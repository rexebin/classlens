import { SymbolInformation } from "vscode";

export interface ClassParents {
  [className: string]: SymbolInformation[];
}
