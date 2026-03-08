from datetime import datetime, timedelta

import pytz

from src.models.event import Event
from src.models.game import Game
from src.models.notification_helper import NotificationHelper


def send_due_bet_reminders(now=None):
    timezone = pytz.timezone("CET")
    current_time = now or datetime.now(timezone)

    for game in Game.get_all():
        events = Event.get_all_by_game_id(game.id, get_full_objects=False)
        upcoming_events = [
            event
            for event in events
            if timedelta(minutes=63)
            > (timezone.localize(event.dt) - current_time)
            > timedelta(minutes=58)
        ]
        if not upcoming_events:
            continue

        for event in upcoming_events:
            players_without_bets = list(
                set(player.id for player in game.players).difference(set(event.has_bets_for_users))
            )
            tokens = NotificationHelper.get_tokens_for_users(
                players_without_bets,
                check_reminder=True,
            )
            for token_data in tokens:
                NotificationHelper.send_push_notification(
                    token_data["device_token"],
                    event.name,
                    f"Rennen startet in einer Stunde um {timezone.localize(event.dt).strftime('%H:%M')}!",
                )
            break

    return {"status": "success"}, None, None
