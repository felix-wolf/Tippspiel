# Technical Debt Register

Last updated: 2026-03-16

This document records the main technical debt and areas that need work across the current code base. It is intentionally opinionated and prioritized so it can guide follow-up work.

## High Priority

### 1. Event administration now has diagnostics/history, but broader repair workflows are still missing
- Files:
  - `backend/src/database/migrations/0004_shared_events.sql`
  - `backend/src/blueprints/event.py`
  - `backend/src/blueprints/result.py`
  - `frontend/src/components/domain/EventEditorModal.tsx`
  - `frontend/src/components/domain/AdminResultTools.tsx`
- What is wrong:
  - Shared race metadata now exists separately from game-specific betting configuration.
  - Game owners can no longer create, edit, or delete event information.
  - Admins can now preview, re-apply, clear, and rescore results from the regular event UI.
  - A dedicated admin overview now exists for shared-event diagnostics and missing-country cleanup.
  - A dedicated admin overview now also persists recent admin repairs plus result/reminder job runs in one place.
  - There is still no broader support workflow for:
    - safer merge/delete flows with impact previews before changing shared metadata used by multiple games
    - user moderation or game repair beyond event/result metadata
- Why it matters:
  - The product model is cleaner and the admin surface now has real operational memory, but support tooling is still narrow once issues go beyond source/result cleanup.
  - As the number of games grows, editing event data game-by-game will become inefficient and error-prone.
- Suggested direction:
  - Add safer merge/delete flows and impact previews before editing shared metadata used by multiple games.
  - Add broader support workflows for moderation, repair, and cross-game recovery tasks.

## Medium Priority

### 2. Event import UI still has some complexity, but the modal state is now explicit
- Files:
  - `frontend/src/components/domain/EventEditorModal.tsx`
  - `frontend/src/components/domain/OfficialEventImporter.tsx`
  - `frontend/src/components/domain/lists/EventImportList.tsx`
- What is wrong:
  - The modal now uses an explicit mode state instead of coordinating multiple booleans.
  - Import selection now lives in the importer subtree instead of leaking across the modal.
  - The remaining complexity is mostly split across three collaborating components rather than hidden boolean combinations.
- Why it matters:
  - The riskiest modal-state combinations are now gone, but the import/create/edit flow is still a fairly dense UI surface.
- Suggested direction:
  - Keep the explicit mode machine intact as new editor features are added.
  - Add one or two focused UI tests around the modal flow if richer component-test tooling is introduced later.

## Lower Priority / Structural Cleanup

### 3. Seed/bootstrap data and runtime data model are drifting apart
- Files:
  - `backend/src/resources/disciplines.csv`
  - `backend/src/resources/athletes.csv`
  - `backend/src/models/athlete.py`
  - `backend/populate_db.py`
- What is wrong:
  - Fresh installs now bootstrap biathlon athletes from the IBU API and use `athletes.csv` mainly for non-biathlon and fallback data.
  - Runtime startup code still patches part of the seed/runtime drift on the fly.
- Why it matters:
  - Fresh environment setup is still less trustworthy than it should be.
  - The real source of truth remains ambiguous.
- Suggested direction:
  - Bring seed files back in line with current production behavior.
  - Treat runtime backfills as one-off admin tools, not hidden startup behavior.

### 4. Some abstract/base contracts are incomplete
- Files:
  - `backend/src/models/base_model.py`
  - `backend/src/models/discipline.py`
  - `backend/src/models/*`
- What is wrong:
  - Several methods use `pass` or raise broad `NotImplementedError` in a way that reflects an incomplete shared model layer.
- Why it matters:
  - The inheritance structure suggests a stronger abstraction than the code actually provides.
- Suggested direction:
  - Either tighten the base contracts or simplify the inheritance model.

### 5. Test coverage is better than before, but still misses some operational paths
- Files:
  - `backend/test/`
  - `frontend/test/`
- Gaps worth noting:
  - no end-to-end test around import selection + persistence + result import
  - limited UI-state tests for the newer event import flows
  - no DB-level migration tests because migrations are still implicit startup code
- Suggested direction:
  - Add one thin happy-path integration test per major workflow.
  - Add a small number of focused component tests for importer state transitions.

## Suggested Work Order

### Phase 1
- Simplify event import modal state handling.

### Phase 2
- Clean seed data and bootstrap drift.
- Tighten the shared model/base contracts.
- Add thin workflow tests for import, result processing, and migration-sensitive paths.

## Notes

- Explicit migrations replaced startup schema mutation on 2026-03-11.
- Official event identity is enforced at the DB level and `season_id` is persisted as of 2026-03-11.
- Recent result polling now processes all eligible events in one run and reports per-event failures as of 2026-03-11.
- Shared race metadata is normalized into canonical shared events and game owners can no longer edit event info as of 2026-03-11.
- A first admin role plus admin-only event management workflow exists as of 2026-03-11.
- Admins can preview, refresh, clear, and rescore event results, and background task endpoints can now be protected by `TIPPSPIEL_TASK_API_TOKEN`, as of 2026-03-11.
- A dedicated admin overview for shared-event source repair and missing-country cleanup exists as of 2026-03-11.
- Admin operations now persist recent repairs plus result/reminder job diagnostics in the admin overview, as of 2026-03-16.
- Generic DB helpers now log and re-raise query/statement/transaction failures instead of silently returning `None`, as of 2026-03-16.
- Backend model/bootstrap deserialization and notification paths now use structured logging instead of `print(...)`, as of 2026-03-16.
- Blueprint/service error handling now uses a shared `ServiceResult` contract instead of ad-hoc `(payload, error, status)` tuples, as of 2026-03-16.
- API-facing frontend model serialization now uses plain payload objects, and `Discipline` / `EventType` were moved out of `models/user`, as of 2026-03-11.
- `UserContext` now lives under `frontend/src/contexts/`, `User` now lives under `frontend/src/models/`, and the old `frontend/src/models/user/` structure is gone, as of 2026-03-11.
- The `realbiathlon` / Selenium scraping path was removed on 2026-03-11.
- The stale Selenium dependency was removed from backend packaging metadata on 2026-03-11.
- Discipline-level URL compatibility fields and the dead `/api/game/events` endpoint were removed on 2026-03-11.
- `TableList` was tightened to a typed column contract and its dead generic behavior was removed on 2026-03-11.
- Discipline-specific import/result behavior now lives behind a registry of adapters instead of on the `Discipline` model, as of 2026-03-12.
- This list is based on a focused code review, not a full architectural rewrite proposal.
- It intentionally prioritizes areas that increase production risk, operational fragility, or change cost.
