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
