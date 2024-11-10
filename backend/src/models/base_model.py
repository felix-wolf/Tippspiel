from abc import ABC, abstractmethod


class BaseModel(ABC):

    @abstractmethod
    def save_to_db(self):
        return

    @abstractmethod
    def to_dict(self):
        return

    @staticmethod
    @abstractmethod
    def from_dict(**kwargs):
        return

    @staticmethod
    @abstractmethod
    def get_by_id(i):
        return

    @staticmethod
    @abstractmethod
    def get_all():
        return

    @staticmethod
    @abstractmethod
    def load_into_db():
        return
