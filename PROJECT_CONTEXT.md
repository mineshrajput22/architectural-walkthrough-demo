# Architectural walkthrough: decisions and handoff

Last updated: 2026-09-26

This is the maintained export of project decisions and working context, not a verbatim chat transcript. Read `AGENTS.md` for the update requirement and `README.md` for operation and asset details.

## User-confirmed direction

- Build a custom browser portfolio for civil engineers and architects, with interactive 3D model exploration. Shapespark was cited as a feature reference.
- The architect creates the model. The user prepares/publishes each project and adds keyframes to highlight important features.
- Use Three.js/WebGL as the project foundation; the supplied model is GLB.
- Prioritize realistic materials and visual quality while keeping models easy to load.
- Target laptops first. The user clarified that quality should be 1K, not below 1K.
- The current sample is for a local demo, not official or commercial publication.
- Provide multiple Explore Spaces destinations and allow movement through doors and walls. E moves up and Q moves down from eye level.
- Improve the map so visitors can relate it to the model. This request is active; completion must be checked against the current implementation.
- Export and maintain these instructions after changes so other AI models can continue the work.
- Add the supplied apartment floor plan as a separate demo section below the existing walkthrough. It represents a different apartment. Give it an independent 3D viewer with drag rotation, scroll zoom, an angled opening view, and a button that resets to top-down.
- After trying the PC floor plan controls, the user found drag rotation janky and approved a provisional trial that keeps drag rotation but adds gentle easing and prevents viewing the model from underneath. This is a trial, not a final control decision.

## Demo attribution: subtle, product-first

The user directed: keep the name subtle, focus the brand on the product, and everywhere the name appears use "by Minesh Rajput". The UI therefore leads with descriptive "3D walkthrough" branding (header brand, footer lead, page title) and carries "by Minesh Rajput" as a caption/byline in the header, sidebar, footer, page title, and README. A separate product name, logo, tagline, palette, and typography have not been chosen — do not invent one.

Previously, the assistant introduced **ATELIER**, **a.**, and **SPACES, EXPERIENCED.** without agreement. These placeholders have been replaced. The model remains credited to Pedro Belthori; Minesh Rajput is credited for the demo.

## Current implementation snapshot

These are implementation facts or choices, not additional user-approved product requirements. The original implementation task is still active; reread source files before continuing.

- Vite with JavaScript and Three.js; scripts and pinned dependency versions are in `package.json`.
- `index.html`: viewer UI, product-first branding with subtle "by Minesh Rajput" bylines, spaces, and author controls.
- `src/main.js` and `src/style.css`: rendering, navigation, map, and presentation.
- `src/tour.json`: five default viewpoints: Main room, Kitchen & counter, Window-side room, Central passage, Entrance.
- Guided tour, free exploration, browser-local saved viewpoints, and JSON tour import/export are present according to the current README.
- The tour auto-plays on load and loops with a 4 s dwell per space (dwell starts after arrival); any interaction pauses it and five idle seconds resume it (Play button removed). Touch devices get a virtual joystick for horizontal movement, shown only in fullscreen (real or fallback) and locked to 1.65 m eye level; drag looks around simultaneously. Desktop keeps free-height `E`/`Q` movement.
- Viewpoint changes glide the camera from point A to point B (eased position + look-target interpolation, ~1.1–2.2 s by distance, slight vertical arc; reduced-motion systems get a shorter 0.6 s level glide). WASD/drag/plan input cancels the flight. Fullscreen shows an in-viewer SPACES panel with all viewpoints and previous/next controls.
- Current 1K interpretation: textures are 1024 × 1024; drawing buffer is 1024 pixels wide with proportional height; text and controls use native screen resolution. The distinction was explained by the assistant; keep it explicit if discussing quality.
- `apartment__baked.glb` is the original supplied asset. `scripts/prepare_model.py` generates `public/models/apartment-demo.glb` separately.
- The sample has 11 embedded 1K textures, 4,664 triangles, and 15 meshes/materials, as recorded by prior inspection and the README.
- Legacy specular/glossiness materials are adapted to baked/unlit materials for this sample. This is not a general conversion pipeline or proof of realistic rendering for all client models.
- A second section below the walkthrough shows `apartment_floor_plan.glb` through `src/floor-plan.js`. The original is retained; `public/models/apartment-floor-plan-demo.glb` is a byte-identical browser copy. The section loads near the viewport, starts angled, supports orbit/zoom/pan, and resets to a top-down view. PC orbit rotation is currently eased and limited to a 60° tilt from vertical, with easing disabled for reduced-motion preferences. Its 1024 px maximum drawing-buffer width is separate from the three embedded 1024 × 1024 textures; UI remains at screen resolution.

## Asset context

The sample is Apartment | Baked by Pedro Belthori; its embedded license is CC BY-NC 4.0. Retain attribution and the source/license links in `README.md`. The user authorized noncommercial demo use after this was disclosed. An eventual client publication requires a suitable asset and a separate publication decision.

The second, separate apartment floor plan model is by SrMonteiro. Its embedded metadata names CC BY 4.0 and includes the original Sketchfab source and author links. Credit it separately from Pedro Belthori and retain those links in `README.md`.

## Recommendations and open decisions

- Blender as a standard preparation stage, and SketchUp/Revit handoff conversion, were recommended; they are not implemented or mandatory approved tooling.
- Final brand identity and actual client portfolio content remain open.
- Hosting decision: Cloudflare Pages (free tier, noncommercial demo). Git-connected to `main`; build `npm run build`, output `dist`. `public/_headers` sets long-cache for `/assets/*` and `/models/*`. Automated uploads and a production content-management workflow remain open.
- Performance and material quality for a densely furnished client model are unvalidated.
- Map improvement is being handled in the implementation task. Inspect the latest source and browser result; do not overwrite that concurrent work or assume it is complete.

## Superseded direction

- Earlier collision/wall-blocking suggestions were replaced by the user's explicit request to move through doors and walls.
- Earlier below-1K wording was corrected by the user to 1K.
- Earlier mobile-first recommendations were followed by the user's laptop-first direction.

## Validation and next handoff

Run instructions and verification commands are in `README.md` and `AGENTS.md`. A previous implementation update reported a successful production build, but subsequent navigation and map edits may have occurred. This documentation export does not certify the current application build or visual QA.

Next contributor: inspect current source, finish/verify the active map improvement if assigned, and update this snapshot and log with the actual outcome. Preserve Minesh Rajput demo attribution; keep other visual identity choices provisional.

## Change log

### 2026-09-21 — Initial portable handoff

- Exported confirmed requirements, branding clarification, implementation snapshot, superseded suggestions, and open work from project conversations and current files.
- Added `AGENTS.md` with a requirement to update this context after each change and to keep the README aligned with behavior.
- Validation: compared the export with the project conversation, README, package scripts, and default tour configuration. Documentation only; no application tests run for this export.
- Outstanding: final branding and verification of the concurrently active map work.

### 2026-09-21 — Smooth flights and fullscreen spaces list

- Replaced the fade-and-jump viewpoint change with an eased camera glide (position + look-target lerp, distance-scaled duration, gentle arc). Flights are interruptible by movement, drag, plan clicks, or selecting another space. (Reduced-motion instant jump was superseded the same day by a 0.6 s level glide; see entry below.)
- Added an in-viewer SPACES panel visible only in fullscreen (`index.html`, `src/main.js`, `src/style.css`), listing all viewpoints with previous/next controls and syncing with the sidebar list.
- Updated README behavior notes. Validation: `npm run build` succeeded, `node scripts/verify-model.mjs` passed; browser visual QA of flight feel and fullscreen panel layout still needs a manual check.
- Outstanding: manual fullscreen + tour timing check in a desktop browser.

### 2026-09-21 — Reduced-motion glide fix

- The smooth flight measured correctly in a headless-Chromium check (page-side 1461 ms for a ~6.7 m hop, gradual intermediate positions), so the reported instant jump pointed at the reduced-motion path, which jumped instantly. It now plays a short 0.6 s level glide instead of a cut; the initial load still jumps directly to the first space.
- Validation: `npm run build` succeeded; Playwright timing re-run gives ~1415 ms normal and ~585 ms reduced-motion glides. Manual desktop-browser check still open.
- Outstanding: user to hard-refresh and confirm flight feel on their laptop.

### 2026-09-21 — README rewritten as project showcase

- Rewrote `README.md` so GitHub visitors understand the work: what the demo does, controls table, how it is built (file-by-file), rendering/asset notes, status and limits, and attribution. Verified the new threejs.org link resolves.
- Validation: documentation-only edit — content and link check, no rebuild. All work through the ambient auto-tour change is pushed to `main` on GitHub.

### 2026-09-21 — Subtle product-first attribution

- User correction: the name must stay subtle with the brand focused on the product, reading "by Minesh Rajput" everywhere it appears. Header brand, page title, and footer now lead with "3D walkthrough" language; the name moved to captions/bylines (header caption, new sidebar byline, footer, title, README).
- Updated `AGENTS.md` contributor instructions to match. Validation: `npm run build` succeeded; headless-Chromium check confirmed the new title/brand/byline/footer text, zero header overflow at 1440 px, and the fullscreen panel stays hidden outside fullscreen.

### 2026-09-21 — Touch fullscreen auto-hide panel

- On touch devices in fullscreen, the SPACES navigation panel now auto-hides when the user starts navigating by touch, and collapses again after picking a space, freeing viewing real estate. A small **Spaces** toggle (touch fullscreen only) reopens it. Desktop fullscreen behavior is unchanged.
- Updated README behavior notes. Validation: `npm run build` succeeded; mobile-emulation check (touch, coarse pointer, real fullscreen) confirmed panel shown → hidden on touch nav → reopened via toggle → hidden again after space selection, with navigation working.

### 2026-09-21 — Fullscreen fallback for phones without element fullscreen

- The fullscreen button did nothing on browsers without element-fullscreen support (e.g. iPhone Safari: no Fullscreen API on generic elements), which also locked out the spaces panel. Tapping fullscreen there now expands the viewer to fill the screen via CSS (`pseudo-fullscreen`: fixed, `100dvh`, body scroll locked) with the same spaces panel, toggle, and auto-hide behavior; tapping the button again exits and restores scrolling.
- Fixed a real overlap the fallback test caught: the touch **Spaces** toggle covered the viewer action buttons, so it moved below them.
- Validation: `npm run build` succeeded; emulated no-fullscreen-API phone check confirmed fallback engage → panel → touch hide → toggle reopen → space pick → clean exit with scroll restored.

### 2026-09-21 — Inline SVG control icons

- Replaced unicode button glyphs (▶ ↗ ⛶ Ⅱ ← → ↺ ▷ ↔), which render inconsistently across devices, with inline SVG icons (`index.html` static buttons, `ICONS` map in `src/main.js` for JS-swapped labels, shared `.icon` styles in `src/style.css`).
- Validation: `npm run build` succeeded; DOM check found 16 SVG icons and zero leftover glyphs in buttons; native mobile-fullscreen regression re-run passed.

### 2026-09-21 — Touch joystick movement

- Mobile had look-around but no way to move (no WASD on phones). Added a touch-only virtual joystick (forward/strafe, camera-relative, with dead zone and clamped radius) plus up/down buttons inside the viewer; drag-to-look keeps working on a second finger, so users can move and look at once. Grabs cancel flights and pause the tour like keyboard input.
- Validation: `npm run build` succeeded; synthetic-touch check confirmed glide (4.00 → 3.04 m), full stop on release, and height rise via the up button.

### 2026-09-21 — Ambient auto-tour, Play button removed

- The tour now starts automatically on load and loops forever; the Play/Pause button is gone. Any interaction (look, move, space pick, free explore) pauses via `stopTour`, and ten idle seconds resume gliding (`IDLE_RESUME_MS`). Continuous activity (drag, held keys, joystick, pointer-lock look via the controls `change` event) keeps refreshing the idle timer.
- Updated README (tour behavior, touch controls row). Validation: `npm run build` succeeded; auto-tour check confirmed self-advance on load, hold-after-interact past the dwell, and resume to the next space with GUIDED TOUR label.

### 2026-09-21 — Minesh Rajput demo attribution

- Recorded the user-confirmed demo creator and replaced Atelier branding in the header, browser title, loading mark, and demo footer. Preserved model attribution.
- Updated README and contributor instructions. The legacy local-storage key remains unchanged to preserve saved viewpoints.
- Validation: pending production build and browser check.

### 2026-09-21 — Cloudflare Pages hosting setup

- User confirmed the demo is noncommercial and chose Cloudflare Pages (free tier) for this frontend-only Vite build.
- Added `public/_headers` (copied to `dist/_headers`): immutable year-long cache for `/assets/*` and `/models/*`, no-cache for `/`. No redirect or base-path change needed; absolute `/models/apartment-demo.glb` and default `/` base work on `*.pages.dev` and custom domains.
- Documented the Git-connected deploy flow (build `npm run build`, output `dist`) in `README.md`.
- Validation: `npm run build` succeeded (282 ms, dist ~5.9 MB). Not yet connected in the Cloudflare dashboard or visited on a `*.pages.dev` URL — that is the concrete next step.
- Outstanding: connect the repo in Cloudflare Pages, confirm the first deploy serves the GLB and navigation, then record the live URL.

### 2026-09-21 — Faster tour pacing (4 s dwell, 5 s resume)

- User request: autoplay already started on load, so only pacing changed — dwell `tourClock > 6` → `> 4` s (`src/main.js`), idle resume `IDLE_RESUME_MS` 10000 → 5000 ms, status notice and code comment reworded from "ten" to "five" idle seconds.
- Updated README guided-tour bullet (four seconds each, five-second resume) and the snapshot line in this file.
- Validation: `npm run build` succeeded; `node --check src/main.js` clean. Browser timing QA (dwell feel, resume feel) still needs a manual desktop check.
- Outstanding: user to confirm pacing feels right on their laptop.

### 2026-09-21 — Performance pass, quality unchanged

- Audit: GPU load already minimal (4,664 tris, 15 meshes, no lights/shadows, baked unlit materials, 1024 px buffer at pixelRatio 1). Real waste was per-frame CPU: `updateMap()` wrote DOM (`setAttribute` + 2× `textContent`) and allocated vectors every frame even with a static camera; `moveWithKeys()` allocated 3 Vector3s per frame with no keys held; default stencil buffer unused; the 5.2 MB GLB request waited for the 626 KB JS bundle to parse.
- Changes (`src/main.js`, `index.html`): `stencil: false` on the renderer; `moveWithKeys` early-out when `keys.size` is 0; `updateMap` skips DOM writes unless position/angle moved beyond sub-visible thresholds (1 mm, 0.05°) with a reused temp vector; `<link rel="preload" href="/models/apartment-demo.glb" as="fetch">` so the model downloads in parallel with the bundle. Textures, buffer resolution, tone mapping, antialiasing, flight motion, and dwell/resume timings untouched.
- Deliberately not done: texture recompression (KTX2/WebP would change the 1K-quality pipeline and add a transcoder), JS code-splitting (single-page, no benefit), render-on-demand (auto-tour animates continuously anyway).
- Validation: `npm run build` succeeded; `node scripts/verify-model.mjs` PASS; `node --check src/main.js` clean. No Playwright/headless browser in this environment, so visual + interaction QA is manual-only.
- Outstanding: desktop-browser check that the map marker, eye-level readout, and camera readout still track during flights and taps, and that first paint feels faster on a cold cache.

### 2026-09-21 — Mobile locked to eye level, stick is fullscreen-only

- User request: touch controls appear only in fullscreen, no up/down height control on mobile, and mobile movement stays at the default 1.65 m eye level. Desktop `E`/`Q` free-height movement is unchanged.
- Changes: removed the touch up/down buttons (`index.html`, `src/style.css` rules, `touchVert` state and listeners in `src/main.js`); `#touch-controls` now displays only under `.viewer:fullscreen` / `.viewer.pseudo-fullscreen` on coarse pointers; `move()` zeroes `delta.y` on coarse pointers so every free-movement path (stick, keys, plan) stays at eye level; flights keep their authored glide and plan clicks already land at 1.65 m.
- Updated README controls table and the snapshot line in this file.
- Validation: `npm run build` succeeded; `node scripts/verify-model.mjs` PASS; `node --check src/main.js` clean; grep confirms zero `touchVert`/`touch-up`/`touch-down` references. No headless browser in this environment, so mobile QA is manual-only.
- Outstanding: on a phone, confirm the stick is hidden outside fullscreen, appears in fullscreen (and iPhone fallback), moves only horizontally at 1.65 m, and drag-look still works alongside it.

### 2026-09-21 — Joystick dims to 30% when idle

- User request: the mobile stick looked too opaque when untouched. It now renders at 30% opacity and fades back to full while touched (`#stick` opacity + transition in `src/style.css`, `active` class toggled in the stick grab/`endStick` handlers in `src/main.js`). Applies to the whole stick including the nub; touch-only CSS scope unchanged.
- Updated the README controls row.
- Validation: `npm run build` succeeded; `node --check src/main.js` clean. Visual fade timing needs a manual phone check.
- Outstanding: confirm the dim/restore feels right in fullscreen on a phone.

### 2026-09-21 — Stateful fullscreen and spaces buttons

- User request: the fullscreen button should read as exit-fullscreen while active, and the Spaces toggle should become a close button while the panel is open so it can be dismissed manually.
- Changes (`src/main.js`, `src/style.css`): new `ICONS.expand`/`compress`/`close` entries; `renderFsButton()` swaps the `#fullscreen` icon and aria-label/title on `fullscreenchange`, pseudo-fullscreen enter/exit, and startup; `setFsPanel()` now swaps the `#fs-toggle` label between "Spaces" (collapsed) and a ✕ icon (open) alongside its aria attributes; 14 px icon sizing for the toggle. Desktop behavior unchanged (toggle only renders on coarse-pointer fullscreen).
- Updated the README fullscreen-panel bullet.
- Validation: `npm run build` succeeded; `node scripts/verify-model.mjs` PASS; `node --check src/main.js` clean. No headless browser here, so state-swap QA is manual-only.
- Outstanding: in desktop and phone fullscreen, confirm expand ⇄ compress icon swap plus labels, and Spaces ⇄ ✕ swap with manual dismiss/reopen.

### 2026-09-21 — Mini-map "black square" diagnosed as hover tooltip

- User reported a black square on the apartment plan. Verified the live plan DOM (735 painted elements, all styled: near-white floor, thin green section lines, 5 numbered markers, gray labels, orange you-marker) and a headless-Chromium render of the production build: no square; the only dense mark in that corner is the legitimate left-wall window-unit section cluster (~90 tiny frame/plastic/glass segments in a 0.12 × 1.1 m strip).
- User confirmed the square disappears when the mouse leaves the map: it was the native hover tooltip from the marker `<title>` elements ("3. Window-side room", etc.), not plan content. No code change; titles stay for accessibility.
- Validation: DOM audit + headless screenshots (standard and 3× zoom); no rebuild (documentation-only entry).

### 2026-09-26 — Separate apartment floor plan demo

- User-confirmed decisions: the supplied floor plan represents a different apartment and belongs in a separate section below the existing walkthrough. Its own viewer starts angled, rotates by drag, zooms by scroll, and resets to a true top-down view.
- Added the floor plan section, independent lazy-loaded Three.js orbit viewer, and separate SrMonteiro/CC BY 4.0 credit. Copied the source GLB byte-for-byte into `public/models/` so the original remains intact. Extended `scripts/verify-model.mjs` to check that copy and its embedded attribution. Updated README behavior, controls, assets, and attribution.
- Validation: `npm run build` succeeded via the installed npm CLI (the shell's `npm.ps1` wrapper pointed to a missing roaming path); extended `node scripts/verify-model.mjs` passed; `node --check` passed for both JavaScript modules. Browser inspection confirmed the floor plan loads, the full model fits on desktop and a narrow viewport, drag rotates, scroll zooms, and reset returns overhead. No browser console errors were observed. Source and browser-copy SHA-256 hashes matched. The floor plan's three embedded textures were inspected at 1024 × 1024.
- Outstanding: check two-finger touch gestures on a physical touch device; the narrow-viewport browser check did not emulate touch input.

### 2026-09-26 — Floor plan PC control trial

- User feedback: PC drag rotation felt janky. The user approved trying the recommended adjustment while keeping drag rotation; the desired feel remains provisional.
- Changed `src/floor-plan.js` to use damped orbit rotation, a lower rotation speed, and a 60° maximum tilt measured from straight overhead. This prevents the camera moving under the floor plan. OrbitControls now uses the Y-up axis so its tilt limit is relative to the model's vertical axis. Reset still returns overhead. Reduced-motion preferences disable damping. Updated README behavior notes.
- Validation: `npm run build`, `node scripts/verify-model.mjs`, and `node --check src/floor-plan.js` passed. Browser inspection confirmed the angled opening frame, drag rotation, above-model tilt limit, and overhead reset; the reset handler was verified by keyboard activation. The in-app browser's pointer-click automation did not reliably activate that button, so physical mouse-click feel still needs user feedback.
- Outstanding: get the user's feel feedback on a PC and check two-finger gestures on a physical touch device.
