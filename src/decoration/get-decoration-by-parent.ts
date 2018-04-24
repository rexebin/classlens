import { SymbolInformation, SymbolKind, Uri } from "vscode";
import {
  convertToCachedSymbols,
  getDefinitionLocation,
  getSymbolsByUri
} from "../commands";
import { classIOCache, saveCache } from "../extension";
import { DecorationOptionsForParents } from "../models/decoration-options";
import { generateDeorations } from "./generate-decorations";
export async function getDecorationByParent(
  parentSymbol: SymbolInformation,
  currentUri: Uri,
  kind: SymbolKind,
  symbolsInCurrentUri: SymbolInformation[],
  className: string
): Promise<DecorationOptionsForParents> {
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
      if (
        !classIOCache.find(
          s => s.parentUriFspath === parentSymbol.location.uri.fsPath
        )
      ) {
        classIOCache.push({
          currentFileName: [parentSymbol.location.uri.fsPath],
          parentSymbolName: [parentSymbol.name],
          parentUriFspath: parentSymbol.location.uri.fsPath,
          parentSymbols: convertToCachedSymbols(parentSymbolsInCurrentUri)
        });
        saveCache();
      }
      return generateDeorations(
        targetSymbols,
        parentSymbol,
        convertToCachedSymbols(parentSymbolsInCurrentUri),
        kind
      );
    }
    /**
     * Check if the cache has symbols of the parent class/interface file.
     * if true, generate codelens for the given property/method.
     */
    const currentFileName = currentUri.fsPath;
    let cache = classIOCache.find(
      c =>
        c.currentFileName.indexOf(currentFileName) !== -1 &&
        c.parentSymbolName.indexOf(parentSymbol.name) !== -1
    );
    if (cache && cache.parentSymbols.length > 0) {
      return generateDeorations(
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
    cache = classIOCache.find(c => c.parentUriFspath === location.uri.fsPath);

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
      return generateDeorations(
        targetSymbols,
        parentSymbol,
        cache.parentSymbols,
        kind
      );
    }
    // if we are here, then it is the first time we get symbols from parent uri.
    const symbolsRemote = await getSymbolsByUri(location.uri);
    // save to cache if cache doesnt have parent symbols.
    if (!classIOCache.find(s => s.parentUriFspath === location.uri.fsPath)) {
      classIOCache.push({
        currentFileName: [currentFileName],
        parentSymbolName: [parentSymbol.name],
        parentUriFspath: location.uri.fsPath,
        parentSymbols: convertToCachedSymbols(symbolsRemote)
      });
      saveCache();
    }
    return generateDeorations(
      targetSymbols,
      parentSymbol,
      convertToCachedSymbols(symbolsRemote),
      kind
    );
  } catch (error) {
    throw error;
  }
}
