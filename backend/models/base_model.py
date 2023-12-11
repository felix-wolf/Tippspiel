import abc


class BaseModel:
    __metaclass__ = abc.ABCMeta

    @abc.abstractmethod
    def save_to_db(self):
        return

    @abc.abstractmethod
    def to_dict(self):
        return

    @staticmethod
    @abc.abstractmethod
    def from_dict(**kwargs):
        return

    @staticmethod
    @abc.abstractmethod
    def get_by_id(i):
        return

    @staticmethod
    @abc.abstractmethod
    def get_all():
        return

    @staticmethod
    @abc.abstractmethod
    def load_into_db():
        return
