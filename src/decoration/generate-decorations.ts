import { Position, Range, SymbolInformation, SymbolKind, window } from "vscode";
import { CachedSymbol } from "../models";
import { DecorationOptionsForParents } from "../models/decoration-options";

export function generateDeorations(
  targetSymbols: SymbolInformation[],
  parentSymbol: SymbolInformation,
  symbolsOfParent: CachedSymbol[],
  kind: SymbolKind
): DecorationOptionsForParents {
  let decorationOptionsForParent: DecorationOptionsForParents = {
    class: [],
    interface: []
  };
  const activeEditor = window.activeTextEditor;
  if (!activeEditor) {
    return {};
  }
  targetSymbols.forEach(targetSymbol => {
    const parentPropertyMethodSymbol = symbolsOfParent.find(
      symbolInParentUri =>
        symbolInParentUri.name === targetSymbol.name &&
        symbolInParentUri.containerName === parentSymbol.name &&
        // filter out false positive when parent symbol and target symbol are in same document uri.
        symbolInParentUri.containerName !== targetSymbol.containerName
    );
    if (!parentPropertyMethodSymbol) {
      return;
    }
    if (kind === SymbolKind.Class) {
      const decoration = {
        range: new Range(
          targetSymbol.location.range.start,
          new Position(
            targetSymbol.location.range.start.line,
            targetSymbol.location.range.start.character +
              targetSymbol.name.length
          )
        ),
        hoverMessage: "override " + parentPropertyMethodSymbol.containerName
      };
      decorationOptionsForParent["class"].push(decoration);
    } else if (kind === SymbolKind.Interface) {
      const decoration = {
        range: new Range(
          targetSymbol.location.range.start,
          new Position(
            targetSymbol.location.range.start.line,
            targetSymbol.location.range.start.character +
              targetSymbol.name.length
          )
        ),
        hoverMessage: "implements " + parentPropertyMethodSymbol.containerName
      };
      decorationOptionsForParent["interface"].push(decoration);
    }
  });

  return decorationOptionsForParent;
}
