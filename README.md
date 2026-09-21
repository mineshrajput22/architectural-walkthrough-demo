# Interactive 3D architectural walkthrough

*Demo by Minesh Rajput.* A separate product name, logo, and final visual identity have not been chosen.

An interactive browser demo for exploring an apartment in 3D: glide between curated spaces, walk freely through the model, and build your own guided tours. Built with [Three.js](https://threejs.org) and Vite, aimed at showing how a civil engineer or architect could present a project online.

AI contributors: read [AGENTS.md](AGENTS.md) and the maintained [project decisions and handoff](PROJECT_CONTEXT.md) before making changes.

## What it does

- **Explore Spaces** — five curated viewpoints (Main room, Kitchen & counter, Window-side room, Central passage, Entrance). Selecting one **glides the camera smoothly from point A to point B** (eased ~1–2 s flight with a gentle arc) instead of jumping. Reduced-motion systems get a shorter level glide.
- **Free exploration** — drag to look, `W A S D` to move, `E` up / `Q` down. Movement passes freely through doors, walls, ceilings, and floors, so nothing blocks inspection.
- **Fullscreen spaces panel** — entering fullscreen (`⛶`) reveals a SPACES panel inside the viewer with every viewpoint plus previous/next controls, so visitors can navigate without leaving fullscreen.
- **Guided tour** — Play visits each viewpoint for six seconds each (dwell starts after arrival).
- **Live apartment plan** — a top-down map built from actual wall/window/door geometry with room labels and numbered markers matching Explore Spaces. The orange marker shows camera position and viewing direction; click a marker to jump to that space, or click the plan to move there at 1.65 m eye level.
- **Curate this walkthrough** — name and save the current camera view (persisted in browser local storage, up to 30 views), export/import the tour as JSON, and remove views.

## Run locally

```powershell
npm install
npm run dev
```

Open the localhost URL printed by Vite. `npm run build` produces a static build in `dist`; `npm run preview` checks that build locally. Nothing is deployed by these commands.

## Controls

| Input | Action |
|---|---|
| Drag / mouse (pointer-lock) | Look around |
| `W A S D` / arrows | Move horizontally |
| `E` / `Q` | Rise / descend |
| `Esc` | Release mouse capture |
| Space buttons, map markers, `←` `→` | Glide to a viewpoint |
| Fullscreen SPACES panel | Navigate while fullscreen |

## How it is built

- `index.html` — viewer UI, demo attribution, spaces list, fullscreen panel, plan map, author controls.
- `src/main.js` — rendering, eased camera flights (position + look-target interpolation, interruptible by any movement input), navigation, map projection, tour playback and import/export.
- `src/style.css` — presentation, including the fullscreen-only spaces panel.
- `src/tour.json` — the five default viewpoints (positions + look targets). Changes to the model's origin, scale, or geometry require rechecking those coordinates.
- `scripts/prepare_model.py` (`npm run prepare:model`) — generates the browser-ready `public/models/apartment-demo.glb` from the supplied source file; the original is never modified.
- `scripts/verify-model.mjs` (`node scripts/verify-model.mjs`) — checks prepared-model geometry, textures, and the five starting positions. Browser appearance and controls still require visual QA.
- `inspection/` — reference renders used while developing the plan map.

## Rendering and asset notes

- The source model is 5.22 MB with 4,664 triangles, 15 meshes/materials, and 11 embedded 1024 × 1024 PNG textures.
- The drawing buffer is 1024 pixels wide (height follows the panel aspect ratio); UI renders at native screen resolution. Texture resolution and viewer resolution are independent.
- The sample uses legacy specular/glossiness materials, adapted by the preparation script to supported unlit materials (baked look, alpha and attribution retained). This is a sample-specific adaptation, not a general PBR pipeline. ACES tone mapping at exposure 2 lifts the dark baked textures.
- Baked lighting cannot respond dynamically to moved lights or objects. This sparsely furnished sample does not validate the performance or material quality of a densely furnished client project.

## Status and limits

- Local, noncommercial demo — not a published product. Hosting, deployment, and a content-management workflow are undecided.
- Final brand identity and real client portfolio content are still open.
- Map and navigation behavior should be re-verified in a desktop browser after model or viewpoint changes (`npm run build`, then visual QA).

## Attribution

**Apartment | Baked** by **Pedro Belthori**.

- Original: https://sketchfab.com/3d-models/apartment-baked-690258b0f81e4331ba1aeff5e8f56bbe
- Author: https://sketchfab.com/pedrobelthori
- Embedded license: CC BY-NC 4.0 — https://creativecommons.org/licenses/by-nc/4.0/
- Demo modification: legacy materials adapted to baked/unlit rendering; original geometry and texture resolution retained.

This local demo is for noncommercial evaluation. Keep the attribution with the sample.
