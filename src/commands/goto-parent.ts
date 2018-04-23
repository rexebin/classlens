import { Range, ViewColumn, window, workspace, Position } from "vscode";
import { Config } from "../configuration";
import { CachedSymbol } from "../models";

export const gotoParentCommandName = "classLens.gotoParent";
/**
 * Clicking on ClassLens Codelens will excute this command to open the target location.
 * @param cachedSymbol location to go to.
 */

export const gotoParent = (cachedSymbol: CachedSymbol) => {
  // The code you place here will be executed every time your command is executed
  workspace.openTextDocument(cachedSymbol.fsPath).then(
    doc => {
      const position = new Position(
        cachedSymbol.startLine,
        cachedSymbol.startChar
      );
      window
        .showTextDocument(doc.uri, {
          viewColumn: Config.isSplit ? ViewColumn.Two : ViewColumn.Active,
          selection: new Range(position, position)
        })
        .then(
          () => {},
          error => {
            console.log(error);
          }
        );
    },
    error => {
      throw error;
    }
  );
};
