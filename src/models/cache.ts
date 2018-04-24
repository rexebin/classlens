"use strict";

export interface ClassIOCache {
  childFileNames: { [filename: string]: string };
  parentNamesAndChildren: { [parentName: string]: string[] };
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
