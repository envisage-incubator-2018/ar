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

class Room_Blank {
	constructor() {
		
		this.players = {};

		this.objects = {
			"sphere1": {
				id: "sphere1",
				modelInfo: {
					shape: "sphere",
					size: 0.5
				},
				position: {x:-3,y:3,z:-3},
				rotation: {x:0,y:0,z:0},
			},
			"box1": {
				id: "box1",
				modelInfo: {
					shape: "box",
					size: {x:0.5,y:0.7,z:1}
				},
				position: {x:-3,y:3,z:0},
				rotation: {x:0,y:0,z:0},
			}
		};


	}
	getRoomState() {	// Gets the room state to be sent to each client every tick
		// Certain attributes like object velocity may not need to be transmitted as position is all the client needs
		// However to prevent lag perhaps the player can also be sent that information and then extrapolate the objects
		// 	future position and correct any errors that may be calculated
		return {
			players: this.players,
			objects: this.objects
		}
	}
	setPlayerState(id, playerData) {	// Updates rooms version of player position as recieved from the player
		this.players[id] = playerData;
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
	update() {		// Runs each server tick to update server-side objects

		this.objects["sphere1"].position.x = -3 + Math.sin(new Date().getTime()/1000);

	}
}


module.exports = Room_Blank;