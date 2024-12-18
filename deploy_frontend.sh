# pull latest
git pull

# change dirs
cd frontend

# install packages
sudo npm install

# get new build
sudo npm run build

# delete old files
sudo rm -r /var/www/tippspiel/

# copy over files
sudo cp -r /home/felix/tippspiel/frontend/dist /var/www/tippspiel
sudo cp /home/felix/tippspiel/frontend/service-worker.js /var/www/tippspiel/
sudo cp /home/felix/tippspiel/frontend/src/assets/icons/icon-192x192.png  /var/www/tippspiel/assets/
sudo cp /home/felix/tippspiel/frontend/src/assets/icons/icon-512x512.png  /var/www/tippspiel/assets/