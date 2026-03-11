from datetime import datetime, timedelta

import pytest

from src.athlete_duplicates import build_merge_preview, find_duplicate_candidates, merge_athletes, resolve_existing_athlete
from src.database import db_manager
from src.models.athlete import Athlete
from src.models.bet import Bet, Prediction
from src.models.event import Event
from src.models.game import Game
from src.models.result import Result


def _create_event(app, base_data, name="Dedup Game"):
    with app.app_context():
        success, game_id = Game.create(
            user_id=base_data["user"].id,
            name=name,
            pw_hash=None,
            discipline_name=base_data["discipline"].id,
        )
        assert success
        event = Event(
            name="Dedup Event",
            game_id=game_id,
            event_type=base_data["event_type"],
            dt=datetime.now() + timedelta(hours=1),
            allow_partial_points=True,
            num_bets=1,
            points_correct_bet=5,
        )
        event.save_to_db()
        return event


def test_find_duplicate_candidates_detects_added_middle_name(app, base_data):
    with app.app_context():
        athlete_a = Athlete(
            athlete_id="athlete-a",
            first_name="Johannes",
            last_name="Boe",
            country_code=base_data["country"].code,
            gender="m",
            discipline=base_data["discipline"].id,
        )
        athlete_b = Athlete(
            athlete_id="athlete-b",
            first_name="Johannes Thingnes",
            last_name="Boe",
            country_code=base_data["country"].code,
            gender="m",
            discipline=base_data["discipline"].id,
        )
        athlete_a.save_to_db()
        athlete_b.save_to_db()

        candidates = find_duplicate_candidates(min_score=0.9)
        match = next(
            (
                candidate
                for candidate in candidates
                if {candidate["left"]["id"], candidate["right"]["id"]} == {"athlete-a", "athlete-b"}
            ),
            None,
        )
        assert match is not None


def test_resolve_existing_athlete_reuses_id_for_middle_name_variant(app, base_data):
    with app.app_context():
        athlete_a = Athlete(
            athlete_id="athlete-a",
            first_name="Johan-Olav",
            last_name="Botn",
            country_code="NOR",
            gender="m",
            discipline=base_data["discipline"].id,
        )
        athlete_b = Athlete(
            athlete_id=None,
            first_name="Johan-Olav Smoerdal",
            last_name="Botn",
            country_code="NOR",
            gender="?",
            discipline=base_data["discipline"].id,
        )
        athlete_a.save_to_db()

        resolved, score = resolve_existing_athlete(athlete_b)
        assert resolved is not None
        assert resolved.id == athlete_a.id
        assert score >= 0.95


def test_merge_athletes_updates_all_references_and_deletes_old_athlete(app, base_data):
    event = _create_event(app, base_data)

    with app.app_context():
        old_athlete = Athlete(
            athlete_id="athlete-old",
            first_name="Johannes",
            last_name="Boe",
            country_code=base_data["country"].code,
            gender="m",
            discipline=base_data["discipline"].id,
        )
        new_athlete = Athlete(
            athlete_id="athlete-new",
            first_name="Johannes Thingnes",
            last_name="Boe",
            country_code=base_data["country"].code,
            gender="m",
            discipline=base_data["discipline"].id,
        )
        old_athlete.save_to_db()
        new_athlete.save_to_db()

        bet = Bet(user_id=base_data["user"].id, event_id=event.id, predictions=[], score=None)
        bet.predictions = [
            Prediction(
                bet_id=bet.id,
                object_id=old_athlete.id,
                object_name=old_athlete.last_name,
                predicted_place=1,
            )
        ]
        bet.save_to_db()

        result = Result(
            event_id=event.id,
            place=1,
            object_id=old_athlete.id,
            object_name=old_athlete.last_name,
        )
        result.save_to_db()

        merge_result = merge_athletes(old_athlete.id, new_athlete.id)
        assert merge_result.updated_predictions == 1
        assert merge_result.updated_results == 1

        assert Athlete.get_by_id(old_athlete.id) is None
        assert Athlete.get_by_id(new_athlete.id) is not None

        predictions = db_manager.query(
            f"SELECT id, object_id FROM {db_manager.TABLE_PREDICTIONS} WHERE bet_id = ?",
            [bet.id],
        )
        results = db_manager.query(
            f"SELECT id, object_id FROM {db_manager.TABLE_RESULTS} WHERE event_id = ?",
            [event.id],
        )

        assert predictions[0]["object_id"] == new_athlete.id
        assert results[0]["object_id"] == new_athlete.id


def test_merge_athletes_blocks_conflicting_prediction_ids(app, base_data):
    event = _create_event(app, base_data, name="Dedup Collision Game")

    with app.app_context():
        old_athlete = Athlete(
            athlete_id="athlete-old",
            first_name="Johannes",
            last_name="Boe",
            country_code=base_data["country"].code,
            gender="m",
            discipline=base_data["discipline"].id,
        )
        new_athlete = Athlete(
            athlete_id="athlete-new",
            first_name="Johannes Thingnes",
            last_name="Boe",
            country_code=base_data["country"].code,
            gender="m",
            discipline=base_data["discipline"].id,
        )
        old_athlete.save_to_db()
        new_athlete.save_to_db()

        bet = Bet(user_id=base_data["user"].id, event_id=event.id, predictions=[], score=None)
        bet.predictions = [
            Prediction(
                bet_id=bet.id,
                object_id=old_athlete.id,
                object_name=old_athlete.last_name,
                predicted_place=1,
            )
        ]
        bet.save_to_db()

        duplicate_prediction = Prediction(
            bet_id=bet.id,
            object_id=new_athlete.id,
            object_name=new_athlete.last_name,
            predicted_place=1,
        )
        duplicate_prediction.save_to_db()

        preview = build_merge_preview(old_athlete.id, new_athlete.id)
        assert len(preview["conflicts"]) == 1

        with pytest.raises(ValueError, match="kollidierender Referenzen"):
            merge_athletes(old_athlete.id, new_athlete.id)


def test_process_athletes_reuses_existing_athlete_for_name_variant(app, base_data):
    with app.app_context():
        existing_athlete = Athlete(
            athlete_id="athlete-existing",
            first_name="Johan-Olav",
            last_name="Botn",
            country_code="NOR",
            gender="m",
            discipline=base_data["discipline"].id,
        )
        existing_athlete.save_to_db()

        resolved = base_data["discipline"].process_athletes(
            [
                Athlete(
                    athlete_id=None,
                    first_name="Johan-Olav Smoerdal",
                    last_name="Botn",
                    country_code="NOR",
                    gender="?",
                    discipline=base_data["discipline"].id,
                )
            ]
        )
        assert len(resolved) == 1
        assert resolved[0].id == existing_athlete.id

        athletes = db_manager.query(
            f"SELECT id, first_name, last_name FROM {db_manager.TABLE_ATHLETES} WHERE country_code = ?",
            ["NOR"],
        )
        assert len(athletes) == 1


def test_process_athletes_logs_resolution_and_creation(app, base_data, caplog):
    with app.app_context():
        caplog.set_level("INFO", logger=app.logger.name)

        existing_athlete = Athlete(
            athlete_id="athlete-existing",
            first_name="Johan-Olav",
            last_name="Botn",
            country_code="NOR",
            gender="m",
            discipline=base_data["discipline"].id,
        )
        existing_athlete.save_to_db()

        resolved = base_data["discipline"].process_athletes(
            [
                Athlete(
                    athlete_id=None,
                    first_name="Johan-Olav Smoerdal",
                    last_name="Botn",
                    country_code="NOR",
                    gender="?",
                    discipline=base_data["discipline"].id,
                ),
                Athlete(
                    athlete_id=None,
                    first_name="Campbell",
                    last_name="Wright",
                    country_code="USA",
                    gender="m",
                    discipline=base_data["discipline"].id,
                ),
            ]
        )

        assert resolved[0].id == existing_athlete.id
        assert any("Resolved imported athlete" in record.message for record in caplog.records)
        assert any("Created new athlete" in record.message for record in caplog.records)
