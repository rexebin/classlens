import { workspace, window } from "vscode";
import { ClassIOCache } from "../models";
/**
 * Configuration storage class.
 */
export class Config {
  static overrideSymbol = workspace
    .getConfiguration("classio")
    .get<string>("overrideSymbol");
  static overrideSymbolColor = workspace
    .getConfiguration("classio")
    .get<string>("overrideSymbolColor");
  static implmentationSymbol = workspace
    .getConfiguration("classio")
    .get<string>("implmentationSymbol");
  static implmentationSymbolColor = workspace
    .getConfiguration("classio")
    .get<string>("implmentationSymbolColor");

  static overrideDecorationType = window.createTextEditorDecorationType({
    // color: "#10ADBA",
    before: {
      contentText: Config.overrideSymbol,
      color: Config.overrideSymbolColor
    }
  });

  static interfaceDecorationType = window.createTextEditorDecorationType({
    before: {
      contentText: Config.implmentationSymbol,
      color: Config.implmentationSymbolColor
    }
  });

  static classIOCache: ClassIOCache[] = [];

  static timer: NodeJS.Timer;
}
/**
 * Will be called when vscode's configuration is changed, to refresh ClassIO config.
 */
export const updateConfig = () => {
  Config.overrideSymbol = workspace
    .getConfiguration("classio")
    .get<string>("overrideSymbol");
  Config.overrideSymbolColor = workspace
    .getConfiguration("classio")
    .get<string>("overrideSymbolColor");
  Config.implmentationSymbol = workspace
    .getConfiguration("classio")
    .get<string>("implmentationSymbol");
  Config.implmentationSymbolColor = workspace
    .getConfiguration("classio")
    .get<string>("implmentationSymbolColor");
  Config.overrideDecorationType = window.createTextEditorDecorationType({
    // color: "#10ADBA",
    before: {
      contentText: Config.overrideSymbol,
      color: Config.overrideSymbolColor
    }
  });

  Config.interfaceDecorationType = window.createTextEditorDecorationType({
    before: {
      contentText: Config.implmentationSymbol,
      color: Config.implmentationSymbolColor
    }
  });
};
