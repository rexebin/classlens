"use strict";

import { SymbolInformation } from "vscode";

export interface SymbolCache {
  currentFileName: string[];
  parentSymbolName: string[];
  parentUriFspath: string;
  parentSymbols: SymbolInformation[];
}

/**
 * Cache storage. Cache symbols of parents, relevent to current file.
 */
export class CacheProvider {
  static symbolCache: SymbolCache[] = [];
}
