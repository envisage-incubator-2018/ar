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

class Room_Empty {
	constructor(roomName) {

		this.roomName = roomName;	// Used so that server knows which socket room to send its room data to

		// This is sent to each client in the room every server tick
		// room.players and room.objects are automatically added by default
		// Any other data must be set elsewhere in the code and will only be sent once before being removed from the roomData object
		this.roomData = {};
		
		
		this.players = {};

		this.objects = {
		};


	}

	initDataToPlayer(socket) {	// Sends the inital room state to a new player in the room
		socket.emit('init-world-state', {
			"players": this.players,
			"objects": this.objects
		});
	}
	sendDataToPlayers() {	// Sends the room state to all players in the room

		// Certain attributes like object velocity may not need to be transmitted as position is all the client needs
		// However to prevent lag perhaps the player can also be sent that information and then extrapolate the objects
		// 	future position and correct any errors that may be calculated

		// Adds the room players and objects data to be sent to each player
		this.roomData.players = this.players;
		this.roomData.objects = this.objects;

		io.to(this.roomName).emit('update-world-state', this.roomData);

		this.roomData = {};
	}

	setPlayerState(id, playerData) {	// Updates rooms version of player position as recieved from the player
		this.players[id] = playerData;
	}
	addPlayer(id) {		// Adds a new player to the room
		this.players[id] = {
			position: {x:0, y:2, z:0},
			rotation: {x:0, y:0, z:0}
		};
	}
	removePlayer(id) {
		delete this.players[id];
	}
	update() {		// Runs each server tick to update server-side objects


	}
}


module.exports = Room_Empty;