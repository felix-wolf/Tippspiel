import hashlib

from backend.database import db_manager
from backend.models.user import User


class Game:

    def __init__(self, game_id, name, pw_hash, creator: User, players: [User] = []):
        self.id = game_id
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

    @staticmethod
    def from_dict(g_dict, creator, players=[]):
        if g_dict:
            try:
                return Game(g_dict['id'], g_dict['name'], g_dict['pw_hash'], creator, players)
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
        game_id = hashlib.md5("".join([user_id, name, str(pw_hash)]).encode('utf-8')).hexdigest()
        sql = f"INSERT INTO {db_manager.TABLE_NAME_GAMES} (id, name, pw_hash, owner_id) VALUES (?,?,?,?)"
        first = db_manager.execute(sql, [game_id, name, pw_hash, user_id])
        # insert player into game
        sql = f"INSERT INTO {db_manager.TABLE_NAME_GAME_PLAYERS} (player_id, game_id) VALUES (?,?)"
        second = db_manager.execute(sql, [user_id, game_id])
        return first and second, game_id
