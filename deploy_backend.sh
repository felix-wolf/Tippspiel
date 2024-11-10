# pull latest
git pull

# change dirs
cd backend

# install deps
python3 -m pipenv install

# run server in pipenv
python3 -m pipenv run nohup gunicorn --bind 0.0.0.0:5000 'main:create_app(env="dev")' 2>&1 >~/gunicorn.log &