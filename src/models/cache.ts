"use strict";

export interface ClassIOCache {
  childFileNames: string[];
  childMemberNames: string[];
  parentNames: string[];
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
