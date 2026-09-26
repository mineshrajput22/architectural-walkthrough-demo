# Interactive 3D architectural walkthrough

*Demo by Minesh Rajput.* A separate product name, logo, and final visual identity have not been chosen.

An interactive browser demo for exploring an apartment in 3D: glide between curated spaces, walk freely through the model, and build your own guided tours. Built with [Three.js](https://threejs.org) and Vite, aimed at showing how a civil engineer or architect could present a project online.

A second, separate apartment floor plan demo appears below the walkthrough. The two models do not represent the same apartment.

AI contributors: read [AGENTS.md](AGENTS.md) and the maintained [project decisions and handoff](PROJECT_CONTEXT.md) before making changes.

## What it does

- **Explore Spaces** — five curated viewpoints (Main room, Kitchen & counter, Window-side room, Central passage, Entrance). Selecting one **glides the camera smoothly from point A to point B** (eased ~1–2 s flight with a gentle arc) instead of jumping. Reduced-motion systems get a shorter level glide.
- **Free exploration** — drag to look, `W A S D` to move, `E` up / `Q` down. Movement passes freely through doors, walls, ceilings, and floors, so nothing blocks inspection.
- **Fullscreen spaces panel** — entering fullscreen (`⛶`) reveals a SPACES panel inside the viewer with every viewpoint plus previous/next controls, so visitors can navigate without leaving fullscreen. The fullscreen button switches to an exit icon while fullscreen is active. On browsers without element fullscreen (e.g. iPhone Safari) the viewer expands to fill the screen instead. On touch devices the panel auto-hides while navigating; the **Spaces** toggle turns into a close (✕) button while the panel is open so it can be dismissed manually.
- **Guided tour** — plays automatically on load and loops through every viewpoint (four seconds each, dwell starts after arrival). Touching anything pauses it; after five idle seconds it resumes gliding on its own.
- **Live apartment plan** — a top-down map built from actual wall/window/door geometry with room labels and numbered markers matching Explore Spaces. The orange marker shows camera position and viewing direction; click a marker to jump to that space, or click the plan to move there at 1.65 m eye level.
- **Curate this walkthrough** — name and save the current camera view (persisted in browser local storage, up to 30 views), export/import the tour as JSON, and remove views.
- **Separate floor plan viewer** — a furnished 3D floor plan opens at an angled view below the walkthrough. Drag to rotate with a gentle release and a tilt range that keeps the camera above the model; scroll to zoom toward the pointer, and use **Reset to top view** for an overhead view. Reduced-motion settings skip the drag easing. Its viewer code and model load only when the section approaches the screen.

## Run locally

```powershell
npm install
npm run dev
```

Open the localhost URL printed by Vite. `npm run build` produces a static build in `dist`; `npm run preview` checks that build locally. Nothing is deployed by these commands.

## Deploy (Cloudflare Pages, free)

This is a static frontend-only build, deployed as a noncommercial demo on Cloudflare Pages (unlimited bandwidth on the free tier, free SSL, global CDN).

1. Commit and push `main` to GitHub.
2. In the [Cloudflare dashboard](https://dash.cloudflare.com) go to **Workers & Pages → Create → Pages → Connect to Git** and select `architectural-walkthrough-demo`.
3. Build settings: command `npm run build`, output directory `dist`, Node 20+.
4. Deploy. Every push to `main` redeploys automatically; preview URLs are created for pull requests.

`public/_headers` is copied to `dist/_headers` by Vite. [Vite](https://vite.dev/guide/assets) gives scripts, styles, and both GLBs content-hashed names under `/assets/`; [Pages headers](https://developers.cloudflare.com/pages/configuration/headers/) can cache those URLs for a year with `immutable`. The `/` HTML remains revalidated so new deployments reference the new asset names. These are browser cache headers; [Cloudflare Pages' edge cache](https://developers.cloudflare.com/pages/configuration/serving-pages/) is managed separately.

## Controls

| Input | Action |
|---|---|
| Drag / mouse (pointer-lock) | Look around |
| `W A S D` / arrows | Move horizontally |
| `E` / `Q` | Rise / descend (desktop; touch stays at eye level) |
| Touch joystick (touch devices, fullscreen only) | Glide horizontally at 1.65 m eye level (dims to 30% when idle) |
| `Esc` | Release mouse capture |
| Space buttons, map markers, `←` `→` | Glide to a viewpoint |
| Fullscreen SPACES panel | Navigate while fullscreen |
| Floor plan: drag / scroll | Rotate / zoom toward the pointer on the separate floor plan (two fingers zoom or pan on touch) |
| Floor plan: Reset to top view | Return to the overhead framing |

## How it is built

- `index.html` — viewer UI, demo attribution, spaces list, fullscreen panel, plan map, author controls.
- `src/main.js` — rendering, eased camera flights (position + look-target interpolation, interruptible by any movement input), navigation, map projection, tour playback and import/export.
- `src/style.css` — presentation, including the fullscreen-only spaces panel.
- All button and control icons are inline SVG (currentColor strokes), so they render consistently across devices instead of relying on unicode glyphs.
- `src/tour.json` — the five default viewpoints (positions + look targets). Changes to the model's origin, scale, or geometry require rechecking those coordinates.
- `scripts/prepare_model.py` (`npm run prepare:model`) — generates the browser-ready `src/models/apartment-demo.glb` from the supplied source file; the original is never modified. Rebuild after changing a model so Vite emits a new hashed URL.
- `scripts/verify-model.mjs` (`node scripts/verify-model.mjs`) — checks the walkthrough model and viewpoints, plus the floor plan browser copy and embedded attribution. Browser appearance and controls still require visual QA.
- `src/floor-plan.js` — independent orbit viewer for the separate floor plan, imported near its section; its browser asset is `src/models/apartment-floor-plan-demo.glb`, a byte-identical copy of the supplied `apartment_floor_plan.glb`.
- `inspection/` — reference renders used while developing the plan map.

## Rendering and asset notes

- The source model is 5.22 MB with 4,664 triangles, 15 meshes/materials, and 11 embedded 1024 × 1024 PNG textures.
- The separate floor plan source is 9.18 MB with three embedded 1024 × 1024 textures. Its browser copy retains the original geometry, materials, and attribution.
- The drawing buffer is 1024 pixels wide (height follows the panel aspect ratio); UI renders at native screen resolution. Texture resolution and viewer resolution are independent.
- The floor plan viewer also caps its drawing buffer at 1024 pixels wide, with proportional height; its controls and text remain at native screen resolution.
- The sample uses legacy specular/glossiness materials, adapted by the preparation script to supported unlit materials (baked look, alpha and attribution retained). This is a sample-specific adaptation, not a general PBR pipeline. ACES tone mapping at exposure 2 lifts the dark baked textures.
- Baked lighting cannot respond dynamically to moved lights or objects. This sparsely furnished sample does not validate the performance or material quality of a densely furnished client project.
- Load and frame-cost notes: the walkthrough GLB is preloaded (`as="fetch"`) so it downloads in parallel with the JS bundle; the floor viewer JavaScript and GLB load near their section; the walkthrough skips WebGL draws when its viewer is outside the viewport or the tab is hidden. The renderer runs without an unused stencil buffer, keyboard movement early-outs with no keys held, and plan-map DOM writes are skipped while the camera is effectively static. None of this changes textures or drawing-buffer resolution.

## Status and limits

- Noncommercial demo, deployed as a static frontend-only build on Cloudflare Pages (free tier). A content-management workflow is undecided.
- Final brand identity and real client portfolio content are still open.
- Map and navigation behavior should be re-verified in a desktop browser after model or viewpoint changes (`npm run build`, then visual QA).

## Attribution

**Apartment | Baked** by **Pedro Belthori**.

- Original: https://sketchfab.com/3d-models/apartment-baked-690258b0f81e4331ba1aeff5e8f56bbe
- Author: https://sketchfab.com/pedrobelthori
- Embedded license: CC BY-NC 4.0 — https://creativecommons.org/licenses/by-nc/4.0/
- Demo modification: legacy materials adapted to baked/unlit rendering; original geometry and texture resolution retained.

This local demo is for noncommercial evaluation. Keep the attribution with the sample.

**Apartment floor plan** by **SrMonteiro** is a separate model, licensed **CC BY 4.0**. The original GLB and its browser copy are unchanged.

- Original: https://sketchfab.com/3d-models/apartment-floor-plan-2e85bf66e2dd4d48b683d6843e040a2b
- Author: https://sketchfab.com/crispimrafael
- Embedded license: CC BY 4.0 — https://creativecommons.org/licenses/by/4.0/
