"use strict";

import {
  CancellationToken,
  CodeLens,
  CodeLensProvider,
  TextDocument
} from "vscode";
import { baseClassRegex, hasParents, interfaceRegex } from ".";
import { log } from "../commands/logger";
import { ClassParents } from "../models";
import { getCodeLensForParents } from "./codelens-generator";
import {
  getBaseClassSymbol,
  getInterfaceSymbols,
  getSymbolsForModules,
  getSymbolsOpenedUri
} from "./symbols";

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
      let symbols = await getSymbolsOpenedUri(document.uri);
      log("start provider, symbols of current file:");
      log(symbols);
      // if there is no symbols in the current document, return;
      if (symbols.length === 0) {
        return [];
      }

      const moduleSymbols = await getSymbolsForModules(document, symbols);
      symbols = [...symbols, ...moduleSymbols];

      let classParents: ClassParents = {};

      const uniqueClasses = Array.from(
        new Set(
          symbols.filter(s => s.containerName !== "").map(s => s.containerName)
        )
      );

      for (let className of uniqueClasses) {
        const classSymbol = symbols.find(s => s.name === className);
        if (!classSymbol) {
          continue;
        }
        const baseClassSymbol = await getBaseClassSymbol(
          document,
          classSymbol,
          symbols
        );
        const interfaceSymbols = await getInterfaceSymbols(
          document,
          classSymbol,
          symbols
        );
        if (baseClassSymbol) {
          classParents[className] = [baseClassSymbol, ...interfaceSymbols];
        } else {
          classParents[className] = interfaceSymbols;
        }
      }

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
