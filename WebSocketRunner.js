//Libraries
const WebSocket = require("ws")
const https = require("https")
const fs = require("fs")

//Secure for wss
let server = https.createServer({
    cert: fs.readFileSync('./cert.pem'),
    key: fs.readFileSync('./key.pem')
});

const wss = new WebSocket.Server({server});
  
const wsMessageHandler = ws => message => {
    //console.log(message)
}
  
const wsConnectionHandler = ws => {
    ws.on('message', wsMessageHandler(ws))
    //console.log("New connection")
    ws.send("Welcome, Cuntface")
}
  
wss.on('connection', wsConnectionHandler)

const broadcast = shared => () =>{ 
    wss.clients.forEach(send(shared.playstate))
}
  
const send = json => client => {
    json.epoch = Date.now()
    if(client.readyState === WebSocket.OPEN) client.send(JSON.stringify(json))
}

const start = config => new Promise((resolve,reject)=>{
    if(!config || !config.port || !config.broadcast_interval || !config.shared){
        console.error(`Invalid config: ${JSON.stringify(config)}`)
        return reject("Invalid config")
    } else {
        server.listen(config.port)
        setInterval(broadcast(config.shared),config.broadcast_interval)
        resolve()
    }
})

module.exports = {
    start : start
}