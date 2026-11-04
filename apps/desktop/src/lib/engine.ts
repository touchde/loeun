import { invoke } from "@tauri-apps/api/core";

/** Version of the Rust download engine embedded in the app. */
export function engineVersion(): Promise<string> {
  return invoke<string>("engine_version");
}
