---
name: building-brand-kits
description: Use when a brand needs a full brand kit page in Figma — cover, brand book, component sets, and every applied surface from app icons to product screens — starting from nothing more than a brand name and a one-line description
---

# Building brand kits

**Requires:** `run_script` (relay only — the page is thousands of nodes; call-by-call creation
exceeds the tool-call cap and the 180s timeout), `create_page`, `save_screenshots`, `get_node`,
`get_metadata`.
**Reads:** `specs/brand-kit-pages.md` — the page shell, block grammar, ramp and type-scale
contracts, and the deliverable size table. `specs/figma-mcp-tools.md` — call rules, screenshot
paths.

## When not to use

- The mark, lockups, clear space, backgrounds, or misuse — `building-logo-lockups` owns those and
  this skill calls it.
- Icon component sets — `building-icon-variant-sets`.
- Authoring a token library. This builds a document that *describes* the system; the reference
  page has no variables and no styles. If the user wants bound variables, that is a separate job.
- The upstream bridge is connected — no `run_script`; say so and stop.

## Steps

1. Confirm a Figma server is connected (`list_files`). Get the **brand name** and a **one-line
   description** of what the product is. These two are required; if either is missing, ask for
   that and nothing else.
2. Offer the rest of the intake once, as a single optional list: audience; 3–5 personality
   adjectives; references and an explicit "not like this"; anything already decided (existing
   colours, licensed fonts, logo files); platforms in scope; light-only or light + dark;
   accessibility target (AA default); target file and whether to build on a new page. Take
   whatever comes back and move on. Never re-ask an item that went unanswered.
3. Read what the file already decides: `get_metadata`, `get_selection`, existing frames. A file
   named for the product, or a logo already sitting on the canvas, is input.
4. Check fonts before proposing type — `figma.listAvailableFontsAsync()` in `run_script`, matching
   family **and** every weight the scale needs. An unavailable font falls back to Inter silently
   and the whole kit is set wrong.
5. Propose 2–3 directions in one message: palette with its ramp anchors, type pairing mapped onto
   the ten scale roles, tone of voice. Label every slot you filled for an unanswered intake item
   as an assumption. **Wait for approval.** Nothing is drawn before this.
6. Compute the semantic token table and every WCAG contrast ratio now, before drawing. The ratios
   become the `calls` rows and the dark-mode labels.
7. Create the page. Build the `Cover` frame, then the seven sections, each wrapping one `content`
   frame. The cover's contents list and the section names are the same seven strings.
8. Hand the *Identity* column, the *Using the mark* column, and section 02 to
   `building-logo-lockups`. Give it the approved palette so its tones match.
9. Build the brand book: its cover strip, then the `columns` frame with the four columns and the
   1px `rule` dividers. Build the *Colour* and *Typography* columns block by block, one
   `run_script` per block.
10. Build sections 03–07 one deliverable frame per script, each tile at its true export size with
    the 76px caption block.
11. `save_screenshots` to `dump/` after each block and each deliverable frame, and look at them. A
    script that returns node IDs has not proved the board reads correctly.
12. Re-read the finished page and check it against the Verify list below.

## Gotchas

- `run_script` is not atomic. One script per block or per deliverable frame — a throw part-way
  should leave one board to inspect, not a half-built page.
- A swatch's fill and its hex label must come from the same value in the same script. Drawn from
  separate literals, they drift and the page lies.
- Contrast is computed, never eyeballed. A pair that fails AA is labelled as failing and kept —
  the reference page says `Fails AA — decorative only` rather than hiding the step.
- Type-scale samples are copy the brand would really ship, not lorem. Same for the dark-mode
  component and the product screens.
- Deliverables are at true export size (1024 app icons, 1200×630 OG, 1584×396 LinkedIn, A4 at
  1240×1754). A tile drawn at a convenient size is not a deliverable.
- Do not bind variables or create styles here, and do not label drawn values as tokens in a way
  that implies they are bound.
- If a call is rejected for the Figma tool-call cap, stop and tell the user. Do not retry.
- `delete_nodes` needs `confirm: true` and, for anything you did not create this session, the
  user's say-so.

## Verify

- Every section holds exactly one `content` frame, and the cover's contents rows match the seven
  section numbers and titles exactly.
- Each ramp has its eleven steps `s50`…`s950`, each labelled with the hex that fills it.
- Every `calls` ratio recomputes to the number printed on the board.
- The type scale has ten rows, each rendered in the weight, size and tracking it states.
- Screenshots of every board show no clipping and no overlapping frames.
