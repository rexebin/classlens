import { TextEditor, window } from "vscode";
import { Config } from "../configuration";
import { DecorationOptionsForParents } from "../models/decoration-options";
export function decorateEditor(decoration: DecorationOptionsForParents) {
  const activeEditor = window.activeTextEditor;
  if (!activeEditor) {
    return;
  }
  clearDecoration(activeEditor).then(() =>
    Object.keys(decoration).forEach(key => {
      if (key === "class") {
        activeEditor.setDecorations(
          Config.overrideDecorationType,
          decoration[key]
        );
      }
      if (key === "interface") {
        activeEditor.setDecorations(
          Config.interfaceDecorationType,
          decoration[key]
        );
      }
    })
  );
}

export async function clearDecoration(activeEditor: TextEditor) {
  activeEditor.setDecorations(Config.overrideDecorationType, []);
  activeEditor.setDecorations(Config.interfaceDecorationType, []);
}
