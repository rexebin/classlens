"use strict";

import { SymbolInformation } from "vscode";

export interface SymboleCache {
  currentFileName: string;
  parentSymbolName: string;
  parentFileName: string;
  parentSymbols: SymbolInformation[];
}

/**
 * Cache storage. Cache symbols of parents, relevent to current file.
 */
export class CacheProvider {
  static symbolCache: SymboleCache[] = [];
}
