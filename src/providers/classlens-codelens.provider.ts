"use strict";

import {
  CancellationToken,
  CodeLens,
  CodeLensProvider,
  SymbolKind,
  TextDocument
} from "vscode";
import { ClassParents } from "../models";
import {
  excutePromises,
  getBaseClassSymbol,
  getCodeLensForParents,
  getInterfaceSymbols,
  getSymbolsOpenedUri,
  hasBaseClass,
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
     * if there is no base class or interfaces in the whole file, skip.
     */
    const text = document.getText();
    if (!hasBaseClass(text) && !hasInterfaces(text)) {
      return [];
    }
    /**
     * if there is a base class or interface in the file, then continue.
     */
    return this.provideClassCodelens(document);
  }

  /**
   * Fetch symbols and generate Codelens for each class.
   * @param document current document
   */
  async provideClassCodelens(document: TextDocument): Promise<CodeLens[]> {
    try {
      const symbols = await getSymbolsOpenedUri(document.uri);
      // if there is no symbols in the current document, return;
      if (symbols.length === 0) {
        return [];
      }
      let promises: Promise<CodeLens[]>[] = [];

      let classParents: ClassParents = {};

      const uniqueClasses = Array.from(
        new Set(
          symbols.filter(s => s.containerName !== "").map(s => s.containerName)
        )
      );

      uniqueClasses.forEach(className => {
        const classSymbol = symbols.find(s => s.name === className);
        if (!classSymbol) {
          return;
        }
        const baseClassSymbol = getBaseClassSymbol(
          document,
          classSymbol,
          symbols
        );
        const interfaceSymbols = getInterfaceSymbols(
          document,
          classSymbol,
          symbols
        );
        classParents[className] = {
          baseClass: baseClassSymbol,
          interfaces: interfaceSymbols
        };
      });

      Object.keys(classParents).forEach(className => {
        const baseClass = classParents[className].baseClass;
        if (baseClass) {
          promises.push(
            getCodeLensForParents(
              baseClass,
              document.uri,
              SymbolKind.Class,
              symbols,
              className
            )
          );
        }
        classParents[className].interfaces.forEach(interfacSymbol => {
          promises.push(
            getCodeLensForParents(
              interfacSymbol,
              document.uri,
              SymbolKind.Interface,
              symbols,
              className
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
