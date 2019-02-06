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

class Room_Soccer {
	constructor(roomName) {
		
		this.roomName = roomName;	// Used so that server knows which socket room to send its room data to
		
		// This is sent to each client in the room every server tick
		// room.players and room.objects are automatically added by default
		// Any other data must be set elsewhere in the code and will only be sent once before being removed from the roomData object
		this.roomData = {};


		this.players = {};

		this.objects = {
			"ball": {
				id: "ball",
				modelInfo: {
					shape: "sphere",
					size: 0.5
				},
				position: {x:0,y:0.5,z:0},
				rotation: {x:0,y:0,z:0},
				velocity: {x:0,y:0,z:0}
			},
		};

	}


	initDataToPlayer(socket) {	// Sends the inital room state to a new player in the room
		socket.emit('init-world-state', {
			"players": this.players,
			"objects": this.objects
		});
	}
	sendDataToPlayers() {	// Sends the room state to all players in the room

		// Adds the room players and objects data to be sent to each player
		this.roomData.players = this.players;
		this.roomData.objects = this.objects;

		io.to(this.roomName).emit('update-world-state', this.roomData);
	}
	
	setPlayerState(id, playerData) {	// Updates rooms version of player position as recieved from the player
		this.players[id] = playerData;
	}
	addPlayer(id) {		// Adds a new player to the room
		this.players[id] = {
			position: {x:0, y:1, z:5},
			rotation: {x:0, y:0, z:0}
		};
	}
	removePlayer(id) {
		delete this.players[id];
	}
	update() {		// Runs each server tick to update server-side objects
		let delta = 1/60;
		let ball = this.objects["ball"];
		let ballSize = ball.modelInfo.size;

		// Make each player apply a force to ball
		for (let id in this.players) {
			let distFromBall = distBetweenXZ(this.players[id].position, ball.position);
			if (distFromBall <= 2) {
				// Apply a force that linearly? increases with distance from player
				// Probably best to not have infinite force at 0 distance
				let forceOnBall = (2-distFromBall) * 10;

				ball.velocity.x += delta * forceOnBall * (ball.position.x-this.players[id].position.x)/distFromBall;
				ball.velocity.z += delta * forceOnBall * (ball.position.z-this.players[id].position.z)/distFromBall;

			}
		}

		// Move ball
		ball.position.x += ball.velocity.x * delta;
		ball.position.y += ball.velocity.y * delta;
		ball.position.z += ball.velocity.z * delta;

		// Keep ball inside arena
		if (ball.position.x > 10 - ballSize) {
			ball.position.x = 10 - ballSize;
			ball.velocity.x *= -1;
		}
		if (ball.position.x < -10 + ballSize) {
			ball.position.x = -10 + ballSize;
			ball.velocity.x *= -1;
		}
		if (ball.position.z > 15 - ballSize) {
			ball.position.z = 15 - ballSize;
			ball.velocity.z *= -1;
		}
		if (ball.position.z < -15 + ballSize) {
			ball.position.z = -15 + ballSize;
			ball.velocity.z *= -1;
		}

		// Apply friction
		ball.velocity.x *= 0.99;
		ball.velocity.y *= 0.99;
		ball.velocity.z *= 0.99;


	}
}

function distBetweenXZ(a,b) {	// Returns distance between two vectors across XZ plane
	return Math.hypot(a.x-b.x,a.z-b.z);
}

module.exports = Room_Soccer;