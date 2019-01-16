
/*
	Matty public ip: http://120.153.145.248:8080/


	
	Array containing 
	

	roomList = {
		"room1": {
			"players": {
				"id1": {
					"position": {x:0,y:0,z:0},
					"rotation": {x:0,y:0,z:0}
				}
			}
			"objects": {
				
			}
		}
	}

*/

// List of rooms containing players/objects in them
// Players contain position/rotation information
// Objects are objects in the room with position/rotation that is global to all players in that room
let roomList = {
	"room1": {
		"players": {

		},
		"objects": {	
			"cube1": {
				"id": "cube1",
				"position": {x:-3,y:3,z:-3},
				"rotation": {x:0,y:0,z:0}
			}
		}
	},
	"room2": {
		"players": {

		},
		"objects": {	

		}
	},
	"room3": {
		"players": {

		},
		"objects": {	

		}
	}
};

// List of players with key as socket.id and values as room name string
// e.g. {"id123": "room1"}
let playerList = {};

// Log server information
setInterval(function() {
	console.log("\nLogging Time: " + (new Date().getTime()));

	console.log("Players online: " + Object.keys(playerList).length);

	for (let roomName in roomList) {
		console.log("	" + roomName + ": " + Object.keys(roomList[roomName]["players"]).length);
	}

	console.log("roomList:", roomList)
	console.log("playerList:", playerList)
}, 3000);


// Listen on port 3000 
let io = require('socket.io').listen(3000);
io.set("heartbeat interval", 1000);

console.log("Starting server");

io.sockets.on('connection', function (socket) {

	console.log("Player connected: ", socket.id);

	socket.on("join-room", function (roomName) {
		console.log("Player " + socket.id + " joining room: " + roomName);
		socket.join(roomName);

		// Create players state in room
		roomList[roomName]["players"][socket.id] = {
			"position": {x:0, y:3, z:5},
			"rotation": {x:0, y:0, z:0}
		};

		// Add to playerList with room name
		playerList[socket.id] = roomName;


		// Send world state to new player to allow them to start updating their own position
		socket.emit('init-world-state', roomList[roomName]);


		// Tells all users in room that a user connected
		socket.to(roomName).emit("user-connected", socket.id);


		// Wait for client to send their own state
		socket.on('update-state', function (data) {

			// Set players updated position in room 
			let roomName = playerList[socket.id];
			roomList[roomName]["players"][socket.id] = data;
		});

		

		// If client disconnects, remove them from room and tell other users
		socket.on('disconnect', function () {
			let roomName = playerList[socket.id];
			console.log("Player " + socket.id + " disconnected from room " + roomName);

			// Remove player from room
			delete roomList[roomName]["players"][socket.id];

			// Remove player from playerList
			delete playerList[socket.id];

			// Tells all users in room that user disconnected
			socket.to(roomName).emit("user-disconnected", socket.id);
		});


	});





});



// Loop through each room and send all players in that room their room state at 60 ticks
setInterval(function() {
	// Update cube position
	roomList["room1"]["objects"]["cube1"]["position"]["x"] = -3 + Math.sin(new Date().getTime()/1000);

	for (let roomName in roomList) {
		io.to(roomName).emit('update-world-state', roomList[roomName]);
	}
}, 1000/60);