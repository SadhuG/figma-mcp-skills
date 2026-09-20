# Repository Structure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the figma-mcp-skills repository: a short always-on `CLAUDE.md`, natively discovered skills, a shared `specs/` folder, templates, a scratch `dump/`, and a zero-dependency plan-to-HTML generator ported from the Figma Design Relay repo.

**Architecture:** Everything is markdown except the generator, which is two ES modules under `docs/_src/` — `plan.mjs` (pure parse and render functions) and `build-plans.mjs` (discovery, index, `--check`) — tested with Node's built-in `node --test`. A `scripts/check.mjs` script makes the spec's verification section repeatable: skill frontmatter, README catalogue against disk, and stale plan HTML.

**Tech Stack:** Markdown, Node 24 (`node:test`, `node:fs`, `node:path` only — no `package.json`, no dependencies), Claude Code native skills (`.claude/skills/<name>/SKILL.md`).

**Spec:** `docs/specs/2026-09-17-repo-structure-design.md` — this plan implements every section of that spec.

## Global Constraints

- No `package.json`, no `node_modules`, no Prettier. The only runtime is `node` (v24 on this machine). Tests run with `node --test docs/_src/`.
- Every file is LF. `.gitattributes` (`* text=auto eol=lf`) is already committed; do not add CRLF.
- Nothing with a `SKILL.md` may live under `.claude/skills/` unless it is a real skill — the harness auto-discovers that folder. Templates live in `templates/`.
- `.claude/CLAUDE.md` stays under 60 lines and contains no manual skill index.
- Skills are procedure (steps), specs are facts (no steps). Apply the separation rule from the spec while writing; do not ask.
- Plan markdown is the source of truth; HTML under `docs/` is generated. Never hand-edit a generated `.html`.
- The two Figma MCP servers (`figma-bridge`, `figma-design-relay`) are chosen per session by the user. Nothing in this repo may assume one is active, and nothing may propose changing `~/.claude.json`.
- Commit messages: `feat:`, `fix:`, `docs:`, `chore:`; end each with `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`.
- The relay repo at `C:/Users/sadhu/code/figma-design-relay` is read-only reference material for the port. Do not modify it.

---

### Task 1: Ignore rules and the scratch folder

`dump/` must exist in the repo but never contribute files to it, and the root `.gitignore` must keep OS and editor noise out. This task proves both with `git status`.

**Files:**

- Create: `.gitignore`
- Create: `dump/.gitignore`

**Interfaces:**

- Consumes: nothing.
- Produces: `dump/` as the only sanctioned scratch location. Task 8's `CLAUDE.md` and Task 7's `authoring` skill refer to it by that path.

- [ ] **Step 1: Write the root `.gitignore`**

```gitignore
# OS / editor
.DS_Store
Thumbs.db
desktop.ini
*.swp
.vscode/
.idea/

# Node, should anything ever install it here
node_modules/

# Claude Code local-only settings
.claude/settings.local.json
```

- [ ] **Step 2: Write `dump/.gitignore`**

```gitignore
# Scratch space. Everything here is throwaway; only this file is tracked.
*
!.gitignore
```

- [ ] **Step 3: Verify `dump/` swallows files**

Run: `echo scratch > dump/probe.txt; git status --porcelain`
Expected: prints exactly two lines, `?? .gitignore` and `?? dump/` — no `dump/probe.txt`. Then `git add -n dump/` lists only `dump/.gitignore`.

- [ ] **Step 4: Clean up and commit**

```bash
rm dump/probe.txt
git add .gitignore dump/.gitignore
git commit -m "chore: ignore rules and scratch folder

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Plan parser and renderer as a library

Port the relay's generator into a pure module with no registry and no relay branding, and make the parser fence-aware so a plan that embeds markdown files (like this one) does not get cut in half by a `## Done when` inside a code block.

**Files:**

- Create: `docs/_src/plan.mjs` (from `C:/Users/sadhu/code/figma-design-relay/docs/superpowers/_src/build-plans.mjs`)
- Create: `docs/_src/plan.test.mjs`

**Interfaces:**

- Consumes: nothing.
- Produces: `parsePlan(md: string): Plan`, `deriveConfig(plan: Plan, filename: string): Config`, `renderHtml(plan: Plan, cfg: Config): string`, `renderIndex(entries: {plan: Plan, cfg: Config}[]): string`. `Plan` is the relay's shape (`title`, `meta`, `blockquote`, `constraints`, `tasks[]`, `doneWhen`) with `meta.Phase` added. `Config` is `{ md, docKey, slug, date, phase, eyebrow, description, spec: {href, label} | null }`. Task 3 imports all four from `./plan.mjs`.

- [ ] **Step 1: Write the failing tests**

Create `docs/_src/plan.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePlan, deriveConfig, renderHtml, renderIndex } from "./plan.mjs";

const FIXTURE = `# Widget Implementation Plan

> **For agentic workers:** read this.

**Goal:** Build the widget.

**Architecture:** One module.

**Tech Stack:** Node.

**Spec:** \`docs/specs/2026-01-01-widget-design.md\` — the widget spec.

## Global Constraints

- Keep it small.

---

### Task 1: Parse input [R1, R2]

Intro paragraph.

**Files:**

- Create: \`src/parse.mjs\`

**Interfaces:**

- Consumes: nothing.
- Produces: \`parse(s)\`.

- [ ] **Step 1: Write the failing test**

\`\`\`js
assert.equal(parse("a"), "a");
\`\`\`

- [x] **Step 2: Run it**

Run: \`node --test\`
Expected: FAIL with "parse is not defined"

### Task 2: Render output

**Files:**

- Create: \`src/render.mjs\`

**Interfaces:**

- Consumes: \`parse(s)\`.
- Produces: \`render(p)\`.

- [ ] **Step 1: Embed a file**

\`\`\`markdown
### Task 99: not a real task
## Done when
- [ ] **Step 7: not a real step**
\`\`\`

- [ ] **Step 2: Commit**

Run: \`git commit\`
Expected: PASS

## Done when

- Both tests pass.
`;

test("parsePlan reads title, meta, constraints, tasks, steps, and done-when", () => {
  const plan = parsePlan(FIXTURE);
  assert.equal(plan.title, "Widget");
  assert.equal(plan.meta.Goal, "Build the widget.");
  assert.equal(plan.meta.Spec, "`docs/specs/2026-01-01-widget-design.md` — the widget spec.");
  assert.deepEqual(plan.constraints, ["- Keep it small."]);
  assert.equal(plan.tasks.length, 2);
  assert.equal(plan.tasks[0].title, "Parse input");
  assert.deepEqual(plan.tasks[0].chips, ["R1", "R2"]);
  assert.deepEqual(plan.tasks[0].files, ["Create: `src/parse.mjs`"]);
  assert.equal(plan.tasks[0].steps.length, 2);
  assert.equal(plan.tasks[0].steps[1].done, true);
  assert.deepEqual(plan.doneWhen, ["- Both tests pass."]);
});

test("parsePlan ignores structure inside fenced code", () => {
  const plan = parsePlan(FIXTURE);
  assert.equal(plan.tasks.length, 2, "fenced '### Task 99' must not start a task");
  assert.equal(plan.tasks[1].steps.length, 2, "fenced '**Step 7**' must not add a step");
  assert.deepEqual(plan.doneWhen, ["- Both tests pass."], "fenced '## Done when' must not end the plan");
});

test("parsePlan reads an optional Phase line", () => {
  const withPhase = FIXTURE.replace("**Tech Stack:** Node.", "**Tech Stack:** Node.\n\n**Phase:** 3");
  assert.equal(parsePlan(withPhase).meta.Phase, "3");
  assert.equal(parsePlan(FIXTURE).meta.Phase, undefined);
});

test("deriveConfig derives everything from the markdown and filename", () => {
  const cfg = deriveConfig(parsePlan(FIXTURE), "2026-01-01-widget.md");
  assert.equal(cfg.md, "2026-01-01-widget.md");
  assert.equal(cfg.docKey, "widget");
  assert.equal(cfg.slug, "widget");
  assert.equal(cfg.date, "2026-01-01");
  assert.equal(cfg.phase, null);
  assert.equal(cfg.eyebrow, "Implementation plan · 2026-01-01");
  assert.equal(cfg.description, "Build the widget.");
  assert.deepEqual(cfg.spec, {
    href: "../specs/2026-01-01-widget-design.md",
    label: "2026-01-01-widget-design",
  });
});

test("deriveConfig includes the phase in the eyebrow when present", () => {
  const withPhase = FIXTURE.replace("**Tech Stack:** Node.", "**Tech Stack:** Node.\n\n**Phase:** 3");
  const cfg = deriveConfig(parsePlan(withPhase), "2026-01-01-widget.md");
  assert.equal(cfg.phase, 3);
  assert.equal(cfg.eyebrow, "Implementation plan · Phase 3 · 2026-01-01");
});

test("renderHtml uses task titles for the rail and derived links, with no relay branding", () => {
  const plan = parsePlan(FIXTURE);
  const html = renderHtml(plan, deriveConfig(plan, "2026-01-01-widget.md"));
  assert.match(html, /<title>Widget · plan<\/title>/);
  assert.match(html, /href="#task-1"[\s\S]*?Parse input/);
  assert.match(html, /href="#task-2"[\s\S]*?Render output/);
  assert.match(html, /href="\.\.\/specs\/2026-01-01-widget-design\.md">2026-01-01-widget-design<\/a>/);
  assert.match(html, /data-doc="widget"/);
  assert.match(html, /Source: <code>docs\/plans\/2026-01-01-widget\.md<\/code>/);
  assert.match(html, /href="\.\.\/index\.html"/);
  assert.doesNotMatch(html, /Figma Design Relay/);
  assert.doesNotMatch(html, /Parity/);
});

test("renderHtml pre-checks completed steps", () => {
  const plan = parsePlan(FIXTURE);
  const html = renderHtml(plan, deriveConfig(plan, "2026-01-01-widget.md"));
  assert.match(html, /id="widgett1s2" checked/);
  assert.match(html, /<li class="step is-done">/);
});

test("renderIndex lists one card per plan with counts", () => {
  const plan = parsePlan(FIXTURE);
  const cfg = deriveConfig(plan, "2026-01-01-widget.md");
  const html = renderIndex([{ plan, cfg }]);
  assert.match(html, /href="plans\/2026-01-01-widget\.html"/);
  assert.match(html, /2 tasks · 4 steps/);
  assert.match(html, /<b>Plans<\/b> — 1/);
  assert.match(html, /href="assets\/doc\.css"/);
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `node --test docs/_src/`
Expected: FAIL — `Cannot find module '.../docs/_src/plan.mjs'`.

- [ ] **Step 3: Copy the relay generator and strip what the library does not own**

```bash
mkdir -p docs/_src
cp "C:/Users/sadhu/code/figma-design-relay/docs/superpowers/_src/build-plans.mjs" docs/_src/plan.mjs
```

Then edit `docs/_src/plan.mjs`:

1. Replace the file header comment (everything before `import`) with:

```js
/**
 * Parses a plan written in the strict plan-markdown shape that
 * `superpowers:writing-plans` produces and renders it as an HTML page.
 *
 * The markdown is the single source of truth. This module is pure: it reads
 * nothing from disk and knows nothing about which plans exist. Discovery,
 * writing, and `--check` live in build-plans.mjs.
 *
 * Expected markdown shape:
 *
 *   # <Title> Implementation Plan
 *   > **For agentic workers:** ...
 *   **Goal:** ...   **Architecture:** ...   **Tech Stack:** ...   **Spec:** ...
 *   **Phase:** N            (optional)
 *   ## Global Constraints
 *   ### Task N: <Name> [R1, R2]        (chips optional)
 *   **Files:** / **Interfaces:**
 *   - [ ] **Step N: <Label>**
 *   ## Done when
 */
```

2. Replace the three `import` lines and the `HERE`/`PLANS_DIR` constants with:

```js
import { basename } from "node:path";
```

3. Delete the whole `/** Plans this script owns ... */ const PLANS = [ ... ];` block.

4. Delete everything from `/* ---------- run ----` to the end of the file.

5. Prefix `export` onto `const parsePlan`, `const renderHtml`, and `const blocks`, `const inline` (the index renderer and tests use them).

- [ ] **Step 4: Make the parser fence-aware and read `Phase`**

In `parsePlan`, the top-level `for` loop and the task-body collector both match structural lines without knowing whether they are inside a code fence. Apply these edits:

a. Change the meta regex from `(Goal|Architecture|Tech Stack|Spec)` to `(Goal|Architecture|Tech Stack|Spec|Phase)`.

b. Add a fence tracker at the top of the main loop. Replace:

```js
  for (; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("> ")) {
```

with:

```js
  let inFence = false;

  for (; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) inFence = !inFence;
    if (inFence) continue;

    if (line.startsWith("> ")) {
```

c. In the `### Task ` branch, the body collector stops at the next `### Task ` or `## Done when`. Replace:

```js
      const body = [];
      while (
        i < lines.length &&
        !lines[i].startsWith("### Task ") &&
        !lines[i].startsWith("## Done when")
      ) {
        body.push(lines[i++]);
      }
      i--;
```

with:

```js
      const body = [];
      let bodyFence = false;
      while (i < lines.length) {
        if (lines[i].startsWith("```")) bodyFence = !bodyFence;
        if (!bodyFence && (lines[i].startsWith("### Task ") || lines[i].startsWith("## Done when"))) break;
        body.push(lines[i++]);
      }
      i--;
```

d. In the same branch, the step splitter `while (j < body.length) { const step = body[j].match(...` walks `body` line by line. Replace that loop with a fence-aware version:

```js
      let stepFence = false;
      while (j < body.length) {
        if (body[j].startsWith("```")) stepFence = !stepFence;
        const step = stepFence ? null : body[j].match(/^- \[([ x])\] \*\*Step (\d+):\s*(.*?)\*\*$/);
        if (!step) {
          j++;
          continue;
        }
        const sBody = [];
        j++;
        let innerFence = false;
        while (j < body.length) {
          if (body[j].startsWith("```")) innerFence = !innerFence;
          if (!innerFence && /^- \[[ x]\] \*\*Step /.test(body[j])) break;
          sBody.push(body[j++]);
        }
        task.steps.push({ no: step[2], label: step[3], done: step[1] === "x", body: sBody });
      }
```

e. The `## Global Constraints` branch collects until `### Task`; it runs before any task so no fence handling is needed there.

- [ ] **Step 5: Add `deriveConfig`**

Insert after `parsePlan` (before the `/* ---------- HTML emission` banner):

```js
/* ---------- derived page metadata ------------------------------------------ */

/** Strips inline markdown so a Goal line can sit in a <meta> attribute. */
const plain = (text) =>
  text
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/"/g, "&quot;");

/**
 * Reads the first `docs/...` path out of a **Spec:** line, whether written as
 * a code span or a markdown link, and turns it into an href relative to
 * docs/plans/. Returns null when the line carries no such path.
 */
const specLink = (specLine) => {
  if (!specLine) return null;
  const m = specLine.match(/`(docs\/[^`]+)`/) ?? specLine.match(/\]\((docs\/[^)\s]+)\)/);
  if (!m) return null;
  const path = m[1];
  return { href: "../" + path.slice("docs/".length), label: basename(path).replace(/\.md$/, "") };
};

/**
 * Everything the page needs that the relay used to keep in a hand-edited
 * registry, derived from the markdown and the filename instead.
 */
export const deriveConfig = (plan, filename) => {
  const md = basename(filename);
  const stem = md.replace(/\.md$/, "");
  const date = stem.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ?? "";
  const docKey = stem.replace(/^\d{4}-\d{2}-\d{2}-/, "");
  const phase = plan.meta.Phase ? Number(plan.meta.Phase) : null;
  return {
    md,
    docKey,
    slug: docKey.replace(/[^a-z0-9]/g, ""),
    date,
    phase,
    eyebrow: ["Implementation plan", phase ? `Phase ${phase}` : null, date || null]
      .filter(Boolean)
      .join(" · "),
    description: plain(plan.meta.Goal ?? ""),
    spec: specLink(plan.meta.Spec),
  };
};
```

- [ ] **Step 6: Replace `renderHtml` and add `renderIndex`**

`renderTask` stays exactly as copied. The old `renderHtml` computed `const slug = cfg.docKey.replace(...)` itself; the new one passes `cfg.slug` straight through. Replace the whole `const renderHtml = (plan, cfg) => { ... };` with:

```js
export const renderHtml = (plan, cfg) => {
  const stepCount = plan.tasks.reduce((n, t) => n + t.steps.length, 0);

  const rail = plan.tasks
    .map(
      (t) => `            <li>
              <a href="#task-${t.no}"
                ><span>${inline(t.title)} <b class="rail__done"></b></span
              ></a>
            </li>`
    )
    .join("\n");

  const specMeta = cfg.spec
    ? `          <div><b>Spec</b> — <a href="${cfg.spec.href}">${cfg.spec.label}</a></div>\n`
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${inline(plan.title)} · plan</title>
    <meta name="description" content="${cfg.description}" />
    <link rel="stylesheet" href="../assets/doc.css" />
  </head>
  <body data-doc="${cfg.docKey}">
    <a class="skip" href="#main">Skip to the plan</a>

    <div class="shell">
      <header class="masthead">
        <p class="eyebrow">${cfg.eyebrow}</p>
        <h1>${inline(plan.title)}</h1>
        <p class="standfirst">${inline(plan.meta.Goal ?? "")}</p>

        <dl class="masthead__meta">
${specMeta}          <div><b>Tasks</b> — ${plan.tasks.length}</div>
          <div><b>Steps</b> — ${stepCount}</div>
          <div><b>Progress</b> — saved in this browser</div>
        </dl>
      </header>

      <blockquote>
${blocks(plan.blockquote)}
      </blockquote>

      <section class="brief">
        <h2 id="brief" data-spy>The shape of it</h2>
        <p><strong>Architecture.</strong> ${inline(plan.meta.Architecture ?? "")}</p>
        <p><strong>Tech stack.</strong> ${inline(plan.meta["Tech Stack"] ?? "")}</p>

        <h3>Global constraints</h3>
        <p>Every task's requirements implicitly include these.</p>
${blocks(plan.constraints)}
      </section>

      <div class="layout">
        <nav class="rail" aria-label="Tasks">
          <p class="rail__title">Tasks</p>
          <ol>
${rail}
          </ol>
        </nav>

        <main id="main">
${plan.tasks.map((t) => renderTask(t, cfg.slug)).join("\n\n")}

          <section class="done-when" id="done" data-spy>
            <h2>Done when</h2>
${blocks(plan.doneWhen)}
          </section>

          <footer class="colophon">
            <span>figma-mcp-skills</span>
            <span>Plan · ${cfg.date}</span>
            <span>Source: <code>docs/plans/${cfg.md}</code></span>
            <span><a href="../index.html">← All plans</a></span>
          </footer>
        </main>
      </div>
    </div>

    <script src="../assets/doc.js"></script>
  </body>
</html>
`;
};

/** The docs landing page: one card per plan, newest first. */
export const renderIndex = (entries) => {
  const sorted = [...entries].sort((a, b) => b.cfg.md.localeCompare(a.cfg.md));
  const tasks = sorted.reduce((n, e) => n + e.plan.tasks.length, 0);
  const steps = sorted.reduce((n, e) => n + e.plan.tasks.reduce((m, t) => m + t.steps.length, 0), 0);

  const cards = sorted
    .map(({ plan, cfg }) => {
      const stepCount = plan.tasks.reduce((n, t) => n + t.steps.length, 0);
      return `          <a class="card" href="plans/${cfg.md.replace(/\.md$/, ".html")}">
            <p class="eyebrow">${cfg.eyebrow} · ${plan.tasks.length} tasks · ${stepCount} steps</p>
            <h2>${inline(plan.title)}</h2>
            <p>${inline(plan.meta.Goal ?? "")}</p>
            <span class="card__more">Open the plan →</span>
          </a>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>figma-mcp-skills — plans</title>
    <meta name="description" content="Implementation plans for the figma-mcp-skills repository." />
    <link rel="stylesheet" href="assets/doc.css" />
  </head>
  <body data-doc="index">
    <a class="skip" href="#main">Skip to the plans</a>

    <div class="shell">
      <header class="masthead">
        <p class="eyebrow">figma-mcp-skills · Plans</p>
        <h1>Implementation plans</h1>
        <p class="standfirst">
          Every page has a markdown twin beside it in <code>docs/plans/</code>. The markdown is what
          executor agents read; these pages are what people read. Step progress is saved in this
          browser.
        </p>

        <dl class="masthead__meta">
          <div><b>Plans</b> — ${sorted.length}</div>
          <div><b>Tasks</b> — ${tasks}</div>
          <div><b>Steps</b> — ${steps}</div>
        </dl>
      </header>

      <main id="main">
        <div class="cards">
${cards}
        </div>
      </main>
    </div>
  </body>
</html>
`;
};
```

- [ ] **Step 7: Run the tests to see them pass**

Run: `node --test docs/_src/`
Expected: PASS — 8 tests, 0 failures.

- [ ] **Step 8: Commit**

```bash
git add docs/_src/plan.mjs docs/_src/plan.test.mjs
git commit -m "feat(docs): plan parser and renderer library

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Build CLI with discovery, index, and `--check`

The relay's script needed every plan registered by hand. This one finds `docs/plans/*.md`, writes each `.html` beside it plus `docs/index.html`, and with `--check` reports stale output without writing.

**Files:**

- Create: `docs/_src/build-plans.mjs`
- Create: `docs/_src/build-plans.test.mjs`

**Interfaces:**

- Consumes: `parsePlan`, `deriveConfig`, `renderHtml`, `renderIndex` from `./plan.mjs`.
- Produces: `build({ plansDir, indexPath, check }): { entries, stale: string[], written: string[] }` and the CLI `node docs/_src/build-plans.mjs [--check]`, exit 1 when `--check` finds stale files. Task 9's `scripts/check.mjs` shells out to the CLI.

- [ ] **Step 1: Write the failing tests**

Create `docs/_src/build-plans.test.mjs`:

```js
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
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `node --test docs/_src/`
Expected: FAIL — `Cannot find module '.../docs/_src/build-plans.mjs'`; the 8 plan tests still pass.

- [ ] **Step 3: Write the CLI**

Create `docs/_src/build-plans.mjs`:

```js
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
```

- [ ] **Step 4: Run the tests to see them pass**

Run: `node --test docs/_src/`
Expected: PASS — 14 tests, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add docs/_src/build-plans.mjs docs/_src/build-plans.test.mjs
git commit -m "feat(docs): plan build CLI with discovery, index, and --check

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Page assets and the first rendered plan

Copy the stylesheet and page script, re-key the progress store so it does not share `localStorage` with the relay's pages, and render this plan for real.

**Files:**

- Create: `docs/assets/doc.css` (copy of `C:/Users/sadhu/code/figma-design-relay/docs/superpowers/assets/doc.css`)
- Create: `docs/assets/doc.js` (copy of `C:/Users/sadhu/code/figma-design-relay/docs/superpowers/assets/doc.js`, one line changed)
- Create: `docs/plans/2026-09-20-repo-structure.html` (generated)
- Create: `docs/index.html` (generated)

**Interfaces:**

- Consumes: the CLI from Task 3.
- Produces: the rendered pages the spec calls for. Nothing later depends on their contents.

- [ ] **Step 1: Copy the assets**

```bash
mkdir -p docs/assets
cp "C:/Users/sadhu/code/figma-design-relay/docs/superpowers/assets/doc.css" docs/assets/doc.css
cp "C:/Users/sadhu/code/figma-design-relay/docs/superpowers/assets/doc.js" docs/assets/doc.js
```

- [ ] **Step 2: Re-key the progress store and retitle the script**

In `docs/assets/doc.js` change the first comment line from `/* Figma Design Relay — document behaviours.` to `/* figma-mcp-skills — document behaviours.` and change

```js
    var key = "fmb-plan:" + document.body.dataset.doc;
```

to

```js
    var key = "fms-plan:" + document.body.dataset.doc;
```

Run: `grep -n "fmb-plan\|Figma Design Relay" docs/assets/doc.js docs/assets/doc.css`
Expected: prints nothing.

- [ ] **Step 3: Render this plan**

Run: `node docs/_src/build-plans.mjs`
Expected: prints `2026-09-20-repo-structure.md  (9 tasks, N steps)` and `wrote 2 file(s)`; `docs/plans/2026-09-20-repo-structure.html` and `docs/index.html` now exist.

- [ ] **Step 4: Confirm the parse survived this plan's embedded markdown**

Run: `grep -c '<article class="task"' docs/plans/2026-09-20-repo-structure.html; grep -o 'Task 0[0-9]</span>' docs/plans/2026-09-20-repo-structure.html | tail -1`
Expected: `9` and `Task 09</span>` — every task rendered, none swallowed by a fenced `### Task` or `## Done when` inside a step.

- [ ] **Step 5: Confirm `--check` is clean, then commit**

Run: `node docs/_src/build-plans.mjs --check`
Expected: `plans: up to date`, exit 0.

```bash
git add docs/assets docs/plans docs/index.html
git commit -m "docs: page assets and rendered plan

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Seed spec — the Figma tool surface

Facts every Figma skill needs, in one place, so skills link here instead of restating them.

**Files:**

- Create: `specs/figma-mcp-tools.md`

**Interfaces:**

- Consumes: nothing.
- Produces: the path `specs/figma-mcp-tools.md`, linked from Task 7's `authoring` skill, Task 8's `CLAUDE.md`, and Task 9's README.

- [ ] **Step 1: Write the spec**

```markdown
# Figma MCP tool surface

**Used by:** every skill that touches a Figma document.
**Source of truth:** the relay repo's docs — `C:/Users/sadhu/code/figma-design-relay/docs/run-script.md`, `design-context.md`, `serialized-nodes.md` — and the tool descriptions the connected server advertises. When this file and a tool description disagree, the tool description wins; fix this file.

## Which server is connected

Two servers may be configured; the user picks one per session. Both expose the same tool names — only the `mcp__<server>__` prefix differs. Reference tools by bare name and call whichever prefix is present.

- `figma-design-relay` — the user's fork. Everything below, including `run_script`.
- `figma-bridge` — the upstream `@gethopp/figma-mcp-bridge`. Everything below **except** `run_script`, and its serializer omits the design-system identity fields (component/instance identity, resolved variable and style names, layout intent).

If neither is connected, say so and stop. Do not suggest editing the MCP configuration.

## Tools

Read:

- `list_files` — connected Figma files and their `fileKey`s.
- `get_metadata` — file name, pages, current page.
- `get_document` — current page's node tree. Large on big pages; prefer `get_selection` or `get_node`.
- `get_selection` — nodes selected in the editor.
- `get_node` — one node by ID.
- `get_styles` — local paint, text, effect, and grid styles.
- `get_variable_defs` — variable collections, modes, and values (design tokens).
- `get_design_context` — reference code, tokens, exported assets, and a screenshot for a node in one call. Assets are written under `assetDir`, which must be inside the server's working directory.
- `get_screenshot` — PNG/SVG/JPG/PDF as base64. `save_screenshots` writes them to disk instead.

Write (design editor only):

- Text: `set_text_content`, `set_text_properties`.
- Node: `set_node_properties` (name, position, size, visibility, opacity, corner radius), `set_node_visibility`.
- Paint: `set_solid_fill`, `set_gradient_fill`, `set_stroke_properties`, `set_effects`.
- Layout: `set_auto_layout`.
- Create: `create_page`, `create_frame`, `create_text`, `create_shape` (rectangle, ellipse, line), `create_image` (local path, URL, or data URI), `import_html_layers` (html-figma JSON).
- Structure: `duplicate_nodes`, `reparent_nodes`, `group_nodes`, `ungroup_node`, `delete_nodes`.
- Viewport: `set_selection`, `scroll_and_zoom_into_view` (both also work in Dev Mode).
- Motion (beta): `get_motion_styles`, `get_node_motion`, `apply_animation_style`, `remove_animation_style`, `apply_manual_keyframe_track`, `remove_manual_keyframe_track`, `set_timeline_duration`.

Escape hatch (relay only):

- `run_script` — arbitrary JavaScript against the Figma Plugin API. Use it for anything the dedicated tools do not cover: components, variables, styles authoring, boolean operations, prototyping. Not atomic.

## Rules that apply to every call

- Node IDs use colon format: `4029:12345`. A URL's `node-id=4029-12345` must be converted.
- Every tool takes an optional `fileKey`. Required when more than one file is connected; call `list_files` first.
- Dev Mode is read-only. Write tools return a clear error there; do not retry them.
- The current user must have edit permission on the file for any write tool.
- `delete_nodes` requires `confirm: true`. Confirm with the user before deleting anything you did not create in this session.
- `run_script` is **not atomic** — a script that throws part-way leaves its earlier mutations in the file. Prefer dedicated tools when they exist; keep scripts small; read back the result.
- File paths (`create_image`, `import_html_layers`, `save_screenshots`, `get_design_context`'s `assetDir`) resolve relative to the MCP server's working directory and must stay inside it.
- Text edits load the node's current fonts first. New text defaults to Inter Regular unless a font is given.
- `create_page` returns the page ID; pass it as `parentId` to create tools to author on that page without switching the editor.
- Requests time out after 180 seconds.
- Serialized nodes omit fields that carry nothing — absence of `component`, `boundVariables`, or `styles` means the node has none, not that the lookup failed.
```

- [ ] **Step 2: Verify it is a spec, not a skill**

Run: `grep -nE "^[0-9]+\. |^## Steps" specs/figma-mcp-tools.md`
Expected: prints nothing — no numbered procedure, no steps section.

- [ ] **Step 3: Commit**

```bash
git add specs/figma-mcp-tools.md
git commit -m "docs: seed spec for the Figma MCP tool surface

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Templates

Skeletons for the two formats that already exist. They live outside `.claude/skills/` so the harness does not discover the skill template as a skill.

**Files:**

- Create: `templates/SKILL.md`
- Create: `templates/spec.md`

**Interfaces:**

- Consumes: nothing.
- Produces: the two template paths, referenced by Task 7's `authoring` skill.

- [ ] **Step 1: Write `templates/SKILL.md`**

```markdown
---
name: <kebab-case-name, must equal the folder name>
description: Use when <the situation that should trigger this skill> — <what it does, one clause>
---

# <Title>

**Requires:** <tools this skill calls; mark relay-only tools, e.g. `run_script` (relay only)>
**Reads:** `specs/<topic>.md` — <why>

## When not to use

- <the neighbouring situation this skill is not for, and what to use instead>

## Steps

1. <one action>
2. <one action>
3. <one action>

## Gotchas

- <a mistake this procedure is prone to, and how to avoid it>

## Verify

- <what to check before saying the task is done>
```

- [ ] **Step 2: Write `templates/spec.md`**

```markdown
# <Topic>

**Used by:** <which skills link here>
**Source of truth:** <where these facts come from, so they can be re-checked>

## <Section>

<Facts only: contracts, tables, enumerations, conventions, examples. No steps — if you are
writing "then do X", it belongs in a skill.>
```

- [ ] **Step 3: Confirm the harness will not discover the template**

Run: `ls .claude/skills/ 2>/dev/null; find . -name SKILL.md -not -path './.git/*'`
Expected: the `ls` shows nothing yet (Task 7 adds the first skill); `find` shows only `./templates/SKILL.md`.

- [ ] **Step 4: Commit**

```bash
git add templates/
git commit -m "docs: skill and spec templates

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: The `authoring` skill

The repo's maintenance procedure as a native skill: how to add or edit skills, specs, templates, and plans, and how to persist a session instruction. The trigger for persisting lives in `CLAUDE.md` (Task 8); the routing lives here.

**Files:**

- Create: `.claude/skills/authoring/SKILL.md`

**Interfaces:**

- Consumes: `templates/SKILL.md`, `templates/spec.md`, `docs/_src/build-plans.mjs`, `scripts/check.mjs` (Task 9).
- Produces: the skill name `authoring`, referenced by `CLAUDE.md` and the README.

- [ ] **Step 1: Write the skill**

```markdown
---
name: authoring
description: Use when adding or editing a skill, spec, template, or plan in this repo, or when a session instruction from the user should be persisted — decides skill vs spec, keeps README and rendered plans in step
---

# Authoring skills, specs, and instructions

**Requires:** file tools, `node` (for `docs/_src/build-plans.mjs` and `scripts/check.mjs`).
**Reads:** `templates/SKILL.md`, `templates/spec.md`.

## When not to use

- Doing Figma work itself — use the relevant Figma skill.
- Designing a new feature for this repo — use `superpowers:brainstorming` first; come back here to write the resulting files.

## Skill or spec?

A **skill** is what to do: trigger, required tools, steps, gotchas, verification. A **spec** is what is true: contracts, tables, enumerations, conventions, examples. No steps in a spec.

Extract a skill section into a spec when any of these hold:

- it is consulted mid-task rather than read top-to-bottom;
- it is a table or code block over ~15 lines;
- a second skill needs it.

Extraction is part of writing or editing the skill. Decide it yourself; do not ask.

## Steps — new or edited skill

1. Copy `templates/SKILL.md` to `.claude/skills/<name>/SKILL.md`. Folder name equals `name` in the frontmatter.
2. Write the `description` as a trigger: "Use when …". This line is all the harness loads into context, so it must say *when*, not just *what*.
3. List required tools under **Requires**; mark relay-only tools (`run_script`) so the skill fails clearly when the upstream bridge is connected.
4. Write steps as single actions. Keep the body under ~100 lines; link `specs/*.md` by relative path instead of restating facts.
5. Apply the skill-or-spec rule above to every section.
6. For craft — testing the skill on a fresh subagent, tightening the description — follow `superpowers:writing-skills`.
7. Add a line to `README.md` under **Skills**: `- [`<name>`](.claude/skills/<name>/SKILL.md) — <description>`.
8. Run `node scripts/check.mjs`.

## Steps — new or edited spec

1. Copy `templates/spec.md` to `specs/<topic>.md`.
2. Name the source of truth so the facts can be re-checked later.
3. Facts only. If a sentence says "then do X", move it to a skill.
4. Add a line to `README.md` under **Specs**: `- [`specs/<topic>.md`](specs/<topic>.md) — <one line>`.
5. Run `node scripts/check.mjs`.

## Steps — persisting a session instruction

`CLAUDE.md` says when to persist (durable instructions: "always", "never", "whenever", "from now on", standing preferences, corrections of approach). This is where it goes:

- general agent behaviour in this repo → `.claude/CLAUDE.md`
- how to perform an existing skill → that skill's `SKILL.md`
- a fact, contract, or convention → the relevant `specs/*.md`, or a new one
- a new procedure → a new skill, via the steps above

1. Write it in the same turn the user states it, then tell the user where it went.
2. Keep `CLAUDE.md` under 60 lines. If a section passes ~10 lines, extract it into a skill or spec and leave a one-line pointer.

## Steps — plans

1. `superpowers:writing-plans` writes to `docs/plans/YYYY-MM-DD-<topic>.md`; design docs go to `docs/specs/`.
2. After any plan edit, including ticking a step, run `node docs/_src/build-plans.mjs`. Commit the `.html` with the `.md`.
3. Never hand-edit a generated `.html` or `docs/index.html`.

## Templates

Add `templates/<format>.md` when a format has appeared three times. Never put a `SKILL.md` under `.claude/skills/` unless it is a real skill — the harness discovers that folder.

## Gotchas

- A skill whose description says only what it does, not when, never triggers.
- Renaming a skill folder without updating `name` breaks discovery; `scripts/check.mjs` catches it.
- Removing a skill or spec without removing its README line fails the check.

## Verify

- `node scripts/check.mjs` prints `check: ok`.
```

- [ ] **Step 2: Confirm discovery-shape and length**

Run: `head -4 .claude/skills/authoring/SKILL.md; wc -l < .claude/skills/authoring/SKILL.md`
Expected: the first line is `---`, the second starts `name: authoring`, the third starts `description: Use when`; the line count is under 100.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/authoring/SKILL.md
git commit -m "feat: authoring skill

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: `CLAUDE.md`

The only always-on file. Short, and every rule it carries is one the agent needs before it can pick a skill.

**Files:**

- Create: `.claude/CLAUDE.md`

**Interfaces:**

- Consumes: the paths from Tasks 1, 5, 7, and 9.
- Produces: nothing later depends on it.

- [ ] **Step 1: Write the file**

```markdown
# figma-mcp-skills

Skills, reference specs, and standing instructions for designing in Figma through an MCP server.
The Figma Design Relay server ships no skills; this repo is that layer. Keep this file short —
everything else is loaded on demand.

## Figma MCP

- Two servers may be configured: `figma-design-relay` (the user's fork) and `figma-bridge`
  (upstream). The user picks one per session. Never propose changing that configuration.
- Tool names are identical on both; only the `mcp__<server>__` prefix differs. Use whichever
  Figma server is connected. If none is, say so and stop.
- `run_script` exists only on the relay. A skill that needs it says so under **Requires**.
- Tool surface, IDs, `fileKey`, Dev Mode, deletion, and path rules: `specs/figma-mcp-tools.md`.

## How to work here

- Skills live in `.claude/skills/<name>/SKILL.md` and are discovered natively — there is no
  index here on purpose. Read the whole `SKILL.md` before executing a skill.
- `specs/` is reference knowledge. Read a spec only when a skill links to it.
- Scratch files go in `dump/`, never the repo root. Nothing in `dump/` is project context.
- Design docs go in `docs/specs/`, plans in `docs/plans/`. Plans render to HTML with
  `node docs/_src/build-plans.mjs`; never hand-edit the HTML.
- `node scripts/check.mjs` verifies skills, the README catalogue, and rendered plans. Run it
  before saying repo maintenance is done.

## Persisting instructions

When the user states a durable instruction — "always", "never", "whenever", "from now on", a
standing preference, or a correction of your approach — write it down in the same turn and say
where it went. Task-scoped instructions ("for now", "this time") are never persisted. Routing
and procedure: the `authoring` skill.

## Conventions

- One skill per folder; folder name equals the frontmatter `name`.
- `README.md` lists every skill and spec; update it in the same change.
- Commit messages: `feat:`, `fix:`, `docs:`, `chore:`.
- Everything is LF (`.gitattributes` enforces it).
```

- [ ] **Step 2: Check the length budget**

Run: `wc -l < .claude/CLAUDE.md`
Expected: a number under 60.

- [ ] **Step 3: Commit**

```bash
git add .claude/CLAUDE.md
git commit -m "docs: CLAUDE.md

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Repo check script and README catalogue

Make the spec's verification list executable, then write the README so it passes.

**Files:**

- Create: `scripts/check.mjs`
- Create: `README.md`

**Interfaces:**

- Consumes: `node docs/_src/build-plans.mjs --check` (Task 3).
- Produces: `node scripts/check.mjs`, exit 0 with `check: ok` when the repo is consistent. `CLAUDE.md` and the `authoring` skill already refer to it.

- [ ] **Step 1: Write the check script**

Create `scripts/check.mjs`:

```js
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
```

- [ ] **Step 2: Run it to see it fail on the missing README**

Run: `node scripts/check.mjs`
Expected: exit 1 with an `ENOENT` error for `README.md` (the script has nothing to catalogue against yet).

- [ ] **Step 3: Write the README**

```markdown
# figma-mcp-skills

Skills, reference specs, and standing instructions that Claude Code loads on demand while
designing in Figma through an MCP server ([Figma Design Relay](https://github.com/SadhuG/figma-design-relay)
or the upstream bridge). The relay ships no skills; this repo is that layer.

The agent's always-on context is `.claude/CLAUDE.md`, kept short. Skills are discovered natively
from `.claude/skills/`; the one-line `description` of each is all that sits in context until the
skill is invoked. Specs are read only when a skill links to them.

## Skills

- [`authoring`](.claude/skills/authoring/SKILL.md) — Use when adding or editing a skill, spec, template, or plan in this repo, or when a session instruction from the user should be persisted — decides skill vs spec, keeps README and rendered plans in step

## Specs

- [`specs/figma-mcp-tools.md`](specs/figma-mcp-tools.md) — the shared Figma tool surface: which tools each server has, and the rules (node IDs, `fileKey`, Dev Mode, deletion, paths, atomicity) every call must respect

## Layout

- `.claude/CLAUDE.md` — always-on instructions
- `.claude/skills/<name>/SKILL.md` — one skill per folder
- `specs/` — reference knowledge shared by skills
- `templates/` — skeletons for new skills and specs
- `docs/specs/`, `docs/plans/` — this repo's own design docs and implementation plans; plans are
  rendered to HTML (`docs/index.html`) by `node docs/_src/build-plans.mjs`
- `dump/` — scratch space, ignored by git
- `scripts/check.mjs` — consistency check: skill frontmatter, this catalogue, rendered plans

## Maintenance

    node scripts/check.mjs             # frontmatter, catalogue, stale plan pages
    node docs/_src/build-plans.mjs     # re-render plans after editing markdown
    node --test docs/_src/             # generator tests
```

- [ ] **Step 4: Run the check to see it pass**

Run: `node scripts/check.mjs`
Expected: `check: ok`, exit 0.

- [ ] **Step 5: Prove the check catches drift**

Run: `mkdir -p .claude/skills/ghost; printf -- '---\nname: ghost\ndescription: Use when testing\n---\n' > .claude/skills/ghost/SKILL.md; node scripts/check.mjs; rm -r .claude/skills/ghost`
Expected: the middle command prints `README: skill "ghost" is not listed (.claude/skills/ghost/SKILL.md)` and exits 1.

- [ ] **Step 6: Re-render the plan and commit**

Ticked steps in this plan change its HTML, so regenerate before the final commit.

Run: `node docs/_src/build-plans.mjs; node scripts/check.mjs; git status --porcelain`
Expected: `check: ok`; status lists only `scripts/check.mjs`, `README.md`, and any regenerated `docs/` pages.

```bash
git add scripts/check.mjs README.md docs/
git commit -m "feat: repo check script and README catalogue

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Done when

- `node --test docs/_src/` passes: 14 tests, 0 failures.
- `node scripts/check.mjs` prints `check: ok`.
- `echo x > dump/probe.txt; git status --porcelain` shows nothing for `dump/`.
- `docs/index.html` lists this plan, and `docs/plans/2026-09-20-repo-structure.html` renders all nine tasks.
- `wc -l < .claude/CLAUDE.md` is under 60, and the file contains no list of skills.
- A fresh Claude Code session opened in this repo lists `authoring` among its skills.
- `git status` is clean on `main`.
