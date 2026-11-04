// Pure helpers for bump-version.mjs (kept separate so they can be unit tested).

const SEMVER =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

/** @param {string} v */
export function isSemver(v) {
  return SEMVER.test(v);
}

/**
 * Sets `[workspace.package] version` and the `version` of internal path
 * dependencies in `[workspace.dependencies]` in the root Cargo.toml.
 * @param {string} toml
 * @param {string} version
 */
export function bumpCargoWorkspace(toml, version) {
  const lines = toml.split("\n");
  let section = "";
  let packageVersionSet = false;

  const out = lines.map((line) => {
    const header = line.match(/^\s*\[([^\]]+)\]\s*$/);
    if (header?.[1]) {
      section = header[1].trim();
      return line;
    }
    if (section === "workspace.package" && /^\s*version\s*=/.test(line)) {
      packageVersionSet = true;
      return line.replace(/(version\s*=\s*)"[^"]*"/, `$1"${version}"`);
    }
    if (section === "workspace.dependencies" && /path\s*=/.test(line)) {
      return line.replace(/(\bversion\s*=\s*)"[^"]*"/, `$1"${version}"`);
    }
    return line;
  });

  if (!packageVersionSet) {
    throw new Error("Cargo.toml has no `version` in [workspace.package]");
  }
  return out.join("\n");
}

/**
 * Sets the top-level "version" of a package.json, keeping its formatting.
 * @param {string} json
 * @param {string} version
 */
export function bumpPackageJson(json, version) {
  const parsed = JSON.parse(json);
  if (typeof parsed.version !== "string") {
    throw new Error('package.json has no top-level "version"');
  }
  parsed.version = version;
  return `${JSON.stringify(parsed, null, 2)}\n`;
}
