import { workspace } from "vscode";
/**
 * Configuration storage class.
 */
export class Config {
  static isSplit = workspace
    .getConfiguration("classLens")
    .get<boolean>("openSideBySide");
}
/**
 * Will be called when vscode's configuration is changed, to refresh ClassLens config.
 */
export const updateConfig = () => {
  Config.isSplit = workspace
    .getConfiguration("classLens")
    .get("openSideBySide");
};
