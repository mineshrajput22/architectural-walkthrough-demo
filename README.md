# Minesh Rajput — local architectural walkthrough demo

**Demo by Minesh Rajput.** This attribution replaces the Atelier placeholder. A separate product name, logo, and final visual identity have not been chosen.

AI contributors: read [AGENTS.md](AGENTS.md) and the maintained [project decisions and handoff](PROJECT_CONTEXT.md) before making changes. Update the handoff after each change so another model can continue with current instructions.

A laptop-oriented Three.js / WebGL 2 demo using the supplied apartment GLB.

## Run locally

```powershell
npm install
npm run dev
```

Open the localhost URL printed by Vite. `npm run build` produces a static build in `dist`; `npm run preview` checks that build locally. Nothing is deployed by these commands.

## Explore and curate

- Drag the scene to look; focus it and use WASD or arrow keys to move horizontally. Hold E to rise and Q to descend. Movement passes freely through doors, walls, ceilings, and floors.
- **Explore freely** enables pointer-lock mouse look where the browser allows it. Esc releases it. Drag-to-look remains available when an embedded browser blocks pointer lock.
- Select a named viewpoint or use previous/next. **Play tour** visits each viewpoint for six seconds. Moving between spaces glides the camera smoothly from point A to point B with a gentle arc, instead of jumping.
- Fullscreen (⛶) shows a **SPACES** panel inside the viewer with every viewpoint plus previous/next controls, so visitors can navigate without leaving fullscreen.
- The floor plan uses actual wall sections, room labels, and numbered markers matching Explore Spaces. Its orange marker shows camera position and viewing direction; height is displayed below. Click a numbered marker to select that space, or click the plan background to move there at 1.65 m eye level. Selecting any built-in space also restores eye level. Five spaces are available: Main room, Kitchen & counter, Window-side room, Central passage, and Entrance.
- Expand **Curate this walkthrough**, enter a title, and save the current camera view. Viewpoints persist in this browser's local storage. Export/import a JSON backup; remove the selected viewpoint with **Remove view**.
- Default viewpoints are in `src/tour.json`. Changes to the model's origin, scale, or geometry require rechecking those coordinates.

## Rendering and asset preparation

- The source is 5.22 MB, with 4,664 triangles, 15 meshes/materials, and 11 embedded 1024 × 1024 PNG textures.
- The drawing buffer is 1024 pixels wide, with height determined by the panel aspect ratio. UI renders at native screen resolution. Texture resolution and viewer resolution are independent.
- `npm run prepare:model` creates `public/models/apartment-demo.glb`. The original `apartment__baked.glb` is unchanged.
- This sample requires the legacy specular/glossiness material extension. The preparation script maps its baked diffuse textures to supported unlit materials, retaining alpha and attribution. This is a sample-specific appearance adaptation, not a general-purpose PBR conversion. ACES tone mapping at exposure 2 lifts the dark baked textures in the demo.
- Baked lighting cannot respond dynamically to moved lights or objects. This model has sparse furnishings; it does not validate the performance or material quality of a densely furnished client project.
- Geometry checks run with `node scripts/verify-model.mjs`. They check actual prepared-model geometry and the five built-in starting positions. Browser appearance and controls still require visual QA.

## Attribution

**Apartment | Baked** by **Pedro Belthori**.

- Original: https://sketchfab.com/3d-models/apartment-baked-690258b0f81e4331ba1aeff5e8f56bbe
- Author: https://sketchfab.com/pedrobelthori
- Embedded license: CC BY-NC 4.0 — https://creativecommons.org/licenses/by-nc/4.0/
- Demo modification: legacy materials adapted to baked/unlit rendering; original geometry and texture resolution retained.

This local demo is for noncommercial evaluation. Keep the attribution with the sample.
