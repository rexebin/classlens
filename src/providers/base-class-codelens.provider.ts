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
  getCodeLensForMember,
  getSymbolsOpenedUri,
  hasBaseClass
} from "../utils";

export class BaseClassProvider implements CodeLensProvider {
  provideCodeLenses(
    document: TextDocument,
    token: CancellationToken
  ): CodeLens[] | Thenable<CodeLens[]> {
    const text = document.getText();
    if (!hasBaseClass(text)) {
      return [];
    }
    return this.provideBaseClassCodelens(document);
  }

  async provideBaseClassCodelens(document: TextDocument): Promise<CodeLens[]> {
    try {
      const symbols = await getSymbolsOpenedUri(document.uri);
      if (!symbols || symbols.length === 0) {
        return [];
      }
      let promises: Promise<CodeLens | undefined>[] = [];
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
            getCodeLensForMember(
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
