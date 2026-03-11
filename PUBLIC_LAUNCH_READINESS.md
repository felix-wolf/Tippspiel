# Public Launch Readiness

Last updated: 2026-03-11

This document lists the work needed before opening the app to a broader audience of biathlon fans.

The app has already crossed the "works for a trusted family group" threshold. Public use is a different bar. The main gaps are not only product polish, but security, reliability, operations, privacy, and abuse resistance.

Recently completed baseline:
- Official biathlon event import and result loading now run on the IBU source only.
- The old `realbiathlon` / Selenium scraping path has been removed from the active product flow.

## Launch Stages

### Stage 1: Closed Beta
Goal: a few dozen trusted external users

### Stage 2: Public Beta
Goal: a few hundred users with low support overhead

### Stage 3: Broad Public Launch
Goal: public signups, predictable operations, and acceptable legal/security posture

## Must-Have Before Closed Beta

### 1. Harden authentication and account lifecycle
- Relevant files:
  - [backend/src/models/user.py](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/src/models/user.py)
  - [backend/src/blueprints/login.py](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/src/blueprints/login.py)
  - [backend/config.py](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/config.py)
- Current state:
  - Registration is only `name + password`.
  - There is no email verification.
  - There is no password reset flow.
  - There is no account recovery path.
- Why this blocks public use:
  - Public users forget passwords.
  - Name-only identity is weak and collision-prone.
  - Support becomes manual immediately.
- Needed steps:
  - Add email-based identity or equivalent verified account recovery.
  - Add password reset.
  - Add uniqueness rules and UX around usernames/display names.
  - Add minimum password policy and registration validation.

### 2. Add rate limiting and abuse protection
- Relevant files:
  - [backend/src/blueprints/login.py](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/src/blueprints/login.py)
  - [backend/src/blueprints/game.py](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/src/blueprints/game.py)
  - [backend/src/blueprints/event.py](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/src/blueprints/event.py)
  - [backend/src/blueprints/notification.py](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/src/blueprints/notification.py)
- Current state:
  - No obvious rate limiting is present.
  - Public endpoints like login/register can be spammed.
  - Device registration and notification test endpoints can be abused by authenticated users.
- Why this blocks public use:
  - Credential stuffing and spam become immediate concerns.
  - A small app can be overwhelmed by trivial automated traffic.
- Needed steps:
  - Add per-IP and per-account rate limits.
  - Add brute-force protection on login.
  - Add anti-abuse guardrails for register, join-game, and notification endpoints.

### 3. Lock down session and cookie security
- Relevant files:
  - [backend/main.py](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/main.py)
  - [backend/config.py](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/config.py)
- Current state:
  - The app sets a secret key and uses Flask-Login.
  - There is no visible session-cookie hardening config here.
  - There is no visible CSRF strategy in the API layer.
- Why this blocks public use:
  - Public deployment needs explicit cookie, CSRF, and transport assumptions.
- Needed steps:
  - Set secure session cookie flags for production.
  - Decide whether the API remains cookie-session based or moves to token/session API auth.
  - Add CSRF protection if cookie auth remains the primary model.
  - Verify HTTPS-only production assumptions.

### 4. Add production backups and restore drills
- Relevant files:
  - [backend/config.py](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/config.py)
  - [backend/src/database/db_manager.py](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/src/database/db_manager.py)
- Current state:
  - SQLite is still the production data store.
  - No backup or restore workflow is represented in the repo.
- Why this blocks public use:
  - For family use, manual recovery may be acceptable.
  - For outside users, silent data loss is not acceptable.
- Needed steps:
  - Define automated DB backup cadence.
  - Test restore into a fresh environment.
  - Document recovery steps.

### 5. Add basic observability
- Relevant files:
  - [backend/src/database/db_manager.py](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/src/database/db_manager.py)
  - [backend/src/models/notification_helper.py](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/src/models/notification_helper.py)
  - [backend/src/models/discipline.py](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/src/models/discipline.py)
- Current state:
  - Logging is inconsistent and often uses `print(...)`.
  - There is no evidence of structured logs, alerting, or health dashboards.
- Why this blocks public use:
  - Once external users report issues, you need to answer:
    - what failed
    - for whom
    - when
    - how often
- Needed steps:
  - Replace prints with structured logging.
  - Add request/error logging.
  - Add alerting for result import failures and notification failures.
  - Add metrics for login, game creation, event import, result processing.

## Must-Have Before Public Beta

### 6. Harden the IBU-only biathlon path
- Relevant files:
  - [backend/src/ibu_api.py](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/src/ibu_api.py)
  - [backend/src/models/event.py](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/src/models/event.py)
  - [backend/src/blueprints/result_service.py](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/src/blueprints/result_service.py)
- Current state:
  - The core biathlon path now has one source of truth.
  - Official-source identity is now enforced on canonical shared race records.
  - Multiple betting games can attach to the same underlying official race.
  - Game owners can attach official races, but canonical event data is no longer owner-editable.
- Why this matters:
  - Result freshness and correctness are among the most visible user-facing features.
- Needed steps:
  - Add admin workflows for correcting shared race metadata when the official source is incomplete or mapped incorrectly.
  - Add retry/reporting around failed official imports.

### 7. Improve reliability of automatic result processing
- Relevant files:
  - [backend/src/blueprints/result_service.py](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/src/blueprints/result_service.py)
  - [backend/src/models/event.py](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/src/models/event.py)
  - [backend/src/ibu_api.py](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/src/ibu_api.py)
- Current state:
  - Automatic checks now fetch one official result set per shared race and fan it out to all linked betting games.
  - Official-source identity is enforced by DB constraints on shared events.
- Why this matters:
  - Result freshness is one of the most visible user-facing features.
- Needed steps:
  - Add better retry/reporting for failed imports.
  - Add idempotent notification safeguards if result reprocessing ever becomes necessary.

### 8. Operationalize migration rollout
- Relevant files:
  - [backend/migrate.py](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/migrate.py)
  - [backend/src/database/migration_runner.py](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/src/database/migration_runner.py)
  - [deploy_backend.sh](/Users/felixwolf/Documents/Developer/Python/tippspiel/deploy_backend.sh)
- Current state:
  - Explicit migrations now exist and app startup no longer mutates schema.
  - Production still needs a stronger operator workflow around backups, rollback, and validation.
- Why this matters:
  - Public deployments need predictable, auditable schema changes.
- Needed steps:
  - Add pre-migration backup steps for production.
  - Add rollback-safe deployment procedure.
  - Document the operator workflow for `status`, `up`, and failure recovery.

### 9. Improve deployment and release process
- Relevant files:
  - [deploy_backend.sh](/Users/felixwolf/Documents/Developer/Python/tippspiel/deploy_backend.sh)
  - [deploy_frontend_remotely.sh](/Users/felixwolf/Documents/Developer/Python/tippspiel/deploy_frontend_remotely.sh)
- Current state:
  - Deployment is shell-script based and assumes one operator-managed environment.
  - It depends on manual `git pull`, local state, and remote copying.
- Why this matters:
  - That is acceptable for a family app, but fragile for a public product.
- Needed steps:
  - Define one reproducible release pipeline.
  - Add environment validation before deploy.
  - Add rollback procedure.
  - Add staging environment or staging deploy flow.

### 10. Add user-visible error handling and supportability
- Relevant files:
  - [frontend/src/models/NetworkHelper.ts](/Users/felixwolf/Documents/Developer/Python/tippspiel/frontend/src/models/NetworkHelper.ts)
  - [frontend/src/components/domain/EventEditorModal.tsx](/Users/felixwolf/Documents/Developer/Python/tippspiel/frontend/src/components/domain/EventEditorModal.tsx)
  - [frontend/src/pages/ViewBetsPage.tsx](/Users/felixwolf/Documents/Developer/Python/tippspiel/frontend/src/pages/ViewBetsPage.tsx)
- Current state:
  - Some network errors are caught, but user-facing recovery paths are still limited.
  - Some operations fail silently or only shake a button.
- Why this matters:
  - Family users will ask you directly.
  - Public users will assume the app is broken and leave.
- Needed steps:
  - Standardize error toasts/messages.
  - Distinguish retryable from non-retryable failures.
  - Add recovery actions where possible.

### 11. Add moderation and admin tooling
- Relevant files:
  - no dedicated admin surface found in the repo
- Current state:
  - There is no visible admin UI or admin workflow for:
    - abusive users
    - broken games
    - bad imports
    - canonical shared-event corrections
    - notification cleanup
- Why this matters:
  - Public users create support and moderation needs quickly.
- Needed steps:
  - Add at least minimal admin capabilities:
    - inspect users/games
    - disable abusive accounts
    - repair/delete broken imports
    - review failed result imports

## Must-Have Before Broad Public Launch

### 12. Publish privacy/legal/user-facing policy documents
- Current state:
  - No obvious privacy policy, terms, or support documentation were found in the repo.
- Why this matters:
  - Public signups and push notifications require clear disclosure.
- Needed steps:
  - Add privacy policy.
  - Add terms / acceptable use.
  - Add imprint/contact if legally required for your target market.
  - Document notification usage and data retention.

### 13. Rework push notification lifecycle for real users
- Relevant files:
  - [backend/src/blueprints/notification.py](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/src/blueprints/notification.py)
  - [backend/src/models/notification_helper.py](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/src/models/notification_helper.py)
- Current state:
  - Device tokens are stored simply.
  - Notification send failures are printed, not operationally handled.
- Why this matters:
  - Public users expect notification settings to actually work and stale tokens to be cleaned up.
- Needed steps:
  - Remove invalid tokens on known Firebase failures.
  - Add audit logs / metrics around deliveries.
  - Clarify platform support and UX for notification opt-in.

### 14. Improve test depth around the main product workflows
- Relevant files:
  - [backend/test/](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/test)
  - [frontend/test/](/Users/felixwolf/Documents/Developer/Python/tippspiel/frontend/test)
- Current state:
  - Coverage is decent for units and some route tests.
  - End-to-end workflow coverage is still thin.
- Why this matters:
  - Public launches need confidence in the highest-traffic flows.
- Needed steps:
  - Add integration tests for:
    - register/login
    - create game / join game
    - import official events
    - place bets
    - automatic result import
    - score calculation

### 15. Decide whether SQLite is still enough
- Relevant files:
  - [backend/config.py](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/config.py)
  - [backend/src/database/db_manager.py](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/src/database/db_manager.py)
- Current state:
  - SQLite is still the app database.
- Why this matters:
  - It can be fine for a small public app.
  - It becomes risky if you expect concurrent writes, multiple processes, or multi-host deployment.
- Needed steps:
  - Decide target scale for the next 12 months.
  - If staying on SQLite, define explicit operational limits and backups.
  - If not, plan a move before broad launch, not after growth pain starts.

### 16. Simplify the product surface around biathlon
- Relevant files:
  - [backend/src/models/discipline.py](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/src/models/discipline.py)
  - [frontend/src/models/user/Discipline.ts](/Users/felixwolf/Documents/Developer/Python/tippspiel/frontend/src/models/user/Discipline.ts)
  - [frontend/src/components/domain/EventEditorModal.tsx](/Users/felixwolf/Documents/Developer/Python/tippspiel/frontend/src/components/domain/EventEditorModal.tsx)
  - [frontend/src/pages/ViewBetsPage.tsx](/Users/felixwolf/Documents/Developer/Python/tippspiel/frontend/src/pages/ViewBetsPage.tsx)
- Current state:
  - The app is becoming biathlon-public-facing, but still carries generic and legacy discipline scaffolding.
- Why this matters:
  - Public product messaging and UX should match the actual core audience.
- Needed steps:
  - Decide whether this becomes:
    - a general betting app with biathlon support, or
    - a biathlon-first app
  - Align the UI, terminology, and maintenance effort accordingly.

## Strongly Recommended Product Work Before Public Use

### 17. Better onboarding and empty states
- Current state:
  - Many flows still assume the user already understands the app model.
- Needed steps:
  - Add first-run guidance.
  - Explain how games work, how event import works, and when results appear.
  - Improve empty states when there are no games, no events, or no results yet.

### 18. Better game discovery and share flow
- Current state:
  - Joining is functional, but there is no clear broader-audience invitation/share UX in the reviewed code.
- Needed steps:
  - Add friendlier invite/share flow.
  - Improve game password UX.
  - Consider public/private game visibility rules.

### 19. Clarify support and operator workflow
- Current state:
  - For family use, support is direct conversation.
  - For public use, that does not scale.
- Needed steps:
  - Define support email/contact.
  - Define bug-report path.
  - Define incident handling for broken results/imports.

### 20. Improve mobile polish and accessibility
- Relevant files:
  - `frontend/src/components/...`
- Current state:
  - The UI is functional and improving, but the app has grown organically.
- Needed steps:
  - Run an accessibility pass on dialogs, tables, buttons, and color contrast.
  - Test key flows on small screens.
  - Ensure keyboard and screen-reader basics are in place.

## Suggested Rollout Plan

### Phase A: Security and operations baseline
- auth/account recovery
- rate limiting
- session hardening
- backups
- structured logging

### Phase B: Biathlon reliability baseline
- remove remaining legacy scraping dependencies
- add explicit migrations
- harden official event identity in the DB
- improve result polling and failure handling

### Phase C: Public beta UX baseline
- onboarding
- clearer error handling
- admin/support tooling
- invite/join polish

### Phase D: Broad launch baseline
- legal/privacy docs
- notification cleanup
- deeper integration tests
- database/deployment scalability decision

## Practical Recommendation

Do not jump directly from family use to open public launch.

A better path is:
1. Closed beta with trusted biathlon fans.
2. Fix operational failures and confusing flows.
3. Public beta with explicit support limits.
4. Broad launch only after reliability, account recovery, and policy work are in place.
