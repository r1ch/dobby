//Libraries
const WebSocket = require("ws")
const net = require("net")
const https = require("https")
const fs = require("fs")

//Constants
const MY_NAME = "Dobby"
const VERSION = "1.6.6" // this is which version of syncplay to say we understand :shrug:
const INTERVAL = 2000 // keepalive is 4secs to death

//Defaults
const defaults = {
	room: "harryshotter",
	port: "8996",
	host: "syncplay.pl",
}

//Secure as shit mate
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
server.listen(8443);


//Create a SyncPlay socket
const connectToSyncPlay = config => new Promise((resolve,reject)=>{
		const connection = net.createConnection(config.port,config.host)
		connection.once('connect',spConnectionHandler(connection))
		connection.on('data',spDataHandler(connection))
		connection.on('close',spCloseHandler(connection))
		connection.write(`{"Hello": {"username": "${MY_NAME}", "isReady":false, "room": {"name": "${config.room}"}, "version":"${VERSION}"}}\r\n`);
		resolve(connection)
})

const spCloseHandler = connection => message =>{
	console.error(`Closed with : ${JSON.stringify(message)}`)
	connectToSyncPlay(defaults)
	.then(()=>console.log(`Reconnected to ${JSON.stringify(defaults)}`))
}

const spConnectionHandler = connection => () => {
	setInterval(ping(connection),INTERVAL)
}

const pingMessage = latencyCalculation => {
	let message = {
		State:{
			ping: {clientRtt:0, clientLatencyCalculation:Date.now()/1000},
			playstate: {paused:null, position: null}
		}
	};
	if(latencyCalculation) message.State.ping.latencyCalculation = latencyCalculation;
	return `${JSON.stringify(message)}\r\n`;
}
	
	
const spDataHandler = connection => data => {
	data.toString().trim().split(/\r?\n/).forEach(item=>{
		let json = {};
		try{ json = JSON.parse(item) }
		catch(e){ console.error(`Unparseable data: ->${item}<-`) }
		if( json.State && json.State.playstate ){
			wss.clients.forEach(sendJson(json.State.playstate))
			connection.write(pingMessage(json.State.latencyCalculation));
		}
	})
}

const ping = connection => () => {
	//connection.write(pingMessage());
}


const sendJson = json => client => {
	if(client.readyState === WebSocket.OPEN) client.send(JSON.stringify(json))
}

connectToSyncPlay(defaults)
.then(()=>console.log(`Connected to ${JSON.stringify(defaults)}`))
