# Icon variant sets

**Used by:** `building-icon-variant-sets`
**Source of truth:** Figma Plugin API reference — `figma.combineAsVariants`, `ComponentSetNode.defaultVariant`, `componentPropertyDefinitions`, `editComponentProperty`, `VectorNode.vectorPaths` — and behaviour confirmed by running the scripts below against a live file with `run_script`. When the API reference and this file disagree, the API wins; fix this file.

## Prop contract (default)

The contract a per-icon code factory consumes. Override any value when the user's spec differs.

| Prop      | Values                        | Default   | Notes                                                                                          |
| --------- | ----------------------------- | --------- | ---------------------------------------------------------------------------------------------- |
| `variant` | `outline` \| `solid`          | `outline` | An icon with no solid state falls back to outline.                                             |
| `weight`  | `thin` \| `regular` \| `bold` | `regular` | Outline only. Solid always renders regular; solid+thin, solid+bold fall back to solid+regular. |
| `size`    | number                        | `24`      | Sets width and height. Not a Figma axis — native size is kept.                                 |
| `color`   | —                             | —         | No prop; `currentColor` via external CSS.                                                      |

Built states per icon: `outline × {thin, regular, bold}` plus `solid` where the icon has one — four, not the cross-product. Otherwise three.

Codegen shape: `createIcon("<name>", <camelName>Paths)`; path data in `paths/<name>.ts`, one file per icon. The code default for `weight` is `regular` regardless of what Figma shows as the default variant (see below).

## Weight → stroke

Weights are derived on shared outline geometry by `strokeWeight`, not by per-weight path data. Redrawn per-weight vectors are a deferred follow-up and the set description says so.

| weight    | `strokeWeight` |
| --------- | -------------- |
| `thin`    | 1              |
| `regular` | 1.5            |
| `bold`    | 2.5            |

`strokeCap` and `strokeJoin` stay as drawn (typically `ROUND`).

## Classifying source components

Read the shape descendants (`VECTOR`, `RECTANGLE`, `ELLIPSE`, `POLYGON`, `STAR`, `BOOLEAN_OPERATION`) of a `COMPONENT`. Components that are children of a `COMPONENT_SET` are not classified individually; the set is one source.

| Shapes carry                  | Class       |
| ----------------------------- | ----------- |
| `strokes` only                | outline     |
| `fills` only, one colour      | solid       |
| `fills` only, several colours | multicolour — brand mark, out of scope |
| both, or none                 | mixed — ask the user |

Base icon name = component name with any solid qualifier removed: trailing `-solid`, ` solid`, `/solid`. For a set, the name after `Icon=`. Existing spellings are kept verbatim (a misspelt name is a reference other files may already use).

## Solid capability

Decided per base name, in this order. The first row that matches wins.

| Signal                                                                                                                   | Capability          | States built                | Description line                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------- | --------------------------- | ------------------------------------------------------------------------------------------------ |
| An outline and a solid component share the base name (solid may sit anywhere on the page), or the set has a `variant=solid` child | **has solid**       | 4                           | —                                                                                                |
| Only a solid component exists — dots, filled glyphs drawn without strokes                                                | **fill-only glyph** | 4, all from the one geometry | `Fill-only glyph: variant and weight do not change the artwork.`                                |
| Only an outline exists and every shape is an open path (no `Z` in any `vectorPaths[].data`, no closed primitive)         | **outline-only**    | 3                           | `No solid variant: open-stroke glyph.`                                                           |
| Only an outline exists and at least one shape is closed                                                                  | **derivable**       | 3, or 4 if the user opts in | `Solid: derivable, not drawn.` / `Solid: derived by filling closed paths — review before use.` |

Path closure is not evidence of artwork: an outline drawn as open strokes may still have a hand-drawn solid twin, and closed dots may never need one. Artwork presence is the only signal that promotes an icon to **has solid**.

Derived solid = clone of the regular outline where every closed shape takes the stroke paint as `fills` and drops `strokes`; open shapes keep their strokes. It is a placeholder for review, never silently equivalent to drawn artwork.

## Source shapes

- **Flat** — separate `COMPONENT`s per state, paired by base name. Build a new set in the library frame.
- **Variant set** — a `COMPONENT_SET` whose children already declare a `variant` axis. Extend in place (add the missing axis and states, never rebuild), then reparent the set into the library frame.

## Naming grammar

- Set: `Icon=<name>`.
- Child: `variant=<variant>, weight=<weight>` — every child declares every axis. A child missing an axis (e.g. `variant=solid` alone) makes the set report errors and `componentPropertyDefinitions` throw.

## Default variant

`defaultVariant` is the child at the top-left-most **position** inside the set. `children` order does not decide it; `defaultVariant` is read-only; `editComponentProperty` rejects `defaultValue` on `VARIANT` properties. The only lever is placement.

Row order is **thin, regular, bold, solid** — the weights read left to right in increasing stroke — so Figma's default variant is `variant=outline, weight=thin`. This is accepted and stated in every set description; the code default stays `regular`.

## Set layout

One row, 24 padding, 16 gap, set resized to hug. Icon native size preserved (a 20×20 source yields 20×20 variants).

`combineAsVariants(nodes, parent)` leaves the new set at the nodes' staging coordinates, which may be far outside `parent`'s bounds; a screenshot of a set left there is blank. The build script positions each set inside the library frame; once the frame has auto layout, that position is superseded by flow and a fixed-size frame no longer clips later batches.

`clone()` on a child of a `COMPONENT_SET` places the clone on the **page**, not in the set. The extend script re-appends it.

## Description template

```
<name> — icon component.

Props:
• variant: "outline" (default) | "solid"
• weight: "thin" | "regular" (default) | "bold" — outline only; solid always renders regular.
• size: number, default 24 — sets width and height.
• color: no dedicated prop — inherits currentColor via external CSS.

Solid is single-weight: solid+thin or solid+bold falls back to solid+regular.
Built states: outline×{thin,regular,bold} + solid, not the full cross-product.

Codegen: createIcon("<name>", <camelName>Paths); path data in paths/<name>.ts (one file per icon, tree-shakeable).

Known deferred: thin/regular/bold are strokeWeight 1 / 1.5 / 2.5 on shared outline geometry, not hand-drawn per-weight paths.

Figma default variant: thin (top-left-most; Figma offers no separate setting). Code default is regular.
```

Substitutions by capability:

| Capability          | `variant` line                                        | `Solid is single-weight…` line                    | `Built states` line                              |
| ------------------- | ----------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------ |
| has solid           | as template                                           | as template                                       | as template                                      |
| fill-only glyph     | as template                                           | `Fill-only glyph: variant and weight do not change the artwork.` | as template                       |
| outline-only        | `variant: "outline" — "solid" falls back to outline.` | `No solid variant: open-stroke glyph.`            | `Built states: outline×{thin,regular,bold}.`     |
| derivable, skipped  | `variant: "outline" — "solid" falls back to outline.` | `Solid: derivable, not drawn.`                    | `Built states: outline×{thin,regular,bold}.`     |
| derivable, derived  | as template                                           | `Solid: derived by filling closed paths — review before use.` | as template                          |

## Scripts

Constants every script below relies on. `run_script` calls share no scope: prepend this block to each script verbatim.

```js
const WEIGHTS = { thin: 1, regular: 1.5, bold: 2.5 };
const ORDER = ['thin', 'regular', 'bold'];            // row order — see Default variant
const PAD = 24, GAP = 16, STAGE = { x: 10000, y: 10000 };
const SHAPES = ['VECTOR', 'RECTANGLE', 'ELLIPSE', 'POLYGON', 'STAR', 'BOOLEAN_OPERATION'];
const SOLID_SUFFIX = /(-solid|\s+solid|\/solid)$/i;
const isClosed = s => s.type !== 'VECTOR' || s.vectorPaths.some(p => /z/i.test(p.data));
const stroked = c => c.findAll(n => SHAPES.includes(n.type) && n.strokes.length);
const layoutRow = (set, row) => {            // row: children in display order
  let x = PAD;
  for (const v of row) { v.x = x; v.y = PAD; x += v.width + GAP; }
  set.resizeWithoutConstraints(x - GAP + PAD, row[0].height + 2 * PAD);
};
const placeBelow = (set, target) => {        // provisional spot inside the library frame
  const others = target.children.filter(c => c !== set);
  set.x = PAD;
  set.y = others.length ? Math.max(...others.map(c => c.y + c.height)) + GAP : PAD;
};
```

Inventory (read-only). Run on the source frame; it also searches the page for solid twins living elsewhere:

```js
const src = await figma.getNodeByIdAsync('<source frame or set id>');
const base = n => n.replace(SOLID_SUFFIX, '');
const paints = f => f.filter(p => p.type === 'SOLID').map(p => JSON.stringify(p.color));
const classify = c => {
  const shapes = c.findAll(d => SHAPES.includes(d.type));
  const st = shapes.filter(s => s.strokes.length), fi = shapes.filter(s => s.fills.length);
  const colours = new Set(fi.flatMap(s => paints(s.fills))).size;
  const kind = st.length && !fi.length ? 'outline'
    : fi.length && !st.length ? (colours > 1 ? 'multicolour' : 'solid') : 'mixed';
  return { kind, closed: st.some(isClosed), strokeWeight: st[0]?.strokeWeight ?? null };
};
const rows = src.findAll(n => (n.type === 'COMPONENT' && n.parent.type !== 'COMPONENT_SET') || n.type === 'COMPONENT_SET').map(n => {
  if (n.type === 'COMPONENT_SET') {
    let axes; try { axes = Object.keys(n.componentPropertyDefinitions); } catch (e) { axes = String(e); }
    return { id: n.id, kind: 'set', name: n.name, base: n.name.replace(/^Icon=/, ''), axes, children: n.children.map(c => c.name),
      capability: n.children.some(c => /variant=solid/.test(c.name)) ? 'has solid' : 'outline-only' };
  }
  return { id: n.id, name: n.name, base: base(n.name), w: n.width, h: n.height, ...classify(n) };
});
const pageSolids = figma.currentPage.findAll(n => n.type === 'COMPONENT' && SOLID_SUFFIX.test(n.name));
for (const r of rows.filter(r => r.kind === 'outline')) {
  const inFrame = rows.filter(o => o.kind === 'solid' && o.base === r.base).map(o => ({ id: o.id, parent: src.name }));
  const onPage = pageSolids.filter(s => base(s.name) === r.base && !inFrame.some(t => t.id === s.id)).map(s => ({ id: s.id, parent: s.parent.name }));
  r.twins = [...inFrame, ...onPage];                 // more than one → the user picks
  r.solid = r.twins.length === 1 ? r.twins[0].id : null;
  r.capability = r.twins.length ? 'has solid' : r.closed ? 'derivable' : 'outline-only';
}
for (const r of rows.filter(r => r.kind === 'solid' && !rows.some(o => o.kind === 'outline' && o.base === r.base))) {
  r.capability = 'fill-only glyph';
}
return rows;
```

Build from flat sources (one batch of 3–4 icons). Per icon: `outline` is the outline ID or `null` for a fill-only glyph; `solid` is the solid ID (the chosen twin when the inventory listed several) or `null`; `derive` is `true` only for icons the user opted in; `description` is the composed template text as a template literal:

```js
const icons = [/* { name, outline: '<id>' | null, solid: '<id>' | null, derive: false, description: `multi-line, from the template` } */];
const target = await figma.getNodeByIdAsync('<library frame id>');
const created = [];
for (const icon of icons) {
  const src = await figma.getNodeByIdAsync(icon.outline ?? icon.solid);
  const variants = ORDER.map(w => {
    const c = src.clone(); c.name = `variant=outline, weight=${w}`;
    for (const v of stroked(c)) v.strokeWeight = WEIGHTS[w];        // no-op on a fill-only glyph
    return c;
  });
  if (icon.solid) {
    const s = (await figma.getNodeByIdAsync(icon.solid)).clone(); s.name = 'variant=solid, weight=regular'; variants.push(s);
  } else if (icon.derive) {
    const s = src.clone(); s.name = 'variant=solid, weight=regular';
    for (const v of stroked(s).filter(isClosed)) { v.fills = v.strokes; v.strokes = []; }
    variants.push(s);
  }
  variants.forEach((v, i) => { figma.currentPage.appendChild(v); v.x = STAGE.x + i * 64; v.y = STAGE.y; });
  const set = figma.combineAsVariants(variants, target);
  set.name = `Icon=${icon.name}`;
  layoutRow(set, variants);
  placeBelow(set, target);
  set.description = icon.description;
  created.push({ name: icon.name, id: set.id, states: variants.length, defaultVariant: set.defaultVariant.name });
}
return created;
```

Extend an existing variant set in place, then move it into the library frame:

```js
const set = await figma.getNodeByIdAsync('<set id>');
const target = await figma.getNodeByIdAsync('<library frame id>');
for (const c of set.children) if (!/weight=/.test(c.name)) c.name = `${c.name}, weight=regular`;
const byName = n => set.children.find(c => c.name === n);
const outline = byName('variant=outline, weight=regular');
for (const w of ORDER.filter(w => w !== 'regular')) {
  if (byName(`variant=outline, weight=${w}`)) continue;
  const c = outline.clone();                          // lands on the page, not in the set
  set.appendChild(c);
  c.name = `variant=outline, weight=${w}`;
  for (const v of stroked(c)) v.strokeWeight = WEIGHTS[w];
}
const row = [...ORDER.map(w => byName(`variant=outline, weight=${w}`)), byName('variant=solid, weight=regular')].filter(Boolean);
layoutRow(set, row);
target.appendChild(set);
placeBelow(set, target);
set.description = '<description from template>';
return { id: set.id, row: row.map(c => c.name), defaultVariant: set.defaultVariant.name };
```

Verify every set under a frame (read-only):

```js
const root = await figma.getNodeByIdAsync('<library frame id>');
return root.findAll(n => n.type === 'COMPONENT_SET').map(s => {
  const problems = [];
  try {
    const p = s.componentPropertyDefinitions;
    if (p.variant?.defaultValue !== 'outline') problems.push(`variant default: ${p.variant?.defaultValue}`);
    if (p.weight?.defaultValue !== ORDER[0]) problems.push(`weight default: ${p.weight?.defaultValue}`);
  } catch (e) { problems.push(`props: ${e}`); }
  for (const c of s.children) {
    const m = /^variant=(\w+), weight=(\w+)$/.exec(c.name);
    if (!m) { problems.push(`name: ${c.name}`); continue; }
    if (m[1] === 'outline')
      for (const v of stroked(c)) if (v.strokeWeight !== WEIGHTS[m[2]]) problems.push(`${c.name}: strokeWeight ${v.strokeWeight}`);
  }
  if (!s.description.includes('Figma default variant')) problems.push('description: missing default-variant note');
  return { id: s.id, name: s.name, states: s.children.length, problems };
});
```
