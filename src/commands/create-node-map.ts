import * as ts from "typescript";

export async function createNamedNodeLookUp(
  str: string
): Promise<NamedNodeLookUp> {
  const sourceFile = ts.createSourceFile(
    "fake.d.ts",
    str,
    ts.ScriptTarget.Latest
  );

  const identifiers: string[] = [];
  const spans: number[] = [];
  const nodes: ts.Node[] = [];

  ts.forEachChild(sourceFile, function visit(node: ts.Node) {
    const declIdent = (<ts.NamedDeclaration>node).name;
    if (declIdent) {
      identifiers.push((<ts.Identifier>declIdent).text);
      spans.push(node.pos, node.end);
      nodes.push(node);
    }
    ts.forEachChild(node, visit);
  });

  return function(name: string): ts.Node {
    const idx = identifiers.indexOf(name);
    return nodes[idx];
  };
}

export interface NamedNodeLookUp {
  (name: string): ts.Node;
}
