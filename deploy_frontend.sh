# pull latest
git pull

# change dirs
cd frontend

# get new build
sudo npm run build

# delete old files
sudo rm -r /var/www/tippspiel/

# copy over files
sudo cp -r /home/felix/tippspiel/frontend/dist /var/www/tippspiel