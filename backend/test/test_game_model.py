from src.models.game import Game
from src.models.user import User
from src.utils import hash_password


def test_game_create_and_get(base_data, app):
    with app.app_context():
        # Create a second user to add as player later
        success, user_two_id = User.create("bob", hash_password("pw", app.config["SALT"]))
        assert success
        user_two = User.get_by_id(user_two_id)

        success, game_id = Game.create(
            user_id=base_data["user"].id,
            name="Winter Cup",
            pw_hash=None,
            discipline_name=base_data["discipline"].id,
        )
        assert success

        game = Game.get_by_id(game_id)
        assert game is not None
        assert game.creator.id == base_data["user"].id

        added = game.add_player(user_two)
        assert added
        refreshed = Game.get_by_id(game_id)
        assert len(refreshed.players) == 2


def test_game_update(base_data, app):
    with app.app_context():
        success, game_id = Game.create(
            user_id=base_data["user"].id,
            name="Old Name",
            pw_hash=None,
            discipline_name=base_data["discipline"].id,
        )
        assert success
        game = Game.get_by_id(game_id)
        success, updated = game.update("New Name")
        assert success
        assert updated.name == "New Name"
