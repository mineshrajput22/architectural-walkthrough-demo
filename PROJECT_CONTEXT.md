# Architectural walkthrough: decisions and handoff

Last updated: 2026-09-21

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
- Viewpoint changes glide the camera from point A to point B (eased position + look-target interpolation, ~1.1–2.2 s by distance, slight vertical arc; reduced-motion systems get a shorter 0.6 s level glide). WASD/drag/plan input cancels the flight. Fullscreen shows an in-viewer SPACES panel with all viewpoints and previous/next controls.
- Current 1K interpretation: textures are 1024 × 1024; drawing buffer is 1024 pixels wide with proportional height; text and controls use native screen resolution. The distinction was explained by the assistant; keep it explicit if discussing quality.
- `apartment__baked.glb` is the original supplied asset. `scripts/prepare_model.py` generates `public/models/apartment-demo.glb` separately.
- The sample has 11 embedded 1K textures, 4,664 triangles, and 15 meshes/materials, as recorded by prior inspection and the README.
- Legacy specular/glossiness materials are adapted to baked/unlit materials for this sample. This is not a general conversion pipeline or proof of realistic rendering for all client models.

## Asset context

The sample is Apartment | Baked by Pedro Belthori; its embedded license is CC BY-NC 4.0. Retain attribution and the source/license links in `README.md`. The user authorized noncommercial demo use after this was disclosed. An eventual client publication requires a suitable asset and a separate publication decision.

## Recommendations and open decisions

- Blender as a standard preparation stage, and SketchUp/Revit handoff conversion, were recommended; they are not implemented or mandatory approved tooling.
- Final brand identity and actual client portfolio content remain open.
- Hosting, deployment, automated uploads, and a production content-management workflow have not been decided.
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
- Validation: documentation-only edit — content and link check, no rebuild. Pushed to `https://github.com/mineshrajput22/architectural-walkthrough-demo` (`main`, commit `c50128f` plus this change unpushed).
- Outstanding: push this README update to GitHub.

### 2026-09-21 — Subtle product-first attribution

- User correction: the name must stay subtle with the brand focused on the product, reading "by Minesh Rajput" everywhere it appears. Header brand, page title, and footer now lead with "3D walkthrough" language; the name moved to captions/bylines (header caption, new sidebar byline, footer, title, README).
- Updated `AGENTS.md` contributor instructions to match. Validation: `npm run build` succeeded; headless-Chromium check confirmed the new title/brand/byline/footer text, zero header overflow at 1440 px, and the fullscreen panel stays hidden outside fullscreen.

### 2026-09-21 — Minesh Rajput demo attribution

- Recorded the user-confirmed demo creator and replaced Atelier branding in the header, browser title, loading mark, and demo footer. Preserved model attribution.
- Updated README and contributor instructions. The legacy local-storage key remains unchanged to preserve saved viewpoints.
- Validation: pending production build and browser check.
