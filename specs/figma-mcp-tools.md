# Figma MCP tool surface

**Used by:** every skill that touches a Figma document.
**Source of truth:** the relay repo's docs — `C:/Users/sadhu/code/figma-design-relay/docs/run-script.md`, `design-context.md`, `serialized-nodes.md` — and the tool descriptions the connected server advertises. When this file and a tool description disagree, the tool description wins; fix this file.

## Which server is connected

Two servers may be configured; the user picks one per session. Both expose the same tool names — only the `mcp__<server>__` prefix differs. Reference tools by bare name and call whichever prefix is present.

- `figma-design-relay` — the user's fork. Everything below, including `run_script`.
- `figma-bridge` — the upstream `@gethopp/figma-mcp-bridge`. Everything below **except** `run_script`, and its serializer omits the design-system identity fields (component/instance identity, resolved variable and style names, layout intent).

If neither is connected, say so and stop. Do not suggest editing the MCP configuration.

## Tools

Read:

- `list_files` — connected Figma files and their `fileKey`s.
- `get_metadata` — file name, pages, current page.
- `get_document` — current page's node tree. Large on big pages; prefer `get_selection` or `get_node`.
- `get_selection` — nodes selected in the editor.
- `get_node` — one node by ID.
- `get_styles` — local paint, text, effect, and grid styles.
- `get_variable_defs` — variable collections, modes, and values (design tokens).
- `get_design_context` — reference code, tokens, exported assets, and a screenshot for a node in one call. Assets are written under `assetDir`, which must be inside the server's working directory.
- `get_screenshot` — PNG/SVG/JPG/PDF as base64. `save_screenshots` writes them to disk instead.

Write (design editor only):

- Text: `set_text_content`, `set_text_properties`.
- Node: `set_node_properties` (name, position, size, visibility, opacity, corner radius), `set_node_visibility`.
- Paint: `set_solid_fill`, `set_gradient_fill`, `set_stroke_properties`, `set_effects`.
- Layout: `set_auto_layout`.
- Create: `create_page`, `create_frame`, `create_text`, `create_shape` (rectangle, ellipse, line), `create_image` (local path, URL, or data URI), `import_html_layers` (html-figma JSON).
- Structure: `duplicate_nodes`, `reparent_nodes`, `group_nodes`, `ungroup_node`, `delete_nodes`.
- Viewport: `set_selection`, `scroll_and_zoom_into_view` (both also work in Dev Mode).
- Motion (beta): `get_motion_styles`, `get_node_motion`, `apply_animation_style`, `remove_animation_style`, `apply_manual_keyframe_track`, `remove_manual_keyframe_track`, `set_timeline_duration`.

Escape hatch (relay only):

- `run_script` — arbitrary JavaScript against the Figma Plugin API. Use it for anything the dedicated tools do not cover: components, variables, styles authoring, boolean operations, prototyping. Not atomic.

## Rules that apply to every call

- Node IDs use colon format: `4029:12345`. A URL's `node-id=4029-12345` must be converted.
- Every tool takes an optional `fileKey`. Required when more than one file is connected; call `list_files` first.
- Dev Mode is read-only. Write tools return a clear error there; do not retry them.
- The current user must have edit permission on the file for any write tool.
- `delete_nodes` requires `confirm: true`. Confirm with the user before deleting anything you did not create in this session.
- `run_script` is **not atomic** — a script that throws part-way leaves its earlier mutations in the file. Prefer dedicated tools when they exist; keep scripts small; read back the result.
- File paths (`create_image`, `import_html_layers`, `save_screenshots`, `get_design_context`'s `assetDir`) resolve relative to the MCP server's working directory and must stay inside it.
- Text edits load the node's current fonts first. New text defaults to Inter Regular unless a font is given.
- `create_page` returns the page ID; pass it as `parentId` to create tools to author on that page without switching the editor.
- Requests time out after 180 seconds.
- Serialized nodes omit fields that carry nothing — absence of `component`, `boundVariables`, or `styles` means the node has none, not that the lookup failed.
