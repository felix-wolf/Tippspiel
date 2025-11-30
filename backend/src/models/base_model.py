from abc import ABC, abstractmethod


class BaseModel(ABC):

    @abstractmethod
    def save_to_db(self):
        raise NotImplementedError()

    @abstractmethod
    def to_dict(self):
        raise NotImplementedError()

    @staticmethod
    @abstractmethod
    def from_dict(**kwargs):
        raise NotImplementedError()

    @staticmethod
    @abstractmethod
    def get_by_id(i):
        raise NotImplementedError()

    @staticmethod
    @abstractmethod
    def get_all():
        raise NotImplementedError()

    @staticmethod
    @abstractmethod
    def get_base_data():
        raise NotImplementedError()
