"use strict";

import { SymbolKind, TextDocument } from "vscode";
import {
  decorateMember,
  getInterfaceSymbols,
  getSymbolsOpenedUri,
  hasInterfaces
} from "../utils";

/**
 * Fetch symbols and generate Codelens.
 * @param document current document
 */
export async function decorateInterfaceMembers(document: TextDocument) {
  try {
    const text = document.getText();
    /**
     * if there is no interfaces in the whole file, skip.
     */
    if (!hasInterfaces(text)) {
      return;
    }

    const symbols = await getSymbolsOpenedUri(document.uri);
    // if there is no symbols in the current document, return;
    if (symbols.length === 0) {
      throw new Error("No symbols found");
    }
    /**
     * 1. filter out all symbols except properties and methods.
     * 2. filter out any symbols without a container class with interfaces and return symbols and associated interface symbols
     * 3. call for Codelens generator for each symbols left, push all the promises into a promise array.
     * 4. resolve all promises and return a codelens array promise.
     */
    symbols
      .filter(
        symbol =>
          symbol.kind === SymbolKind.Property ||
          symbol.kind === SymbolKind.Method
      )
      .forEach(symbol => {
        const className = symbol.containerName;
        const classSymbol = symbols.filter(s => s.name === className)[0];
        const interfaceSymbols = getInterfaceSymbols(
          document,
          classSymbol,
          symbols
        );
        if (interfaceSymbols.length === 0) {
          return;
        }
        interfaceSymbols.forEach(i => {
          decorateMember(
            symbol,
            i,
            document.uri,
            SymbolKind.Interface,
            symbols
          );
        });
      });
  } catch (error) {
    throw error;
  }
}
