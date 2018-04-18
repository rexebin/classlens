import { Uri, Position, Location, commands } from "vscode";

export function getDefinitionLocation(
  uri: Uri,
  position: Position
): Thenable<Location | undefined> {
  return commands
    .executeCommand<Location[]>(
      "vscode.executeDefinitionProvider",
      uri,
      position
    )
    .then(locations => {
      if (locations) {
        return locations[0];
      }
    });
}
