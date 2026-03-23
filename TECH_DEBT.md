# Technical Debt Register

Last updated: 2026-03-23

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

### 3. Backend endpoints still mix HTTP parsing, authorization, and domain orchestration in large handlers
- Files:
  - `backend/src/blueprints/event.py`
  - `backend/src/blueprints/game.py`
  - `backend/src/blueprints/result.py`
  - `backend/src/blueprints/login.py`
- What is wrong:
  - Several endpoints still branch on `request.method` and perform request parsing, authorization checks, payload decoding, and model orchestration inline.
  - `event.py` in particular handles list import, single-event CRUD, bet saving, and start-list validation in one module with repeated `payload/error` and `entity/error` flows.
  - Newer backend code introduced `ServiceResult`, but the blueprint layer still mixes direct dict returns, `error_response(...)`, and `ensure_service_result(...)`.
- Why it matters:
  - The code paths are harder to scan and change because the HTTP layer still owns too much business logic.
  - Authorization and validation rules are easy to duplicate or drift when each route reassembles the same control flow slightly differently.
- Suggested direction:
  - Split multi-method handlers into single-purpose route functions or thin controller helpers.
  - Standardize the blueprint layer on one response contract and push orchestration into service functions that return `ServiceResult`.

## Lower Priority / Structural Cleanup

### 4. DB transaction handling is still too low-level and repetitive
- Files:
  - `backend/src/database/db_manager.py`
  - `backend/src/models/event.py`
  - `backend/src/models/user.py`
  - `backend/src/models/bet.py`
  - `backend/src/blueprints/admin_service.py`
  - `backend/src/blueprints/result_service.py`
- What is wrong:
  - `db_manager.py` still exposes raw `start_transaction` / `commit_transaction` / `rollback_transaction` primitives, so callers have to repeat the same `conn = None` / `try` / `except` / `finally` transaction pattern.
  - Read helpers also duplicate connection and cursor setup, and row-to-dict conversion is reimplemented per query instead of using a `row_factory`.
- Why it matters:
  - Boilerplate transaction code obscures the intent of model/service methods and makes error handling inconsistent.
  - Small persistence changes cost more than they should because each call site has to manage connection lifecycle manually.
- Suggested direction:
  - Introduce a transaction/context-manager helper in `db_manager` and migrate multi-step writes onto it.
  - Set a SQLite row factory once per connection so `query` and `query_one` can be simplified.

### 5. Model/service boundaries are still inconsistent in a few utility classes
- Files:
  - `backend/src/models/notification_helper.py`
  - `backend/src/models/score_event.py`
  - `backend/src/models/game_stats.py`
- What is wrong:
  - The old shared `BaseModel` contract was removed on 2026-03-23 because it forced fake CRUD methods onto classes that were really DTOs or helpers.
  - A few classes still sit in `models/` even though they behave more like read-models or service helpers than persistence-backed domain entities.
- Why it matters:
  - The most misleading inheritance noise is gone, but the package structure still makes some utility/read-model classes look more uniform than they really are.
- Suggested direction:
  - Keep trimming fake model semantics from helper/read-only classes and consider moving non-entity helpers out of `models/` when convenient.

### 6. Backend bootstrap/auth code still carries legacy scaffolding that no longer pulls its weight
- Files:
  - `backend/main.py`
  - `backend/src/models/user.py`
  - `backend/src/blueprints/*.py`
- What is wrong:
  - There is still dead or legacy-looking glue such as the unused `hash_password(...)` helper in `main.py`, `sys.path.append("..")` in `user.py`, and broad `from flask_login import *` imports across blueprints.
  - The custom `User` object still implements older Flask-Login style methods directly, which makes the class noisier than necessary if the project is willing to align with `UserMixin`.
- Why it matters:
  - None of these issues is severe on its own, but together they make the backend look more custom and fragile than it needs to be.
  - The extra scaffolding raises the cost of understanding startup and auth behavior because it is harder to tell what is intentional versus leftover.
- Suggested direction:
  - Remove dead helpers and implicit path hacks.
  - Replace wildcard imports with explicit imports and consider moving `User` onto `UserMixin` to shed boilerplate auth methods.

### 7. Test coverage is better than before, but still misses some operational paths
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
- Simplify backend blueprint/service boundaries for event, game, and result flows.

### Phase 2
- Introduce DB transaction/context helpers and reduce persistence boilerplate.
- Tighten the shared model/base contracts.

### Phase 3
- Simplify event import modal state handling.
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
- A focused backend simplification review on 2026-03-17 found remaining debt in large blueprint handlers, low-level transaction plumbing, and legacy bootstrap/auth scaffolding.
- Biathlon athlete bootstrap remains IBU-first, but fallback CSV data now matches that model better: `populate_db.py` writes to the configured DB path, `athletes.csv` can persist `ibu_id`, and `backend/refresh_athlete_seed_data.py` explicitly refreshes the fallback seed cache as of 2026-03-17.
- API-facing frontend model serialization now uses plain payload objects, and `Discipline` / `EventType` were moved out of `models/user`, as of 2026-03-11.
- `UserContext` now lives under `frontend/src/contexts/`, `User` now lives under `frontend/src/models/`, and the old `frontend/src/models/user/` structure is gone, as of 2026-03-11.
- The old backend `BaseModel` abstraction was removed on 2026-03-23 after it was reduced to fake CRUD contracts across unrelated model classes.
- The `realbiathlon` / Selenium scraping path was removed on 2026-03-11.
- The stale Selenium dependency was removed from backend packaging metadata on 2026-03-11.
- Discipline-level URL compatibility fields and the dead `/api/game/events` endpoint were removed on 2026-03-11.
- `TableList` was tightened to a typed column contract and its dead generic behavior was removed on 2026-03-11.
- Discipline-specific import/result behavior now lives behind a registry of adapters instead of on the `Discipline` model, as of 2026-03-12.
- This list is based on a focused code review, not a full architectural rewrite proposal.
- It intentionally prioritizes areas that increase production risk, operational fragility, or change cost.
