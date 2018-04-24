import { Position, Range, ViewColumn, window, workspace } from "vscode";
import { Config } from "../configuration";

export async function goToParent() {
  const activeEditor = window.activeTextEditor;
  if (!activeEditor) {
    return;
  }
  const cursor = activeEditor.selection.active;
  const wordRange = activeEditor.document.getWordRangeAtPosition(cursor);
  const word = activeEditor.document.getText(wordRange);
  const caches = Config.classIOCache.filter(
    cache =>
      cache.childFileNames[activeEditor.document.fileName] ===
      activeEditor.document.fileName
  );

  caches.forEach(cache => {
    const cachedSymbol = cache.parentSymbols.find(c => c.name === word);

    if (cachedSymbol) {
      const validSymbols =
        cache.parentNamesAndChildren[cachedSymbol.containerName];
      if (validSymbols && validSymbols.indexOf(word) !== -1) {
        workspace.openTextDocument(cache.parentUriFspath).then(doc => {
          window.showTextDocument(doc, {
            viewColumn: ViewColumn.Three,
            selection: new Range(
              new Position(cachedSymbol.startLine, cachedSymbol.startChar),
              new Position(cachedSymbol.startLine, cachedSymbol.startChar)
            )
          });
        });
      }
    }
  });
}
