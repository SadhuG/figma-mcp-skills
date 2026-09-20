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
