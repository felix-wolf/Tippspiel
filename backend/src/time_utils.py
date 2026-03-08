from datetime import datetime
from zoneinfo import ZoneInfo


BERLIN_TIMEZONE = ZoneInfo("Europe/Berlin")


def berlin_now():
    return datetime.now(BERLIN_TIMEZONE)


def ensure_berlin_time(dt: datetime):
    if dt.tzinfo is None:
        return dt.replace(tzinfo=BERLIN_TIMEZONE)
    return dt.astimezone(BERLIN_TIMEZONE)


def berlin_local_now_naive():
    return berlin_now().replace(tzinfo=None)
