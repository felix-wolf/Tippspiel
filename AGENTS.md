# Repository Guide

## Overview
- This repo is split into `backend/` and `frontend/`.
- `backend/` is a Flask app with SQLite, Flask-Login, Firebase Admin, and pytest-based tests.
- `frontend/` is a React + TypeScript + Vite app with Vitest tests.

## Structure
- `backend/main.py`: Flask app factory and blueprint registration.
- `backend/config.py`: environment-based backend config loader.
- `backend/src/blueprints/`: API routes.
- `backend/src/models/`: domain and persistence logic.
- `backend/src/database/`: SQLite DB helpers and local DB files.
- `backend/src/resources/`: SQL schema and seed CSV files.
- `backend/test/`: backend unit and integration tests.
- `frontend/src/`: React app source.
- `frontend/test/`: frontend unit tests.
- `deploy_backend.sh`: backend deploy script.
- `deploy_frontend.sh`: local frontend deploy script.
- `deploy_frontend_remotely.sh`: local-build, remote-copy frontend deploy script.

## Environment Setup

### Backend
- Backend config is loaded from environment variables by `backend/config.py`.
- For local development, create `backend/.env` from `backend/.env.example`.
- Relevant variables:
  - `TIPPSPIEL_SECRET_KEY`
  - `TIPPSPIEL_PASSWORD_SALT`
  - `TIPPSPIEL_DB_PATH`
  - `TIPPSPIEL_FIREBASE_CREDENTIALS_PATH`
  - `TIPPSPIEL_TESTING`
- `backend/.env` is loaded automatically by the app; no manual `export` is required for normal local runs.

### Frontend
- Frontend build-time config comes from Vite `VITE_*` variables.
- For local development, use `frontend/.env` or `frontend/.env.local`.
- Start from `frontend/.env.example`.

## Running the App

### Backend
- Install/sync dependencies:
```bash
cd backend
uv sync
```
- Start the backend:
```bash
cd backend
uv run python main.py
```

### Frontend
- Install dependencies:
```bash
cd frontend
npm install
```
- Start the frontend dev server:
```bash
cd frontend
npm run dev
```

## Unit Tests

### Backend tests
- Run all backend tests:
```bash
cd backend
uv run pytest
```
- Run a single backend test file:
```bash
cd backend
uv run pytest test/test_blueprint_game.py
```
- Backend tests use `backend/test/conftest.py`, which creates an isolated temporary SQLite database per test.

### Frontend tests
- Run all frontend tests:
```bash
cd frontend
npm test
```
- Run Vitest once without watch mode:
```bash
cd frontend
npm test -- --run
```
- Current frontend tests live in:
  - `frontend/test/Event.test.ts`
  - `frontend/test/Result.test.ts`

## Useful Verification Commands
- Frontend type-check:
```bash
cd frontend
npm exec tsc -- --noEmit
```
- Frontend lint:
```bash
cd frontend
npm run lint
```

## Deployment Notes
- Backend production config is expected in `/etc/tippspiel/backend.env`.
- `backend/tippspiel_backend.service` is the systemd unit for the backend.
- `backend/run_tippspiel_backend` contains cron entries for periodic notification/result checks.
- `deploy_frontend_remotely.sh` builds the frontend locally and copies `frontend/dist/` to a remote host over SSH.
- Frontend `VITE_*` values are needed where the frontend build runs, not on the production server if only static files are copied.

## Project Tracking Docs
- Keep `TECH_DEBT.md` up to date as technical debt is discovered, removed, or reprioritized.
- Keep `PUBLIC_LAUNCH_READINESS.md` up to date as launch blockers are addressed or new public-launch requirements become visible.
- When a change materially affects either document, update it in the same piece of work rather than leaving it for later.
- When working on an item taken from `TECH_DEBT.md`, finish the item end-to-end before treating it as done.
- Do not leave a tech-debt item in a half-completed state just because one safe sub-slice is finished.
- Only update `TECH_DEBT.md` to mark progress on an item after the implementation, verification, and any necessary follow-through for that item are actually complete; if scope remains, rewrite the entry to describe the true remaining work.

## Current Auth/Password Notes
- User passwords now use a safer hash for new registrations and upgrade legacy SHA-256 hashes on successful login.
- Game join passwords follow the same migration pattern: new protected games use a safer hash, legacy hashes upgrade on successful join.
- Do not rotate `TIPPSPIEL_PASSWORD_SALT` until all legacy hashes are gone or you are forcing resets.
