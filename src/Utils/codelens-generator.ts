"use strict";

import { CodeLens, SymbolInformation, SymbolKind, Uri } from "vscode";
import { classLensCache, saveCache } from "../extension";
import { getDefinitionLocation } from "./definition.command";
import { getSymbolsByUri } from "./symbols";
/**
 * Return Codelens for a given property/method symbol.
 *
 * Look for the same symbol in symbols from parent's definition file, if find exactly one, return codelens.
 *
 * @param targetSymbols: the property or method symbol to get CodeLens for
 * @param parentSymbol: the parent symbol read from property's file, has same uri as above parameter.
 * @param symbolsOfParent: all symbols in the parent's definition file
 * @param kind indicate what type of CodeLens the caller is after.
 */
export function getCodeLens(
  targetSymbols: SymbolInformation[],
  parentSymbol: SymbolInformation,
  symbolsOfParent: SymbolInformation[],
  kind: SymbolKind
): CodeLens[] {
  let codelens: CodeLens[] = [];
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
      codelens.push(
        new CodeLens(targetSymbol.location.range, {
          command: "classLens.gotoParent",
          title: `override`,
          arguments: [parentPropertyMethodSymbol]
        })
      );
    } else if (kind === SymbolKind.Interface) {
      codelens.push(
        new CodeLens(targetSymbol.location.range, {
          command: "classLens.gotoParent",
          title: `implements: ${parentSymbol.name}`,
          arguments: [parentPropertyMethodSymbol]
        })
      );
    }
  });
  return codelens;
}

/**
 *
 * @param targetSymbols Symbols to look for codelens for
 * @param parentSymbol Parent symbol
 * @param currentUri current document uri
 * @param kind SymbolKind.Class or SymbolKind.Interface
 * @param symbolsInCurrentUri All symbols of current document
 */
export async function getCodeLensForParents(
  parentSymbol: SymbolInformation,
  currentUri: Uri,
  kind: SymbolKind,
  symbolsInCurrentUri: SymbolInformation[],
  className: string
): Promise<CodeLens[]> {
  try {
    // get a list of target symbols to get codelens for, limited to a given class.
    const targetSymbols = symbolsInCurrentUri.filter(
      symbol =>
        (symbol.kind === SymbolKind.Property ||
          symbol.kind === SymbolKind.Method) &&
        symbol.containerName === className
    );
    // check if the parent class/interface is in the current file.
    let parentSymbolsInCurrentUri = symbolsInCurrentUri.filter(
      s => s.containerName === parentSymbol.name
    );
    if (parentSymbolsInCurrentUri.length > 0) {
      return getCodeLens(
        targetSymbols,
        parentSymbol,
        parentSymbolsInCurrentUri,
        kind
      );
    }
    /**
     * Check if the cache has symbols of the parent class/interface file.
     * if true, generate codelens for the given property/method.
     */
    const currentFileName = currentUri.fsPath;
    let cache = classLensCache.find(
      c =>
        c.currentFileName.indexOf(currentFileName) !== -1 &&
        c.parentSymbolName.indexOf(parentSymbol.name) !== -1
    );
    if (cache && cache.parentSymbols.length > 0) {
      return getCodeLens(
        targetSymbols,
        parentSymbol,
        cache.parentSymbols,
        kind
      );
    }
    //if we are here, then the parent symbol is not in the current file and not in cache.
    // excuete definition provider to look for the parent file.
    const location = await getDefinitionLocation(
      currentUri,
      parentSymbol.location.range.start
    );

    // check if the parent class/interface's symbols are already in cache,
    // maybe loaded by other files before.
    cache = classLensCache.find(c => c.parentUriFspath === location.uri.fsPath);

    // if found, then check if the cache already added
    // current file name, if not, add the current file name and parent symbol name.
    if (cache) {
      if (cache.currentFileName.indexOf(currentFileName) === -1) {
        cache.currentFileName.push(currentFileName);
      }
      if (cache.parentSymbolName.indexOf(parentSymbol.name) === -1) {
        cache.parentSymbolName.push(parentSymbol.name);
      }
      saveCache();
      return getCodeLens(
        targetSymbols,
        parentSymbol,
        cache.parentSymbols,
        kind
      );
    }
    // if we are here, then it is the first time we get symbols from parent uri.
    const symbolsRemote = await getSymbolsByUri(location.uri);
    // save to cache if cache doesnt have parent symbols.
    if (!classLensCache.find(s => s.parentUriFspath === location.uri.fsPath)) {
      classLensCache.push({
        currentFileName: [currentFileName],
        parentSymbolName: [parentSymbol.name],
        parentUriFspath: location.uri.fsPath,
        parentSymbols: symbolsRemote
      });
      saveCache();
    }
    return getCodeLens(targetSymbols, parentSymbol, symbolsRemote, kind);
  } catch (error) {
    throw error;
  }
}
