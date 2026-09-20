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
    node --test "docs/_src/*.test.mjs"             # generator tests
