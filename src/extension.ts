"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import {
  CodeLens,
  Uri,
  CodeLensProvider,
  TextDocument,
  CancellationToken,
  SymbolInformation,
  SymbolKind
} from "vscode";
import { getDefinitionLocation } from "./definition.service";
import {
  hasBaseClass,
  getBaseClassSymbol,
  hasInterfaces,
  getInterfaceSymbols
} from "./util";
import { getCodeLens } from "./codelens.service";
import { getSymbolsByUri, getSymbolsOpenedUri } from "./symbols.service";

let isSplit = vscode.workspace
  .getConfiguration("openFile")
  .get<boolean>("openSideBySide");

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "classlens" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "classLens.gotoParent",
      (symbol: SymbolInformation) => {
        // The code you place here will be executed every time your command is executed
        const activeTextEditor = vscode.window.activeTextEditor;
        if (!activeTextEditor) {
          return;
        }
        vscode.workspace.openTextDocument(symbol.location.uri).then(
          doc => {
            vscode.window.showTextDocument(symbol.location.uri, {
              viewColumn: isSplit
                ? vscode.ViewColumn.Two
                : activeTextEditor.viewColumn,
              selection: new vscode.Range(
                symbol.location.range.start,
                symbol.location.range.start
              )
            });
          },
          error => {
            console.log(error);
          }
        );
        // Display a message box to the user
        // _openFile(symbol.location.uri.path);
      }
    ),
    vscode.languages.registerCodeLensProvider(
      { language: "typescript", scheme: "file" },
      new BaseClassProvider()
    ),
    vscode.languages.registerCodeLensProvider(
      { language: "typescript", scheme: "file" },
      new InterfaceCodeLensProvider()
    ),
    vscode.workspace.onDidChangeConfiguration(() => {
      isSplit = vscode.workspace
        .getConfiguration("openFile")
        .get("openSideBySide");
    })
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}

export interface SymboleCache {
  [name: string]: SymbolInformation[];
}
class BaseClassProvider implements CodeLensProvider {
  symbolCache: SymboleCache = {};
  provideCodeLenses(
    document: TextDocument,
    token: CancellationToken
  ): CodeLens[] | Thenable<vscode.CodeLens[]> {
    const text = document.getText();
    if (!hasBaseClass(text)) {
      return [];
    }
    this.symbolCache = {};
    const codelens = this.provideCodelens(document);
    return codelens;
  }

  async provideCodelens(document: TextDocument): Promise<CodeLens[]> {
    const text = document.getText();
    const symbols = await getSymbolsOpenedUri(document.uri);
    if (!symbols || symbols.length === 0) {
      return [];
    }
    let promises: Promise<CodeLens | undefined>[] = [];
    symbols
      .filter(
        s => s.kind === SymbolKind.Property || s.kind === SymbolKind.Method
      )
      .map(s => {
        const className = s.containerName;
        const baseClassSymbol = getBaseClassSymbol(text, className, symbols);
        if (!baseClassSymbol) {
          return;
        }
        return { symbol: s, baseClass: baseClassSymbol };
      })
      .filter(i => i !== undefined)
      .map(result => {
        if (!result) {
          return;
        }
        promises.push(
          this.getOverideCodeLens(result.symbol, result.baseClass, document.uri)
        );
      });

    return <Promise<CodeLens[]>>Promise.all(promises).then(values => {
      return values.filter(v => v !== undefined);
    });
  }

  async getOverideCodeLens(
    propertyMethodSymbol: SymbolInformation,
    parentSymbol: SymbolInformation,
    uri: Uri
  ): Promise<CodeLens | undefined> {
    if (this.symbolCache[parentSymbol.name]) {
      const codeLens = getCodeLens(
        propertyMethodSymbol,
        parentSymbol,
        this.symbolCache[parentSymbol.name],
        SymbolKind.Class
      );

      return codeLens;
    } else {
      const location = await getDefinitionLocation(
        uri,
        parentSymbol.location.range.start
      );
      if (!location) {
        return;
      }
      const symbols = await getSymbolsByUri(location.uri);
      if (!symbols) {
        return;
      }
      this.symbolCache[parentSymbol.name] = symbols;
      return getCodeLens(
        propertyMethodSymbol,
        parentSymbol,
        symbols,
        SymbolKind.Class
      );
    }
  }
}

class InterfaceCodeLensProvider implements CodeLensProvider {
  symbolCache: SymboleCache = {};
  provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CodeLens[]> {
    const text = document.getText();
    if (!hasInterfaces(text)) {
      return [];
    }
    this.symbolCache = {};
    return this.provideInterfaceCodeLens(document);
  }

  async provideInterfaceCodeLens(document: TextDocument): Promise<CodeLens[]> {
    const text = document.getText();
    let promises: Promise<CodeLens | undefined>[] = [];
    const symbols = await getSymbolsOpenedUri(document.uri);
    if (!symbols || symbols.length === 0) {
      return [];
    }
    symbols
      .filter(
        s => s.kind === SymbolKind.Property || s.kind === SymbolKind.Method
      )
      .map(s => {
        const className = s.containerName;
        const interfaceSymbols = getInterfaceSymbols(text, className, symbols);
        if (!interfaceSymbols || interfaceSymbols.length === 0) {
          return;
        }
        return { symbol: s, interfaces: interfaceSymbols };
      })
      .filter(i => i !== undefined)
      .map(result => {
        if (!result) {
          return;
        }
        result.interfaces.forEach(i => {
          promises.push(
            this.getInterfaceCodeLens(result.symbol, i, document.uri)
          );
        });
      });
    return <Promise<CodeLens[]>>Promise.all(promises).then(values => {
      return values.filter(v => v !== undefined);
    });
  }

  async getInterfaceCodeLens(
    propertyMethodSymbol: SymbolInformation,
    parentSymbol: SymbolInformation,
    uri: Uri
  ): Promise<CodeLens | undefined> {
    if (this.symbolCache[parentSymbol.name]) {
      const codeLens = getCodeLens(
        propertyMethodSymbol,
        parentSymbol,
        this.symbolCache[parentSymbol.name],
        SymbolKind.Interface
      );

      return codeLens;
    } else {
      const location = await getDefinitionLocation(
        uri,
        parentSymbol.location.range.start
      );

      if (!location) {
        return;
      }
      const symbols = await getSymbolsByUri(location.uri);

      if (!symbols) {
        return;
      }
      this.symbolCache[parentSymbol.name] = symbols;
      return getCodeLens(
        propertyMethodSymbol,
        parentSymbol,
        symbols,
        SymbolKind.Interface
      );
    }
  }
}
