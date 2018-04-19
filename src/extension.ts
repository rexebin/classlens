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
  getInterfaceSymbols,
  excutePromises
} from "./util";
import { getCodeLens } from "./codelens.service";
import { getSymbolsByUri, getSymbolsOpenedUri } from "./symbols.service";

let isSplit = vscode.workspace
  .getConfiguration("classLens")
  .get<boolean>("openSideBySide");
let symbolCache: SymboleCache[] = [];
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
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
      }
    ),
    vscode.languages.registerCodeLensProvider(
      [
        { language: "typescript", scheme: "file" },
        { language: "javascript", scheme: "file" }
      ],
      new BaseClassProvider()
    ),
    vscode.languages.registerCodeLensProvider(
      [
        { language: "typescript", scheme: "file" },
        { language: "javascript", scheme: "file" }
      ],
      new InterfaceCodeLensProvider()
    ),
    vscode.workspace.onDidChangeConfiguration(() => {
      isSplit = vscode.workspace
        .getConfiguration("classLens")
        .get("openSideBySide");
    }),
    vscode.workspace.onDidSaveTextDocument(doc => {
      const cache = symbolCache.filter(s => s.parentFileName === doc.fileName);
      if (cache) {
        cache.forEach(c => {
          const index = symbolCache.indexOf(c);
          symbolCache.splice(index, 1);
        });
      }
    })
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}

export interface SymboleCache {
  currentFileName: string;
  parentSymbolName: string;
  parentFileName: string;
  parentSymbols: SymbolInformation[];
}
class BaseClassProvider implements CodeLensProvider {
  provideCodeLenses(
    document: TextDocument,
    token: CancellationToken
  ): CodeLens[] | Thenable<vscode.CodeLens[]> {
    const text = document.getText();
    if (!hasBaseClass(text)) {
      return [];
    }
    return this.provideBaseClassCodelens(document);
  }

  async provideBaseClassCodelens(document: TextDocument): Promise<CodeLens[]> {
    try {
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
          const classSymbol = symbols.filter(s => s.name === className)[0];
          const baseClassSymbol = getBaseClassSymbol(
            document,
            classSymbol,
            symbols
          );
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
            getCodeLensForMember(
              result.symbol,
              result.baseClass,
              document.uri,
              SymbolKind.Class,
              symbols
            )
          );
        });

      return excutePromises(promises);
    } catch (error) {
      console.log(error);
      return [];
    }
  }
}

class InterfaceCodeLensProvider implements CodeLensProvider {
  provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CodeLens[]> {
    const text = document.getText();
    if (!hasInterfaces(text)) {
      return [];
    }
    return this.provideInterfaceCodeLens(document);
  }

  async provideInterfaceCodeLens(document: TextDocument): Promise<CodeLens[]> {
    try {
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
          const classSymbol = symbols.filter(s => s.name === className)[0];
          const interfaceSymbols = getInterfaceSymbols(
            document,
            classSymbol,
            symbols
          );
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
              getCodeLensForMember(
                result.symbol,
                i,
                document.uri,
                SymbolKind.Interface,
                symbols
              )
            );
          });
        });
      return excutePromises(promises);
    } catch (error) {
      console.log(error);
      return [];
    }
  }
}

async function getCodeLensForMember(
  propertyMethodSymbol: SymbolInformation,
  parentSymbol: SymbolInformation,
  uri: Uri,
  kind: SymbolKind,
  symbolsCurrent: SymbolInformation[]
): Promise<CodeLens | undefined> {
  try {
    const currentFileName = parentSymbol.location.uri.fsPath;
    const cache = symbolCache.filter(
      c =>
        c.currentFileName === currentFileName &&
        c.parentSymbolName === parentSymbol.name
    );
    if (cache.length > 0 && cache[0].parentSymbols.length > 0) {
      const codeLens = getCodeLens(
        propertyMethodSymbol,
        parentSymbol,
        cache[0].parentSymbols,
        kind
      );

      return codeLens;
    } else {
      // check if the parent class/interface is in the current file.
      let symbols = symbolsCurrent.filter(
        s => s.containerName === parentSymbol.name
      );
      if (symbols.length > 0) {
        return getCodeLens(propertyMethodSymbol, parentSymbol, symbols, kind);
      }

      const location = await getDefinitionLocation(
        uri,
        parentSymbol.location.range.start
      );
      if (!location) {
        return;
      }
      const symbolsRemote = await getSymbolsByUri(location.uri);
      if (!symbolsRemote) {
        return;
      }
      if (
        symbolCache.filter(
          s =>
            s.currentFileName === currentFileName &&
            s.parentFileName === location.uri.fsPath
        ).length === 0
      ) {
        symbolCache = [
          ...symbolCache,
          {
            currentFileName: currentFileName,
            parentSymbolName: parentSymbol.name,
            parentFileName: location.uri.fsPath,
            parentSymbols: symbolsRemote
          }
        ];
      }
      return getCodeLens(
        propertyMethodSymbol,
        parentSymbol,
        symbolsRemote,
        kind
      );
    }
  } catch (error) {
    console.log(error);
  }
}
