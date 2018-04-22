"use strict";

import { ExtensionContext, commands, languages, workspace } from "vscode";
import { gotoParent, gotoParentCommandName } from "./commands";
import { supportedDocument, updateConfig } from "./configuration";
import { ClassLensProvider } from "./providers";
import { CacheProvider } from "./utils";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json

  context.subscriptions.push(
    commands.registerCommand(gotoParentCommandName, gotoParent),
    languages.registerCodeLensProvider(
      supportedDocument,
      new ClassLensProvider()
    ),
    workspace.onDidChangeConfiguration(updateConfig),
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
