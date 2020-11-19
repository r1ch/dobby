# dobby
Join a syncplay room and provide a websocket translation for the play state

## Start script
```
#!/bin/bash
sudo yum update -y
sudo yum install git -y
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
. ~/.nvm/nvm.sh
nvm install node 15.2.1
git clone https://github.com/r1ch/dobby.git
cd dobby
npm ci
chmod 644 dobby.service
sudo mv dobby.service /lib/systemd/system
sudo systemctl daemon-reload
sudo systemctl enable dobby.service
```
