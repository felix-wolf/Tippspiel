from datetime import datetime, timedelta

from src.models.athlete import Athlete
from src.models.event import Event
from src.models.game import Game
from src.models.result import Result
from src.models.country import Country


def _create_game(app, base_data, name: str):
    with app.app_context():
        success, game_id = Game.create(
            user_id=base_data["user"].id,
            name=name,
            pw_hash=None,
            discipline_name=base_data["discipline"].id,
        )
        assert success
        return game_id


def _create_shared_events(app, base_data):
    with app.app_context():
        first_game_id = _create_game(app, base_data, "Admin Shared Game 1")
        second_game_id = _create_game(app, base_data, "Admin Shared Game 2")

        first_event = Event(
            name="Antholz - Women Sprint",
            game_id=first_game_id,
            event_type=base_data["event_type"],
            dt=datetime.now() + timedelta(hours=1),
            allow_partial_points=False,
            source_provider="ibu",
            source_event_id="event-shared-1",
            source_race_id="race-shared-1",
            season_id="2526",
        )
        second_event = Event(
            name="Antholz - Women Sprint",
            game_id=second_game_id,
            event_type=base_data["event_type"],
            dt=datetime.now() + timedelta(hours=1),
            allow_partial_points=False,
            source_provider="ibu",
            source_event_id="event-shared-2",
            source_race_id="race-shared-1",
            season_id="2526",
        )
        first_event.save_to_db()
        second_event.save_to_db()
        return first_game_id, second_game_id, first_event.id, second_event.id, first_event.shared_event_id


def test_admin_shared_events_list_groups_linked_events(admin_client, app, base_data):
    _, _, first_event_id, _, shared_event_id = _create_shared_events(app, base_data)

    with app.app_context():
        saved_result = Result(
            event_id=first_event_id,
            place=1,
            object_id=base_data["athlete"].id,
            object_name="Franz Fischer",
        )
        success, _ = saved_result.save_to_db()
        assert success

    response = admin_client.get("/api/admin/shared-events")

    assert response.status_code == 200
    payload = response.get_json()
    assert len(payload) == 1
    assert payload[0]["shared_event_id"] == shared_event_id
    assert payload[0]["linked_event_count"] == 2
    assert payload[0]["with_results_count"] == 1
    assert payload[0]["without_results_count"] == 1
    assert payload[0]["flags"]["can_refresh_results"] is True
    assert payload[0]["flags"]["missing_results"] is True
    assert payload[0]["flags"]["has_inconsistent_result_state"] is True


def test_admin_shared_event_detail_returns_linked_events(admin_client, app, base_data):
    _, _, _, _, shared_event_id = _create_shared_events(app, base_data)

    response = admin_client.get(f"/api/admin/shared-events/{shared_event_id}")

    assert response.status_code == 200
    payload = response.get_json()
    assert payload["shared_event_id"] == shared_event_id
    assert len(payload["linked_events"]) == 2
    assert payload["target_event_id"] == payload["linked_events"][0]["event_id"]


def test_admin_shared_event_source_update_rewrites_linked_events(admin_client, app, base_data):
    _, _, first_event_id, second_event_id, shared_event_id = _create_shared_events(app, base_data)

    response = admin_client.put(
        f"/api/admin/shared-events/{shared_event_id}/source",
        json={
            "source_provider": "ibu",
            "source_event_id": "event-updated",
            "source_race_id": "race-updated",
            "season_id": "2627",
        },
    )

    assert response.status_code == 200
    payload = response.get_json()
    assert payload["shared_event_id"] == "official:ibu:race-updated"
    assert payload["source_event_id"] == "event-updated"
    assert payload["season_id"] == "2627"

    with app.app_context():
        first_event = Event.get_by_id(first_event_id, get_full_object=False)
        second_event = Event.get_by_id(second_event_id, get_full_object=False)
        assert first_event.shared_event_id == "official:ibu:race-updated"
        assert second_event.shared_event_id == "official:ibu:race-updated"
        assert first_event.source_race_id == "race-updated"
        assert second_event.source_race_id == "race-updated"


def test_admin_shared_event_source_update_rejects_collisions(admin_client, app, base_data):
    first_game_id = _create_game(app, base_data, "Collision Game")
    with app.app_context():
        first_event = Event(
            name="Event A",
            game_id=first_game_id,
            event_type=base_data["event_type"],
            dt=datetime.now() + timedelta(hours=1),
            allow_partial_points=False,
            source_provider="ibu",
            source_event_id="event-a",
            source_race_id="race-a",
        )
        second_event = Event(
            name="Event B",
            game_id=first_game_id,
            event_type=base_data["event_type"],
            dt=datetime.now() + timedelta(hours=2),
            allow_partial_points=False,
            source_provider="ibu",
            source_event_id="event-b",
            source_race_id="race-b",
        )
        first_event.save_to_db()
        second_event.save_to_db()

    response = admin_client.put(
        f"/api/admin/shared-events/{first_event.shared_event_id}/source",
        json={
            "source_provider": "ibu",
            "source_event_id": "event-b",
            "source_race_id": "race-b",
            "season_id": "2526",
        },
    )

    assert response.status_code == 409
    assert "kollidieren" in response.get_json()["error"]


def test_admin_country_diagnostics_lists_placeholder_countries(admin_client, app, base_data):
    with app.app_context():
        placeholder_country = Country(code="BRT", name="BRT", flag="🏴‍☠️")
        placeholder_country.save_to_db()
        athlete = Athlete(
            athlete_id="athlete-brt",
            first_name="Darya",
            last_name="Dolidovich",
            country_code="BRT",
            gender="f",
            discipline=base_data["discipline"].id,
            ibu_id="IBU-BRT-1",
        )
        success, _ = athlete.save_to_db()
        assert success

    response = admin_client.get("/api/admin/countries")

    assert response.status_code == 200
    payload = response.get_json()
    assert len(payload) == 1
    assert payload[0]["code"] == "BRT"
    assert payload[0]["flag"] == "🏴‍☠️"
    assert payload[0]["athlete_count"] == 1
    assert payload[0]["athlete_examples"] == ["Darya Dolidovich"]


def test_admin_country_update_persists_name_and_flag(admin_client, app):
    with app.app_context():
        placeholder_country = Country(code="BRT", name="BRT", flag="🏴‍☠️")
        placeholder_country.save_to_db()

    response = admin_client.put(
        "/api/admin/countries/BRT",
        json={"name": "Belarus", "flag": "🇧🇾"},
    )

    assert response.status_code == 200
    payload = response.get_json()
    assert payload["name"] == "Belarus"
    assert payload["flag"] == "🇧🇾"

    with app.app_context():
        updated = Country.get_by_id("BRT")
        assert updated is not None
        assert updated.name == "Belarus"
        assert updated.flag == "🇧🇾"


def test_admin_endpoints_require_admin(client, app, base_data):
    _, _, _, _, shared_event_id = _create_shared_events(app, base_data)

    shared_list = client.get("/api/admin/shared-events")
    shared_detail = client.get(f"/api/admin/shared-events/{shared_event_id}")
    shared_update = client.put(
        f"/api/admin/shared-events/{shared_event_id}/source",
        json={
            "source_provider": "ibu",
            "source_event_id": "event-updated",
            "source_race_id": "race-updated",
        },
    )
    country_list = client.get("/api/admin/countries")
    country_update = client.put("/api/admin/countries/BRT", json={"name": "Belarus", "flag": "🇧🇾"})

    assert shared_list.status_code == 403
    assert shared_detail.status_code == 403
    assert shared_update.status_code == 403
    assert country_list.status_code == 403
    assert country_update.status_code == 403
