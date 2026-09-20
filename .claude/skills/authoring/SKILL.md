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
