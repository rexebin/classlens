import { Position, Range, SymbolInformation, window } from "vscode";
import { CachedSymbol } from "../models";
import { DecorationOptionsForParents } from "../models/decoration-options";

export function generateDeorations(
  targetSymbols: SymbolInformation[],
  parentSymbol: SymbolInformation,
  symbolsOfParent: CachedSymbol[]
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
    const parentSymbolInParent = symbolsOfParent.find(
      s => s.name === parentSymbol.name
    );
    if (!parentSymbolInParent) {
      return;
    }
    const kind = parentSymbolInParent.kind;
    if (kind === "class") {
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
    } else if (kind === "interface") {
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
