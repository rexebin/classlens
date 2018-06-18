"use strict";

import {
  CancellationToken,
  CodeLens,
  CodeLensProvider,
  SymbolKind,
  TextDocument
} from "vscode";
import { baseClassRegex, hasParents, interfaceRegex } from ".";
import { log } from "../commands/logger";
import { ClassInterfaces, ClassParent } from "../models";
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

      let classParent: ClassParent = {};
      let classInterfaces: ClassInterfaces = {};

      const uniqueClasses = Array.from(
        new Set(
          symbols.filter(s => s.containerName !== "").map(s => s.containerName)
        )
      );

      for (let className of uniqueClasses) {
        const classSymbol = symbols.find(s => s.name === className);
        if (!classSymbol) {
          return [];
        }
        const baseClassSymbol = await getBaseClassSymbol(
          document,
          classSymbol,
          symbols
        );
        classInterfaces[className] = await getInterfaceSymbols(
          document,
          classSymbol,
          symbols
        );
        if (baseClassSymbol) {
          classParent[className] = baseClassSymbol;
        }
      }
      log("unique classes:");
      log(uniqueClasses);
      log("class parents:");
      log(classParent);
      let codeLens: CodeLens[] = [];
      let classNames = Object.keys(classParent);
      for (let className of classNames) {
        codeLens = [
          ...codeLens,
          ...(await getCodeLensForParents(
            classParent[className],
            document.uri,
            symbols,
            className,
            SymbolKind.Class
          ))
        ];
      }
      classNames = Object.keys(classInterfaces);
      for (let className of classNames) {
        for (let symbol of classInterfaces[className]) {
          codeLens = [
            ...codeLens,
            ...(await getCodeLensForParents(
              symbol,
              document.uri,
              symbols,
              className,
              SymbolKind.Interface
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
