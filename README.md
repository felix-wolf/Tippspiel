# Tippspiel

Tippspiel is a full-stack betting game application for managing private prediction groups around sports events. Users can create games, join existing games, add or import events, place bets, upload results, calculate scores, and view standings in a browser-based UI.

The repository is split into a Flask backend and a React frontend. Both parts are developed and tested independently, but they are designed to run together during local development: Vite serves the frontend and proxies `/api` requests to the Flask app on `http://127.0.0.1:5000`.

## Repository at a Glance

- `backend/`: Flask application, SQLite database access, Firebase integration, official data import/integration logic, and pytest test suite
- `frontend/`: React + TypeScript + Vite application, component library, domain models, and Vitest test suite
- `deploy_backend.sh`: backend deployment entry point
- `deploy_frontend.sh`: local frontend deployment script
- `deploy_frontend_remotely.sh`: local-build, remote-copy frontend deployment script

## Architecture

### Backend

The backend is a Flask app created in [`backend/main.py`](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/main.py). It loads configuration from environment variables via [`backend/config.py`](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/config.py), registers blueprints under `/api`, initializes Flask-Login, and optionally boots Firebase Admin for notifications.

The data layer is built around SQLite and custom model/database helpers in [`backend/src/models`](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/src/models) and [`backend/src/database`](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/src/database). Core backend responsibilities include:

- authentication and session handling
- game creation and protected game joins
- event management, official event import, and admin event maintenance
- bet submission and result processing
- score calculation and standings
- notification-related endpoints and helpers

### Frontend

The frontend is a React 18 + TypeScript app bootstrapped with Vite. Routing starts in [`frontend/src/App.tsx`](/Users/felixwolf/Documents/Developer/Python/tippspiel/frontend/src/App.tsx) and is organized around a small set of pages such as login, home, game details, placing bets, and viewing bets.

The UI talks to the backend through typed domain/network helpers in [`frontend/src/models`](/Users/felixwolf/Documents/Developer/Python/tippspiel/frontend/src/models). The codebase is roughly split into:

- `pages/`: route-level screens
- `components/design/`: reusable UI building blocks
- `components/domain/`: betting/game specific UI
- `contexts/`: user, appearance, cache, and app state providers
- `models/`: frontend data models and API access helpers

## Technology Stack

### Backend

- Python 3.11
- Flask
- Flask-Login
- SQLite
- Firebase Admin SDK
- pytest
- pandas, BeautifulSoup, lxml, html5lib, requests for import/data-processing workflows
- `uv` for dependency management and execution

### Frontend

- React 18
- TypeScript
- Vite
- Vitest
- Tailwind CSS 4
- Sass modules
- React Router
- Headless UI
- Recharts and Chart.js
- Firebase Web SDK

## Repository Structure

```text
tippspiel/
├── backend/
│   ├── main.py                  # Flask app factory / startup
│   ├── config.py                # Environment-based config loader
│   ├── src/
│   │   ├── blueprints/          # API routes
│   │   ├── database/            # SQLite helpers and DB files
│   │   ├── models/              # Domain and persistence logic
│   │   ├── resources/           # SQL schema and seed/import data
│   │   └── scraping/            # Source-specific scraping/import helpers
│   └── test/                    # Backend tests
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable and domain-specific UI
│   │   ├── contexts/            # React contexts
│   │   ├── models/              # Frontend models and API wrappers
│   │   ├── pages/               # Route-level pages
│   │   └── styles/              # Shared styling helpers
│   └── test/                    # Frontend tests
├── deploy_backend.sh
├── deploy_frontend.sh
└── deploy_frontend_remotely.sh
```

## Getting Started

### Prerequisites

- Python 3.11
- Node.js and npm
- `uv`

### Backend setup

1. Create a local backend env file from [`backend/.env.example`](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/.env.example).
2. Install dependencies:

```bash
cd backend
uv sync
```

3. Start the backend:

```bash
cd backend
uv run python main.py
```

Relevant backend environment variables:

- `TIPPSPIEL_SECRET_KEY`
- `TIPPSPIEL_PASSWORD_SALT`
- `TIPPSPIEL_DB_PATH`
- `TIPPSPIEL_FIREBASE_CREDENTIALS_PATH`
- `TIPPSPIEL_TESTING`

### Frontend setup

1. Create a frontend env file from [`frontend/.env.example`](/Users/felixwolf/Documents/Developer/Python/tippspiel/frontend/.env.example).
2. Install dependencies:

```bash
cd frontend
npm install
```

3. Start the frontend dev server:

```bash
cd frontend
npm run dev
```

By default, the Vite dev server proxies `/api` requests to the backend on port `5000`, configured in [`frontend/vite.config.ts`](/Users/felixwolf/Documents/Developer/Python/tippspiel/frontend/vite.config.ts).

## Common Development Commands

### Backend

```bash
cd backend
uv run pytest
uv run pytest test/test_blueprint_game.py
```

### Frontend

```bash
cd frontend
npm test
npm test -- --run
npm run lint
npm exec tsc -- --noEmit
```

## Where to Start Reading

For new contributors, these files give the fastest overview of how the system hangs together:

- [`backend/main.py`](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/main.py): backend startup, config wiring, blueprint registration
- [`backend/src/blueprints/game.py`](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/src/blueprints/game.py): representative API flow for authenticated game actions
- [`backend/src/models/event.py`](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/src/models/event.py): core event/bet/result processing logic
- [`frontend/src/App.tsx`](/Users/felixwolf/Documents/Developer/Python/tippspiel/frontend/src/App.tsx): route tree and top-level composition
- [`frontend/src/pages/HomePage.tsx`](/Users/felixwolf/Documents/Developer/Python/tippspiel/frontend/src/pages/HomePage.tsx): main authenticated landing flow
- [`frontend/src/models/NetworkHelper.ts`](/Users/felixwolf/Documents/Developer/Python/tippspiel/frontend/src/models/NetworkHelper.ts): central frontend API handling

## Testing

Backend tests live in [`backend/test`](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/test) and use [`backend/test/conftest.py`](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/test/conftest.py) to provision isolated temporary SQLite databases.

Frontend tests live in [`frontend/test`](/Users/felixwolf/Documents/Developer/Python/tippspiel/frontend/test) and cover domain models and selected UI behavior with Vitest.

## Deployment Notes

- Production backend configuration is expected in `/etc/tippspiel/backend.env`.
- [`backend/tippspiel_backend.service`](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/tippspiel_backend.service) contains the systemd unit for the backend.
- [`backend/run_tippspiel_backend`](/Users/felixwolf/Documents/Developer/Python/tippspiel/backend/run_tippspiel_backend) contains cron entries related to periodic backend tasks.
- `deploy_frontend_remotely.sh` builds the frontend locally and copies `frontend/dist/` to a remote host over SSH.

## Notes for Contributors

- New user passwords and game join passwords use a safer hash, while legacy SHA-256 hashes are upgraded on successful login/join.
- Do not rotate `TIPPSPIEL_PASSWORD_SALT` until legacy hashes have been migrated or resets are planned.
- The repository currently contains generated/local artifacts such as virtualenv, `node_modules`, `dist`, and local SQLite files. Be deliberate when reviewing diffs and deployments.
