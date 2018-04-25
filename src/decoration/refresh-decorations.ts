import { TextDocument, TextEditor } from "vscode";
import {
  baseClassRegex,
  getBaseClassSymbol,
  getInterfaceSymbols,
  getSymbolsOpenedUri,
  hasParents,
  interfaceRegex,
  mergeDecorations
} from "../commands";
import { ClassParents } from "../models";
import { DecorationOptionsForParents } from "../models/decoration-options";
import { clearDecoration, decorateEditor } from "./decorate-editor";
import { getDecorationByParent } from "./get-decoration-by-parent";
export async function refreshDecorations(activeEditor?: TextEditor) {
  try {
    if (!activeEditor) {
      return;
    }
    const document: TextDocument = activeEditor.document;
    const text = document.getText();
    if (
      !hasParents(text, baseClassRegex) &&
      !hasParents(text, interfaceRegex)
    ) {
      clearDecoration(activeEditor);
      return {};
    }

    const symbols = await getSymbolsOpenedUri(document.uri);
    // if there is no symbols in the current document, return;
    if (symbols.length === 0) {
      clearDecoration(activeEditor);
      return;
    }
    let classParents: ClassParents = {};

    const uniqueClasses = Array.from(
      new Set(
        symbols.filter(s => s.containerName !== "").map(s => s.containerName)
      )
    );

    uniqueClasses.forEach(className => {
      const classSymbol = symbols.find(s => s.name === className);
      if (!classSymbol) {
        return;
      }
      const baseClassSymbol = getBaseClassSymbol(
        document,
        classSymbol,
        symbols
      );
      const interfaceSymbols = getInterfaceSymbols(
        document,
        classSymbol,
        symbols
      );
      if (baseClassSymbol) {
        classParents[className] = [baseClassSymbol, ...interfaceSymbols];
      } else {
        classParents[className] = interfaceSymbols;
      }
    });
    let decorations: DecorationOptionsForParents = {
      class: [],
      interface: []
    };
    const classNames = Object.keys(classParents);
    for (let className of classNames) {
      for (let symbol of classParents[className]) {
        decorations = mergeDecorations([
          decorations,
          await getDecorationByParent(symbol, document.uri, symbols, className)
        ]);
      }
    }
    decorateEditor(decorations, activeEditor);
  } catch (error) {
    throw error;
  }
}
