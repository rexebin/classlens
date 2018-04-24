"use strict";

import {
  ExtensionContext,
  Memento,
  commands,
  languages,
  workspace
} from "vscode";
import { supportedDocument, updateConfig } from "./configuration";
import { excute } from "./decoration";
import { ClassIOCache } from "./models";
import { ClassIODefinitionProvider } from "./provider";

export let workspaceState: Memento;
export let classIOCache: ClassIOCache[];
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  workspaceState = context.workspaceState;
  classIOCache = workspaceState.get<ClassIOCache[]>("classio", []);
  context.subscriptions.push(
    commands.registerCommand("classio.cleanCache", () => {
      classIOCache = [];
      saveCache();
    }),
    workspace.onDidOpenTextDocument(activeEditor => {
      excute();
    }),
    workspace.onDidChangeTextDocument(event => {
      excute();
    }),
    languages.registerDefinitionProvider(
      supportedDocument,
      new ClassIODefinitionProvider()
    ),

    workspace.onDidChangeConfiguration(updateConfig),
    workspace.onDidSaveTextDocument(doc => {
      const cache = classIOCache.filter(
        s => s.parentUriFspath === doc.fileName
      );
      if (cache.length > 0) {
        cache.forEach(c => {
          const index = classIOCache.indexOf(c);
          classIOCache.splice(index, 1);
        });
        saveCache();
      }
    })
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}

export function saveCache() {
  workspaceState.update("classio", classIOCache);
}
