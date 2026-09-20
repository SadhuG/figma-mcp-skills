---
name: building-icon-variant-sets
description: Use when a Figma file holds icon components — outline symbols, optional solid twins, fill-only glyphs, or sets with only a variant axis — that need to become one component set per icon with variant and weight properties for a per-icon code factory
---

# Building icon variant sets

**Requires:** `run_script` (relay only — `combineAsVariants` and component properties have no dedicated tool), `save_screenshots`, `set_auto_layout`, `get_node`.
**Reads:** `specs/icon-variant-sets.md` — the prop contract, naming grammar, solid-capability table, default-variant rule, and every script this skill runs. `specs/figma-mcp-tools.md` — call rules, screenshot paths.

## When not to use

- Redrawing per-weight vector geometry — that is illustration work; this skill derives weights by `strokeWeight`.
- Building non-icon component sets (buttons, inputs) — the naming grammar and default-variant rule apply, the scripts do not.
- The upstream bridge is connected — no `run_script`; say so and stop.

## Steps

1. Confirm the relay is connected (`list_files`). Convert the user's URL `node-id` to colon form.
2. Run the **inventory** script on the source frame. It classifies each source (`outline`, `solid`, `multicolour`, `mixed`, `set`), pairs outlines with solid twins anywhere on the page, and assigns each icon a solid capability: **has solid**, **fill-only glyph**, **derivable**, or **outline-only**.
3. Show the inventory as one table: icon, capability, states to build, native size, source shape, and anything skipped (multicolour marks, mixed). In the same message confirm scope, weight steps, the prop contract, and, only where they apply: which twin to use for any icon whose inventory row lists more than one; whether to derive a placeholder solid for **derivable** icons or leave them at three states (default: leave). Do not re-ask any of these later.
4. Ask which frame the library goes in. If the user wants the original preserved, duplicate it once with `duplicate_nodes` and build in the copy; never duplicate again.
5. Compose each icon's description from the template and its capability row before building; the scripts take it as input. Prepend the spec's constants block to every script.
6. Build **one** set first — the **build** script for flat sources and fill-only glyphs, the **extend** script for an existing variant set. Then apply `set_auto_layout` to the library frame (wrap, padding 24, gap 32) so later batches flow instead of clipping. Save a screenshot with `save_screenshots` to `dump/` and view it. Confirm the states read thin → regular → bold (→ solid) and `defaultVariant` is `variant=outline, weight=thin`.
7. Build the rest in batches of 3–4 icons per script. The limit is blast radius: `run_script` is not atomic, so a failing batch should leave few sets to inspect. Every script returns the IDs, state count, and `defaultVariant` of what it created. Screenshot each batch.
8. Run the **verify** script over the library frame. Fix any set with problems by repositioning or renaming — never by rebuilding a set that already resolves.
9. Take one final screenshot of the library frame.

## Gotchas

- Solid capability comes from artwork, not geometry. Closed paths do not mean a solid exists; open strokes do not mean one cannot (a hand-drawn twin may sit elsewhere on the page). A fills-only source with no outline twin is a fill-only glyph, not a missing outline: its four states share one geometry.
- A derived solid is a fill of the closed outline paths — a placeholder. Build it only when the user opted in at step 3, and say so in the set description.
- The default variant is the **top-left-most child by position**. Reordering `children` does nothing; `defaultVariant` is read-only; `editComponentProperty` rejects `defaultValue` on variant properties. With the thin → regular → bold row, `thin` is the Figma default; the description records this and the code default stays `regular`.
- Every child name must declare every axis. A solid state is `variant=solid, weight=regular`, not `variant=solid`, or the set breaks and `componentPropertyDefinitions` throws.
- `clone()` on a variant child lands on the page, not in the set; `combineAsVariants` leaves the set at the staging coordinates. The spec's scripts handle both — do not trim those lines.
- Keep native sizes (a 20×20 icon stays 20×20) and existing spellings.
- If a call is rejected for the Figma tool-call cap, stop and tell the user. Do not retry.

## Verify

- The **verify** script returns an empty `problems` array for every set.
- Each set's state count matches its capability: 4 for **has solid**, **fill-only glyph**, and opted-in **derivable**; 3 otherwise.
- The final screenshot shows no overlapping sets and every set's states in the order thin, regular, bold, solid.
