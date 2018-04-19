"use strict";

import { SymbolInformation, CodeLens, SymbolKind, Uri } from "vscode";
import { getDefinitionLocation } from "./definition.command";
import { getSymbolsByUri } from "./symbols";
import { CacheProvider } from "./cache";
/**
 * Return Codelens for a given property/method symbol.
 *
 * Look for the same symbol in symbols from parent's definition file, if find exactly one, return codelens.
 *
 * @param propertyMethodSymbol: the property or method symbol to get CodeLens for
 * @param parentSymbol: the parent symbol read from property's file, has same uri as above parameter.
 * @param symbolsOfParent: all symbols in the parent's definition file
 * @param kind indicate what type of CodeLens the caller is after.
 */
export function getCodeLens(
  propertyMethodSymbol: SymbolInformation,
  parentSymbol: SymbolInformation,
  symbolsOfParent: SymbolInformation[],
  kind: SymbolKind
): CodeLens | undefined {
  const basePropertyMethod = symbolsOfParent.filter(
    s =>
      s.name === propertyMethodSymbol.name &&
      s.containerName === parentSymbol.name &&
      s.containerName !== propertyMethodSymbol.containerName
  );

  if (basePropertyMethod.length === 1) {
    if (kind === SymbolKind.Class) {
      return new CodeLens(propertyMethodSymbol.location.range, {
        command: "classLens.gotoParent",
        title: `override`,
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

export async function getCodeLensForMember(
  propertyMethodSymbol: SymbolInformation,
  parentSymbol: SymbolInformation,
  uri: Uri,
  kind: SymbolKind,
  symbolsCurrent: SymbolInformation[]
): Promise<CodeLens | undefined> {
  try {
    const currentFileName = parentSymbol.location.uri.fsPath;
    const cache = CacheProvider.symbolCache.filter(
      c =>
        c.currentFileName === currentFileName &&
        c.parentSymbolName === parentSymbol.name
    );
    if (cache.length > 0 && cache[0].parentSymbols.length > 0) {
      const codeLens = getCodeLens(
        propertyMethodSymbol,
        parentSymbol,
        cache[0].parentSymbols,
        kind
      );

      return codeLens;
    } else {
      // check if the parent class/interface is in the current file.
      let symbols = symbolsCurrent.filter(
        s => s.containerName === parentSymbol.name
      );
      if (symbols.length > 0) {
        return getCodeLens(propertyMethodSymbol, parentSymbol, symbols, kind);
      }

      const location = await getDefinitionLocation(
        uri,
        parentSymbol.location.range.start
      );
      if (!location) {
        return;
      }
      const symbolsRemote = await getSymbolsByUri(location.uri);
      if (!symbolsRemote) {
        return;
      }
      if (
        CacheProvider.symbolCache.filter(
          s =>
            s.currentFileName === currentFileName &&
            s.parentFileName === location.uri.fsPath
        ).length === 0
      ) {
        CacheProvider.symbolCache = [
          ...CacheProvider.symbolCache,
          {
            currentFileName: currentFileName,
            parentSymbolName: parentSymbol.name,
            parentFileName: location.uri.fsPath,
            parentSymbols: symbolsRemote
          }
        ];
      }
      return getCodeLens(
        propertyMethodSymbol,
        parentSymbol,
        symbolsRemote,
        kind
      );
    }
  } catch (error) {
    console.log(error);
  }
}
