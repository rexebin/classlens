"use strict";

import { CodeLens, SymbolInformation } from "vscode";
import { CachedSymbol } from "../models";
const baseClassRegex = /(class)(\s+)(\w+)(<\w+>)?(\s+)(extends)/;
const interfaceRegex = /(implements)(\s+)/;

/**
 * Return true if there is a base class in the given text, otherwise return false.
 * @param document text of document
 */
export function hasBaseClass(document: string): boolean {
  const map = document.match(baseClassRegex);
  if (map && map.length > 0) {
    return true;
  }
  return false;
}

/**
 * Return true if there is an interface in the given text, otherwise return false.
 * @param document text of document
 */
export function hasInterfaces(document: string): boolean {
  const map = document.match(interfaceRegex);
  if (map && map.length > 0) {
    return true;
  }
  return false;
}

/**
 * Solve all promises in the given promise array.
 * Return a list of valid result.
 * Filter out any undefined result and errors.
 * @param promises list of promises to solve.
 */
export function excutePromises(
  promises: Promise<CodeLens[]>[]
): Promise<CodeLens[]> {
  return new Promise((resolve, reject) => {
    let results: CodeLens[] = [];
    let count = 0;
    promises.forEach((promise, idx) => {
      promise
        .catch(error => {
          console.log(error);
          return error;
        })
        .then(valueOrError => {
          if (!(valueOrError instanceof Error) && valueOrError !== undefined) {
            results = [...results, ...valueOrError];
          }
          count += 1;
          if (count === promises.length) {
            resolve(results);
          }
        });
    });
  });
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
        symbol.containerName
      )
    );
  });
  return cachedSymbols;
}
