from pathlib import Path

import config


def test_load_config_prefers_env_specific_file_over_base_file(monkeypatch, tmp_path):
    (tmp_path / ".env").write_text(
        "\n".join(
            [
                "TIPPSPIEL_SECRET_KEY=base-secret",
                "TIPPSPIEL_PASSWORD_SALT=base-salt",
                "TIPPSPIEL_DB_PATH=src/database/tippspiel_dev.db",
            ]
        ),
        encoding="utf-8",
    )
    (tmp_path / ".env.prod").write_text(
        "\n".join(
            [
                "TIPPSPIEL_SECRET_KEY=prod-secret",
                "TIPPSPIEL_PASSWORD_SALT=prod-salt",
                "TIPPSPIEL_DB_PATH=src/database/tippspiel.db",
            ]
        ),
        encoding="utf-8",
    )

    monkeypatch.setattr(config, "BACKEND_ROOT", tmp_path)
    monkeypatch.delenv("TIPPSPIEL_SECRET_KEY", raising=False)
    monkeypatch.delenv("TIPPSPIEL_PASSWORD_SALT", raising=False)
    monkeypatch.delenv("TIPPSPIEL_DB_PATH", raising=False)

    loaded = config.load_config("prod")

    assert loaded["SECRET_KEY"] == "prod-secret"
    assert loaded["SALT"] == "prod-salt"
    assert loaded["DB_PATH"] == "src/database/tippspiel.db"
    assert loaded["ADMIN_USERNAMES"] == []


def test_load_config_prefers_real_environment_over_files(monkeypatch, tmp_path):
    (tmp_path / ".env").write_text(
        "\n".join(
            [
                "TIPPSPIEL_SECRET_KEY=base-secret",
                "TIPPSPIEL_PASSWORD_SALT=base-salt",
                "TIPPSPIEL_DB_PATH=src/database/tippspiel_dev.db",
            ]
        ),
        encoding="utf-8",
    )
    (tmp_path / ".env.prod").write_text(
        "\n".join(
            [
                "TIPPSPIEL_SECRET_KEY=prod-secret",
                "TIPPSPIEL_PASSWORD_SALT=prod-salt",
                "TIPPSPIEL_DB_PATH=src/database/tippspiel.db",
            ]
        ),
        encoding="utf-8",
    )

    monkeypatch.setattr(config, "BACKEND_ROOT", tmp_path)
    monkeypatch.setenv("TIPPSPIEL_SECRET_KEY", "shell-secret")
    monkeypatch.setenv("TIPPSPIEL_PASSWORD_SALT", "shell-salt")
    monkeypatch.setenv("TIPPSPIEL_DB_PATH", "/tmp/custom.db")
    monkeypatch.setenv("TIPPSPIEL_ADMIN_USERNAMES", "alice, bob")

    loaded = config.load_config("prod")

    assert loaded["SECRET_KEY"] == "shell-secret"
    assert loaded["SALT"] == "shell-salt"
    assert loaded["DB_PATH"] == "/tmp/custom.db"
    assert loaded["ADMIN_USERNAMES"] == ["alice", "bob"]
