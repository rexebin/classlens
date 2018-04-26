"use strict";

import { CodeLens, SymbolInformation, SymbolKind, Uri } from "vscode";
import { saveCache } from "../extension";
import { CachedSymbol } from "../models";
import { getDefinitionLocation } from "./definition.command";
import { getSymbolsByUri } from "./symbols";
import { convertToCachedSymbols } from "./util";
import { Config } from "../configuration";
import { log } from "../commands/logger";
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
  symbolsOfParent: CachedSymbol[]
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
    const parentSymbolInParent = symbolsOfParent.find(
      s => s.name === parentSymbol.name
    );
    if (!parentSymbolInParent) {
      return;
    }

    const kind = parentSymbolInParent.kind;

    if (kind === "class") {
      codelens.push(
        new CodeLens(targetSymbol.location.range, {
          command: "classLens.gotoParent",
          title: `override`,
          arguments: [parentPropertyMethodSymbol]
        })
      );
    } else if (kind === "interface") {
      codelens.push(
        new CodeLens(targetSymbol.location.range, {
          command: "classLens.gotoParent",
          title: `implements: ${parentSymbol.name}`,
          arguments: [parentPropertyMethodSymbol]
        })
      );
    }
  });
  log("from getCodelens:");
  log(codelens);
  return codelens;
}

/**
 *
 * @param targetSymbols Symbols to look for codelens for
 * @param parentSymbolInCurrentUri Parent symbol
 * @param currentUri current document uri
 * @param kind SymbolKind.Class or SymbolKind.Interface
 * @param symbolsInCurrentUri All symbols of current document
 */
export async function getCodeLensForParents(
  parentSymbolInCurrentUri: SymbolInformation,
  currentUri: Uri,
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
    const targetSymbolNames = targetSymbols.map(s => s.name);
    // check if the parent class/interface is in the current file.
    let parentSymbolsInCurrentUri = symbolsInCurrentUri.filter(
      s => s.containerName === parentSymbolInCurrentUri.name
    );
    if (parentSymbolsInCurrentUri.length > 0) {
      const parent = symbolsInCurrentUri.find(
        s => s.name === parentSymbolInCurrentUri.name
      );
      if (parent) {
        log("parent is in current file");
        log(parent);
        return getCodeLens(
          targetSymbols,
          parentSymbolInCurrentUri,
          convertToCachedSymbols([...parentSymbolsInCurrentUri, parent])
        );
      }
      return [];
    }
    /**
     * Check if the cache has symbols of the parent class/interface file.
     * if true, generate codelens for the given property/method.
     */
    const currentFileName = currentUri.fsPath;
    let cache = Config.classLensCache.find(
      c =>
        c.childFileNames[currentFileName] === currentFileName &&
        c.parentNamesAndChildren[parentSymbolInCurrentUri.name] !== undefined
    );
    if (cache && cache.parentSymbols.length > 0) {
      cache.parentNamesAndChildren[
        parentSymbolInCurrentUri.name
      ] = targetSymbolNames;
      saveCache();
      log("generate codelens from cache");
      log(Config.classLensCache);
      return getCodeLens(
        targetSymbols,
        parentSymbolInCurrentUri,
        cache.parentSymbols
      );
    }
    //if we are here, then the parent symbol is not in the current file and not in cache.
    // excuete definition provider to look for the parent file.
    const location = await getDefinitionLocation(
      currentUri,
      parentSymbolInCurrentUri.location.range.start
    );

    log("get definition for parent:");

    if (!location) {
      log("location not found");
      return [];
    }

    log(location);

    // check if the parent class/interface's symbols are already in cache,
    // maybe loaded by other files before.
    cache = Config.classLensCache.find(
      c => c.parentUriFspath === location.uri.fsPath
    );

    // if found, then check if the cache already added
    // current file name, if not, add the current file name and parent symbol name.
    if (cache) {
      log("found symbols of parents in cache:");
      cache.childFileNames[currentFileName] = currentFileName;
      cache.parentNamesAndChildren[
        parentSymbolInCurrentUri.name
      ] = targetSymbolNames;

      saveCache();
      log(Config.classLensCache);
      return getCodeLens(
        targetSymbols,
        parentSymbolInCurrentUri,
        cache.parentSymbols
      );
    }
    // if we are here, then it is the first time we get symbols from parent uri.
    const symbolsRemote = await getSymbolsByUri(location.uri);
    // save to cache if cache doesnt have parent symbols.
    log("request symbols for parent:");
    if (
      !Config.classLensCache.find(
        s => s.parentUriFspath === location.uri.fsPath
      )
    ) {
      Config.classLensCache.push({
        childFileNames: { [currentFileName]: currentFileName },
        parentNamesAndChildren: {
          [parentSymbolInCurrentUri.name]: targetSymbolNames
        },
        parentUriFspath: location.uri.fsPath,
        parentSymbols: convertToCachedSymbols(symbolsRemote)
      });
      saveCache();
      log(Config.classLensCache);
    }
    return getCodeLens(
      targetSymbols,
      parentSymbolInCurrentUri,
      convertToCachedSymbols(symbolsRemote)
    );
  } catch (error) {
    throw error;
  }
}
