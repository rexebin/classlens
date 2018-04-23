import {
  SymbolInformation,
  window,
  workspace,
  ViewColumn,
  Range,
  Position
} from "vscode";
import { Config } from "../configuration";

export const gotoParentCommandName = "classLens.gotoParent";
/**
 * Clicking on ClassLens Codelens will excute this command to open the target location.
 * @param symbol location to go to.
 */
export interface SymbolRange {
  line: number;
  character: number;
}
export const gotoParent = (symbol: SymbolInformation) => {
  const range: SymbolRange[] = <any>symbol.location.range;
  // The code you place here will be executed every time your command is executed
  workspace.openTextDocument(symbol.location.uri.fsPath).then(
    doc => {
      const startLine = range[0].line;
      const startChar = range[0].character;
      const endLine = range[1].line;
      const endChar = range[1].character;
      window
        .showTextDocument(doc.uri, {
          viewColumn: Config.isSplit ? ViewColumn.Two : ViewColumn.Active,
          selection: new Range(
            new Position(startLine, startChar),
            new Position(endLine, endChar)
          )
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
