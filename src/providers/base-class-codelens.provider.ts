"use strict";

import {
  CancellationToken,
  CodeLens,
  CodeLensProvider,
  SymbolKind,
  TextDocument
} from "vscode";
import {
  excutePromises,
  getBaseClassSymbol,
  computeCodeLensForMember,
  getSymbolsOpenedUri,
  hasBaseClass
} from "../utils";

/**
 * Codelens Provider for Base class.
 */
export class BaseClassProvider implements CodeLensProvider {
  provideCodeLenses(
    document: TextDocument,
    token: CancellationToken
  ): CodeLens[] | Thenable<CodeLens[]> {
    /**
     * if there is no base class in the whole file, skip.
     */
    const text = document.getText();
    if (!hasBaseClass(text)) {
      return [];
    }
    /**
     * if there is a base class in the file, then continue.
     */
    return this.provideBaseClassCodelens(document);
  }

  /**
   * Fetch symbols and generate Codelens.
   * @param document current document
   */
  async provideBaseClassCodelens(document: TextDocument): Promise<CodeLens[]> {
    try {
      const symbols = await getSymbolsOpenedUri(document.uri);
      // if there is no symbols in the current document, return;
      if (!symbols || symbols.length === 0) {
        return [];
      }
      let promises: Promise<CodeLens | undefined>[] = [];

      /**
       * 1. filter out all symbols except properties and methods.
       * 2. filter out any symbols without a container class and return symbols and associated base class symbol
       * 3. call for Codelens generator for each symbols left, push all the promises into a promise array.
       * 4. resolve all promises and return a codelens array promise.
       */
      symbols
        .filter(
          s => s.kind === SymbolKind.Property || s.kind === SymbolKind.Method
        )
        .map(s => {
          const className = s.containerName;
          const classSymbol = symbols.filter(s => s.name === className)[0];
          const baseClassSymbol = getBaseClassSymbol(
            document,
            classSymbol,
            symbols
          );
          if (!baseClassSymbol) {
            return;
          }
          return { symbol: s, baseClass: baseClassSymbol };
        })
        .filter(i => i !== undefined)
        .map(result => {
          if (!result) {
            return;
          }
          promises.push(
            computeCodeLensForMember(
              result.symbol,
              result.baseClass,
              document.uri,
              SymbolKind.Class,
              symbols
            )
          );
        });

      return excutePromises(promises);
    } catch (error) {
      console.log(error);
      return [];
    }
  }
}
