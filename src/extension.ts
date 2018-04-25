"use strict";

import {
  ExtensionContext,
  Memento,
  commands,
  languages,
  workspace,
  window,
  TextEditor
} from "vscode";
import { goToParent } from "./commands/go-to-parent";
import { Config, supportedDocument, updateConfig } from "./configuration";
import { refreshDecorations } from "./decoration";
import { ClassIOCache } from "./models";
import { ClassIODefinitionProvider } from "./provider";

let workspaceState: Memento;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  workspaceState = context.workspaceState;
  Config.classIOCache = workspaceState.get<ClassIOCache[]>("classio", []);
  context.subscriptions.push(
    commands.registerCommand("classio.cleanCache", () => {
      Config.classIOCache = [];
      saveCache();
    }),
    workspace.onDidOpenTextDocument(doc => {
      updateDecorations(window.activeTextEditor);
    }),
    window.onDidChangeActiveTextEditor(editor => {
      updateDecorations(editor);
    }),
    workspace.onDidChangeTextDocument(event => {
      updateDecorations(window.activeTextEditor);
    }),
    languages.registerDefinitionProvider(
      supportedDocument,
      new ClassIODefinitionProvider()
    ),

    commands.registerCommand("classio.goToParent", goToParent),

    workspace.onDidChangeConfiguration(updateConfig),
    workspace.onDidSaveTextDocument(doc => {
      const cache = Config.classIOCache.filter(
        s => s.parentUriFspath === doc.fileName
      );
      if (cache.length > 0) {
        cache.forEach(c => {
          const index = Config.classIOCache.indexOf(c);
          Config.classIOCache.splice(index, 1);
        });
        saveCache();
      }
    })
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}

export function saveCache() {
  workspaceState.update("classio", Config.classIOCache);
}

function updateDecorations(editor?: TextEditor) {
  if (!editor) {
    return;
  }
  if (Config.timer) {
    clearTimeout(Config.timer);
  }
  Config.timer = setTimeout(refreshDecorations, 500, editor);
}
