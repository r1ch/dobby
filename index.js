//Libraries
const WebSocket = require("ws")
const net = require("net")
const https = require("https")
const fs = require("fs")

//Constants
const MY_NAME = "Dobby"
const VERSION = "1.6.6" // this is which version of syncplay to say we understand :shrug:
const BROADCAST_INTERVAL = 500

//Defaults
const defaults = {
	room: "harryshotter",
	port: "8996",
	host: "syncplay.pl",
}

//Global shared state between SyncPlay and WSS
class SharedPlayState {
	constructor() {
		this._playstate = false
		this._time = false
	}
	
	set playstate(playstate) {
		this._playstate = Object.assign({},playstate)
		this._time = Date.now()
	}
	
	get playstate() {
		if(!this._playstate){
			return {position:0}
		} else {
			let playstate = Object.assign({},this._playstate)
			if(!this._playstate.paused) playstate.position += (Date.now()-this._time)/1000
			return playstate
		}
	}
}

const GLOBAL_PLAYSTATE = new SharedPlayState();

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

const broadcast = ()=>{
	wss.clients.forEach(sendJson(GLOBAL_PLAYSTATE.playstate))
}

setInterval(broadcast,BROADCAST_INTERVAL)


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
}

const pingMessage = latencyCalculation => {
	let message = {
		State:{
			ping: {clientRtt:0, clientLatencyCalculation:Date.now()/1000},
			//playstate: {paused:null, position: null}
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
			console.log(json.State)
			GLOBAL_PLAYSTATE.playstate = json.State.playstate;
			connection.write(pingMessage(json.State.latencyCalculation));
		}
	})
}

const sendJson = json => client => {
	if(client.readyState === WebSocket.OPEN) client.send(JSON.stringify(json))
}

connectToSyncPlay(defaults)
.then(()=>console.log(`Connected to ${JSON.stringify(defaults)}`))
