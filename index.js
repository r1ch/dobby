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

//Shared RoomState
class SharedPlayState {
	constructor() {
		this._playstate = false
		this._time = false
		this._clients = []
		setInterval(this.broadcast,BROADCAST_INTERVAL)
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
	
	addClient(client){
		this._clients.push(client)
	}
	
	broadcast(){
		this._clients.forEach(client=>client.send(JSON.stringify(this.playstate)))
	}
}

const ROOMS = []

//Secure for wss
const server = https.createServer({
  cert: fs.readFileSync('./cert.pem'),
  key: fs.readFileSync('./key.pem')
});

const wss = new WebSocket.Server({ server });

const wsMessageHandler = ws => message => {
	let json = false
	try{
		json = JSON.parse(message)
	} catch(e){
		console.error(`Dropped: ${JSON.stringify(message)}`)
	}
	if(json && json.port && json.room){
		let slug = `${json.port}:${json.room}`
		if(!ROOMS[slug]){
			ROOMS[slug] = {}
			let config = Object.assign({},defaults)
			config.port = json.port
			config.room = json.room
			config.shared = new SharedPlayState();
			ROOMS[slug].server = connectToSyncPlay(config)
			ROOMS[slug].config = config
		}
		ROOMS[slug].config.shared.addClient(ws)
	}
}

const wsConnectionHandler = ws => {
	ws.on('message', wsMessageHandler(ws))
}

wss.on('connection', wsConnectionHandler)

server.listen(8443);

//How to create a SyncPlay socket
const connectToSyncPlay = config => new Promise((resolve,reject)=>{
		const connection = net.createConnection(config.port,config.host)
		connection.once('connect',spConnectionHandler(connection))
		connection.on('data',spDataHandler(config,connection))
		connection.on('close',spCloseHandler(config,connection))
		connection.write(`{"Hello": {"username": "${MY_NAME}", "isReady":false, "room": {"name": "${config.room}"}, "version":"${VERSION}"}}\r\n`);
		resolve(connection)
})

const spCloseHandler = (config,connection) => message =>{
	connectToSyncPlay(config)
	.then(()=>console.log(`Reconnected to ${JSON.stringify(config)}`))
}

const spConnectionHandler = connection => () => {
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
	
	
const spDataHandler = (config,connection) => data => {
	data.toString().trim().split(/\r?\n/).forEach(item=>{
		let json = {};
		try{ json = JSON.parse(item) }
		catch(e){ console.error(`Unparseable data: ->${item}<-`) }
		if( json.State && json.State.playstate ){
			config.shared.playstate = json.State.playstate
			connection.write(pingMessage(json.State.latencyCalculation));
		}
	})
}

const sendJson = json => client => {
	if(client.readyState === WebSocket.OPEN) client.send(JSON.stringify(json))
}
