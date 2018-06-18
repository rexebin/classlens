"use strict";

import {
  commands,
  Position,
  SymbolInformation,
  SymbolKind,
  TextDocument,
  Uri,
  workspace
} from "vscode";
import { baseClassRegex, getAllDefinitions, hasParents } from ".";
import { log, createNamedNodeLookUp } from "../commands";

/**
 *
 * Get all symbols of the document with given uri.
 * 1. open the target document
 * 2. excute symbol provider against the just opened target document
 *
 * Note: the function open file in the background. it will show the document to the user.
 *
 * @param uri uri of document to be opened
 *
 */
export async function getSymbolsByUri(uri: Uri): Promise<SymbolInformation[]> {
  try {
    const doc = await workspace.openTextDocument(uri);
    return await getSymbolsOpenedUri(doc.uri);
  } catch (error) {
    throw error;
  }
}
/**
 * Get all symbols of the already opened document with given uri.

 * @param uri uri of document to get symbols for.
 */
export async function getSymbolsOpenedUri(
  uri: Uri
): Promise<SymbolInformation[]> {
  try {
    const symbols = await commands.executeCommand<SymbolInformation[]>(
      "vscode.executeDocumentSymbolProvider",
      uri
    );
    if (!symbols) {
      return [];
    }
    return symbols;
  } catch (error) {
    throw error;
  }
}
// export function getCSharpSymbols(
//   doc: TextDocument,
//   classSymbol: SymbolInformation,
//   symbols: SymbolInformation[]
// ): SymbolInformation[] {
//   let parentsAndInterfaces = doc.getText();
//   const classIndex = parentsAndInterfaces.indexOf("class " + classSymbol.name);
//   if (classIndex === -1) {
//     return [];
//   }
//   parentsAndInterfaces = parentsAndInterfaces.slice(classIndex);
//   const columnIndex = parentsAndInterfaces.indexOf(":");
//   let parents: string[] = [];
//   if (columnIndex >= 0) {
//     let parentText = parentsAndInterfaces.slice(columnIndex + 1);
//     parents = parentText.slice(0, parentText.indexOf("{")).split(",");
//     if (parents) {
//       parents = parents.map(i => i.trim());
//     }
//   } else {
//     return [];
//   }
//   // get interface symbols by names from given symbols list.
//   let parentSymbols: SymbolInformation[] = [];
//   parents.forEach(i => {
//     const s = symbols.find(
//       // symbols often doesn't include generic part, remove it to find all valid interface symbols
//       s => s.name.replace(/(<).+(>)/, "") === i.replace(/(<).+(>)/, "")
//     );
//     if (s) {
//       parentSymbols.push(s);
//     }
//   });
//   return parentSymbols;
// }
/**
 *
 * Return symbols of interfaces of a given class.
 *
 * @param doc current document
 * @param classSymbol symbol of class to look for interface for.
 * @param symbols symbols of current document.
 * @returns symbols of interfaces of given class.
 */
export async function getInterfaceSymbols(
  doc: TextDocument,
  classSymbol: SymbolInformation,
  symbols: SymbolInformation[]
): Promise<ParentSymbol[]> {
  const interfaces = getInterfaceNames(doc, classSymbol);
  // get interface symbols by names from given symbols list.
  let interfaceSymbols: ParentSymbol[] = [];
  for (let i of interfaces) {
    let s = await getParentSymbol(i, doc, symbols);
    if (s) {
      interfaceSymbols.push(s);
    }
  }
  return interfaceSymbols;
}

export async function getParentSymbol(
  name: string,
  doc: TextDocument,
  symbols: SymbolInformation[]
): Promise<ParentSymbol | undefined> {
  name = name.replace(/(<).+(>)/, "");
  const symbol = symbols.find(s => s.name === name);
  if (symbol) {
    return {
      name: name,
      position: new Position(
        symbol.location.range.start.line,
        symbol.location.range.start.character + 1
      )
    };
  }
  const lookup = await createNamedNodeLookUp(doc.getText());
  const node = lookup(name);
  if (!node) {
    log(name + " node not found");
    return;
  }
  const p = doc.positionAt(node.pos);

  return { name: name, position: new Position(p.line, p.character + 1) };
}

/**
 * Return symbols of base class of a given class.
 *
 * @param doc current document
 * @param classSymbol symbol of class to look for base class for.
 * @param symbols symbols of current document.
 *
 * @returns Symbol of base class of the given class.
 */
export async function getBaseClassSymbol(
  doc: TextDocument,
  classSymbol: SymbolInformation,
  symbols: SymbolInformation[]
): Promise<ParentSymbol | undefined> {
  let parentClassName = getBaseClassName(doc, classSymbol);

  if (!parentClassName) {
    return;
  }
  return await getParentSymbol(parentClassName, doc, symbols);
}

/**
 * Get interface names of a given class.
 * @param doc document object of current uri.
 * @param classSymbol class symbol
 */
export function getInterfaceNames(
  doc: TextDocument,
  classSymbol: SymbolInformation
): string[] {
  let parentsAndInterfaces = getClassTextFromClassName(doc, classSymbol);
  if (parentsAndInterfaces === "") {
    return [];
  }
  // string manipulation to get names of interfaces of the given class.
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
      interfaces = interfaces.map(i => i.trim()).map(i => {
        if (i.indexOf(".") !== -1) {
          const name = i.split(".").pop();
          if (name) {
            return name;
          }
        }
        return i;
      });
    }
  }
  return interfaces;
}
/**
 * get class's declaration text.
 * Note: it is only contains the given class's body, not the whole body.
 * when class is changed by the user, only the first part to the changing point of the class body will be returned.
 * Therefore, changing class may interrupt classIO until class text returned contains the sholw declaration of the class.
 * @param doc : current text document
 * @param classSymbol symbol of target class to look for.
 *
 * @returns string of class's body starting from the end of class name to the end of class.
 */
function getClassTextFromClassName(
  doc: TextDocument,
  classSymbol: SymbolInformation
): string {
  const classText = doc.getText(classSymbol.location.range);
  const classIndex = classText.indexOf("class " + classSymbol.name);
  if (classIndex === -1) {
    return "";
  } else {
    return classText.slice(
      classIndex + classSymbol.name.length + "class ".length
    );
  }
}

export function getBaseClassName(
  doc: TextDocument,
  classSymbol: SymbolInformation
): string {
  if (!hasParents(doc.getText(classSymbol.location.range), baseClassRegex)) {
    return "";
  }
  let parentsAndInterfaces = getClassTextFromClassName(doc, classSymbol);
  if (parentsAndInterfaces === "") {
    return "";
  }
  parentsAndInterfaces = parentsAndInterfaces.slice(
    0,
    parentsAndInterfaces.indexOf("{")
  );
  let matches = parentsAndInterfaces.match(/(extends)\s+((\w|\.)+)/);
  if (!matches || !matches[0]) {
    return "";
  }
  let parentClassName = matches[0].replace("extends", "").trim();
  if (!parentClassName) {
    return "";
  }
  if (parentClassName.indexOf(".") !== -1) {
    const parent = parentClassName.split(".").pop();
    if (parent) {
      parentClassName = parent;
    }
  }
  log(parentClassName);
  return parentClassName;
}

export interface ParentSymbol {
  name: string;
  position: Position;
}

export function getNameSpacePosition(
  doc: TextDocument,
  moduleSymbol: SymbolInformation
): Position {
  const nameSpaceLineText = doc.getText(moduleSymbol.location.range);
  const namespaceNameIndex = nameSpaceLineText.indexOf(moduleSymbol.name);
  return new Position(
    moduleSymbol.location.range.start.line,
    namespaceNameIndex
  );
}
/**
 *
 * @param document text document
 * @param symbols all symbols of given text document
 */
export async function getSymbolsForModules(
  document: TextDocument,
  symbols: SymbolInformation[]
): Promise<SymbolInformation[]> {
  let modules = symbols.filter(s => s.kind === SymbolKind.Module);
  let moduleSymbols: SymbolInformation[] = [];
  for (let symbol of modules) {
    log(symbol.location.range.start);
    const definitions = await getAllDefinitions(
      symbol.location.uri,
      getNameSpacePosition(document, symbol)
    );
    if (definitions.length > 0) {
      for (let def of definitions) {
        if (def && def.uri && def.uri.fsPath !== document.uri.fsPath) {
          const symbolsOfDef = await getSymbolsByUri(def.uri);
          moduleSymbols = [...moduleSymbols, ...symbolsOfDef];
        } else {
          log("module def is current file, skip");
        }
      }
    } else {
      log("no module definitions found");
    }
  }
  log("module symbols:");
  log(moduleSymbols);
  return moduleSymbols;
}
