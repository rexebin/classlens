import { workspace } from "vscode";

export class Config {
  static isSplit = workspace
    .getConfiguration("classLens")
    .get<boolean>("openSideBySide");
}

export const updateConfig = () => {
  Config.isSplit = workspace
    .getConfiguration("classLens")
    .get("openSideBySide");
};
