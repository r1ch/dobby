//Libraries
const events = require('events');
const WebSocket = require("ws")
const https = require("https")
const fs = require("fs")

const fatherJack = new events.EventEmitter();


const start = config => new Promise((resolve,reject)=>{
    //Global message
    let messageSeen = {} ;
    
    //Grab certs for server
    const server = https.createServer({
        cert: fs.readFileSync('./cert.pem'),
        key: fs.readFileSync('./key.pem')
    });
    
    const wss = new WebSocket.Server({server});
    
    const wsMessageHandler = ws => message => {
        //Pass each message on once, clear after 5 seconds anyway
        try{
            let data = JSON.parse(message)
            if(data.time && data.playerList && !messageSeen[data.time]){
                messageSeen[data.time] = true
                fatherJack.emit('drink',data.playerList)
                setTimeout(()=>{
                    //console.log(`Cleaning ${JSON.stringify(Object.keys(messageSeen))}`) 
                    delete messageSeen[data.time]
                    //console.log(`->${JSON.stringify(Object.keys(messageSeen))}`) 
                },5000)
            } else {
                //console.log(`Dropping ${JSON.stringify(data)}`)
            }
        } catch(e) {
            console.error(`Dropped ${message}`)
        }
    }
    
    const wsConnectionHandler = ws => {
        ws.on('message', wsMessageHandler(ws))
        let message = Object.assign({issuedAt:Date.now()},config.shared.playstate)
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
        wss.on('connection', wsConnectionHandler)
        setInterval(broadcast(config.shared),config.broadcast_interval)
        resolve()
    }
})

module.exports = {
    start : start,
    fatherJack : fatherJack
}
