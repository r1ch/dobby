//Libraries
const WebSocket = require("ws")
const net = require("net")

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


//Create a WebSocket listener on port 8080
const wss = new WebSocket.Server({port:8080})

const wsMessageHandler = ws => message => {
	console.log(message)
}

const wsConnectionHandler = ws => {
	ws.on('message', wsMessageHandler(ws))
	console.log("New connection")
	ws.send("Welcome, Cuntface")
}

wss.on('connection', wsConnectionHandler)


//Create a SyncPlay socket
const connectToSyncPlay = config => new Promise((resolve,reject)=>{
		const connection = net.createConnection(config.port,config.host)
		connection.on('connect',spConnectionHandler(connection))
		connection.on('data',spDataHandler(connection))
		connection.write(`{"Hello": {"username": "${MY_NAME}", "room": {"name": "${config.room}"}, "version":"${VERSION}"}}\r\n`);
		setInterval(ping(connection),INTERVAL)
		resolve(connection)
})

const spConnectionHandler = connection => () => {
	//start the keepalive
	setInterval(connection=>ping(connection),INTERVAL)
}

const spDataHandler = connection => data => {
	//on data, tell anyone connected to the wss
	let json = {}
	try{ json = JSON.parse(data.toString()) }
	catch(e){ console.error(`Unparseable data: ${data.toString()}`)}
	if(json.State && json.State.playstate){
		wss.clients.forEach(client=>sendJson(json.State.playstate))
	}
}

const ping = connection => () => {
	connection.write(`{"State": {"ping":{"clientRtt":0}}}\r\n`)
}


const sendJson = json => client => {
	if(client.readyState == WebSocket.OPEN) client.send(JSON.stringify(json))
}

connectToSyncPlay(defaults)
.then(()=>console.log(`Connected to ${JSON.stringify(defaults)}`))
