import { SymbolInformation, CodeLens } from "vscode";

export function getCodeLens(
  propertyMethodSymbol: SymbolInformation,
  baseClassSymbol: SymbolInformation,
  baseClassSymbols: SymbolInformation[]
): CodeLens | undefined {
  const basePropertyMethod = baseClassSymbols.filter(
    s =>
      s.name === propertyMethodSymbol.name &&
      s.containerName === baseClassSymbol.name
  );

  if (basePropertyMethod.length === 1) {
    return new CodeLens(propertyMethodSymbol.location.range, {
      command: "classLens.gotoParent",
      title: `override`,
      arguments: [basePropertyMethod[0]]
    });
  }
}
