"use strict";

import { Uri, Position, Location, commands } from "vscode";

/**
 * Execute definition provider to look for parent class/interface's location.
 * @param uri current document uri
 * @param position position of parent symbol in current file.
 * @returns a promise of parent class/interface's location
 */

export async function getDefinitionLocation(
  uri: Uri,
  position: Position
): Promise<Location | undefined> {
  try {
    const locations = await commands.executeCommand<Location[]>(
      "vscode.executeDefinitionProvider",
      uri,
      position
    );

    if (locations) {
      return locations[0];
    }
  } catch (error) {
    console.log(error);
  }
}
