"use strict";

export interface ClassLensCache {
  currentFileName: string[];
  parentSymbolName: string[];
  parentUriFspath: string;
  parentSymbols: CachedSymbol[];
}

export class CachedSymbol {
  constructor(
    public fsPath: string,
    public startLine: number,
    public startChar: number,
    public name: string,
    public containerName: string
  ) {}
}
