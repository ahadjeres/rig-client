
# this script install the client for mining
# curl -L setup.metricmining.com > setup.sh && chmod +x setup.sh && ./setup.sh


curl  https://raw.githubusercontent.com/creationix/nvm/v0.33.9/install.sh  -O
chmod +x install.sh
./install.sh
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads
nvm install node
npm install -g pm2
ssh-keyscan -H github.com >> ~/.ssh/known_hosts
git clone git@github.com:ahadjeres/rig-client.git
rm -rf rig-client
cd rig-client
pm2 delete all
pm2 flush
npm install
pm2 restart client.js --name client
pm2 save
pm2 startup upstart
sudo env PATH=$PATH:/home/ethos/.nvm/versions/node/v9.11.1/bin /home/ethos/.nvm/versions/node/v9.11.1/lib/node_modules/pm2/bin/pm2 startup upstart -u ethos --hp /home/ethos
rm /home/ethos/remote.conf
