import { DecorationOptions, TextEditorDecorationType, window } from "vscode";

export function decorateEditor(
  decorateType: TextEditorDecorationType,
  decorationOption: DecorationOptions[]
) {
  const editor = window.activeTextEditor;
  if (!editor) {
    return;
  }
  editor.setDecorations(decorateType, decorationOption);
}
