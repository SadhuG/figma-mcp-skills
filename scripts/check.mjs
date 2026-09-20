/**
 * Repo consistency check. Exit 0 and print "check: ok" when:
 *   - every .claude/skills/<name>/SKILL.md has frontmatter with name === folder and a description;
 *   - README.md links every skill and every specs/*.md, and links nothing that is missing;
 *   - every rendered plan page is current (node docs/_src/build-plans.mjs --check).
 * Otherwise print each problem and exit 1.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const problems = [];

// Skills
const skillsDir = join(ROOT, ".claude", "skills");
const skills = existsSync(skillsDir)
  ? readdirSync(skillsDir).filter((d) => statSync(join(skillsDir, d)).isDirectory())
  : [];
for (const skill of skills) {
  const file = join(skillsDir, skill, "SKILL.md");
  if (!existsSync(file)) {
    problems.push(`skill ${skill}: missing SKILL.md`);
    continue;
  }
  const fm = readFileSync(file, "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) {
    problems.push(`skill ${skill}: no frontmatter`);
    continue;
  }
  const name = fm[1].match(/^name:\s*(.+?)\s*$/m)?.[1];
  const description = fm[1].match(/^description:\s*(.+?)\s*$/m)?.[1];
  if (name !== skill) problems.push(`skill ${skill}: frontmatter name is "${name}", folder is "${skill}"`);
  if (!description) problems.push(`skill ${skill}: missing description`);
}

// Specs
const specs = readdirSync(join(ROOT, "specs"))
  .filter((f) => f.endsWith(".md"))
  .map((f) => `specs/${f}`);

// README catalogue
const readme = readFileSync(join(ROOT, "README.md"), "utf8");
const linked = [...readme.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]);
for (const skill of skills) {
  const path = `.claude/skills/${skill}/SKILL.md`;
  if (!linked.includes(path)) problems.push(`README: skill "${skill}" is not listed (${path})`);
}
for (const spec of specs) {
  if (!linked.includes(spec)) problems.push(`README: spec ${spec} is not listed`);
}
for (const path of linked) {
  if ((path.startsWith(".claude/skills/") || path.startsWith("specs/")) && !existsSync(join(ROOT, path))) {
    problems.push(`README: links ${path}, which does not exist`);
  }
}

// Rendered plans
const plans = spawnSync(process.execPath, [join(ROOT, "docs", "_src", "build-plans.mjs"), "--check"], {
  encoding: "utf8",
});
if (plans.status !== 0) problems.push(`docs: ${plans.stderr.trim() || "plan HTML is stale"}`);

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log("check: ok");
