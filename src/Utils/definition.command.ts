"use strict";

import { Uri, Position, Location, commands } from "vscode";

export async function getDefinitionLocation(
  uri: Uri,
  position: Position
): Promise<Location> {
  try {
    const locations = await commands.executeCommand<Location[]>(
      "vscode.executeDefinitionProvider",
      uri,
      position
    );

    if (locations) {
      return locations[0];
    }
    throw new Error("Definition not found");
  } catch (error) {
    throw error;
  }
}
