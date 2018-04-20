"use strict";

import { SymbolKind, TextDocument } from "vscode";
import {
  decorateMember,
  getBaseClassSymbol,
  getSymbolsOpenedUri,
  hasBaseClass
} from "../utils";

/**
 * Fetch symbols and generate Codelens.
 * @param document current document
 */
export async function decorateOverrideMembers(document: TextDocument) {
  try {
    const text = document.getText();
    if (!hasBaseClass(text)) {
      return;
    }
    const symbols = await getSymbolsOpenedUri(document.uri);
    // if there is no symbols in the current document, return;
    if (symbols.length === 0) {
      throw new Error("No Symbols found");
    }

    /**
     * 1. filter out all symbols except properties and methods.
     * 2. filter out any symbols without a container class and return symbols and associated base class symbol
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
        const baseClassSymbol = getBaseClassSymbol(
          document,
          classSymbol,
          symbols
        );
        if (!baseClassSymbol) {
          return;
        }

        decorateMember(
          symbol,
          baseClassSymbol,
          document.uri,
          SymbolKind.Class,
          symbols
        );
      });
  } catch (error) {
    throw error;
  }
}
