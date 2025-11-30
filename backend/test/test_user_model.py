from src.models.user import User
from src.utils import hash_password


def test_user_create_and_get(app):
    with app.app_context():
        success, user_id = User.create("alice", hash_password("pw", app.config["SALT"]))
        assert success

        fetched = User.get_by_id(user_id)
        assert fetched is not None
        assert fetched.name == "alice"
        assert fetched.color is not None


def test_user_update_color(base_data, app):
    with app.app_context():
        user = base_data["user"]
        updated = user.update_color("#123456")
        assert updated
        fetched = User.get_by_id(user.id)
        assert fetched.color == "#123456"


def test_user_credentials_lookup(base_data, app):
    with app.app_context():
        pw_hash = hash_password("pw", app.config["SALT"])
        user = User.get_by_credentials("tester", pw_hash)
        assert user is not None
        assert user.name == "tester"
