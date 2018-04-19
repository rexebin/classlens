"use strict";

import {
  CancellationToken,
  CodeLens,
  CodeLensProvider,
  ProviderResult,
  SymbolKind,
  TextDocument
} from "vscode";
import {
  excutePromises,
  getCodeLensForMember,
  getInterfaceSymbols,
  getSymbolsOpenedUri,
  hasInterfaces
} from "../utils";

export class InterfaceCodeLensProvider implements CodeLensProvider {
  provideCodeLenses(
    document: TextDocument,
    token: CancellationToken
  ): ProviderResult<CodeLens[]> {
    const text = document.getText();
    if (!hasInterfaces(text)) {
      return [];
    }
    return this.provideInterfaceCodeLens(document);
  }

  async provideInterfaceCodeLens(document: TextDocument): Promise<CodeLens[]> {
    try {
      let promises: Promise<CodeLens | undefined>[] = [];
      const symbols = await getSymbolsOpenedUri(document.uri);
      if (!symbols || symbols.length === 0) {
        return [];
      }
      symbols
        .filter(
          s => s.kind === SymbolKind.Property || s.kind === SymbolKind.Method
        )
        .map(s => {
          const className = s.containerName;
          const classSymbol = symbols.filter(s => s.name === className)[0];
          const interfaceSymbols = getInterfaceSymbols(
            document,
            classSymbol,
            symbols
          );
          if (!interfaceSymbols || interfaceSymbols.length === 0) {
            return;
          }
          return { symbol: s, interfaces: interfaceSymbols };
        })
        .filter(i => i !== undefined)
        .map(result => {
          if (!result) {
            return;
          }
          result.interfaces.forEach(i => {
            promises.push(
              getCodeLensForMember(
                result.symbol,
                i,
                document.uri,
                SymbolKind.Interface,
                symbols
              )
            );
          });
        });
      return excutePromises(promises);
    } catch (error) {
      console.log(error);
      return [];
    }
  }
}
