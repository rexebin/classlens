import { SymbolInformation, CodeLens, SymbolKind } from "vscode";

export function getCodeLens(
  propertyMethodSymbol: SymbolInformation,
  parentSymbol: SymbolInformation,
  symbolsOfParent: SymbolInformation[],
  kind: SymbolKind
): CodeLens | undefined {
  const basePropertyMethod = symbolsOfParent.filter(
    s =>
      s.name === propertyMethodSymbol.name &&
      s.containerName === parentSymbol.name
  );

  if (basePropertyMethod.length === 1) {
    if (kind === SymbolKind.Class) {
      return new CodeLens(propertyMethodSymbol.location.range, {
        command: "classLens.gotoParent",
        title: `overrides`,
        arguments: [basePropertyMethod[0]]
      });
    }
    if (kind === SymbolKind.Interface) {
      return new CodeLens(propertyMethodSymbol.location.range, {
        command: "classLens.gotoParent",
        title: `implements: ${parentSymbol.name}`,
        arguments: [basePropertyMethod[0]]
      });
    }
  }
}
