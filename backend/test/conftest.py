import os
import sys
from pathlib import Path

import pytest

# Ensure the backend package is importable when tests are run from repo root.
BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from main import create_app
from src.database.migration_runner import migrate_to_latest
from src.models.country import Country
from src.models.discipline import Biathlon
from src.models.athlete import Athlete
from src.models.event_type import EventType
from src.models.user import User
from src.utils import hash_password



@pytest.fixture()
def app(tmp_path):
    """Flask app with isolated temp DB per test."""
    os.environ["TIPPSPIEL_SECRET_KEY"] = "test-secret-key"
    os.environ["TIPPSPIEL_PASSWORD_SALT"] = "test-password-salt"
    os.environ["TIPPSPIEL_TESTING"] = "1"
    os.environ["TIPPSPIEL_DB_PATH"] = str(tmp_path / "tippspiel_test.db")
    os.environ.pop("TIPPSPIEL_FIREBASE_CREDENTIALS_PATH", None)
    app = create_app("test", check_migrations=False)
    app.config.update(
        {
            "TESTING": True,
            "DB_PATH": str(tmp_path / "tippspiel_test.db"),
        }
    )
    with app.app_context():
        migrate_to_latest(app.config["DB_PATH"])
        yield app
    if (tmp_path / "tippspiel_test.db").exists():
        (tmp_path / "tippspiel_test.db").unlink()
    os.environ.pop("TIPPSPIEL_DB_PATH", None)

@pytest.fixture()
def base_data(app):
    """Seed a minimal set of shared objects."""
    with app.app_context():
        country = Country(code="GER", name="Germany", flag="GER")
        country.save_to_db()

        discipline = Biathlon(
            discipline_id="biathlon",
            name="Biathlon",
            event_types=[],
            result_url="https://example.com/results",
            events_url="https://example.com/events",
            event_import_mode="official_api",
            result_mode="official_api",
        )
        discipline.save_to_db()

        event_type = EventType(
            name="sprint",
            display_name="Sprint",
            discipline_id=discipline.id,
            betting_on="athletes",
        )
        event_type.save_to_db()

        success, user_id = User.create("tester", hash_password("pw", app.config["SALT"]))
        assert success
        user = User.get_by_id(user_id)

        success, second_user_id = User.create("second_user", hash_password("pw", app.config["SALT"]))
        assert success
        second_user = User.get_by_id(second_user_id)

        athlete = Athlete(
            athlete_id="athlete-1",
            first_name="Franz",
            last_name="Fischer",
            country_code=country.code,
            gender="m",
            discipline=discipline.id,
            ibu_id="IBU-1",
        )
        athlete.save_to_db()

        return {
            "country": country,
            "discipline": discipline,
            "event_type": event_type,
            "user": user,
            "second_user": second_user,
            "athlete": athlete,
        }


@pytest.fixture()
def client(app, base_data):
    """Flask test client bound to the app fixture with a logged-in user."""
    client = app.test_client()
    with client.session_transaction() as sess:
        sess.clear()
        # Flask-Login stores the user id in the session under "_user_id"
        sess["_user_id"] = base_data["user"].id
    return client
