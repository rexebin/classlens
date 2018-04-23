import { SymbolInformation } from "vscode";

export interface ClassParents {
  [className: string]: ParentSymbols;
}

export interface ParentSymbols {
  baseClass: SymbolInformation | undefined;
  interfaces: SymbolInformation[];
}
