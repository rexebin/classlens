"use strict";

import {
  SymbolInformation,
  workspace,
  ExtensionContext,
  window,
  commands,
  Range,
  ViewColumn,
  languages
} from "vscode";
import { BaseClassProvider, InterfaceCodeLensProvider } from "./providers";
import { CacheProvider } from "./utils";

let isSplit = workspace
  .getConfiguration("classLens")
  .get<boolean>("openSideBySide");

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json

  context.subscriptions.push(
    commands.registerCommand(
      "classLens.gotoParent",
      (symbol: SymbolInformation) => {
        // The code you place here will be executed every time your command is executed
        const activeTextEditor = window.activeTextEditor;
        if (!activeTextEditor) {
          return;
        }
        workspace.openTextDocument(symbol.location.uri).then(
          doc => {
            window.showTextDocument(symbol.location.uri, {
              viewColumn: isSplit
                ? ViewColumn.Two
                : activeTextEditor.viewColumn,
              selection: new Range(
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
    languages.registerCodeLensProvider(
      [
        { language: "typescript", scheme: "file" },
        { language: "javascript", scheme: "file" }
      ],
      new BaseClassProvider()
    ),
    languages.registerCodeLensProvider(
      [
        { language: "typescript", scheme: "file" },
        { language: "javascript", scheme: "file" }
      ],
      new InterfaceCodeLensProvider()
    ),
    workspace.onDidChangeConfiguration(() => {
      isSplit = workspace.getConfiguration("classLens").get("openSideBySide");
    }),
    workspace.onDidSaveTextDocument(doc => {
      const cache = CacheProvider.symbolCache.filter(
        s => s.parentFileName === doc.fileName
      );
      if (cache) {
        cache.forEach(c => {
          const index = CacheProvider.symbolCache.indexOf(c);
          CacheProvider.symbolCache.splice(index, 1);
        });
      }
    })
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
