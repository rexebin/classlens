"use strict";

import {
  CancellationToken,
  CodeLens,
  CodeLensProvider,
  SymbolInformation,
  SymbolKind,
  TextDocument
} from "vscode";
import {
  getBaseClassSymbol,
  getSymbolsOpenedUri,
  hasBaseClass,
  getCodeLensForParents,
  excutePromises,
  getInterfaceSymbols,
  hasInterfaces
} from "../utils";

/**
 * Codelens Provider for Base class.
 */
export class ClassLensProvider implements CodeLensProvider {
  provideCodeLenses(
    document: TextDocument,
    token: CancellationToken
  ): CodeLens[] | Thenable<CodeLens[]> {
    /**
     * if there is no base class in the whole file, skip.
     */
    const text = document.getText();
    if (!hasBaseClass(text) && !hasInterfaces(text)) {
      return [];
    }
    /**
     * if there is a base class in the file, then continue.
     */
    return this.provideClassCodelens(document);
  }

  /**
   * Fetch symbols and generate Codelens.
   * @param document current document
   */
  async provideClassCodelens(document: TextDocument): Promise<CodeLens[]> {
    try {
      const symbols = await getSymbolsOpenedUri(document.uri);
      // if there is no symbols in the current document, return;
      if (symbols.length === 0) {
        throw new Error("No Symbols found");
      }

      let baseClassSymbols: {
        baseClassSymbol: SymbolInformation;
        className: string;
      }[] = [];

      let classes = symbols
        .filter(s => s.containerName !== "")
        .map(s => s.containerName);
      classes = Array.from(new Set(classes));

      classes.forEach(c => {
        const classSymbol = symbols.filter(s => s.name === c)[0];
        const baseClassSymbol = getBaseClassSymbol(
          document,
          classSymbol,
          symbols
        );
        if (!baseClassSymbol) {
          return;
        }
        baseClassSymbols.push({
          baseClassSymbol: baseClassSymbol,
          className: c
        });
      });

      let promises: Promise<CodeLens[]>[] = [];
      baseClassSymbols.forEach(baseClassSymbol => {
        promises.push(
          getCodeLensForParents(
            baseClassSymbol.baseClassSymbol,
            document.uri,
            SymbolKind.Class,
            symbols,
            baseClassSymbol.className
          )
        );
      });
      let interfaceSymbols: {
        interfaceSymbols: SymbolInformation[];
        className: string;
      }[] = [];
      classes.forEach(c => {
        const classSymbol = symbols.filter(s => s.name === c)[0];
        interfaceSymbols.push({
          interfaceSymbols: getInterfaceSymbols(document, classSymbol, symbols),
          className: c
        });
      });
      interfaceSymbols.forEach(interfaceSymbol => {
        interfaceSymbol.interfaceSymbols.forEach(i => {
          promises.push(
            getCodeLensForParents(
              i,
              document.uri,
              SymbolKind.Interface,
              symbols,
              interfaceSymbol.className
            )
          );
        });
      });
      return excutePromises(promises);
    } catch (error) {
      throw error;
    }
  }
}
