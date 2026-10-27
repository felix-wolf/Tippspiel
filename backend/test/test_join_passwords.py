import pytest

from src.models.game import Game
from src.utils import hash_game_password


@pytest.mark.parametrize("password_payload", [{}, {"password": ""}, {"password": None}])
@pytest.mark.parametrize("protected", [False, True])
def test_join_password_requirement(app, base_data, password_payload, protected):
    success, game_id = Game.create(
        user_id=base_data["user"].id, name="Join Password Test",
        pw_hash=hash_game_password("123") if protected else None,
        discipline_name=base_data["discipline"].id,
    )
    assert success
    client = app.test_client()
    assert client.post("/api/login", json={"name": base_data["second_user"].name, "password": "pw"}).status_code == 200
    response = client.post("/api/game/join", json={"game_id": game_id, **password_payload})
    assert response.status_code == (400 if protected else 200)
    member_ids = [player.id for player in Game.get_by_id(game_id).players]
    assert (base_data["second_user"].id in member_ids) is not protected
