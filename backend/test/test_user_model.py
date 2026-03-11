from src.models.user import User
from src.utils import hash_password, password_hash_needs_upgrade


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


def test_user_authenticate_upgrades_legacy_hash(base_data, app):
    with app.app_context():
        user = User.authenticate("tester", "pw", app.config["SALT"])
        assert user is not None
        upgraded = User.get_by_id(base_data["user"].id)
        assert upgraded is not None
        assert not password_hash_needs_upgrade(upgraded.pw_hash)


def test_user_update_admin_flag(app):
    with app.app_context():
        success, user_id = User.create("admin-candidate", hash_password("pw", app.config["SALT"]))
        assert success
        user = User.get_by_id(user_id)
        assert user is not None
        assert user.is_admin is False
        assert user.update_admin_flag(True)

        updated = User.get_by_id(user_id)
        assert updated is not None
        assert updated.is_admin is True
