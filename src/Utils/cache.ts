"use strict";

import { SymbolInformation } from "vscode";

export interface SymboleCache {
  currentFileName: string;
  parentSymbolName: string;
  parentFileName: string;
  parentSymbols: SymbolInformation[];
}

export class CacheProvider {
  static symbolCache: SymboleCache[] = [];
}
