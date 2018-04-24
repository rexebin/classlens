import { SymbolKind, window } from "vscode";
import {
  excutePromises,
  getBaseClassSymbol,
  getInterfaceSymbols,
  getSymbolsOpenedUri,
  hasBaseClass,
  hasInterfaces
} from "../commands";
import { ClassParents } from "../models";
import { DecorationOptionsForParents } from "../models/decoration-options";
import { decorateEditor, clearDecoration } from "./decorate-editor";
import { getDecorationByParent } from "./get-decoration-by-parent";
export async function excute() {
  try {
    const activeEditor = window.activeTextEditor;
    if (!activeEditor) {
      return;
    }
    const document = activeEditor.document;
    const text = document.getText();
    if (!hasBaseClass(text) && !hasInterfaces(text)) {
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
      classParents[className] = {
        baseClass: baseClassSymbol,
        interfaces: interfaceSymbols
      };
    });

    let promises: Promise<DecorationOptionsForParents>[] = [];
    Object.keys(classParents).forEach(className => {
      const baseClass = classParents[className].baseClass;
      if (baseClass) {
        promises.push(
          getDecorationByParent(
            baseClass,
            document.uri,
            SymbolKind.Class,
            symbols,
            className
          )
        );
      }
      classParents[className].interfaces.forEach(interfacSymbol => {
        promises.push(
          getDecorationByParent(
            interfacSymbol,
            document.uri,
            SymbolKind.Interface,
            symbols,
            className
          )
        );
      });
    });
    excutePromises(promises).then(decoration => decorateEditor(decoration));
  } catch (error) {
    throw error;
  }
}
