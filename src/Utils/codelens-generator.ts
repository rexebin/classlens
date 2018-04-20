"use strict";

import {
  DecorationOptions,
  DecorationRenderOptions,
  SymbolInformation,
  SymbolKind,
  TextEditorDecorationType,
  Uri,
  window
} from "vscode";
import { decorateEditor } from "../decorator";
import { CacheProvider } from "./cache";
import { getDefinitionLocation } from "./definition.command";
import { getSymbolsByUri } from "./symbols";
import { ContextExtension } from "../extension";
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
export async function decorate(
  propertyMethodSymbol: SymbolInformation,
  parentSymbol: SymbolInformation,
  symbolsOfParent: SymbolInformation[],
  kind: SymbolKind
) {
  const basePropertyMethod = symbolsOfParent.filter(
    s =>
      s.name === propertyMethodSymbol.name &&
      s.containerName === parentSymbol.name &&
      s.containerName !== propertyMethodSymbol.containerName
  );
  if (!ContextExtension.context) {
    console.log("error");
  }
  let decorationRenderOptions: DecorationRenderOptions = {
    gutterIconPath: ContextExtension.context.asAbsolutePath(
      "../../classlens.png"
    ),
    gutterIconSize: "contain"
  };
  let textEditorDecorationType: TextEditorDecorationType = window.createTextEditorDecorationType(
    <any>decorationRenderOptions
  );
  if (basePropertyMethod.length === 1) {
    if (kind === SymbolKind.Class) {
      const decorateOptions: DecorationOptions[] = [
        {
          range: propertyMethodSymbol.location.range,
          hoverMessage: `Override ${parentSymbol.name}`
        }
      ];
      return decorateEditor(textEditorDecorationType, decorateOptions);
    } else if (kind === SymbolKind.Interface) {
      const decorateOptions: DecorationOptions[] = [
        {
          range: propertyMethodSymbol.location.range,
          hoverMessage: `implements ${parentSymbol.name}`
        }
      ];
      return decorateEditor(textEditorDecorationType, decorateOptions);
    }
  }
}

export async function decorateMember(
  propertyMethodSymbol: SymbolInformation,
  parentSymbol: SymbolInformation,
  uri: Uri,
  kind: SymbolKind,
  symbolsCurrent: SymbolInformation[]
) {
  try {
    /**
     * Check if the cache has symbols of the parent class/interface file.
     * if true, generate codelens for the given property/method.
     */
    const currentFileName = parentSymbol.location.uri.fsPath;
    const cache = CacheProvider.symbolCache.filter(
      c =>
        c.currentFileName === currentFileName &&
        c.parentSymbolName === parentSymbol.name
    );
    if (cache.length > 0 && cache[0].parentSymbols.length > 0) {
      decorate(
        propertyMethodSymbol,
        parentSymbol,
        cache[0].parentSymbols,
        kind
      );
    } else {
      // check if the parent class/interface is in the current file.
      let symbols = symbolsCurrent.filter(
        s => s.containerName === parentSymbol.name
      );
      if (symbols.length > 0) {
        decorate(propertyMethodSymbol, parentSymbol, symbols, kind);
      }

      /**
       * if we are here, then the parent symbol is not in the current file.
       * 1. excuete definition provider to look for the parent file.
       * 2. if location not found, return. There should be a single location found,
       *  because the symbol in the current file indicate that definition provider will find one that is imported.
       * 3. run symbol provider against the location found, get a list of symobls of the parent class/interface's file.
       * 4. save the above symbols to cache.
       * 5. generate codelens for the given child symbol against the above parent symbols.
       */
      const location = await getDefinitionLocation(
        uri,
        parentSymbol.location.range.start
      );

      // check if the parent class/interface's symbols are already in cache.

      const cache = CacheProvider.symbolCache.filter(
        c => c.parentFileName === location.uri.fsPath
      );
      if (cache.length === 1) {
        decorate(
          propertyMethodSymbol,
          parentSymbol,
          cache[0].parentSymbols,
          kind
        );
      }
      const symbolsRemote = await getSymbolsByUri(location.uri);
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
      decorate(propertyMethodSymbol, parentSymbol, symbolsRemote, kind);
    }
  } catch (error) {
    throw error;
  }
}
