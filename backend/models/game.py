import hashlib

from backend.database import db_manager
from backend.models.user import User


class Game:

    def __init__(self, name, pw_hash, creator: User, game_id=None, players=None):
        if players is None:
            players = []
        if game_id:
            self.id = game_id
        else:
            self.id = hashlib.md5("".join([name, creator.id, str(pw_hash)]).encode('utf-8')).hexdigest()
        self.name = name
        self.pw_hash = pw_hash
        self.players = players
        self.creator = creator

    def add_player(self, player: User):
        sql = f"""
            INSERT INTO {db_manager.TABLE_NAME_GAME_PLAYERS} 
            (player_id, game_id) VALUES (?,?)
        """
        success = db_manager.execute(sql, [player.id, self.id])
        if success:
            self.players.append(player)
        return success

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "pw_set": self.pw_hash is not None,
            "players": [p.to_dict() for p in self.players],
            "creator": self.creator.to_dict()
        }

    def save_to_db(self):
        sql = f"INSERT INTO {db_manager.TABLE_NAME_GAMES} (id, name, pw_hash, owner_id) VALUES (?,?,?,?)"
        first = db_manager.execute(sql, [self.id, self.name, self.pw_hash, self.creator.id])
        for player in self.players:
            sql = f"INSERT INTO {db_manager.TABLE_NAME_GAME_PLAYERS} (player_id, game_id) VALUES (?,?)"
            success = db_manager.execute(sql, [player.id, self.id])
            if not success:
                return False
        return first, self.id

    @staticmethod
    def from_dict(g_dict, creator, players=None):
        if g_dict:
            try:
                return Game(
                    game_id=g_dict['id'], name=g_dict['name'],
                    pw_hash=g_dict['pw_hash'], creator=creator, players=players
                )
            except KeyError as e:
                print("Could not instantiate game with given values:", g_dict)
                return None
        else:
            return None

    @staticmethod
    def get_all():
        sql = f"SELECT g.id FROM {db_manager.TABLE_NAME_GAMES} g"
        game_ids = db_manager.query(sql)
        if not game_ids:
            game_ids = []
        return [Game.get_by_id(id['id']) for id in game_ids]

    @staticmethod
    def get_by_id(game_id):
        sql = f"SELECT g.* FROM {db_manager.TABLE_NAME_GAMES} g WHERE g.id = ?"
        game = db_manager.query_one(sql, [game_id])
        if game:
            players = User.get_by_game_id(game['id'])
            creator = User.get_by_id(game['owner_id'])
            return Game.from_dict(game, creator, players=players)
        return None

    @staticmethod
    def create(user_id, name, pw_hash):
        # insert game
        creator = User.get_by_id(user_id)
        game = Game(name=name, pw_hash=pw_hash, creator=creator, players=[creator])
        return game.save_to_db()

