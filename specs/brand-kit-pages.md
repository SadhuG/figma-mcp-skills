# Brand kit pages

**Used by:** `building-brand-kits`, `building-logo-lockups`.
**Source of truth:** the reference page in the Figma file *Temp: LeadFlow v2* — page cover `2:424`,
sections `2:467`–`2:479`, brand book `1:6`. That file is unsaved, so its `fileKey` is ephemeral;
the structure below is the durable part. Sizes are the reference instance's, not a hard contract —
the grammar is.

## Page shell

One Figma page holds a cover frame followed by seven Figma **sections**, left to right.

| Node | Name | Reference size |
| --- | --- | --- |
| FRAME | `Cover` | 4400×878 |
| SECTION | `01 · Brand book` | wraps one `content` frame |
| SECTION | `02 · Component sets` | " |
| SECTION | `03 · App icons & favicons` | " |
| SECTION | `04 · Social` | " |
| SECTION | `05 · Presentation & print` | " |
| SECTION | `06 · Merch` | " |
| SECTION | `07 · Brand in product` | " |

Section names are `NN · Title` with a middle dot. Every section contains exactly one frame named
`content`; the deliverables are that frame's children. Section numbers and the cover's contents
list are the same seven strings in the same order.

### Cover

- `left` (900×622) — `wordmark` frame of two TEXT lines (brand name, then the word `Brand`),
  a `tagline` TEXT, and a `meta` row of four chips: `TYPEFACE`, `PRIMARY`, `INK`, `VERSION`.
  Each chip is a frame of a label TEXT over a value TEXT.
- `contents` (267×401) — a `CONTENTS` label over seven rows, each a frame holding a number TEXT
  (`01`…`07`) and a title TEXT matching its section.

## Brand book (section 01)

One frame (reference 6883×4315):

- `Cover` (6883×720) — a logo INSTANCE, a `ct` frame of two title TEXT lines, and a `meta` row of
  four chips: `Mark`, `Primary`, `Typeface`, `Version`.
- `columns` (6883×3475) — four column frames separated by 1px RECTANGLE dividers named `rule`,
  each divider the full height of `columns`.

| Column | Reference size | Owned by |
| --- | --- | --- |
| `col · Identity` | 1600×2133 | `building-logo-lockups` |
| `col · Using the mark` | 1600×2595 | `building-logo-lockups` |
| `col · Colour` | 1600×3475 | `building-brand-kits` |
| `col · Typography` | 1600×2058 | `building-brand-kits` |

### Column and block grammar

Every column opens with `col head` (1600×192): a title TEXT and a one-line description TEXT, both
1440 wide. Blocks follow, each 1600 wide.

Every block opens with a frame named `head`, 1440 wide:

- 141 tall — eyebrow TEXT (`NN — Column name`), title TEXT, description TEXT.
- 115 tall — eyebrow and title only.

Content sits in a short-named frame below the head: `row`, `strip`, `cols`, `dm`, `g`, `b`, `cs`,
`bgs`, `misuse`, `spec`, `scale`. Inner content is 1440 wide inside a 1600 column — an 80px gutter
each side.

## Colour column

| Block | Content frame | Shape |
| --- | --- | --- |
| `Colour` | `Blue`, `Ink`, `Ember`, `calls` | one frame per ramp, then a contrast callout row |
| `Semantic tokens` | `cols` | two 704-wide `col` frames of 702×37 rows |
| `Dark mode` | `dm` | two 704-wide frames, `Light` and `Dark` |
| `Gradients` | `g` | three 464-wide tiles, one per gradient |

A ramp frame is `hd` (ramp name TEXT + a note TEXT stating which step is the product primary and
which steps fail AA) over `strip`: eleven swatch frames named `s50`, `s100`, `s200`, `s300`,
`s400`, `s500`, `s600`, `s700`, `s800`, `s900`, `s950`, each 124×130, carrying step label and hex.

`calls` rows are `<ratio> · <pair> · <verdict>` — e.g. `5.28:1 · Blue 600 on white · Body text,
links, icons` and `4.33:1 · Blue 500 on white · Fails AA — decorative only`. Ratios are WCAG 2.1
contrast, computed, not estimated.

Semantic rows are a three-cell table under a `hdr` of `TOKEN / LIGHT / DARK`, with token names in
`Group/Name` form. The reference groups are `Surface/` (Canvas, Subtle, Raised, Sunken, Inverse),
`Text/` (Primary, Secondary, Muted, Inverse, Link), `Border/` (Subtle, Default, Strong, Focus),
`Brand/` (Primary, Primary Hover, Primary Press, On Primary). The `hdr` repeats at the top of the
second column.

`Dark mode` holds the same product component rendered light and dark, each labelled with the
semantic token and the ratio it resolves to in that mode.

## Typography column

One `Typography` block: `head`, then `spec` (1440×359), then `scale` (1440×1158).

`spec` is the family name TEXT, a specimen TEXT of uppercase, lowercase, digits and the glyphs the
brand actually uses, and a `w` row of one chip per weight.

`scale` is rows `r0`…`r9`. Each row carries role, usage, spec string `<weight> · <size>px ·
<tracking>%`, and a live sample set in that style. The reference roles:

| Row | Role | Spec | Usage |
| --- | --- | --- | --- |
| `r0` | Display | ExtraBold · 80px · -3.5% | Marketing heroes, covers |
| `r1` | Heading 1 | Bold · 56px · -2% | Page titles |
| `r2` | Heading 2 | Bold · 48px · -2% | Section titles |
| `r3` | Heading 3 | SemiBold · 40px · -1.5% | Subsections |
| `r4` | Heading 4 | SemiBold · 32px · -1% | Card titles |
| `r5` | Heading 5 | SemiBold · 24px · -1% | Dense headings |
| `r6` | Heading 6 | SemiBold · 20px · -0.5% | Labels, table heads |
| `r7` | Text Regular | Regular · 16px · 0% | Body copy |
| `r8` | Text Small | Regular · 14px · 0% | Secondary, captions |
| `r9` | Text Tiny | Medium · 12px · +2% | Meta, legal |

Samples are product sentences, not lorem — the reference sets each row in copy the brand would
really ship.

## Deliverable tiles (sections 03–07)

Each deliverable is a frame named for the artefact, containing a title TEXT (73 tall) and a `row`
frame of tiles. A tile is the asset at its **true export size** plus a 76px caption block below;
tile width is the asset width, or the caption's minimum width when the asset is smaller.

| Section | `content` width | Frames | Tiles (asset size) |
| --- | --- | --- | --- |
| 03 | 4400 | `App icons` | iOS, iOS Dark, Brand, macOS — 1024×1024 |
| | | `Android adaptive` | background, foreground, composed — 1024×1024 |
| | | `Favicons` | 180, 48, 32, 16 |
| 04 | 2560 | `Social avatars` | brand, light, ink — 400×400 |
| | | `Social cards` | Open Graph 1200×630, X card 1200×675 |
| | | `LinkedIn banner` | 1584×396 |
| 05 | 4000 | `Slides` | cover, divider — 1920×1080 |
| | | `Business cards` | front, back — 1050×600 |
| | | `Email signature` | 680×210 |
| | | `Letterhead` | A4 — 1240×1754 |
| 06 | 2400 | `Merch` | T-shirt chest print 900×900; stickers brand, ink, light — 400×400 |
| 07 | 3040 | `Login` | Desktop 1440×900 |
| | | `Marketing hero` | 1440×860 |
| | | `Dashboard` | Light, Dark — 1440×900 |
| | | `Empty and loading states` | Empty state, Loading — 760×520 |

Tile names carry their variant after an em dash: `iOS — 1024`, `Dashboard — Dark`,
`Card — front`, `Avatar — ink`.

## What this page is not

The reference page has no Figma variables and no local styles — `get_variable_defs` returns an
empty collection list and `get_styles` returns empty arrays. Colour, type and token values are
drawn and labelled, not bound. A brand kit page documents the system; it does not author it.
