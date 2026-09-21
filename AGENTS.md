# Instructions for AI contributors

Read `PROJECT_CONTEXT.md` and `README.md` before changing this project. These files are the portable handoff for every AI model and human contributor. If your tool does not load AGENTS.md automatically, load it explicitly.

## Keep the handoff current

- After each change, update the relevant current-state sections in `PROJECT_CONTEXT.md` and append a dated entry to its change log before reporting completion. Include what changed, why, validation performed, and unfinished work. For a batch of related edits, one entry is sufficient.
- Update `README.md` whenever setup, controls, commands, or observable behavior changes. Update this file when contributor instructions change.
- Record new user decisions and corrections immediately. Separate user-approved requirements, implementation choices, proposals, and unresolved questions. Never present an AI suggestion as a user decision.
- Preserve decision history: mark replaced decisions as superseded and explain what replaced them. Latest explicit user instructions take precedence over these notes.
- Read the current files before editing; another task may be working in this shared directory. Preserve unrelated changes and do not claim another task's work is verified without evidence.
- Keep notes portable: use repository-relative paths and commands, avoid private machine details, and do not rely on access to previous chats.

## Project constraints

- This is a demo by Minesh Rajput, as confirmed by the user. Use that attribution; ATELIER, the a. mark, and its tagline were unapproved placeholders and have been removed from the UI. A separate product name, logo, and final visual identity remain undecided. Retain the original model creator credit separately.
- Preserve the original supplied GLB; generate browser adaptations separately and retain attribution.
- Current scope is a local, noncommercial demo. Do not infer publication approval from the eventual client-portfolio objective.
- Preserve requested free navigation through doors and walls, with E up and Q down. Do not reintroduce collision blocking based on earlier suggestions.
- Maintain laptop-first, 1K quality targets. Record assumptions about texture versus drawing-buffer resolution explicitly.

## Validation and completion

- For application changes, run `npm run build`. For model or viewpoint changes, also run `node scripts/verify-model.mjs` and inspect relevant browser behavior when available.
- For UI and navigation changes, check appearance and affected controls in the browser; build success alone is not visual verification.
- Documentation-only edits need a content and link check, not an application rebuild.
- Record actual results and limitations, not inferred passes. Leave a concrete next step for incomplete work.
