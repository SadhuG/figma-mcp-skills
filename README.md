# figma-mcp-skills

Skills, reference specs, and standing instructions that Claude Code loads on demand while
designing in Figma through an MCP server ([Figma Design Relay](https://github.com/SadhuG/figma-design-relay)
or the upstream bridge). The relay ships no skills; this repo is that layer.

The agent's always-on context is `.claude/CLAUDE.md`, kept short. Skills are discovered natively
from `.claude/skills/`; the one-line `description` of each is all that sits in context until the
skill is invoked. Specs are read only when a skill links to them.

## Skills

- [`authoring`](.claude/skills/authoring/SKILL.md) — Use when adding or editing a skill, spec, template, or plan in this repo, or when a session instruction from the user should be persisted — decides skill vs spec, keeps README and rendered plans in step
- [`building-brand-kits`](.claude/skills/building-brand-kits/SKILL.md) — Use when a brand needs a full brand kit page in Figma — cover, brand book, component sets, and every applied surface from app icons to product screens — starting from nothing more than a brand name and a one-line description
- [`building-icon-variant-sets`](.claude/skills/building-icon-variant-sets/SKILL.md) — Use when a Figma file holds icon components — outline symbols, optional solid twins, or sets with only a variant axis — that need to become one component set per icon with variant and weight properties for a per-icon code factory
- [`building-logo-lockups`](.claude/skills/building-logo-lockups/SKILL.md) — Use when a brand mark needs its lockups, tones, clear space, minimum sizes, background rules and misuse grid built in Figma — as the Identity and Using the mark columns of a brand book, or as standalone logo, app tile and glyph component sets

## Specs

- [`specs/brand-kit-pages.md`](specs/brand-kit-pages.md) — the brand kit page contract: cover and seven sections, brand book column and block grammar, the colour ramp and ten-row type scale, and the deliverable tile sizes for app icons through product screens
- [`specs/figma-mcp-tools.md`](specs/figma-mcp-tools.md) — the shared Figma tool surface: which tools each server has, and the rules (node IDs, `fileKey`, Dev Mode, deletion, paths, atomicity) every call must respect
- [`specs/logo-lockups.md`](specs/logo-lockups.md) — logo contract: the four lockups and their usage lines, the five tones and the grounds they are for, clear space as a multiple of the mark, minimum-size floors, approved and prohibited backgrounds, and the eight misuse categories
- [`specs/icon-variant-sets.md`](specs/icon-variant-sets.md) — icon component-set contract: variant/weight props, weight → strokeWeight table, naming grammar, solid-capability classes, the position-based default-variant rule, and the inventory/build/extend/verify scripts

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
