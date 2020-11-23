class PlayState {
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
			return { position:0 }
		} else {
			let playstate = Object.assign({},this._playstate)
			if(!this._playstate.paused) playstate.position += (Date.now()-this._time)/1000
			return playstate
		}
	}
}

module.exports = PlayState