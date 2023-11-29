from flask import Flask, render_template
from flask_login import *
from datetime import datetime

app = Flask(__name__)
login_manager = LoginManager()
login_manager.init_app(app)


@app.route('/time')
def get_time():
    return {'Time': "Hello"}


@login_manager.user_loader
def load_user(user_id):
    print("Requesting user for id", user_id)
    return -1


@app.route('/login', methods=['GET', 'POST'])
def login():
    print("login")
    login_user()
    return -1

@app.route('/test')
@login_required
def test():
    return render_template("index.html")

@app.route("/")
@app.route("/index")
def index():
    return render_template("index.html")


if __name__ == '__main__':
    app.run(debug=True)
