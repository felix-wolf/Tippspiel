
# stop systemd service
sudo systemctl stop tippspiel_backend

# pull latest
git pull

# change dirs
cd backend

# install deps
uv sync

# run backend tests before deploying
uv run pytest -q || { echo "Tests failed. Aborting deploy."; exit 1; }

# run migrations before starting backend
uv run python migrate.py --env prod up || { echo "Migrations failed. Aborting deploy."; exit 1; }

# copy systemd service file
sudo cp /home/felix/tippspiel/backend/tippspiel_backend.service /etc/systemd/system/

# copy cron job file
sudo cp /home/felix/tippspiel/backend/run_tippspiel_backend /etc/cron.d/

# reload systemd and cron
sudo systemctl daemon-reload

# start systemd service
sudo systemctl start tippspiel_backend
