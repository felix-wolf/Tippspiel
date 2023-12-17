import hashlib
import random


def generate_id(field_array):
    return hashlib.md5("".join(field_array).encode('utf8')).hexdigest()


def generateRandomHexColor():
    letters = "0123456789ABCDEF"
    color = "#" + "".join([random.choice(letters) for i in range(6)])
    return color
