from datetime import datetime, timedelta

from src.models.athlete import Athlete
from src.models.country import Country
from src.models.event import Event
from src.models.event_type import EventType
from src.models.game import Game
from src.models.result import Result
from src.models.user import User


def test_game_stats_endpoint_returns_user_stats(client, app, base_data):
    with app.app_context():
        success, game_id = Game.create(
            user_id=base_data["user"].id,
            name="Stats Game",
            pw_hash=None,
            discipline_name=base_data["discipline"].id,
        )
        assert success

        game = Game.get_by_id(game_id)
        assert game is not None

        second_user = User.get_by_id(base_data["second_user"].id)
        assert second_user is not None
        assert game.add_player(second_user)

        athlete_two = Athlete(
            athlete_id="athlete-2",
            first_name="Simon",
            last_name="Eder",
            country_code=base_data["country"].code,
            gender="m",
            discipline=base_data["discipline"].id,
        )
        athlete_three = Athlete(
            athlete_id="athlete-3",
            first_name="Johannes",
            last_name="Boe",
            country_code=base_data["country"].code,
            gender="m",
            discipline=base_data["discipline"].id,
        )
        athlete_two.save_to_db()
        athlete_three.save_to_db()
        relay_event_type = EventType(
            name="relay",
            display_name="Relay",
            discipline_id=base_data["discipline"].id,
            betting_on="countries",
        )
        relay_event_type.save_to_db()
        france = Country(code="FRA", name="Frankreich", flag="FRA")
        france.save_to_db()

        event_one = Event(
            name="Oberhof - Men Sprint",
            game_id=game_id,
            event_type=base_data["event_type"],
            dt=datetime.now() + timedelta(hours=1),
            allow_partial_points=False,
            num_bets=1,
            points_correct_bet=5,
        )
        event_two = Event(
            name="Antholz - Men Pursuit",
            game_id=game_id,
            event_type=base_data["event_type"],
            dt=datetime.now() + timedelta(hours=2),
            allow_partial_points=False,
            num_bets=1,
            points_correct_bet=5,
        )
        event_three = Event(
            name="Ruhpolding - Men Individual",
            game_id=game_id,
            event_type=base_data["event_type"],
            dt=datetime.now() + timedelta(hours=3),
            allow_partial_points=False,
            num_bets=1,
            points_correct_bet=7,
        )
        relay_event = Event(
            name="Oberhof - Mixed Relay",
            game_id=game_id,
            event_type=relay_event_type,
            dt=datetime.now() + timedelta(hours=4),
            allow_partial_points=False,
            num_bets=1,
            points_correct_bet=9,
        )
        for event in [event_one, event_two, event_three, relay_event]:
            event.save_to_db()

        assert event_one.save_bet(
            base_data["user"].id,
            [{"object_id": base_data["athlete"].id, "predicted_place": 1, "object_name": "Franz Fischer"}],
        )[0]
        assert event_one.save_bet(
            base_data["second_user"].id,
            [{"object_id": athlete_two.id, "predicted_place": 1, "object_name": "Simon Eder"}],
        )[0]

        assert event_two.save_bet(
            base_data["user"].id,
            [{"object_id": base_data["athlete"].id, "predicted_place": 1, "object_name": "Franz Fischer"}],
        )[0]
        assert event_two.save_bet(
            base_data["second_user"].id,
            [{"object_id": athlete_two.id, "predicted_place": 1, "object_name": "Simon Eder"}],
        )[0]

        assert event_three.save_bet(
            base_data["user"].id,
            [{"object_id": athlete_three.id, "predicted_place": 1, "object_name": "Johannes Boe"}],
        )[0]
        assert event_three.save_bet(
            base_data["second_user"].id,
            [{"object_id": athlete_two.id, "predicted_place": 1, "object_name": "Simon Eder"}],
        )[0]
        assert relay_event.save_bet(
            base_data["user"].id,
            [{"object_id": france.code, "predicted_place": 1, "object_name": france.name}],
        )[0]
        assert relay_event.save_bet(
            base_data["second_user"].id,
            [{"object_id": base_data["country"].code, "predicted_place": 1, "object_name": base_data["country"].name}],
        )[0]

        refreshed_event_one = Event.get_by_id(event_one.id)
        refreshed_event_two = Event.get_by_id(event_two.id)
        refreshed_event_three = Event.get_by_id(event_three.id)
        refreshed_relay_event = Event.get_by_id(relay_event.id)
        assert refreshed_event_one is not None
        assert refreshed_event_two is not None
        assert refreshed_event_three is not None
        assert refreshed_relay_event is not None

        assert refreshed_event_one.process_results(
            [
                Result(refreshed_event_one.id, 1, base_data["athlete"].id),
                Result(refreshed_event_one.id, 2, athlete_two.id),
            ]
        )[0]
        assert refreshed_event_two.process_results(
            [
                Result(refreshed_event_two.id, 1, athlete_two.id),
                Result(refreshed_event_two.id, 2, base_data["athlete"].id),
            ]
        )[0]
        assert refreshed_event_three.process_results(
            [
                Result(refreshed_event_three.id, 1, athlete_three.id),
                Result(refreshed_event_three.id, 2, athlete_two.id),
            ]
        )[0]
        assert refreshed_relay_event.process_results(
            [
                Result(refreshed_relay_event.id, 1, france.code),
                Result(refreshed_relay_event.id, 2, base_data["country"].code),
            ]
        )[0]

    response = client.get("/api/game/stats", query_string={"game_id": game_id})

    assert response.status_code == 200
    payload = response.get_json()

    assert payload["overview"]["total_points"] == 21.0
    assert payload["overview"]["resolved_predictions"] == 4
    assert payload["overview"]["resolved_events"] == 4
    assert payload["overview"]["exact_hits"] == 3

    assert payload["locations"]["best_total_points"]["name"] == "Oberhof"
    assert payload["locations"]["best_total_points"]["points"] == 14.0
    assert payload["locations"]["best_vs_opponents"]["name"] == "Oberhof"
    assert payload["locations"]["best_vs_opponents"]["delta"] == 14.0
    assert payload["locations"]["worst_total_points"]["name"] == "Antholz"
    assert payload["locations"]["worst_total_points"]["points"] == 0.0
    assert payload["locations"]["worst_vs_opponents"]["name"] == "Antholz"
    assert payload["locations"]["worst_vs_opponents"]["delta"] == -5.0

    assert payload["race_formats"]["best_total_points"]["name"] == "mixed relay"
    assert payload["race_formats"]["best_total_points"]["points"] == 9.0
    assert payload["race_formats"]["worst_total_points"]["name"] == "pursuit"

    assert payload["athletes"]["most_picked"]["id"] == base_data["athlete"].id
    assert payload["athletes"]["most_points"]["id"] == athlete_three.id
    assert payload["athletes"]["low_return_frequent"]["id"] == base_data["athlete"].id
    assert payload["athletes"]["most_points"]["name"] != "Frankreich"
    assert payload["countries"]["most_points"]["name"] == "FRA  Frankreich"
    assert payload["countries"]["most_points"]["points"] == 9.0
    assert payload["countries"]["low_return_frequent"]["name"] == "FRA  Frankreich"

    assert payload["events"]["best_event"]["name"] == "Oberhof - Mixed Relay"
    assert payload["events"]["worst_event"]["name"] == "Antholz - Men Pursuit"

    second_response = client.get(
        "/api/game/stats",
        query_string={"game_id": game_id, "user_id": base_data["second_user"].id},
    )
    assert second_response.status_code == 200
    second_payload = second_response.get_json()

    assert second_payload["overview"]["total_points"] == 5.0
    assert second_payload["overview"]["resolved_predictions"] == 4
    assert second_payload["athletes"]["most_points"]["name"] == "GER  Simon Eder"
    assert second_payload["countries"]["most_points"]["name"] == "GER  Germany"
