# dobby
Join a syncplay room and provide a websocket translation for the play state

## Start script
```
sudo yum update -y
sudo yum install git -y
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
. ~/.nvm/nvm.sh
nvm install node
git clone https://github.com/r1ch/dobby.git
cd dobby
npm ci
node index
```
