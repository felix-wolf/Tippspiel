# Technical Debt Register

Last updated: 2026-03-11

This document records the main technical debt and areas that need work across the current code base. It is intentionally opinionated and prioritized so it can guide follow-up work.

## High Priority

### 1. Event administration exists now, but the admin surface is still minimal
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
  - There is still no dedicated admin overview for:
    - reviewing recent failed background jobs or corrected imports in one place
    - persistent audit/history for admin actions
    - broader support workflows like user moderation or game repair
- Why it matters:
  - The product model is cleaner and a first global repair surface exists, but operational administration is still narrow.
  - As the number of games grows, editing event data game-by-game will become inefficient and error-prone.
- Suggested direction:
  - Add persistent operation history and failed-job diagnostics to the admin overview.
  - Add safer merge/delete flows and impact previews before editing shared metadata used by multiple games.

### 2. The `Discipline` model is overloaded
- Files:
  - `backend/src/models/discipline.py`
  - `backend/src/blueprints/game_service.py`
  - `backend/src/blueprints/result_service.py`
- What is wrong:
  - `Discipline` mixes:
    - persistence
    - import orchestration
    - official API mapping
    - athlete resolution
    - result transformation
- Why it matters:
  - The class is large and difficult to change safely.
  - Logic for transport, parsing, domain matching, and persistence is tightly coupled.
- Suggested direction:
  - Split into dedicated adapters/providers, e.g.:
    - official feed client
    - legacy scraper
    - event importer
    - result processor
    - athlete resolver

## Medium Priority

### 3. Error handling and logging are inconsistent and often low-signal
- Files:
  - `backend/src/database/db_manager.py`
  - `backend/src/models/*.py`
  - `backend/src/models/notification_helper.py`
- What is wrong:
  - Many code paths use `print(...)`.
  - Some DB helpers swallow exceptions and return `None`.
  - Other DB helpers re-raise raw exceptions.
- Why it matters:
  - Production diagnostics are weak.
  - Failure behavior is inconsistent.
  - Bugs can be masked as missing data.
- Suggested direction:
  - Standardize on structured logging.
  - Do not swallow DB exceptions in generic helpers.
  - Centralize error-to-response translation at the blueprint/service layer.

### 4. Event import UI still has some complexity, but the modal state is now explicit
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

### 5. Generic table component is too weak for current UI needs
- Files:
  - `frontend/src/components/design/TableList.tsx`
- What is wrong:
  - Uses `Record<string, any>`.
  - Relies on runtime primitive checks.
  - Still contains commented-out behavior and TODOs.
  - Accessibility and customization are limited.
- Why it matters:
  - The more result and stats columns are added, the more brittle this shared component becomes.
- Suggested direction:
  - Tighten typing.
  - Remove dead/commented code.
  - Add clearer column configuration and optional accessibility hooks.

### 6. Stale discipline URL compatibility still remains in the API contract
- Files:
  - `backend/src/models/discipline.py`
  - `backend/src/blueprints/game.py`
  - `frontend/src/models/Discipline.ts`
  - `frontend/src/pages/ViewBetsPage.tsx`
- What is wrong:
  - `result_url` and `events_url` still exist in the schema and API model even though the supported biathlon flow is official import plus manual fallback.
  - `/api/game/events` still exists only as a compatibility endpoint that returns `410`.
- Why it matters:
  - The product contract is broader than the actual supported feature set.
  - Dead compatibility surface increases maintenance cost and confusion.
- Suggested direction:
  - Decide whether URL-based import/result support is permanently removed.
  - If yes, remove the stale schema/API fields and the compatibility endpoint in a proper migration.

## Lower Priority / Structural Cleanup

### 7. Seed/bootstrap data and runtime data model are drifting apart
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

### 8. Some abstract/base contracts are incomplete
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

### 9. Test coverage is better than before, but still misses some operational paths
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
- Split `Discipline` into smaller import/result adapters.
- Improve backend error handling/logging consistency.

### Phase 2
- Simplify event import modal state handling.
- Clean stale discipline URL compatibility.

### Phase 3
- Clean seed data and bootstrap drift.
- Refactor or replace the generic table abstraction.
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
- API-facing frontend model serialization now uses plain payload objects, and `Discipline` / `EventType` were moved out of `models/user`, as of 2026-03-11.
- `UserContext` now lives under `frontend/src/contexts/`, `User` now lives under `frontend/src/models/`, and the old `frontend/src/models/user/` structure is gone, as of 2026-03-11.
- The `realbiathlon` / Selenium scraping path was removed on 2026-03-11.
- The stale Selenium dependency was removed from backend packaging metadata on 2026-03-11.
- This list is based on a focused code review, not a full architectural rewrite proposal.
- It intentionally prioritizes areas that increase production risk, operational fragility, or change cost.
