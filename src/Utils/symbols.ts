"use strict";

import {
  Uri,
  SymbolInformation,
  workspace,
  commands,
  TextDocument
} from "vscode";

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

export function getInterfaceSymbols(
  doc: TextDocument,
  classSymbol: SymbolInformation,
  symbols: SymbolInformation[]
): SymbolInformation[] {
  const classText = doc.getText(classSymbol.location.range);
  const classIndex = classText.indexOf("class " + classSymbol.name);
  if (classIndex === -1) {
    return [];
  }
  let parentsAndInterfaces = classText.slice(
    classIndex + classSymbol.name.length + "class ".length
  );
  const implementsIndex = parentsAndInterfaces.indexOf("implements");
  let interfaces: string[] = [];
  if (implementsIndex >= 0) {
    let interfacesText = parentsAndInterfaces.slice(
      implementsIndex + "implements".length
    );
    interfaces = interfacesText
      .slice(0, interfacesText.indexOf("{"))
      .split(",");
    if (interfaces) {
      interfaces = interfaces.map(i => i.trim());
    }
  }

  let interfaceSymbols: SymbolInformation[] = [];
  interfaces.forEach(i => {
    const s = symbols.filter(
      s => s.name.replace(/(<).+(>)/, "") === i.replace(/(<).+(>)/, "")
    );
    if (s && s.length > 0) {
      interfaceSymbols.push(s[0]);
    }
  });
  return interfaceSymbols;
}

export function getBaseClassSymbol(
  doc: TextDocument,
  classSymbol: SymbolInformation,
  symbols: SymbolInformation[]
): SymbolInformation | undefined {
  const classText = doc.getText(classSymbol.location.range);
  const classIndex = classText.indexOf("class " + classSymbol.name);
  if (classIndex === -1) {
    return;
  }
  let parentsAndInterfaces = classText.slice(
    classIndex + classSymbol.name.length + "class ".length
  );
  parentsAndInterfaces = parentsAndInterfaces.slice(
    0,
    parentsAndInterfaces.indexOf("{")
  );
  let parentClassName = parentsAndInterfaces.match(/(extends)\s+(\w+)/);
  if (!parentClassName) {
    return;
  }
  const c = parentClassName[0].replace("extends", "").trim();
  return symbols.filter(
    s => s.name.replace(/(<).+(>)/, "") === c.replace(/(<).+(>)/, "")
  )[0];
}
