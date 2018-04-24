"use strict";

import {
  SymbolInformation,
  TextDocument,
  Uri,
  commands,
  workspace
} from "vscode";
import { hasBaseClass } from "./util";

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

/**
 *
 * Return symbols of interfaces of a given class.
 *
 * @param doc current document
 * @param classSymbol symbol of class to look for interface for.
 * @param symbols symbols of current document.
 * @returns symbols of interfaces of given class.
 */
export function getInterfaceSymbols(
  doc: TextDocument,
  classSymbol: SymbolInformation,
  symbols: SymbolInformation[]
): SymbolInformation[] {
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
  // get interface symbols by names from given symbols list.
  let interfaceSymbols: SymbolInformation[] = [];
  interfaces.forEach(i => {
    const s = symbols.filter(
      // symbols often doesn't include generic part, remove it to find all valid interface symbols
      s => s.name.replace(/(<).+(>)/, "") === i.replace(/(<).+(>)/, "")
    );
    if (s && s.length > 0) {
      interfaceSymbols.push(s[0]);
    }
  });
  return interfaceSymbols;
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
export function getBaseClassSymbol(
  doc: TextDocument,
  classSymbol: SymbolInformation,
  symbols: SymbolInformation[]
): SymbolInformation | undefined {
  if (!hasBaseClass(doc.getText(classSymbol.location.range))) {
    return;
  }
  let parentsAndInterfaces = getClassTextFromClassName(doc, classSymbol);
  if (parentsAndInterfaces === "") {
    return;
  }
  parentsAndInterfaces = parentsAndInterfaces.slice(
    0,
    parentsAndInterfaces.indexOf("{")
  );
  let matches = parentsAndInterfaces.match(/(extends)\s+(\w+)/);
  if (!matches || !matches[0]) {
    return;
  }
  const parentClassName = matches[0].replace("extends", "").trim();
  if (!parentClassName) {
    return;
  }
  return symbols.filter(
    // remove generic signature.
    s =>
      s.name.replace(/(<).+(>)/, "") === parentClassName.replace(/(<).+(>)/, "")
  )[0];
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
