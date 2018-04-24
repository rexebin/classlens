import { DecorationOptions } from "vscode";

export interface DecorationOptionsForParents {
  [parentType: string]: DecorationOptions[];
}
