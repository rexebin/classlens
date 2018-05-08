"use strict";

import {
  Position,
  SymbolInformation,
  SymbolKind,
  TextDocument,
  Uri,
  commands,
  workspace
} from "vscode";
import {
  baseClassRegex,
  convertToCachedSymbols,
  getAllDefinitions,
  hasParents
} from ".";
import { log } from "../commands/logger";
import { Config } from "../configuration";
import { saveCache } from "../extension";

/**
 *
 * Get all symbols of the document with given uri.
 * 1. open the target document
 * 2. execute symbol provider against the just opened target document
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
): Promise<SymbolInformation[]> {
  const interfaces = getInterfaceNames(doc, classSymbol);
  // get interface symbols by names from given symbols list.
  let interfaceSymbols: SymbolInformation[] = [];
  for (let i of interfaces) {
    const s = symbols.find(
      // symbols often doesn't include generic part, remove it to find all valid interface symbols
      s => s.name.replace(/(<).+(>)/, "") === i.replace(/(<).+(>)/, "")
    );
    if (s) {
      interfaceSymbols.push(s);
      continue;
    }
    const symbol = await fetchParentSymbolRemote(
      doc,
      classSymbol,
      symbols,
      i,
      SymbolKind.Interface
    );
    if (symbol) {
      interfaceSymbols.push(symbol);
    }
  }

  return interfaceSymbols;
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
      interfaces = interfaces.map(i => i.trim());
    }
  }
  log(interfaces);
  return interfaces;
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
): Promise<SymbolInformation | undefined> {
  let parentClassName = getBaseClassName(doc, classSymbol);
  if (!parentClassName) {
    return;
  }
  var result = symbols.find(
    // remove generic signature.
    s =>
      s.name.replace(/(<).+(>)/, "") === parentClassName.replace(/(<).+(>)/, "")
  );

  if (result) {
    return result;
  }

  const symbol = await fetchParentSymbolRemote(
    doc,
    classSymbol,
    symbols,
    parentClassName,
    SymbolKind.Class
  );
  if (symbol) {
    return symbol;
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
  const parentClassName = matches[0].replace("extends", "").trim();
  if (!parentClassName) {
    return "";
  }
  return parentClassName;
}

/**
 * get class's declaration text.
 * Note: it is only contains the given class's body, not the whole body.
 * when class is changed by the user, only the first part to the changing point of the class body will be returned.
 * Therefore, changing class may interrupt classlens until class text returned contains the sholw declaration of the class.
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

export async function fetchParentSymbolRemote(
  document: TextDocument,
  classSymbol: SymbolInformation,
  symbols: SymbolInformation[],
  parentClassName: string,
  kind: SymbolKind
): Promise<SymbolInformation | undefined> {
  const text = document.getText(classSymbol.location.range);
  const position = getParentClassPosition(
    parentClassName,
    text,
    classSymbol.location.range.start.line,
    kind
  );
  if (!position) {
    return;
  }
  log(document.getText(document.getWordRangeAtPosition(position)));
  const locations = await getAllDefinitions(document.uri, position);
  log(locations);
  const targetSymbols = symbols.filter(
    symbol =>
      (symbol.kind === SymbolKind.Property ||
        symbol.kind === SymbolKind.Method) &&
      symbol.containerName === classSymbol.name
  );
  const targetSymbolNames = targetSymbols.map(s => s.name);
  for (let location of locations) {
    log(typeof location);
    log(location);
    if (location && location.uri) {
      log(location);
      const symbols = await getSymbolsByUri(location.uri);
      if (
        !Config.classLensCache.find(
          s => s.parentUriFspath === location.uri.fsPath
        )
      ) {
        Config.classLensCache.push({
          childFileNames: { [document.uri.fsPath]: document.uri.fsPath },
          parentNamesAndChildren: {
            [parentClassName]: targetSymbolNames
          },
          parentUriFspath: location.uri.fsPath,
          parentSymbols: convertToCachedSymbols(symbols)
        });
        saveCache();
        log(Config.classLensCache);
      }
      return symbols.find(s => s.name === parentClassName);
    }
  }
}

function getParentClassPosition(
  parentClassName: string,
  text: string,
  startLine: number,
  kind: SymbolKind
): Position | undefined {
  if (!parentClassName) {
    return;
  }

  let parentClassNameLine: number = 0;
  let parentClassCharacter: number = 0;
  if (kind === SymbolKind.Class) {
    let matches = text.match(/(extends)\s+((\w|\.)+)/);
    if (matches && matches.length > 0) {
      const splits = text.split(matches[0]);
      const newLines = splits[0].match(/[\r\n]/g);
      if (newLines) {
        parentClassNameLine = newLines.length;
      }
    }
  }

  if (kind === SymbolKind.Interface) {
  }

  log("start Line:" + startLine);
  log("parent line:" + parentClassNameLine);
  log("parent char:" + parentClassCharacter);

  return new Position(
    startLine + parentClassNameLine,
    parentClassCharacter + 1
  );
}
