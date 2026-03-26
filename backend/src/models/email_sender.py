from html import escape
from urllib.parse import quote

import requests
from flask import current_app


class EmailSender:
    RESEND_API_URL = "https://api.resend.com/emails"

    @staticmethod
    def is_configured(config) -> bool:
        return all(
            [
                config.get("RESEND_API_KEY"),
                config.get("EMAIL_FROM"),
                config.get("APP_BASE_URL"),
            ]
        )

    @staticmethod
    def build_password_reset_url(reset_token: str) -> str:
        base_url = current_app.config["APP_BASE_URL"].rstrip("/")
        path = current_app.config.get("PASSWORD_RESET_PATH", "/reset-password")
        normalized_path = path if path.startswith("/") else f"/{path}"
        return f"{base_url}{normalized_path}?token={quote(reset_token)}"

    @staticmethod
    def send_password_reset_email(to_email: str, reset_token: str):
        if not EmailSender.is_configured(current_app.config):
            raise RuntimeError("Resend email sending is not configured.")

        reset_url = EmailSender.build_password_reset_url(reset_token)
        payload = {
            "from": current_app.config["EMAIL_FROM"],
            "to": [to_email],
            "subject": "Passwort zuruecksetzen",
            "html": (
                "<p>Du hast ein neues Passwort angefordert.</p>"
                f"<p><a href=\"{escape(reset_url, quote=True)}\">Passwort zuruecksetzen</a></p>"
                "<p>Der Link ist nur fuer kurze Zeit gueltig.</p>"
            ),
            "text": (
                "Du hast ein neues Passwort angefordert.\n\n"
                f"Passwort zuruecksetzen: {reset_url}\n\n"
                "Der Link ist nur fuer kurze Zeit gueltig."
            ),
        }
        reply_to = current_app.config.get("EMAIL_REPLY_TO")
        if reply_to:
            payload["reply_to"] = reply_to

        response = requests.post(
            EmailSender.RESEND_API_URL,
            headers={
                "Authorization": f"Bearer {current_app.config['RESEND_API_KEY']}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=10,
        )
        response.raise_for_status()
        return response.json()
