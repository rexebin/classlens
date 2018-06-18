import { ParentSymbol } from "../providers";

export interface ClassParent {
  [className: string]: ParentSymbol;
}

export interface ClassInterfaces {
  [className: string]: ParentSymbol[];
}
