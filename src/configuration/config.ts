import { workspace } from "vscode";
import { ClassLensCache } from "../models";
/**
 * Configuration storage class.
 */
export class Config {
  static isSplit = workspace
    .getConfiguration("classLens")
    .get<boolean>("openSideBySide");

  static classLensCache: ClassLensCache[] = [];

  static timer: NodeJS.Timer;

  static isDebug = workspace
    .getConfiguration("classLens")
    .get<boolean>("debugMode");
}
/**
 * Will be called when vscode's configuration is changed, to refresh ClassLens config.
 */
export const updateConfig = () => {
  Config.isSplit = workspace
    .getConfiguration("classLens")
    .get("openSideBySide");
  Config.isDebug = workspace
    .getConfiguration("classLens")
    .get<boolean>("debugMode");
};
