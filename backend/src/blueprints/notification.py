from flask import Blueprint, request, jsonify
from flask_login import *
from firebase_admin import messaging
from src.models.notification_helper import NotificationHelper


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
        send_push_notification(response['device_token'], "Das hier ist ein Test", "Test123")
        return {'token': response }


@notification_blueprint.route('/send-notification', methods=['GET'])
def send_notification():
    print("LEL")
    token = request.args.get("token")
    title = request.args.get("title", 'Default Title')
    body = request.args.get("body", 'Default Body')

    if not token:
        return jsonify({'error': 'Token is required'}), 400

    try:
        send_push_notification(token, title, body)
        return jsonify({'success': True, 'message': 'NotificationHelper sent successfully!'}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    

def send_push_notification(token, title, body):
    # Construct the message
    message = messaging.Message(
        notification=messaging.Notification(
            title=title,
            body=body,
        ),
        token=token,
    )

    try:
        # Send the message
        response = messaging.send(message)
        print('Successfully sent message:', response)
    except Exception as e:
        print('Error sending message:', e)