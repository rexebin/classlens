"use strict";

import {
  CancellationToken,
  CodeLens,
  CodeLensProvider,
  TextDocument
} from "vscode";
import { ClassParents } from "../models";
import { getCodeLensForParents } from "./codelens-generator";
import {
  getBaseClassSymbol,
  getInterfaceSymbols,
  getSymbolsOpenedUri
} from "./symbols";
import { hasParents, baseClassRegex, interfaceRegex } from ".";
import { log } from "../commands/logger";

/**
 * Codelens Provider for Base class.
 */
export class ClassLensProvider implements CodeLensProvider {
  async provideCodeLenses(
    document: TextDocument,
    token: CancellationToken
  ): Promise<CodeLens[]> {
    /**
     * if there is no base class or interfaces in the whole file, skip.
     */
    const text = document.getText();
    if (
      !hasParents(text, baseClassRegex) &&
      !hasParents(text, interfaceRegex)
    ) {
      return [];
    }
    /**
     * if there is a base class or interface in the file, then continue.
     */
    return await this.provideClassCodelens(document);
  }

  /**
   * Fetch symbols and generate Codelens for each class.
   * @param document current document
   */
  async provideClassCodelens(document: TextDocument): Promise<CodeLens[]> {
    try {
      const symbols = await getSymbolsOpenedUri(document.uri);
      log("start provider, symbols of current file:");
      // if there is no symbols in the current document, return;
      if (symbols.length === 0) {
        return [];
      }

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
        if (baseClassSymbol) {
          classParents[className] = [baseClassSymbol, ...interfaceSymbols];
        } else {
          classParents[className] = interfaceSymbols;
        }
      });
      log("unique classes:");
      log(uniqueClasses);
      log("class parents:");
      log(classParents);
      let codeLens: CodeLens[] = [];
      const classNames = Object.keys(classParents);
      for (let className of classNames) {
        for (let symbol of classParents[className]) {
          codeLens = [
            ...codeLens,
            ...(await getCodeLensForParents(
              symbol,
              document.uri,
              symbols,
              className
            ))
          ];
        }
      }
      log("complete, codelens:");
      log(codeLens);
      return codeLens;
    } catch (error) {
      throw error;
    }
  }
}
