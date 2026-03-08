# pull latest
git pull

# change dirs
cd backend

# install deps
uv sync

# copy systemd service file
sudo cp /home/felix/tippspiel/backend/tippspiel_backend.service /etc/systemd/system/

# copy cron job file
sudo cp /home/felix/tippspiel/backend/run_tippspiel_backend /etc/cron.d/

# run server in pipenv
sudo systemctl restart tippspiel_backend