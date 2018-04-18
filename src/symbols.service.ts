import { Uri, SymbolInformation, workspace, commands } from "vscode";

export function getSymbolsByUri(
  uri: Uri
): Thenable<SymbolInformation[] | undefined> {
  return workspace.openTextDocument(uri).then(
    doc => {
      return getSymbolsOpenedUri(doc.uri);
    },
    error => {
      console.log(error);
    }
  );
}

export function getSymbolsOpenedUri(
  uri: Uri
): Thenable<SymbolInformation[] | undefined> {
  return commands
    .executeCommand<SymbolInformation[]>(
      "vscode.executeDocumentSymbolProvider",
      uri
    )
    .then(
      symbols => {
        return symbols;
      },
      error => {
        console.log(error);
      }
    );
}
