import { Config } from "../configuration";

export function log(text: string | object) {
  if (Config.isDebug) {
    console.log(text);
  }
}
