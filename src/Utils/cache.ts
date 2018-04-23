"use strict";

import { SymbolInformation } from "vscode";

export interface SymbolCache {
  currentFileName: string[];
  parentSymbolName: string[];
  parentUriFspath: string;
  parentSymbols: SymbolInformation[];
}
