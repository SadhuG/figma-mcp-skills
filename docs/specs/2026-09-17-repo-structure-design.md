# figma-mcp-skills — repository structure

**Date:** 2026-09-17
**Status:** approved in discussion, awaiting written review

## Purpose

A collection of skills, reference specs, and standing instructions that an agent loads on
demand while designing in Figma through an MCP server. The Figma Design Relay server ships no
skills of its own; this repository is that layer.

The governing constraint is context hygiene: the agent's always-on context must stay small.
Everything else is loaded only when a task needs it.

## Layout

```
figma-mcp-skills/
├── .claude/
│   ├── CLAUDE.md                  always in context; short
│   └── skills/
│       └── authoring/SKILL.md     how to add/edit skills, specs, templates, plans;
│                                  how to persist session instructions
├── specs/
│   └── figma-mcp-tools.md         reference: shared Figma tool surface and gotchas
├── templates/
│   ├── SKILL.md                   skeleton for a new skill
│   └── spec.md                    skeleton for a new spec
├── docs/
│   ├── index.html                 generated catalogue of plans
│   ├── _src/build-plans.mjs       plan-markdown → HTML generator (zero dependencies)
│   ├── assets/doc.css, doc.js     page styling; step-checkbox persistence; scroll-spy rail
│   ├── specs/                     design docs for this repo (markdown only)
│   └── plans/                     implementation plans: <date>-<topic>.md + generated .html
├── dump/
│   └── .gitignore                 ignores everything except itself
├── README.md                      human catalogue of skills and specs
├── .gitignore
└── .gitattributes                 * text=auto eol=lf
```

## Components

### `.claude/CLAUDE.md`

Target under 60 lines. Contents, in order:

1. **What this repo is.** One paragraph.
2. **Figma MCP context.** Two Figma MCP servers may be configured (`figma-bridge`, the upstream
   package, and `figma-design-relay`, the user's fork). The user picks which one is active per
   session. Tool names are identical across both; only the `mcp__<server>__` prefix differs.
   Instructions: use whichever Figma server is connected; if none is, say so and stop. Skills
   that need relay-only tools (`run_script`) declare that requirement. Full tool reference in
   `specs/figma-mcp-tools.md`.
3. **How to work here.** Skills live in `.claude/skills/` and are discovered natively — read the
   full `SKILL.md` before executing one. Specs are consulted only when a skill links to them.
   Scratch files go in `dump/`, never the repo root. Design docs go to `docs/specs/`, plans to
   `docs/plans/`; plans are rendered to HTML with `node docs/_src/build-plans.mjs`, and the
   HTML is never hand-edited.
4. **Persisting instructions.** The trigger rule (below). Procedure is in the `authoring` skill.
5. **Conventions.** One skill per folder. README catalogue kept in step with disk. No manual
   skill index in CLAUDE.md — native discovery is the index. Commit messages: `feat:`, `fix:`,
   `docs:`, `chore:`.

### Skills — `.claude/skills/<name>/SKILL.md`

Native Claude Code skills. Frontmatter carries `name` and a trigger-style `description`
("Use when …"); the description is what the harness loads into context, the body is loaded on
invocation. A skill is *procedure*: trigger, required tools, steps, gotchas, verification.
Target under ~100 lines. Skills link to specs by relative path rather than restating facts.

### Specs — `specs/<topic>.md`

Reference knowledge: contracts, tables, enumerations, conventions, examples. No steps. Loaded
only when a skill links to one. Shared across skills; one location so nothing is duplicated.

**Separation rule** (applied by the agent while authoring, never raised as a question):

- Skill = *what to do*. Spec = *what is true*.
- Extract a skill section into a spec when: it is something consulted mid-task rather than read
  top-to-bottom; or it is a table or code block over ~15 lines; or a second skill needs it.
- Extraction happens as part of authoring or editing the skill, not as a separate task.

### Seed spec — `specs/figma-mcp-tools.md`

The shared Figma tool surface: which tools both servers expose, which are relay-only, and the
gotchas every skill must respect — node IDs use colon format (`4029:12345`); `fileKey` selects
the file when several are connected; Dev Mode is read-only; `delete_nodes` requires
`confirm: true`; `run_script` is not atomic; file paths must resolve inside the server's working
directory. Links to the relay repo's `docs/run-script.md`, `docs/design-context.md`, and
`docs/serialized-nodes.md` for full contracts rather than restating them.

### Seed skill — `.claude/skills/authoring/SKILL.md`

The repo's own maintenance procedure. Covers:

- Adding or editing a skill: copy `templates/SKILL.md`; write the trigger description; declare
  required tools; keep the body short; link specs relatively. Defers to
  `superpowers:writing-skills` for craft rather than duplicating it.
- Adding or editing a spec: copy `templates/spec.md`; facts only.
- Applying the separation rule and extraction trigger.
- Adding a template once a format has appeared three times.
- Writing a plan to `docs/plans/` and regenerating HTML.
- Updating `README.md` on every add, rename, or remove.
- Routing a persisted instruction (table below).

### Persisting session instructions

**Trigger (in CLAUDE.md, always active):** when the user states a durable instruction —
"always", "never", "whenever", "from now on", a standing preference, or a correction of the
agent's approach — the agent persists it in the same turn and says where it went. Task-scoped
instructions ("for now", "this time") are never persisted.

**Routing (in `authoring`):**

| Instruction is about                  | Goes to                                   |
| ------------------------------------- | ----------------------------------------- |
| general agent behaviour in this repo  | `.claude/CLAUDE.md`                       |
| how to perform an existing skill      | that skill's `SKILL.md`                   |
| a fact, contract, or convention       | the relevant `specs/*.md` (new if needed) |
| a new procedure                       | a new skill                               |

**Size guard:** if a CLAUDE.md section grows past ~10 lines, extract it into a skill or spec
and leave a pointer.

### Templates — `templates/`

`SKILL.md` and `spec.md` skeletons. Kept outside `.claude/skills/` because anything under that
folder containing a `SKILL.md` is auto-discovered as a skill. New templates are added by the
`authoring` skill when a third instance of a format appears.

### Plan rendering — `docs/`

Ported from the Figma Design Relay repo's `docs/superpowers/` with these changes:

- **No plan registry.** The generator discovers `docs/plans/*.md`. Title comes from the `#`
  line, date from the filename, rail titles from `### Task N:` headings, the spec link from the
  `**Spec:**` line, description from `**Goal:**`. An optional `**Phase:**` meta line supplies
  a phase number; `[R1, R2]` requirement chips on task headings remain supported. Both are
  optional and absent by default.
- **No relay branding or links.** Page title, colophon, and spec links are derived, not fixed.
- **`docs/index.html` is generated** — one card per plan with task and step counts.
- **`--check` is implemented**: exits non-zero if any on-disk HTML differs from what the
  generator would emit, so verification can detect stale pages.
- **localStorage key prefix changed** in `doc.js` so step progress does not collide with the
  relay's pages in the same browser.
- **No Prettier, no `package.json`, no `node_modules`.** `node docs/_src/build-plans.mjs` is
  the whole build. Requires Node, which is present on this machine.

The markdown is the source of truth. `superpowers:writing-plans` produces the shape the
parser expects. Regenerate after any plan edit; never hand-edit the HTML.

### `dump/`

Scratch space. Contains only a `.gitignore` that ignores everything except itself. The agent
never reads it as project context and never creates scratch files elsewhere.

### `README.md`

Human-readable catalogue: one line per skill and per spec, plus how to use the repo. Maintained
by the `authoring` skill on every add, rename, or remove.

## Out of scope

- Any Figma-workflow skill beyond `authoring`. Real skills are added over time.
- HTML rendering of design docs (`docs/specs/`); those stay markdown.
- Automated hooks to regenerate HTML on save. A rule suffices for now; a `PostToolUse` hook can
  be added later if it proves error-prone.
- Fixing or unifying the Figma MCP server entries in `~/.claude.json`. The user manages those
  per session.

## Verification

Done when all of the following hold:

- Every `SKILL.md` under `.claude/skills/` has valid frontmatter with `name` and `description`.
- `README.md` lists exactly the skills and specs present on disk.
- Dropping a file into `dump/` leaves `git status` clean.
- `node docs/_src/build-plans.mjs --check` exits 0 after a build and non-zero after editing a
  plan without rebuilding.
- The generator renders a plan produced by `superpowers:writing-plans` without parse errors,
  and `docs/index.html` lists it.
- A fresh Claude Code session in this repo lists `authoring` in its skill inventory.
- `git status` is clean and the initial commit is on `main`.
