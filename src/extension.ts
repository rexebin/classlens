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
import { hasBaseClass, getBaseClass } from "./util";
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
        vscode.workspace.openTextDocument(symbol.location.uri).then(doc => {
          vscode.window.showTextDocument(symbol.location.uri, {
            viewColumn: isSplit
              ? vscode.ViewColumn.Two
              : activeTextEditor.viewColumn,
            selection: new vscode.Range(
              symbol.location.range.start,
              symbol.location.range.start
            )
          });
        });
        // Display a message box to the user
        // _openFile(symbol.location.uri.path);
      }
    ),
    vscode.languages.registerCodeLensProvider(
      { language: "typescript", scheme: "file" },
      new BaseClassProvider()
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

class BaseClassProvider implements CodeLensProvider {
  symbolCache: { [className: string]: SymbolInformation[] } = {};
  provideCodeLenses(
    document: TextDocument,
    token: CancellationToken
  ): CodeLens[] | Thenable<vscode.CodeLens[]> {
    const text = document.getText();
    if (!hasBaseClass(text)) {
      return [];
    }
    let promises: Promise<CodeLens | undefined>[] = [];

    let lens: CodeLens[] = [];
    return getSymbolsOpenedUri(document.uri).then(symbols => {
      if (!symbols || symbols.length === 0) {
        return [];
      }
      symbols
        .filter(
          s => s.kind === SymbolKind.Property || s.kind === SymbolKind.Method
        )
        .map(s => {
          const className = s.containerName;
          const baseClassSymbol = getBaseClass(text, className, symbols);
          if (!baseClassSymbol) {
            return;
          }
          return { symbol: s, baseClass: baseClassSymbol };
        })
        .filter(i => i !== undefined)
        .forEach(result => {
          if (!result) {
            return;
          }
          promises.push(
            this.getOverideCodeLens(
              result.symbol,
              result.baseClass,
              document.uri
            )
          );
        });
      return Promise.all(promises).then(values => {
        values.forEach(v => {
          if (v) {
            lens.push(v);
          }
        });
        return lens;
      });
    });
  }

  getOverideCodeLens(
    propertyMethodSymbol: SymbolInformation,
    baseClassSymbol: SymbolInformation,
    uri: Uri
  ): Promise<CodeLens | undefined> {
    return new Promise((resolve, reject) => {
      if (this.symbolCache[baseClassSymbol.name]) {
        const codeLens = getCodeLens(
          propertyMethodSymbol,
          baseClassSymbol,
          this.symbolCache[baseClassSymbol.name]
        );

        resolve(codeLens);
      } else {
        getDefinitionLocation(uri, baseClassSymbol.location.range.start).then(
          location => {
            if (!location) {
              resolve();
              return;
            }
            getSymbolsByUri(location.uri).then(symbols => {
              if (!symbols) {
                resolve();
                return;
              }
              this.symbolCache[baseClassSymbol.name] = symbols;
              resolve(
                getCodeLens(propertyMethodSymbol, baseClassSymbol, symbols)
              );
            });
          }
        );
      }
    });
  }
}
