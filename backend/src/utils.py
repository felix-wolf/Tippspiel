import hashlib
import hmac
import random
from werkzeug.security import check_password_hash, generate_password_hash


def generate_id(field_array):
    return hashlib.md5("".join([str(i) for i in field_array]).encode('utf8')).hexdigest()


def hash_password(pw, salt):
    return hashlib.sha256("".join([pw, salt]).encode('utf-8')).hexdigest()


def hash_user_password(pw):
    return generate_password_hash(pw, method="pbkdf2:sha256:600000")


def password_hash_needs_upgrade(stored_hash):
    return not (stored_hash.startswith("pbkdf2:") or stored_hash.startswith("scrypt:"))


def verify_user_password(pw, stored_hash, salt):
    if password_hash_needs_upgrade(stored_hash):
        return hmac.compare_digest(hash_password(pw, salt), stored_hash)
    return check_password_hash(stored_hash, pw)


def generateRandomHexColor():
    letters = "0123456789ABCDEF"
    color = "#" + "".join([random.choice(letters) for i in range(6)])
    return color


def validate_int(value):
    try:
        return int(value)
    except Exception as err:
        return 9999
