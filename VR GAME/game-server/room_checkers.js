/*



	Each room follows its own update function

	A soccer room for example would analyse the position of players and update the position of a soccer ball


	Each room is stored as a class on the server
	Everytime a player sends its state...
		- a function is run in the room class with this data as the parameter
		- this function updates the rooms stored version of the player
	Each server tick...
		- server sends the required information of each object to the player

	Server can send a different init-world-state than update-world-state
		- client will only start recieving update-world-state events after the init-world-state is fired
		- init should contain extra information about object models for example
			- also eventually could send world map?
			- might be able to send entire scenes since this message is only transmitted once and its size won't be an issue


*/

class Room_Checkers {
	constructor(roomName) {

		this.roomName = roomName;	// Used so that server knows which socket room to send its room data to

		// This is sent to each client in the room every server tick
		// room.players and room.objects are automatically added by default
		// Any other data must be set elsewhere in the code and will only be sent once before being removed from the roomData object
		this.roomData = {};


		this.players = {};

		this.objects = {
			"box1": {
				modelInfo: {
					shape: "box",
					size: {x:1, y:1, z:1}
				},
				position: {x:-6,y:4,z:-3},
				rotation: {x:0,y:0,z:0},

				//Selectable Object properties
				Selectable: 1,			// Whether object is selectable or not (if this attribute does not exist we assume not)
				SelectThreshold: 2,		// Selection time until object function runs
				ActivationDistance: 5,	// Minimum distance to select object
				ActivationFunction: "teleportPlayer",	
				ActivationParameter: {x:0,y:1,z:0}
			}
		};





		// Multi-dimentional array of checkers board
		// 0 if player 0, 1 if player 1, -1 if empty square
		this.boardState = [];
		for (let y=0; y<8; y++) {
			this.boardState.push([]);
			for (let x=0; x<8; x++) {

				// Create starting board state
				let piece = -1;
				if (x%2!=y%2) {
					if (y<=2) piece = 0;
					if (y>=5) piece = 1;
				}

				this.boardState[y].push(piece)
			}
		}
		//console.log(this.boardState)



	}
	addPlayer(id) {		// Adds a new player to the room
		this.players[id] = {
			position: {x:0, y:3, z:5},
			rotation: {x:0, y:0, z:0}
		};
	}
	removePlayer(id) {
		delete this.players[id];
	}

	initDataToPlayer(socket) {	// Sends the inital room state to a new player in the room
		socket.emit('init-world-state', {
			"players": this.players,
			"objects": this.objects,
			"boardState": this.boardState
		});
	}
	sendDataToPlayers() {	// Sends the room state to all players in the room

		// Adds the room players and objects data to be sent to each player
		this.roomData.players = this.players;
		this.roomData.objects = this.objects;

		io.to(this.roomName).emit('update-world-state', this.roomData);

		this.roomData = {};
	}

	setPlayerState(id, playerData) {	// Updates rooms version of player position as recieved from the player
		/*
			Clients send a playerData dictionary to server each tick
			This must contain some information like position/rotation so that the server knows where the player is
			It could also contain some extra information that the server can then use
				An example of when this is needed is in selection functions which affect server-side objects
				The player might send a value "playerData.moveSphereUpOne = true" which the server can then read and use in the room.update function
			
			If there are values which the server only wants to use once, what would happen if the server ran room.update() twice 
			after only one execution of setPlayerState()?
			A work-around is to execute the relevant code that uses this information inside of setPlayerState()
		*/
		this.players[id] = playerData;


		// Execute code here that only runs exactly after the player sends their state to server
		// Used for button presses that the player only sends "true" for one tick

		// .checkersPieceSelected = 
		if (playerData.selectedPiece) {
			console.log("Player selected piece " + JSON.stringify(playerData.selectedPiece))
			delete playerData.selectedPiece;
		}

		if (playerData.selectedMove) {
			console.log("Player selected move " + JSON.stringify(playerData.selectedMove[0]) + " -> " + JSON.stringify(playerData.selectedMove[1]));

			// Make move in boardState
			let piece = playerData.selectedMove[0];
			let move = playerData.selectedMove[1];
			this.boardState[move.y][move.x] = this.boardState[piece.y][piece.x];
			this.boardState[piece.y][piece.x] = -1;

			// Send this new boardState to each player
			this.roomData.boardState = this.boardState;




			delete playerData.selectedMove;
		}

	}
	update() {		// Runs each server tick to update server-side objects

		//if (Math.random() < 0.01) {
		//	this.boardState[Math.floor(Math.random()*8)][Math.floor(Math.random()*8)] = Math.floor(Math.random()*3)-1;
		//	this.roomData.boardState = this.boardState;
		//}


	}
}


module.exports = Room_Checkers;
