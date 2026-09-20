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

import { basename } from "node:path";

/* ---------- inline + block markdown ---------------------------------------- */

const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Renders the inline subset the plans use: code spans, bold, italics, links.
 * Code spans are extracted first so their contents are never re-parsed.
 */
/** Placeholder used to park code spans while inline markdown is escaped. */
const SENTINEL = "\u0001";

export const inline = (text) => {
  const spans = [];
  let out = text.replace(/`([^`]+)`/g, (_, code) => {
    spans.push(`<code>${escapeHtml(code)}</code>`);
    return `${SENTINEL}${spans.length - 1}${SENTINEL}`;
  });
  out = escapeHtml(out);
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  return out.replace(/\u0001(\d+)\u0001/g, (_, i) => spans[Number(i)]);
};

/**
 * Turns a `Run:` / `Expected:` pair into the instrument readout. A leading
 * PASS / FAIL / prints verdict is colour-coded; the rest is inline markdown.
 */
const renderExpect = (runLine, expectLine) => {
  const parts = [];
  if (runLine) parts.push(`<b>Run</b> ${inline(runLine)}`);
  if (expectLine) {
    const verdict = expectLine.match(/^(PASS|FAIL|prints)\b/i);
    if (verdict) {
      const state = /^fail$/i.test(verdict[1]) ? "fail" : "pass";
      const rest = expectLine.slice(verdict[0].length);
      parts.push(`<b>Expect</b> <span class="${state}">${verdict[0]}</span>${inline(rest)}`);
    } else {
      parts.push(`<b>Expect</b> ${inline(expectLine)}`);
    }
  }
  return `<p class="expect">\n  ${parts.join("<br />\n  ")}\n</p>`;
};

/**
 * Renders a run of block-level markdown: paragraphs, lists, fenced code,
 * blockquotes, and the Run/Expected readout convention.
 */
export const blocks = (lines) => {
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    // Fenced code
    if (line.startsWith("```")) {
      const body = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) body.push(lines[i++]);
      i++;
      out.push(`<pre><code>${escapeHtml(body.join("\n"))}</code></pre>`);
      continue;
    }

    // Run: / Expected: readout
    if (/^Run:\s/.test(line) || /^Expected:\s/.test(line)) {
      let run = null;
      let expect = null;
      while (i < lines.length && (/^Run:\s/.test(lines[i]) || /^Expected:\s/.test(lines[i]))) {
        if (lines[i].startsWith("Run:")) run = lines[i].slice(4).trim();
        else expect = lines[i].slice(9).trim();
        i++;
      }
      out.push(renderExpect(run, expect));
      continue;
    }

    // A label for the code block that follows
    if (/^_.+_$/.test(line.trim())) {
      out.push(`<p class="pre-label">${inline(line.trim().slice(1, -1))}</p>`);
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      const body = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        body.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      out.push(`<blockquote>\n${blocks(body)}\n</blockquote>`);
      continue;
    }

    // Lists
    if (/^(\s*)([-*]|\d+\.)\s/.test(line)) {
      const ordered = /^\s*\d+\.\s/.test(line);
      const items = [];
      while (i < lines.length && /^(\s*)([-*]|\d+\.)\s/.test(lines[i])) {
        let item = lines[i].replace(/^\s*([-*]|\d+\.)\s/, "");
        i++;
        while (
          i < lines.length &&
          /^\s{2,}\S/.test(lines[i]) &&
          !/^\s*([-*]|\d+\.)\s/.test(lines[i])
        ) {
          item += " " + lines[i].trim();
          i++;
        }
        items.push(`  <li>${inline(item)}</li>`);
      }
      const tag = ordered ? "ol" : "ul";
      out.push(`<${tag} class="plain">\n${items.join("\n")}\n</${tag}>`);
      continue;
    }

    // Paragraph
    const para = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("```") &&
      !lines[i].startsWith("> ") &&
      !/^(\s*)([-*]|\d+\.)\s/.test(lines[i]) &&
      !/^Run:\s/.test(lines[i]) &&
      !/^Expected:\s/.test(lines[i])
    ) {
      para.push(lines[i].trim());
      i++;
    }
    out.push(`<p>${inline(para.join(" "))}</p>`);
  }

  return out.join("\n");
};

/* ---------- plan parsing ---------------------------------------------------- */

export const parsePlan = (md) => {
  const lines = md.split("\n");
  const plan = { meta: {}, constraints: [], tasks: [], doneWhen: [], blockquote: [] };

  let i = 0;
  plan.title = lines[i++].replace(/^#\s+/, "").replace(/\s+Implementation Plan$/, "");

  // Structural lines (headings, step markers) are ignored inside code fences,
  // so a plan may embed whole markdown files in its steps.
  let inFence = false;

  for (; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) inFence = !inFence;
    if (inFence) continue;

    if (line.startsWith("> ")) {
      plan.blockquote.push(line.replace(/^>\s?/, ""));
      continue;
    }

    const meta = line.match(/^\*\*(Goal|Architecture|Tech Stack|Spec|Phase):\*\*\s*(.*)$/);
    if (meta) {
      const body = [meta[2]];
      while (i + 1 < lines.length && lines[i + 1].trim() !== "" && !lines[i + 1].startsWith("**")) {
        body.push(lines[++i].trim());
      }
      plan.meta[meta[1]] = body.join(" ").trim();
      continue;
    }

    if (line.startsWith("## Global Constraints")) {
      i++;
      const body = [];
      while (i < lines.length && !lines[i].startsWith("### Task")) body.push(lines[i++]);
      i--;
      plan.constraints = body.filter((l) => l.trim() !== "" && l.trim() !== "---");
      continue;
    }

    if (line.startsWith("### Task ")) {
      const m = line.match(/^### Task (\d+):\s*(.*)$/);
      const task = {
        no: m[1],
        title: m[2],
        intro: [],
        files: [],
        interfaces: [],
        steps: [],
        chips: [],
      };
      const chip = task.title.match(/\s*\[(R[^\]]+)\]$/);
      if (chip) {
        task.chips = chip[1].split(/\s*,\s*/);
        task.title = task.title.replace(/\s*\[R[^\]]+\]$/, "");
      }
      i++;

      const body = [];
      let bodyFence = false;
      while (i < lines.length) {
        if (lines[i].startsWith("```")) bodyFence = !bodyFence;
        if (!bodyFence && (lines[i].startsWith("### Task ") || lines[i].startsWith("## Done when"))) break;
        body.push(lines[i++]);
      }
      i--;

      let j = 0;
      while (
        j < body.length &&
        !/^\*\*(Files|Interfaces):\*\*/.test(body[j]) &&
        !/^- \[ \]/.test(body[j])
      ) {
        task.intro.push(body[j++]);
      }
      /**
       * Collects the bullets under a `**Files:**` / `**Interfaces:**` marker.
       * Prettier puts a blank line after the marker, so skip blanks before the
       * list and stop at the first one after it.
       */
      const collectBullets = (into) => {
        j++;
        while (j < body.length && body[j].trim() === "") j++;
        while (j < body.length && body[j].startsWith("- ")) {
          let item = body[j++].slice(2);
          // Prettier wraps long bullets onto continuation lines.
          while (j < body.length && /^\s{2,}\S/.test(body[j]) && !body[j].startsWith("- ")) {
            item += " " + body[j++].trim();
          }
          into.push(item);
        }
      };

      // A finished step is written `- [x]`. Every step boundary below matches
      // both states: matching only `- [ ]` would silently drop each step an
      // executor has checked off, which is exactly when the page matters most.
      while (j < body.length && !/^- \[[ x]\]/.test(body[j])) {
        if (/^\*\*Files:\*\*/.test(body[j])) collectBullets(task.files);
        else if (/^\*\*Interfaces:\*\*/.test(body[j])) collectBullets(task.interfaces);
        else j++;
      }
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

      plan.tasks.push(task);
      continue;
    }

    if (line.startsWith("## Done when")) {
      i++;
      const body = [];
      while (i < lines.length) body.push(lines[i++]);
      plan.doneWhen = body.filter((l) => l.trim() !== "" && l.trim() !== "---");
    }
  }

  return plan;
};

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

/* ---------- HTML emission --------------------------------------------------- */

const fileLine = (raw) => {
  const m = raw.match(/^(Create|Modify|Extend|Delete|Test):\s*(.*)$/);
  if (!m) return `  <li>${inline(raw)}</li>`;
  return `  <li><span class="verb">${m[1]}</span>${inline(m[2])}</li>`;
};

const renderTask = (task, htmlSlug) => {
  const chips = task.chips
    .map((c) => `<span class="chip chip--phase">${c}</span>`)
    .join("\n              ");

  const steps = task.steps
    .map((step) => {
      const id = `${htmlSlug}t${task.no}s${step.no}`;
      // Pre-checked steps carry `is-done` from the start; doc.js only toggles
      // that class on the boxes it sees change, so first paint needs it here.
      const done = step.done ? { attr: " checked", cls: " is-done" } : { attr: "", cls: "" };
      return `              <li class="step${done.cls}">
                <div class="step__top">
                  <input type="checkbox" id="${id}"${done.attr} />
                  <label class="step__label" for="${id}">${inline(step.label)}</label>
                </div>
                <div class="step__body">
${blocks(step.body)}
                </div>
              </li>`;
    })
    .join("\n\n");

  const consumes = task.interfaces.find((t) => t.startsWith("Consumes:"));
  const produces = task.interfaces.find((t) => t.startsWith("Produces:"));

  return `          <article class="task" id="task-${task.no}" data-spy>
            <div class="task__head">
              <span class="task__no">Task ${String(task.no).padStart(2, "0")}</span>
              <h2>${inline(task.title)}</h2>
              ${chips}
            </div>
${blocks(task.intro)}

            <div class="tension">
              <span class="tension__count"></span><span class="tension__fill"></span>
            </div>

            <dl class="files">
              <dt>Files</dt>
              <dd>
                <ul>
${task.files
  .map(fileLine)
  .map((l) => `              ${l}`)
  .join("\n")}
                </ul>
              </dd>
              <dt>Interfaces</dt>
              <dd>
                ${consumes ? `<strong>Consumes</strong> — ${inline(consumes.replace(/^Consumes:\s*/, ""))}<br />` : ""}
                ${produces ? `<strong>Produces</strong> — ${inline(produces.replace(/^Produces:\s*/, ""))}` : ""}
              </dd>
            </dl>

            <ol class="steps">
${steps}
            </ol>
          </article>`;
};

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
