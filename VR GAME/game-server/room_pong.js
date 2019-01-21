/*





*/

class Room_Pong {
	constructor() {
		
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
			"paddle1": {
				id: "paddle1",
				modelInfo: {
					shape: "box",
					size: {x:1,y:0.5,z:0.2}
				},
				position: {x:0,y:0.5,z:10},
				rotation: {x:0,y:0,z:0},
			},
			"paddle2": {
				id: "paddle2",
				modelInfo: {
					shape: "box",
					size: {x:1,y:0.5,z:0.2}
				},
				position: {x:0,y:0.5,z:-10},
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
		if (ball.position.x > 10 - this.ballSize) {
			ball.position.x = 10 - this.ballSize;
			ball.velocity.x *= -1;
		}
		if (ball.position.x < -10 + this.ballSize) {
			ball.position.x = -10 + this.ballSize;
			ball.velocity.x *= -1;
		}
		if (ball.position.z > 15 - this.ballSize) {
			ball.position.z = 15 - this.ballSize;
			ball.velocity.z *= -1;
		}
		if (ball.position.z < -15 + this.ballSize) {
			ball.position.z = -15 + this.ballSize;
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

module.exports = Room_Pong;