/**
 * Renders every plan under docs/plans/ to an HTML page beside it, plus
 * docs/index.html. The markdown is the source of truth; never hand-edit the
 * HTML — edit the markdown and run this again.
 *
 * Usage:  node docs/_src/build-plans.mjs [--check]
 *
 * --check writes nothing and exits 1 if any page on disk differs from what
 * the markdown would produce. scripts/check.mjs runs it.
 *
 * FMS_PLANS_DIR and FMS_INDEX_PATH override the locations; tests use them.
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { deriveConfig, parsePlan, renderHtml, renderIndex } from "./plan.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

export const build = ({ plansDir, indexPath, check }) => {
  const files = readdirSync(plansDir)
    .filter((f) => f.endsWith(".md"))
    .sort();

  const entries = [];
  const outputs = [];
  for (const md of files) {
    const plan = parsePlan(readFileSync(join(plansDir, md), "utf8"));
    const cfg = deriveConfig(plan, md);
    entries.push({ plan, cfg });
    outputs.push({ path: join(plansDir, md.replace(/\.md$/, ".html")), html: renderHtml(plan, cfg) });
  }
  outputs.push({ path: indexPath, html: renderIndex(entries) });

  const stale = [];
  const written = [];
  for (const out of outputs) {
    const current = existsSync(out.path) ? readFileSync(out.path, "utf8") : null;
    if (current === out.html) continue;
    if (check) stale.push(out.path);
    else {
      writeFileSync(out.path, out.html);
      written.push(out.path);
    }
  }
  return { entries, stale, written };
};

// Lower-cased because on Windows the drive letter can differ in case between the two.
const isMain =
  process.argv[1] && pathToFileURL(process.argv[1]).href.toLowerCase() === import.meta.url.toLowerCase();

if (isMain) {
  const check = process.argv.includes("--check");
  const plansDir = process.env.FMS_PLANS_DIR ?? join(HERE, "..", "plans");
  const indexPath = process.env.FMS_INDEX_PATH ?? join(HERE, "..", "index.html");
  const { entries, stale, written } = build({ plansDir, indexPath, check });

  for (const { plan, cfg } of entries) {
    const steps = plan.tasks.reduce((n, t) => n + t.steps.length, 0);
    console.log(`${cfg.md}  (${plan.tasks.length} tasks, ${steps} steps)`);
  }
  if (check) {
    if (stale.length) {
      console.error(`stale: ${stale.map((p) => basename(p)).join(", ")} — run node docs/_src/build-plans.mjs`);
      process.exit(1);
    }
    console.log("plans: up to date");
  } else {
    console.log(written.length ? `wrote ${written.length} file(s)` : "nothing to write");
  }
}
