# Logo lockups

**Used by:** `building-logo-lockups`; `building-brand-kits` places what it produces.
**Source of truth:** the *Identity* (`7:481`) and *Using the mark* (`7:486`) columns and the
component-set matrices (`1:1012`, `1:1083`, `1:1099`) of the reference page described in
`specs/brand-kit-pages.md`. Values below are that instance's; the grammar is the durable part.

## The four lockups

| Lockup | Composition | Usage line |
| --- | --- | --- |
| `Horizontal` | mark left, wordmark right | Default. Product headers, sites, documents. |
| `Stacked` | mark above wordmark | Square spaces, covers, merch. |
| `Mark` | symbol alone | Avatars, tiles, favicons, app icons. |
| `Wordmark` | type alone | When the mark already appears nearby. |

Every lockup ships in the same set; a kit with fewer than four states which lockup is missing and
why, rather than leaving the gap unexplained.

## Tones

Five tones, each with the ground it is for:

| Tone | Ground |
| --- | --- |
| `Full Color` | On light ground — the default |
| `Inverse` | On dark ground |
| `White` | On brand blue or photography |
| `Ink` | Single-colour light ground |
| `Blue` | Monochrome blue on light |

The logo matrix is tones × lockups — five rows by four columns, 20 components, column heads
`MARK`, `HORIZONTAL`, `STACKED`, `WORDMARK`.

Two further matrices sit beside it: an **app tile** matrix of four themes (`LIGHT`, `DARK`,
`BLUE`, `WASH`) at 240×240 with a fixed corner radius, and a **glyph** matrix of three tones
(`BLUE`, `INK`, `WHITE`) for the single element the mark collapses into at small sizes.

## Clear space

Clear space is expressed as a multiple of the mark's own geometry, never as a pixel value, so it
survives scaling. The reference: `X = ½ mark height = one step`, applied on all four sides, drawn
as a labelled `X` inset around the lockup.

## Minimum sizes

| Artefact | Floor | Reason |
| --- | --- | --- |
| Mark | 20px tall | below this the blades close up |
| Horizontal lockup | 96px wide | |
| Stacked lockup | 72px wide | |
| Below 20px | use the glyph instead | |

The minimum-size block also shows the mark rendered at each step of a size ladder (20, 24, 32,
48px in the reference) so the floor is visible rather than asserted.

## Backgrounds

A background block is one tile per approved ground: the lockup on that ground, the ground's name
and hex, and the tone to use on it. The reference grounds:

| Ground | Hex | Tone |
| --- | --- | --- |
| White | `#FFFFFF` | Full Color |
| Ink 950 | `#111111` | Inverse |
| Brand Blue | `#145CFD` | White |
| Blue Wash | `#F0F4FF` | Full Color |
| Ink 800 | `#282A2E` | Inverse |
| Ink 400 | `#9AA0AC` | Never — needs a scrim |

At least one tile states a ground the mark may **not** sit on unaided. A backgrounds block with no
prohibition is incomplete.

## Misuse

Eight tiles, each a `✕` glyph, a `Do not <verb>` title, and one sentence giving the reason. The
categories, with the reference wording:

| Category | Reference tile |
| --- | --- |
| Rotation | Do not rotate — The ascent angle is fixed at 17°. |
| Proportion | Do not stretch — Scale proportionally, always. |
| Recolouring parts | Do not recolour a blade — Only the leading blade is blue. |
| Effects | Do not add effects — No shadows, glows or bevels. |
| Outlining | Do not outline — The blades are solid shapes. |
| Contrast | Do not lower contrast — Blue on blue loses the mark. |
| Opacity | Do not fade — Full opacity, or use the Inverse tone. |
| Accent substitution | Do not substitute the accent — The accent is `#145CFD`. Nothing else. |

Each reason cites a specific property of this mark. A tile whose reason would read true of any
logo is not doing its job.

## Identity blocks

The *Identity* column carries three blocks — the mark (geometry and what it means), the lockups,
and the glyph. The *Using the mark* column carries clear space and minimum size, backgrounds, and
misuse. Block and head grammar is in `specs/brand-kit-pages.md`.
