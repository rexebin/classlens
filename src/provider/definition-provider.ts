import {
  CancellationToken,
  DefinitionProvider,
  Location,
  Position,
  TextDocument,
  Uri,
  window
} from "vscode";
import { Config } from "../configuration";

export class ClassIODefinitionProvider implements DefinitionProvider {
  provideDefinition(
    document: TextDocument,
    position: Position,
    token: CancellationToken
  ):
    | Location
    | Location[]
    | Thenable<Location | Location[] | null | undefined>
    | null
    | undefined {
    const editor = window.activeTextEditor;
    if (!editor) {
      return;
    }

    const wordAtCursor = editor.document.getWordRangeAtPosition(position);
    const symbolName = editor.document.getText(wordAtCursor);
    const cache = Config.classIOCache.filter(
      c => c.childFileNames[document.fileName] === document.fileName
    );

    let locations: Location[] = [];
    cache.forEach(c => {
      const parentSymbols = c.parentSymbols.filter(s => s.name === symbolName);
      parentSymbols.forEach(symbol => {
        const validSymbos = c.parentNamesAndChildren[symbol.containerName];
        if (validSymbos && validSymbos.indexOf(symbolName) !== -1) {
          locations.push(
            new Location(
              Uri.file(symbol.fsPath),
              new Position(symbol.startLine, symbol.startChar)
            )
          );
        }
      });
    });

    return locations;
  }
}
