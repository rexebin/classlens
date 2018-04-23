"use strict";

import {
  ExtensionContext,
  Memento,
  commands,
  languages,
  workspace
} from "vscode";
import { gotoParent, gotoParentCommandName } from "./commands";
import { supportedDocument, updateConfig } from "./configuration";
import { ClassLensCache } from "./models";
import { ClassLensProvider } from "./providers";

export let workspaceState: Memento;
export let classLensCache: ClassLensCache[];
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  workspaceState = context.workspaceState;
  classLensCache = workspaceState.get<ClassLensCache[]>("classlens", []);
  context.subscriptions.push(
    commands.registerCommand(gotoParentCommandName, gotoParent),
    commands.registerCommand("classlens.cleanCache", () => {
      classLensCache = [];
      saveCache();
    }),
    languages.registerCodeLensProvider(
      supportedDocument,
      new ClassLensProvider()
    ),
    workspace.onDidChangeConfiguration(updateConfig),
    workspace.onDidSaveTextDocument(doc => {
      const cache = classLensCache.filter(
        s => s.parentUriFspath === doc.fileName
      );
      if (cache.length > 0) {
        cache.forEach(c => {
          const index = classLensCache.indexOf(c);
          classLensCache.splice(index, 1);
        });
        saveCache();
      }
    })
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}

export function saveCache() {
  workspaceState.update("classlens", classLensCache);
}
