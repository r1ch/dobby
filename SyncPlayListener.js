//Libraries
const net = require("net")

//Constants
const MY_NAME = "Dobby"
const VERSION = "1.6.6" // this is which version of syncplay to say we understand :shrug:

//Create a SyncPlay socket
const connectToSyncPlay = config => new Promise((resolve,reject)=>{

    //Check the config
    if(!config || !config.playstate || !config.host || !config.port){
        console.error(`Invalid config ${JSON.stringify(config)}`)
        return reject("Invalid config")
    }

    const connection = net.createConnection(config.port,config.host)
    connection.once('connect',spConnectionHandler(connection))
    connection.on('data',spDataHandler(config.playstate,connection))
    connection.on('close',spCloseHandler(config))
    connection.write(`{"Hello": {"username": "${MY_NAME}", "isReady":false, "room": {"name": "${config.room}"}, "version":"${VERSION}"}}\r\n`);
    resolve(connection)
})

const spCloseHandler = config => message =>{
    console.error(`Closed with : ${JSON.stringify(message)}`)
    connectToSyncPlay(config)
    .then(()=>console.log(`Reconnected to ${JSON.stringify(config)}`))
}

const spConnectionHandler = connection => () => {
}

const pingMessage = State => {
    let message = {
        State:{
            ping: {clientRtt:0, clientLatencyCalculation:Date.now()/1000},
        }
    };
    if(State.latencyCalculation) message.State.ping.latencyCalculation = State.latencyCalculation;
    if(State.ignoringOnTheFly && State.ignoringOnTheFly.server){
        message.State.ignoringOnTheFly = {
            client : State.ignoringOnTheFly.server,
            server : State.ignoringOnTheFly.server
        }
    }
    return `${JSON.stringify(message)}\r\n`;
}


const spDataHandler = (playstate, connection) => data => {
data.toString().trim().split(/\r?\n/).forEach(item=>{
    let json = {};
    try{ json = JSON.parse(item) }
    catch(e){ console.error(`Unparseable data: ->${item}<-`) }
    if( json.State && json.State.playstate ){
        playstate = json.State.playstate;
        connection.write(pingMessage(json.State));
    }
})
}

module.exports = {
    connect : connectToSyncPlay
}
