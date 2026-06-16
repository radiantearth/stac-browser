cd ~/creodias-stac-browser
git pull
npm install
npm run build
sudo rm -r /var/www/html/**
sudo cp dist/* /var/www/html -r
sudo chown -R "$USER":www-data /var/www/html
sudo chmod -R 0755 /var/www/html
