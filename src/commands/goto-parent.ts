import {
  SymbolInformation,
  window,
  workspace,
  ViewColumn,
  Range
} from "vscode";
import { Config } from "../configuration";

export const gotoParentCommandName = "classLens.gotoParent";
/**
 * Clicking on ClassLens Codelens will excute this command to open the target location.
 * @param symbol location to go to.
 */
export const gotoParent = (symbol: SymbolInformation) => {
  // The code you place here will be executed every time your command is executed
  workspace.openTextDocument(symbol.location.uri).then(
    doc => {
      window.showTextDocument(symbol.location.uri, {
        viewColumn: Config.isSplit ? ViewColumn.Two : ViewColumn.Active,
        selection: new Range(
          symbol.location.range.start,
          symbol.location.range.start
        )
      });
    },
    error => {
      throw error;
    }
  );
};
