//Libraries
const WebSocket = require("ws")
const https = require("https")
const fs = require("fs")

const start = config => new Promise((resolve,reject)=>{
    //Grab certs for server
    const server = https.createServer({
        cert: fs.readFileSync('./cert.pem'),
        key: fs.readFileSync('./key.pem')
    });
    
    const wss = new WebSocket.Server({server});
    const wsMessageHandler = ws => message => {}
    const wsConnectionHandler = shared => ws => {
        ws.on('message', wsMessageHandler(ws))
        let message = Object.assign({issuedAt:Date.now()},shared.playstate)
        ws.send(JSON.stringify(message))
    }
    
    const broadcast = shared => () => { wss.clients.forEach(send(shared.playstate)) }
    
    const send = json => client => {
        json.issuedAt = Date.now()
        if(client.readyState === WebSocket.OPEN) client.send(JSON.stringify(json))
    }
    
    if(!config || !config.port || !config.broadcast_interval || !config.shared){
        console.error(`Invalid config: ${JSON.stringify(config)}`)
        return reject("Invalid config")
    } else {
        server.listen(config.port)
        wss.on('connection', wsConnectionHandler(config.shared))
        setInterval(broadcast(config.shared),config.broadcast_interval)
        resolve()
    }
})

module.exports = {
    start : start
}
