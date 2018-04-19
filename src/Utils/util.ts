"use strict";

import { CodeLens } from "vscode";
const baseClassRegex = /(class)(\s+)(\w+)(\s+)(extends)/;
const interfaceRegex = /(implements)(\s+)/;

export function hasBaseClass(document: string): boolean {
  const map = document.match(baseClassRegex);
  if (map && map.length > 0) {
    return true;
  }
  return false;
}

export function hasInterfaces(document: string): boolean {
  const map = document.match(interfaceRegex);
  if (map && map.length > 0) {
    return true;
  }
  return false;
}

export function excutePromises(
  promises: Promise<CodeLens | undefined>[]
): Promise<CodeLens[]> {
  return new Promise((resolve, reject) => {
    const results: CodeLens[] = [];
    let count = 0;
    promises.forEach((promise, idx) => {
      promise
        .catch(error => {
          console.log(error);
          return error;
        })
        .then(valueOrError => {
          if (!(valueOrError instanceof Error) && valueOrError !== undefined) {
            results.push(valueOrError);
          }
          count += 1;
          if (count === promises.length) {
            resolve(results);
          }
        });
    });
  });
}
