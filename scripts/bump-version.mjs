#!/usr/bin/env node
// Sets the app version everywhere it lives, in one step.
//
//   pnpm bump-version 0.1.0            # write the changes
//   pnpm bump-version 0.1.0 --dry-run  # only list what would change
//
// Updates:
//   - Cargo.toml: [workspace.package] version (every crate inherits it,
//     and tauri.conf.json reads the app version from Cargo) and the version
//     of internal path dependencies in [workspace.dependencies]
//   - Cargo.lock (via `cargo update --workspace`)
//   - apps/desktop/package.json
//
// The browser extension is versioned independently (docs/RELEASE.md), so
// extension/package.json is not touched.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { bumpCargoWorkspace, bumpPackageJson, isSemver } from "./lib/version.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const version = args.find((a) => !a.startsWith("--"));

if (!version || !isSemver(version)) {
  console.error("Usage: pnpm bump-version <MAJOR.MINOR.PATCH[-pre]> [--dry-run]");
  process.exit(1);
}

const targets = [
  { file: "Cargo.toml", bump: bumpCargoWorkspace },
  { file: "apps/desktop/package.json", bump: bumpPackageJson },
];

const changed = [];
for (const { file, bump } of targets) {
  const path = join(root, file);
  const before = readFileSync(path, "utf8");
  const after = bump(before, version);
  if (after !== before) {
    changed.push(file);
    if (!dryRun) writeFileSync(path, after);
  }
}

if (!dryRun && changed.includes("Cargo.toml")) {
  execFileSync("cargo", ["update", "--workspace", "--quiet"], { cwd: root, stdio: "inherit" });
  changed.push("Cargo.lock");
}

const verb = dryRun ? "Would update" : "Updated";
if (changed.length === 0) {
  console.info(`Already at ${version}; nothing to change.`);
} else {
  console.info(`${verb} to ${version}:`);
  for (const file of changed) console.info(`  ${relative(root, join(root, file))}`);
}
