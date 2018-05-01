# this ONLY an update script please use install if in dought

curl  https://raw.githubusercontent.com/creationix/nvm/v0.33.9/install.sh  -O
chmod +x install.sh
./install.sh
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads
nvm install node v10.0.0
npm install -g pm2
ssh-keyscan -H github.com >> ~/.ssh/known_hosts
rm -rf rig-client
git clone git@github.com:ahadjeres/rig-client.git
cd rig-client
# clean up pm2
pm2 delete all
pm2 flush
pm2 unstartup
# install
npm install
pm2 start  client.js --name client
pm2 save
pm2 startup
sudo env PATH=$PATH:/home/ethos/.nvm/versions/node/v10.0.0/bin /home/ethos/.nvm/versions/node/v10.0.0/lib/node_modules/pm2/bin/pm2 startup upstart -u ethos --hp /home/ethos
