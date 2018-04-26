"use strict";

import {
  ExtensionContext,
  Memento,
  commands,
  languages,
  workspace,
  TextDocument
} from "vscode";
import { gotoParent, gotoParentCommandName } from "./commands";
import { supportedDocument, updateConfig, Config } from "./configuration";
import { ClassLensCache } from "./models";
import { ClassLensProvider } from "./providers";
import { log } from "./commands/logger";

let workspaceState: Memento;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  workspaceState = context.workspaceState;
  Config.classLensCache = workspaceState.get<ClassLensCache[]>("classlens", []);

  context.subscriptions.push(
    commands.registerCommand(gotoParentCommandName, gotoParent),
    commands.registerCommand("classlens.cleanCache", () => {
      log("clear cache");
      Config.classLensCache = [];
      saveCache();
      log(Config.classLensCache);
    }),
    languages.registerCodeLensProvider(
      supportedDocument,
      new ClassLensProvider()
    ),
    workspace.onDidChangeConfiguration(updateConfig),
    workspace.onDidSaveTextDocument(doc => {
      log("on save update cache");
      startUpdateCacheTimer(doc);
      log(Config.classLensCache);
    })
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}

export function saveCache() {
  workspaceState.update("classlens", Config.classLensCache);
}

async function startUpdateCacheTimer(doc: TextDocument) {
  if (Config.timer) {
    clearTimeout(Config.timer);
  }
  Config.timer = setTimeout(updateCache, 500, doc);
}

function updateCache(doc: TextDocument) {
  const cache = Config.classLensCache.filter(
    s => s.parentUriFspath === doc.fileName
  );
  if (cache.length > 0) {
    cache.forEach(c => {
      const index = Config.classLensCache.indexOf(c);
      Config.classLensCache.splice(index, 1);
      log("remove from cache:");
      log(Config.classLensCache[index]);
    });
    saveCache();
  }
}
