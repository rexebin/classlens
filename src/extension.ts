"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "classlens" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand("extension.sayHello", () => {
    // The code you place here will be executed every time your command is executed

    // Display a message box to the user
    vscode.window.showInformationMessage("Hello World!");
  });

  context.subscriptions.push(
    disposable,
    vscode.languages.registerCodeLensProvider(
      {
        language: "typescript",
        scheme: "file"
      },
      new ClassLensProvider()
    )
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}

class ClassLensProvider implements vscode.CodeLensProvider {
  provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CodeLens[]> {
    throw new Error("Method not implemented.");
  }
}

vscode.workspace.onDidOpenTextDocument(document => {
  getSymboles(document);
});

vscode.workspace.onDidChangeTextDocument(document => {
  getSymboles(document.document);
});

function getSymboles(document: vscode.TextDocument) {
  vscode.commands
    .executeCommand<vscode.SymbolInformation[]>(
      "vscode.executeDocumentSymbolProvider",
      document.uri
    )
    .then(result => {
      if (!result) {
        return;
      }
      console.log(result);
      let classes: vscode.SymbolInformation[] = [];

      classes = result.filter(
        element => element.kind === vscode.SymbolKind.Class
      );

      classes.forEach(c => {
        const properties = result.filter(
          e =>
            e.kind === vscode.SymbolKind.Property && e.containerName === c.name
        );
        const methods = result.filter(
          e => e.kind === vscode.SymbolKind.Method && e.containerName === c.name
        );
        console.log(properties);
        console.log(methods);
        const lineText = document.getText(c.location.range);
        console.log(lineText);
        const implementsIndex = lineText.indexOf(c.name);
        if (implementsIndex === -1) {
          return;
        }
        let interfaces = lineText.slice(implementsIndex + c.name.length);
        interfaces = interfaces.slice(0, interfaces.indexOf("{"));
        console.log(interfaces);
      });
    });
}
