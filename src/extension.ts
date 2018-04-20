"use strict";

import { ExtensionContext, commands, workspace } from "vscode";
import { gotoParent, gotoParentCommandName } from "./commands";
import { updateConfig } from "./configuration";
import { decorateInterfaceMembers, decorateOverrideMembers } from "./providers";
import { CacheProvider } from "./utils";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  ContextExtension.context = context;
  context.subscriptions.push(
    commands.registerCommand(gotoParentCommandName, gotoParent),
    workspace.onDidOpenTextDocument(doc => {
      ContextExtension.context = context;

      decorateOverrideMembers(doc);
      decorateInterfaceMembers(doc);
    }),
    // languages.registerCodeLensProvider(
    //   supportedDocument,
    //   new BaseClassProvider()
    // ),
    // languages.registerCodeLensProvider(
    //   supportedDocument,
    //   new InterfaceCodeLensProvider()
    // ),
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

export class ContextExtension {
  static context: ExtensionContext;
}
