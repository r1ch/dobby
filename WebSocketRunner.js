//Libraries
const WebSocket = require("ws")
const https = require("https")
const fs = require("fs")

//Secure for wss
const server = https.createServer({
    cert: fs.readFileSync('./cert.pem'),
    key: fs.readFileSync('./key.pem')
});
  
const wss = new WebSocket.Server({ server });
  
const wsMessageHandler = ws => message => {
    //console.log(message)
}
  
const wsConnectionHandler = ws => {
    ws.on('message', wsMessageHandler(ws))
    //console.log("New connection")
    ws.send("Welcome, Cuntface")
}
  
wss.on('connection', wsConnectionHandler)

const broadcast = playstate => () =>{ 
    wss.clients.forEach(send(playstate))
}
  
const send = json => client => {
    if(client.readyState === WebSocket.OPEN) client.send(JSON.stringify(json))
    //PRUNE dead clients
}

const start = config => new Promise((resolve,reject)=>{
    if(!config || !config.port || !config.broadcast_interval || !config.playstate){
        console.error(`Invalid config: ${JSON.stringify(config)}`)
        return reject("Invalid config")
    } else {
        server.listen(config.port)
        setInterval(broadcast(config.playstate),config.broadcast_interval)
        resolve()
    }
})



module.exports = {
    start : start
}