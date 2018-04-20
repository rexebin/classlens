"use strict";

import { CodeLens } from "vscode";
const baseClassRegex = /(class)(\s+)(\w+)(\s+)(extends)/;
const interfaceRegex = /(implements)(\s+)/;

/**
 * Return true if there is a base class in the given text, otherwise return false.
 * @param document text of document
 */
export function hasBaseClass(document: string): boolean {
  const map = document.match(baseClassRegex);
  if (map && map.length > 0) {
    return true;
  }
  return false;
}

/**
 * Return true if there is an interface in the given text, otherwise return false.
 * @param document text of document
 */
export function hasInterfaces(document: string): boolean {
  const map = document.match(interfaceRegex);
  if (map && map.length > 0) {
    return true;
  }
  return false;
}

/**
 * Solve all promises in the given promise array.
 * Return a list of valid result.
 * Filter out any undefined result and errors.
 * @param promises list of promises to solve.
 */
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
