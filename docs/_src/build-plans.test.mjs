import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { build } from "./build-plans.mjs";

const CLI = fileURLToPath(new URL("./build-plans.mjs", import.meta.url));

const PLAN = `# Tiny Implementation Plan

> **For agentic workers:** read this.

**Goal:** Do one thing.

**Architecture:** One file.

**Tech Stack:** Node.

**Spec:** \`docs/specs/tiny.md\`

## Global Constraints

- None.

---

### Task 1: Only task

**Files:**

- Create: \`a.mjs\`

**Interfaces:**

- Consumes: nothing.
- Produces: nothing.

- [ ] **Step 1: Do it**

Run: \`true\`
Expected: PASS

## Done when

- Done.
`;

const scratch = () => {
  const root = mkdtempSync(join(tmpdir(), "fms-plans-"));
  const plansDir = join(root, "plans");
  mkdirSync(plansDir);
  writeFileSync(join(plansDir, "2026-02-02-tiny.md"), PLAN);
  return { root, plansDir, indexPath: join(root, "index.html") };
};

test("build writes one html per plan and an index", () => {
  const { root, plansDir, indexPath } = scratch();
  const result = build({ plansDir, indexPath, check: false });
  assert.equal(result.entries.length, 1);
  assert.deepEqual(result.stale, []);
  assert.equal(result.written.length, 2);
  assert.ok(existsSync(join(plansDir, "2026-02-02-tiny.html")));
  assert.match(readFileSync(indexPath, "utf8"), /2026-02-02-tiny\.html/);
  rmSync(root, { recursive: true });
});

test("build is idempotent: a second run writes nothing", () => {
  const { root, plansDir, indexPath } = scratch();
  build({ plansDir, indexPath, check: false });
  const again = build({ plansDir, indexPath, check: false });
  assert.deepEqual(again.written, []);
  rmSync(root, { recursive: true });
});

test("check reports stale html after the markdown changes, and writes nothing", () => {
  const { root, plansDir, indexPath } = scratch();
  build({ plansDir, indexPath, check: false });
  const before = readFileSync(join(plansDir, "2026-02-02-tiny.html"), "utf8");
  writeFileSync(join(plansDir, "2026-02-02-tiny.md"), PLAN.replace("Do one thing.", "Do two things."));
  const result = build({ plansDir, indexPath, check: true });
  assert.deepEqual(result.stale, [join(plansDir, "2026-02-02-tiny.html"), indexPath]);
  assert.equal(readFileSync(join(plansDir, "2026-02-02-tiny.html"), "utf8"), before);
  rmSync(root, { recursive: true });
});

test("check passes when html is current", () => {
  const { root, plansDir, indexPath } = scratch();
  build({ plansDir, indexPath, check: false });
  assert.deepEqual(build({ plansDir, indexPath, check: true }).stale, []);
  rmSync(root, { recursive: true });
});

test("build ignores non-markdown files in the plans folder", () => {
  const { root, plansDir, indexPath } = scratch();
  writeFileSync(join(plansDir, "notes.txt"), "not a plan");
  assert.equal(build({ plansDir, indexPath, check: false }).entries.length, 1);
  rmSync(root, { recursive: true });
});

test("CLI --check exits 1 on stale output and 0 when current", () => {
  const { root, plansDir, indexPath } = scratch();
  const env = { ...process.env, FMS_PLANS_DIR: plansDir, FMS_INDEX_PATH: indexPath };
  assert.throws(() => execFileSync(process.execPath, [CLI, "--check"], { env, stdio: "pipe" }));
  execFileSync(process.execPath, [CLI], { env, stdio: "pipe" });
  execFileSync(process.execPath, [CLI, "--check"], { env, stdio: "pipe" });
  rmSync(root, { recursive: true });
});
