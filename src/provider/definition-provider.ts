import {
  DefinitionProvider,
  TextDocument,
  Position,
  CancellationToken,
  Location,
  window,
  Uri
} from "vscode";
import { classIOCache } from "../extension";

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

    const cache = classIOCache.filter(
      c => c.currentFileName.indexOf(document.fileName) !== -1
    );
    let locations: Location[] = [];
    cache.forEach(c => {
      const parentSymbols = c.parentSymbols.filter(s => s.name === symbolName);
      parentSymbols.forEach(symbol => {
        locations.push(
          new Location(
            Uri.file(symbol.fsPath),
            new Position(symbol.startLine, symbol.startChar)
          )
        );
      });
    });

    return locations;
  }
}
