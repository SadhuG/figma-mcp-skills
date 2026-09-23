---
name: building-logo-lockups
description: Use when a brand mark needs its lockups, tones, clear space, minimum sizes, background rules and misuse grid built in Figma — as the Identity and Using the mark columns of a brand book, or as standalone logo, app tile and glyph component sets
---

# Building logo lockups

**Requires:** `run_script` (relay only — components and `combineAsVariants` have no dedicated
tool), `create_image` (importing supplied artwork), `save_screenshots`, `get_node`.
**Reads:** `specs/logo-lockups.md` — lockups, tones, clear space, minimum sizes, background
grounds, the misuse categories. `specs/brand-kit-pages.md` — the column and block grammar these
two columns must follow. `specs/figma-mcp-tools.md` — call rules, screenshot paths.

## When not to use

- Designing an original symbol from scratch. This skill composes, tones and documents a mark; it
  does not invent one. Without supplied artwork it can still build a type-only wordmark — say
  which of the two is happening.
- The colour and typography columns, or any applied surface — `building-brand-kits`.
- Icon component sets — `building-icon-variant-sets`.
- The upstream bridge is connected — no `run_script`; say so and stop.

## Steps

1. Establish where the mark comes from, and say it out loud: supplied artwork (`create_image`, or
   the user pastes vectors), a component already in the file, or a type-only wordmark built here.
2. Build the four lockups — `Horizontal`, `Stacked`, `Mark`, `Wordmark` — at one master size, each
   with the usage line from the spec.
3. Derive the five tones per lockup into 20 components, then `combineAsVariants` into the logo
   matrix with column heads `MARK`, `HORIZONTAL`, `STACKED`, `WORDMARK`. Build the app tile matrix
   (four themes at 240×240) and the glyph matrix (three tones) beside it.
4. Build the *Identity* column: the mark (its geometry and what it means), the lockups, the glyph.
5. Build the *Using the mark* column: clear space with its `X` inset and the minimum-size ladder;
   the background tiles, at least one of which is a ground the mark may not sit on unaided; the
   eight misuse tiles.
6. Express clear space as a multiple of the mark's own geometry (`X = ½ mark height`), never as a
   pixel value — the rule has to survive scaling.
7. Prove each minimum-size floor by rendering the mark at it and at the steps above it, so the
   floor is visible rather than asserted.
8. `save_screenshots` to `dump/` for each block and each matrix, and look at them.

## Gotchas

- Every misuse reason must cite a property of *this* mark — a fixed ascent angle, which element
  carries the accent, the exact accent hex. A reason that would read true of any logo is filler.
- A tone is defined by the ground it sits on, not by taste. Check each tone tile against the
  ground in the spec table before calling the block done.
- The glyph is the mark's fallback below the size floor, not a decorative extra; the identity
  column has to say what it collapses from.
- `run_script` is not atomic — one script per block or per matrix.
- `clone()` on a variant child lands on the page, not in the set, and `combineAsVariants` leaves
  the set at the staging coordinates. Reposition explicitly.
- If a call is rejected for the Figma tool-call cap, stop and tell the user. Do not retry.

## Verify

- The logo matrix resolves as one component set of 20, every child naming both axes.
- Each of the four lockups carries its usage line; each of the five tones names its ground.
- The misuse block has eight tiles, each with a mark-specific reason.
- The backgrounds block includes at least one prohibited ground.
- Screenshots show every tone legible on its own ground, and nothing clipped.
