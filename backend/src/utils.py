import hashlib
import random


def generate_id(field_array):
    return hashlib.md5("".join([str(i) for i in field_array]).encode('utf8')).hexdigest()

def hash_password(pw, salt):
    return hashlib.sha256("".join([pw, salt]).encode('utf-8')).hexdigest()

def generateRandomHexColor():
    letters = "0123456789ABCDEF"
    color = "#" + "".join([random.choice(letters) for i in range(6)])
    return color


def validate_int(value):
    try:
        return int(value)
    except Exception as err:
        return 9999
