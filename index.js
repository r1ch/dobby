const WebSocket = require("ws")
const net = require("net")

const wss = new WebSocket.Server({port:8080})

let GLOBAL_MESS = {paused:false};

const wsMessageHandler = ws => message => {
	console.log(message)
	ws.send("Drink your Disarrono fuck face")
}

const wsConnectionHandler = ws => {
	ws.on('message', wsMessageHandler(ws))
	ws.send("Welcome, Cuntface")
}

wss.on('connection', wsConnectionHandler)


const sync = net.createConnection(8996,`syncplay.pl`,()=>{
	sync.on('data',data=>{
		let json = {}
		try{
			json = JSON.parse(data.toString())
		} catch(e){
			console.error(`Unparseable data: ${data.toString()}`)
		}
		if(json.State && json.State.playstate){
			wss.clients.forEach(client=>{
				client.readyState === WebSocket.OPEN && client.send(JSON.stringify(json.State.playstate))
			})
		}
	})

	sync.write(`{"Hello": {"username": "Dobby", "room": {"name": "harryshotter"}, "version":"1.2.7"}}\r\n`)
	setInterval(()=>{
		sync.write(`{"State": {"ping":{"clientRtt":0}}}\r\n`)
	},2000)
})


