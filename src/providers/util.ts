"use strict";

import { SymbolInformation } from "vscode";
import { CachedSymbol } from "../models";
export const baseClassRegex = /(class)(\s+)(\w+)(<.*>)?(\s+)(extends)/;

export const interfaceRegex = /(implements)(\s+)/;

/**
 * Return true if there is a parent in the given text, otherwise return false.
 * @param document text of document
 */
export function hasParents(document: string, regex: RegExp): boolean {
  const map = document.match(regex);
  if (map && map.length > 0) {
    return true;
  }
  return false;
}

export function convertToCachedSymbols(
  symbols: SymbolInformation[]
): CachedSymbol[] {
  const cachedSymbols: CachedSymbol[] = [];
  symbols.forEach(symbol => {
    cachedSymbols.push(
      new CachedSymbol(
        symbol.location.uri.fsPath,
        symbol.location.range.start.line,
        symbol.location.range.start.character,
        symbol.name,
        symbol.containerName,
        symbol.kind
      )
    );
  });
  return cachedSymbols;
}
