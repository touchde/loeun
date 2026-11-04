import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bumpCargoWorkspace, bumpPackageJson, isSemver } from "./version.mjs";

const CARGO = `[workspace]
members = ["crates/*"]

[workspace.package]
version = "0.0.0"
edition = "2024"
rust-version = "1.96"

[workspace.dependencies]
loeun-core = { path = "crates/loeun-core", version = "0.0.0" }
serde = { version = "1.0" }

[profile.release]
lto = "thin"
`;

describe("isSemver", () => {
  it("accepts release and pre-release versions", () => {
    for (const v of ["0.1.0", "1.0.0", "10.20.30", "0.2.0-beta.1", "1.0.0+build.5"]) {
      assert.ok(isSemver(v), v);
    }
  });
  it("rejects malformed versions", () => {
    for (const v of ["1.0", "v1.0.0", "01.0.0", "1.0.0-", "latest", ""]) {
      assert.ok(!isSemver(v), v);
    }
  });
});

describe("bumpCargoWorkspace", () => {
  const out = bumpCargoWorkspace(CARGO, "0.1.0");

  it("updates the workspace package version", () => {
    assert.match(out, /\[workspace\.package\]\nversion = "0\.1\.0"/);
  });
  it("updates internal path dependencies", () => {
    assert.match(out, /loeun-core = \{ path = "crates\/loeun-core", version = "0\.1\.0" \}/);
  });
  it("leaves external dependencies and other fields alone", () => {
    assert.match(out, /serde = \{ version = "1\.0" \}/);
    assert.match(out, /rust-version = "1\.96"/);
  });
  it("changes nothing else", () => {
    const diff = out.split("\n").filter((line, i) => line !== CARGO.split("\n")[i]);
    assert.equal(diff.length, 2);
  });
  it("fails loudly without a workspace version", () => {
    assert.throws(() => bumpCargoWorkspace("[workspace]\n", "0.1.0"), /no `version`/);
  });
});

describe("bumpPackageJson", () => {
  it("sets the version and keeps 2-space formatting", () => {
    const out = bumpPackageJson('{\n  "name": "desktop",\n  "version": "0.0.0"\n}\n', "0.1.0");
    assert.equal(out, '{\n  "name": "desktop",\n  "version": "0.1.0"\n}\n');
  });
  it("fails without a version field", () => {
    assert.throws(() => bumpPackageJson('{"name":"x"}', "0.1.0"), /no top-level/);
  });
});
