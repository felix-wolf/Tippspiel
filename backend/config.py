import os
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parent


def _read_env_file(path: Path) -> dict[str, str]:
    values = {}
    if not path.exists():
        return values
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip("'").strip('"')
        values[key] = value
    return values


def _require_env(name: str, env_values: dict[str, str]) -> str:
    value = env_values.get(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def load_config(env: str) -> dict:
    file_env = {
        **_read_env_file(BACKEND_ROOT / ".env"),
        **_read_env_file(BACKEND_ROOT / f".env.{env}"),
    }
    env_values = {**file_env, **os.environ}

    default_db_paths = {
        "dev": "src/database/tippspiel_dev.db",
        "prod": "src/database/tippspiel.db",
        "test": "src/database/tippspiel_test.db",
    }

    return {
        "SECRET_KEY": _require_env("TIPPSPIEL_SECRET_KEY", env_values),
        "SALT": _require_env("TIPPSPIEL_PASSWORD_SALT", env_values),
        "DB_PATH": env_values.get("TIPPSPIEL_DB_PATH", default_db_paths.get(env, default_db_paths["dev"])),
        "FIREBASE_CREDENTIALS_PATH": env_values.get("TIPPSPIEL_FIREBASE_CREDENTIALS_PATH"),
        "TASK_API_TOKEN": env_values.get("TIPPSPIEL_TASK_API_TOKEN"),
        "ADMIN_USERNAMES": [
            item.strip()
            for item in env_values.get("TIPPSPIEL_ADMIN_USERNAMES", "").split(",")
            if item.strip()
        ],
        "TESTING": env_values.get("TIPPSPIEL_TESTING", "1" if env == "test" else "0") == "1",
    }
