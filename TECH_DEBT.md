# Technical Debt Register

Last updated: 2026-03-11

This document records the main technical debt and areas that need work across the current code base. It is intentionally opinionated and prioritized so it can guide follow-up work.

## High Priority

### 1. Event administration is now centralized, but no admin tooling exists yet
- Files:
  - `backend/src/database/migrations/0004_shared_events.sql`
  - `backend/src/blueprints/event.py`
  - `frontend/src/components/domain/EventEditorModal.tsx`
- What is wrong:
  - Shared race metadata now exists separately from game-specific betting configuration.
  - Game owners can no longer create, edit, or delete event information.
  - There is still no admin UI or admin API workflow to manage canonical race data.
- Why it matters:
  - The product model is cleaner, but manual correction of bad or missing event data is currently blocked.
  - Non-official/manual disciplines now depend on future admin tooling to remain operational.
- Suggested direction:
  - Add explicit admin roles and admin-only endpoints for canonical event CRUD.
  - Build a minimal admin surface for shared race management before expanding beyond the IBU-only biathlon path.

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

### 4. Frontend models manually build JSON strings
- Files:
  - `frontend/src/models/Event.ts`
  - `frontend/src/models/Result.ts`
  - `frontend/src/models/Bet.ts`
- What is wrong:
  - Several models serialize payloads by hand with template strings instead of plain objects.
- Why it matters:
  - The format is fragile.
  - Optional fields can easily serialize incorrectly.
  - Tests end up validating string shape instead of payload semantics.
- Suggested direction:
  - Replace `toJson(): string` with `toPayload(): object`.
  - Let `fetch`/`JSON.stringify` handle serialization.
  - Update tests to compare parsed objects instead of raw strings.

### 5. Event import UI state is becoming hard to maintain
- Files:
  - `frontend/src/components/domain/EventEditorModal.tsx`
  - `frontend/src/components/domain/OfficialEventImporter.tsx`
  - `frontend/src/components/domain/lists/EventImportList.tsx`
- What is wrong:
  - The modal now coordinates multiple modes:
    - edit existing event
    - official import
    - manual creation fallback
  - State is spread across several booleans.
- Why it matters:
  - UI regressions become more likely as the flow grows.
  - It is easy to end up with impossible or unclear state combinations.
- Suggested direction:
  - Replace boolean combinations with an explicit modal mode state machine.
  - Move import selection state into the importer subtree.

### 6. Generic table component is too weak for current UI needs
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

### 7. Unused Selenium dependency still remains in backend packaging metadata
- Files:
  - `backend/pyproject.toml`
  - `backend/uv.lock`
- What is wrong:
  - The runtime scraping code is gone, but the dependency manifests still include `selenium`.
- Why it matters:
  - The dependency graph is now larger than necessary.
  - It obscures what the backend actually needs in production.
- Suggested direction:
  - Remove `selenium` from the dependency manifests once the lockfile can be regenerated cleanly.

### 8. Stale discipline URL compatibility still remains in the API contract
- Files:
  - `backend/src/models/discipline.py`
  - `backend/src/blueprints/game.py`
  - `frontend/src/models/user/Discipline.ts`
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

### 9. Seed/bootstrap data and runtime data model are drifting apart
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

### 10. Some abstract/base contracts are incomplete
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

### 11. Test coverage is better than before, but still misses some operational paths
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
- Drop the unused Selenium dependency from backend packaging.
- Improve backend error handling/logging consistency.

### Phase 2
- Replace manual frontend JSON string serialization with plain payload objects.
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
- The `realbiathlon` / Selenium scraping path was removed on 2026-03-11.
- This list is based on a focused code review, not a full architectural rewrite proposal.
- It intentionally prioritizes areas that increase production risk, operational fragility, or change cost.
