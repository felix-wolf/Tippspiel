from flask import Blueprint, request, jsonify
from flask_login import *
from src.models.notification_helper import NotificationHelper
from datetime import datetime, timedelta
from src.models.event import Event
from src.models.game import Game
import pytz

notification_blueprint = Blueprint('notification', __name__)

@notification_blueprint.route("/api/notification/register_device", methods=['GET', 'POST'])
@login_required
def register_device():
    if request.method == "GET":
        return "not supported", 400
    if request.method == "POST":
        token = request.get_json().get("token")
        user_id = request.get_json().get("user_id")
        platform = request.get_json().get("platform")
        if any([x is None for x in [token, user_id, platform]]):
            return "missing param", 400
        
        NotificationHelper.save_to_db(token=token, user_id=user_id, platform=platform)
        return {'token': token }
    
@notification_blueprint.route("/api/notification/test", methods=['POST'])
@login_required
def send_test_notification():
    if request.method == "POST":
        user_id = request.get_json().get("user_id")
        platform = request.get_json().get("platform")
        if any([x is None for x in [user_id, platform]]):
            return "missing param", 400
        
        response = NotificationHelper.get_token(user_id=user_id, platform=platform)
        if not response:
            return "No token found", 404
        NotificationHelper.send_push_notification(response['device_token'], "Das hier ist ein Test", "Test123")
        return {'token': response }


@notification_blueprint.route('/api/notification/check', methods=['GET'])
def send_notification():
    now = datetime.now(pytz.timezone('CET'))
    games = Game.get_all()
    for game in games:
        events = Event.get_all_by_game_id(game.id, get_full_objects=False)
        events = [event for event in events if timedelta(minutes=63) > (pytz.timezone('CET').localize(event.dt) - now) > timedelta(minutes=58)]
        if len(events) == 0:
            continue
        for event in events:
            players_without_bets = list(set([player.id for player in game.players]).difference(set(event.has_bets_for_users)))
            result = NotificationHelper.get_tokens_for_users(players_without_bets, check_reminder=True)
            for res in result:
                try:
                    NotificationHelper.send_push_notification(res['device_token'], f"Rennen startet in einer Stunde um {pytz.timezone('CET').localize(event.dt).strftime("%H:%M")}!", event.name)
                except Exception as e:
                    return jsonify({'success': False, 'error': str(e)}), 500
            break
    return "Success", 200
    

@notification_blueprint.route('/api/notification/settings', methods=['GET', 'POST'])
def settings():
    if request.method == "GET":
        user_id = request.args.get("user_id")
        platform = request.args.get("platform")
        return NotificationHelper.get_notification_settings_for_user(user_id=user_id, platform=platform)
    if request.method == "POST":
        user_id = request.get_json().get("user_id")
        platform = request.get_json().get("platform")
        setting = request.get_json().get("setting")
        value = request.get_json().get("value")
        success = NotificationHelper.save_setting(user_id=user_id, platform=platform, setting=setting, value=bool(int(value)))
        if not success:
            return "Error", 500
    return {"Code": 200}