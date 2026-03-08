import os
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parent


def _load_env_file(path: Path) -> None:
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip("'").strip('"')
        os.environ.setdefault(key, value)


def _require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def load_config(env: str) -> dict:
    _load_env_file(BACKEND_ROOT / ".env")
    _load_env_file(BACKEND_ROOT / f".env.{env}")

    default_db_paths = {
        "dev": "src/database/tippspiel_dev.db",
        "prod": "src/database/tippspiel.db",
        "test": "src/database/tippspiel_test.db",
    }

    return {
        "SECRET_KEY": _require_env("TIPPSPIEL_SECRET_KEY"),
        "SALT": _require_env("TIPPSPIEL_PASSWORD_SALT"),
        "DB_PATH": os.getenv("TIPPSPIEL_DB_PATH", default_db_paths.get(env, default_db_paths["dev"])),
        "FIREBASE_CREDENTIALS_PATH": os.getenv("TIPPSPIEL_FIREBASE_CREDENTIALS_PATH"),
        "TESTING": os.getenv("TIPPSPIEL_TESTING", "1" if env == "test" else "0") == "1",
    }
