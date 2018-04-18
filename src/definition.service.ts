import { Uri, Position, Location, commands } from "vscode";

export async function getDefinitionLocation(
  uri: Uri,
  position: Position
): Promise<Location | undefined> {
  const locations = await commands.executeCommand<Location[]>(
    "vscode.executeDefinitionProvider",
    uri,
    position
  );

  if (locations) {
    return locations[0];
  }
}
