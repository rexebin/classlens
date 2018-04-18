import { SymbolInformation, CodeLens } from "vscode";
const baseClassRegex = /(class)(\s+)(\w+)(\s+)(extends)/;
const interfaceRegex = /(implements)(\s+)/;

export function getInterfaceSymbols(
  documentText: string,
  className: string,
  symbols: SymbolInformation[]
): SymbolInformation[] {
  const classIndex = documentText.indexOf(className);
  if (classIndex === -1) {
    return [];
  }
  let parentsAndInterfaces = documentText.slice(classIndex + className.length);
  const implementsIndex = parentsAndInterfaces.indexOf("implements");
  let interfaces: string[] = [];
  if (implementsIndex >= 0) {
    let interfacesText = parentsAndInterfaces.slice(
      implementsIndex + "implements".length
    );
    interfaces = interfacesText
      .slice(0, interfacesText.indexOf("{"))
      .split(",");
    if (interfaces) {
      interfaces = interfaces.map(i => i.trim());
    }
  }

  let interfaceSymbols: SymbolInformation[] = [];
  interfaces.forEach(i => {
    const s = symbols.filter(
      s => s.name.replace(/(<).+(>)/, "") === i.replace(/(<).+(>)/, "")
    );
    if (s && s.length > 0) {
      interfaceSymbols.push(s[0]);
    }
  });
  return interfaceSymbols;
}

export function getBaseClassSymbol(
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
  return symbols.filter(
    s => s.name.replace(/(<).+(>)/, "") === c.replace(/(<).+(>)/, "")
  )[0];
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
export function excutePromises(
  promises: Promise<CodeLens | undefined>[]
): Promise<CodeLens[]> {
  return new Promise((resolve, reject) => {
    const results: CodeLens[] = [];
    let count = 0;
    promises.forEach((promise, idx) => {
      promise
        .catch(error => {
          console.log(error);
          return error;
        })
        .then(valueOrError => {
          if (!(valueOrError instanceof Error) && valueOrError !== undefined) {
            results.push(valueOrError);
          }
          count += 1;
          if (count === promises.length) {
            resolve(results);
          }
        });
    });
  });
}
