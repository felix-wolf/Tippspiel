import src.utils as utils

from src.database import db_manager
from src.models.discipline import Discipline
from src.models.user import User
from src.models.base_model import BaseModel
from datetime import datetime

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

    def delete(self):
        """Instead of delete the game, will set it to invisible to prevent damage for accidental clicks"""
        sql = f"UPDATE {db_manager.TABLE_GAMES} SET visible = 0 WHERE id = ?"
        return db_manager.execute(sql, [self.id])
    
    def get_num_events(self, past):
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        if past:
            clause = f"datetime < '{now}'"
        else:
            clause = f"datetime > '{now}'"
        sql = f"SELECT COUNT(*) as num FROM {db_manager.TABLE_EVENTS} WHERE game_id = ? AND {clause}"
        num_events = db_manager.query_one(sql, [self.id])
        if num_events is not None:
            return True, num_events["num"]
        return False, None

    def update(self, name: str):
        sql = f"UPDATE {db_manager.TABLE_GAMES} SET name = ? WHERE id = ?"
        success = db_manager.execute(sql, [name, self.id])
        if success:
            return True, Game.get_by_id(self.id)
        return False, None

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
        sql = f"SELECT g.id FROM {db_manager.TABLE_GAMES} g WHERE g.visible = 1"
        game_ids = db_manager.query(sql)
        if not game_ids:
            game_ids = []
        return [Game.get_by_id(g['id']) for g in game_ids]

    @staticmethod
    def get_by_id(game_id):
        sql = f"SELECT g.* FROM {db_manager.TABLE_GAMES} g WHERE g.id = ? AND g.visible = 1"
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
    def get_base_data():
        raise NotImplementedError()