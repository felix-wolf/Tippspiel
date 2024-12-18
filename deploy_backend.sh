# pull latest
git pull

# change dirs
cd backend

# install deps
python3 -m pipenv install

sudo cp /home/felix/tippspiel/backend/run_tippspiel_backend /etc/cron.d/

# run server in pipenv
sudo systemctl restart tippspiel_backend