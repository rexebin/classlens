import {
  SymbolInformation,
  Uri,
  CodeLens,
  Location,
  commands,
  workspace
} from "vscode";

export function getInterfaceNames(
  documentText: string,
  className: string,
  symbols: SymbolInformation[]
): SymbolInformation[] {
  const classIndex = documentText.indexOf(className);
  if (classIndex === -1) {
    return [];
  }
  let parentsAndInterfaces = documentText.slice(classIndex + className.length);
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
    const s = symbols.filter(s => s.name === i);
    if (s) {
      interfaceSymbols.push(s[0]);
    }
  });
  return interfaceSymbols;
}

export function getInterfaceCodeLens(
  propertyMethodSymbol: SymbolInformation,
  interfaceSymbol: SymbolInformation,
  uri: Uri
): Thenable<CodeLens | undefined> {
  return commands
    .executeCommand<Location[]>(
      "vscode.executeDefinitionProvider",
      uri,
      interfaceSymbol.location.range.start
    )
    .then(locations => {
      if (!locations) {
        return;
      }
      return workspace.openTextDocument(locations[0].uri).then(doc => {
        return commands
          .executeCommand<SymbolInformation[]>(
            "vscode.executeDocumentSymbolProvider",
            doc.uri
          )
          .then(symbols => {
            if (!symbols) {
              return;
            }
            const basePropertyMethod = symbols.filter(
              s =>
                s.name === propertyMethodSymbol.name &&
                s.containerName === interfaceSymbol.name
            );

            if (basePropertyMethod.length === 1) {
              return new CodeLens(basePropertyMethod[0].location.range, {
                command: "classLens.gotoParent",
                title: `implement`,
                arguments: [basePropertyMethod[0]]
              });
            }
            return;
          });
      });
    });
}
