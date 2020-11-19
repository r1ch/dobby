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
	//start the keepalive
	//setInterval(ping(connection),INTERVAL)
}

const spDataHandler = connection => data => {
	//on data, tell anyone connected to the wss
	let json = {}
	try{ json = JSON.parse(data.toString().trim()) }
	catch(e){ console.error(`Unparseable data: ->${data.toString()}<-`)}
	if(json.State && json.State.playstate){
		console.log(data.toString().trim())
		wss.clients.forEach(sendJson(json.State.playstate))
		//Will have: {"State": {"playstate": {"paused": false, "position": 300.56051483154295, "setBy": "Bob", "doSeek": false}, "ping": {"yourLatency": 0.012035489082336426, "senderLatency": 0.012035489082336426, "latencyCalculation": 1394654868.994537}}}
		//Must send {"State": {"ping": {"clientRtt": 0, "clientLatencyCalculation": 1394654653.11, "latencyCalculation": 1394654868.994537}, "playstate": {"paused": false, "position": 300.5129999217987}}}
		/*let pingMessage = {
			State:{
				ping:{clientRtt:0,clientLatencyCalculation:Date.now()/1000,latencyCalculation:json.State.ping.latencyCalculation},
				playstate: {paused:false, position: json.State.playstate.position},
			}       
		}
		console.log(`Ping w/:${JSON.stringify(pingMessage)}`)
		connection.write(`${JSON.stringify(pingMessage)}\r\n`)*/
	}
}

const ping = connection => () => {
	let pingMessage = {
		State:{
			ping:{clientRtt:0,clientLatencyCalculation:Date.now()/1000},
			playstate: {paused: null, position: null}
		}
	};
	connection.write(`${JSON.stringify(pingMessage)}\r\n`)
}


const sendJson = json => client => {
	if(client.readyState === WebSocket.OPEN) client.send(JSON.stringify(json))
}

connectToSyncPlay(defaults)
.then(()=>console.log(`Connected to ${JSON.stringify(defaults)}`))
