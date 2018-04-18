import { SymbolInformation } from "vscode";
const baseClassRegex = /(class)(\s+)(\w+)(\s+)(extends)/;
const interfaceRegex = /(implements)(\s+)/;
export function getBaseClass(
  text: string,
  className: string,
  symbols: SymbolInformation[]
): SymbolInformation | undefined {
  const classIndex = text.indexOf(className);
  if (classIndex === -1) {
    return;
  }
  let parentsAndInterfaces = text.slice(classIndex + className.length);
  parentsAndInterfaces = parentsAndInterfaces.slice(
    0,
    parentsAndInterfaces.indexOf("{")
  );
  let parentClassName = parentsAndInterfaces.match(/(extends)\s+(\w+)/);
  if (!parentClassName) {
    return;
  }
  const c = parentClassName[0].replace("extends", "").trim();
  return symbols.filter(s => s.name === c)[0];
}

export function hasBaseClass(document: string): boolean {
  const map = document.match(baseClassRegex);
  if (map && map.length > 0) {
    return true;
  }
  return false;
}

export function hasInterfaces(document: string): boolean {
  const map = document.match(interfaceRegex);
  if (map && map.length > 0) {
    return true;
  }
  return false;
}
