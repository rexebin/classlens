// "use strict";

// import {
//   CancellationToken,
//   CodeLens,
//   CodeLensProvider,
//   ProviderResult,
//   SymbolKind,
//   TextDocument,
//   SymbolInformation
// } from "vscode";
// import {
//   excutePromises,
//   getCodeLensForParents,
//   getInterfaceSymbols,
//   getSymbolsOpenedUri,
//   hasInterfaces
// } from "../utils";

// /**
//  * CodeLens provider for interfaces.
//  */
// export class InterfaceCodeLensProvider implements CodeLensProvider {
//   provideCodeLenses(
//     document: TextDocument,
//     token: CancellationToken
//   ): ProviderResult<CodeLens[]> {
//     const text = document.getText();
//     /**
//      * if there is no interfaces in the whole file, skip.
//      */
//     if (!hasInterfaces(text)) {
//       return [];
//     }
//     /**
//      * if there is an interface in the file, then continue.
//      */
//     return this.provideInterfaceCodeLens(document);
//   }
//   /**
//    * Fetch symbols and generate Codelens.
//    * @param document current document
//    */
//   async provideInterfaceCodeLens(document: TextDocument): Promise<CodeLens[]> {
//     try {
//       let promises: Promise<CodeLens[]>[] = [];
//       const symbols = await getSymbolsOpenedUri(document.uri);
//       // if there is no symbols in the current document, return;
//       if (symbols.length === 0) {
//         throw new Error("No symbols found");
//       }
//       /**
//        * 1. filter out all symbols except properties and methods.
//        * 2. filter out any symbols without a container class with interfaces and return symbols and associated interface symbols
//        * 3. call for Codelens generator for each symbols left, push all the promises into a promise array.
//        * 4. resolve all promises and return a codelens array promise.
//        */
//       let interfaceSymbols: SymbolInformation[] = [];
//       const targetSymbols = symbols.filter(
//         symbol =>
//           symbol.kind === SymbolKind.Property ||
//           symbol.kind === SymbolKind.Method
//       );
//       targetSymbols.forEach(symbol => {
//         const className = symbol.containerName;
//         const classSymbol = symbols.filter(s => s.name === className)[0];
//         interfaceSymbols = getInterfaceSymbols(document, classSymbol, symbols);
//       });
//       interfaceSymbols.forEach(interfaceSymbol => {
//         promises.push(
//           getCodeLensForParents(
//             targetSymbols,
//             interfaceSymbol,
//             document.uri,
//             SymbolKind.Interface,
//             symbols
//           )
//         );
//       });
//       return excutePromises(promises);
//     } catch (error) {
//       throw error;
//     }
//   }
// }
