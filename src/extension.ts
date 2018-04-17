"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import {
  CodeLens,
  Uri,
  Command,
  CodeLensProvider,
  ProviderResult,
  TextDocument,
  CancellationToken,
  commands,
  SymbolInformation,
  SymbolKind
} from "vscode";

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
      new ClassLensProvider()
    ),
    vscode.workspace.onDidChangeConfiguration(() => {
      isSplit = vscode.workspace
        .getConfiguration("openFile")
        .get("openSideBySide");
    })
  );
}

class ClassMemberLens extends CodeLens {
  className: string;
  uri: Uri;
  propertyOrMethodName: string;

  baseClassName: string;
  constructor(
    range: vscode.Range,
    uri: Uri,
    className: string,
    propertyOrMethodName: string,
    baseClassName: string,
    command?: Command
  ) {
    super(range, command);
    this.className = className;
    this.uri = uri;
    this.propertyOrMethodName = propertyOrMethodName;
    this.baseClassName = baseClassName;
  }
}

// this method is called when your extension is deactivated
export function deactivate() {}

class ClassLensProvider implements CodeLensProvider {
  provideCodeLenses(
    document: TextDocument,
    token: CancellationToken
  ): CodeLens[] | Thenable<vscode.CodeLens[]> {
    return vscode.commands
      .executeCommand<vscode.SymbolInformation[]>(
        "vscode.executeDocumentSymbolProvider",
        document.uri
      )
      .then(symbols => {
        if (!symbols || symbols.length === 0) {
          return [];
        }
        let classes = symbols.filter(
          element => element.kind === vscode.SymbolKind.Class
        );
        var result: CodeLens[] = [];
        classes.forEach(c => {
          const lineText = document.getText(c.location.range);
          const classIndex = lineText.indexOf(c.name);
          if (classIndex === -1) {
            return [];
          }
          let parentsAndInterfaces = lineText.slice(classIndex + c.name.length);
          parentsAndInterfaces = parentsAndInterfaces.slice(
            0,
            parentsAndInterfaces.indexOf("{")
          );
          let parentClassName = parentsAndInterfaces.match(/(extends)\s(\w+)/);
          if (!parentClassName) {
            return [];
          }
          let parent = parentClassName[0].replace("extends", "").trim();
          symbols
            .filter(
              e =>
                e.containerName === c.name &&
                (e.kind === SymbolKind.Property || e.kind === SymbolKind.Method)
            )
            .map(pm => {
              result.push(
                new ClassMemberLens(
                  pm.location.range,
                  document.uri,
                  c.name,
                  pm.name,
                  parent
                )
              );
            });
        });
        return result;
      });
  }

  resolveCodeLens(
    codeLens: CodeLens,
    token: vscode.CancellationToken
  ): ProviderResult<CodeLens> {
    if (codeLens instanceof ClassMemberLens) {
      return commands
        .executeCommand<SymbolInformation[]>(
          "vscode.executeWorkspaceSymbolProvider",
          codeLens.propertyOrMethodName
        )
        .then(symbol => {
          if (!symbol) {
            return;
          }
          const mothers = symbol.filter(
            e =>
              e.containerName === codeLens.baseClassName &&
              e.name === codeLens.propertyOrMethodName
          );

          if (mothers.length === 1) {
            return new CodeLens(mothers[0].location.range, {
              command: "classLens.gotoParent",
              title: `override`,
              arguments: [mothers[0]]
            });
          }
        });
    }
  }
}

function _openFile(targetFile: string): Promise<vscode.TextDocument> {
  return new Promise((resolve, reject) => {
    // if file is already opened, set focus to the file.
    vscode.window.visibleTextEditors.forEach(editor => {
      if (editor.document.fileName === targetFile) {
        vscode.window.showTextDocument(editor.document, editor.viewColumn).then(
          () => {
            resolve(editor.document);
          },
          err => {
            reject(err);
          }
        );
        resolve();
        return;
      }
    });
    // if we come this far, open file.
    const activeTextEditor = vscode.window.activeTextEditor;
    if (!activeTextEditor) {
      reject();
      return;
    }
    vscode.workspace.openTextDocument(targetFile).then(
      doc => {
        vscode.window
          .showTextDocument(
            doc,
            isSplit ? vscode.ViewColumn.Two : activeTextEditor.viewColumn
          )
          .then(
            () => {
              resolve(doc);
            },
            err => {
              reject(err);
            }
          );
      },
      err => {
        reject(err);
      }
    );
  });
}
