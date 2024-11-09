import utils

from database import db_manager
from models.discipline import Discipline
from models.user import User
from models.base_model import BaseModel


class Game(BaseModel):

    def __init__(self, name, pw_hash, creator: User, discipline: Discipline, game_id: str = None, players: [User] = None):
        if players is None:
            players = []
        if game_id:
            self.id = game_id
        else:
            self.id = utils.generate_id([name, creator.id, pw_hash])
        self.name = name
        self.pw_hash = pw_hash
        self.discipline = Discipline
        self.players = players
        self.creator = creator
        self.discipline = discipline

    def add_player(self, player: User):
        sql = f"""
            INSERT INTO {db_manager.TABLE_GAME_PLAYERS} 
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
            "creator": self.creator.to_dict(),
            "discipline": self.discipline.to_dict()
        }

    def save_to_db(self):
        sql = f"INSERT INTO {db_manager.TABLE_GAMES} (id, name, pw_hash, owner_id, discipline) VALUES (?,?,?,?,?)"
        first = db_manager.execute(sql, [self.id, self.name, self.pw_hash, self.creator.id, self.discipline.id])
        for player in self.players:
            sql = f"INSERT INTO {db_manager.TABLE_GAME_PLAYERS} (player_id, game_id) VALUES (?,?)"
            success = db_manager.execute(sql, [player.id, self.id])
            if not success:
                return False
        return first, self.id

    @staticmethod
    def from_dict(g_dict, discipline, creator, players=None):
        if g_dict:
            try:
                return Game(
                    game_id=g_dict['id'], name=g_dict['name'], discipline=discipline,
                    pw_hash=g_dict['pw_hash'], creator=creator, players=players
                )
            except KeyError as e:
                print("Could not instantiate game with given values:", g_dict)
                return None
        else:
            return None

    @staticmethod
    def get_all():
        sql = f"SELECT g.id FROM {db_manager.TABLE_GAMES} g"
        game_ids = db_manager.query(sql)
        if not game_ids:
            game_ids = []
        return [Game.get_by_id(g['id']) for g in game_ids]

    @staticmethod
    def get_by_id(game_id):
        sql = f"SELECT g.* FROM {db_manager.TABLE_GAMES} g WHERE g.id = ?"
        game = db_manager.query_one(sql, [game_id])
        if game:
            players = User.get_by_game_id(game['id'])
            creator = User.get_by_id(game['owner_id'])
            discipline = Discipline.get_by_id(game['discipline'])
            return Game.from_dict(g_dict=game, discipline=discipline, creator=creator, players=players)
        return None

    @staticmethod
    def create(user_id, name, pw_hash, discipline_name):
        # insert game
        creator = User.get_by_id(user_id)
        discipline = Discipline.get_by_id(discipline_name)
        game = Game(name=name, pw_hash=pw_hash, discipline=discipline, creator=creator, players=[creator])
        return game.save_to_db()

    @staticmethod
    def load_into_db():
        raise NotImplementedError()