//Internals
const SyncPlayListener = require("./SyncPlayListener")
const WebSocketRunner = require("./WebSocketRunner")
const PlayState = require("./PlayState")

//Config Objects

const sharedPlayState = new PlayState()

const syncPlayConfig = {
	playstate: sharedPlayState,
	host: "syncplay.pl",
	port: 8996,
	room: "harryshotter"
}

const socketConfig = {
	playstate: sharedPlayState,
	broadcast_interval: 500,
	port: 8443,
}

//Wiring

Promise.all([
	SyncPlayListener.connect(syncPlayConfig),
	WebSocketRunner.start(socketConfig)
])
.then(()=>console.log("Started"))
.catch(console.error)