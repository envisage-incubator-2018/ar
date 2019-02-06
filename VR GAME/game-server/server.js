
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

// Listen on port 3000
console.log("Starting server");
io = require('socket.io').listen(3000);
io.set("heartbeat interval", 1000);

let Room_Empty = require("./room_empty.js");
let Room_Blank = require("./room_blank.js");
let Room_Soccer = require("./room_soccer.js");
let Room_Checkers = require("./room_checkers.js");
let Room_Pong = require("./room_pong.js");


// List of rooms containing players/objects in them
// Players contain position/rotation information
// Objects are objects in the room with position/rotation that is global to all players in that room
let roomList = {
	"room0": new Room_Empty("room0"),
	"room1": new Room_Blank("room1"),
	"room2": new Room_Blank("room2"),
	"room3": new Room_Pong("room3"),
	"room4": new Room_Soccer("room4"),
	"room5": new Room_Checkers("room5"),
	"room6": new Room_Blank("room6")
};

// List of players with key as socket.id and values as room name string and rtc connection state
// e.g. {"id123": ["room1", true]}
let playerList = {};

// Log server information
setInterval(function() {
	console.log("\nLogging Time: " + (new Date().getTime()));

	console.log("Players online: " + Object.keys(playerList).length);

	for (let roomName in roomList) {
		console.log("	" + roomName + ": " + Object.keys(roomList[roomName].players).length);
	}

	//console.log("roomList:", roomList)
	console.log("playerList:", playerList)
}, 3000);





io.sockets.on('connection', function (socket) {

	console.log("Player connected: ", socket.id);

	socket.on("join-room", function (roomName) {
		console.log("Player " + socket.id + " joining room: " + roomName);

		socket.join(roomName);	// Join the socket room for that room
		roomList[roomName].addPlayer(socket.id);	// Add player to room class

		// Add to playerList with roomName
		playerList[socket.id] = [roomName, false];

		// Send world state to new player to allow them to start updating their own position
		roomList[roomName].initDataToPlayer(socket);

		// Tells all users in room that a user connected
		socket.to(roomName).emit("user-connected", socket.id);

		// Wait for client to send their own state every client-tick
		socket.on('update-state', function (playerData) {

			// Set players updated position in room
			let roomName = playerList[socket.id][0];
			roomList[roomName].setPlayerState(socket.id, playerData);
		});

		// RTC event handlers
		socket.emit("rtc_connect");

		socket.on("rtc_join", function(roomName, canMakeOffer) {
			roomName = "room" + roomName;
			if (playerList[socket.id][1]) {
				// Disconnect from the old channel
				console.log("disconnecting rtc in join event");
				rtc_disconnect();
			}

			console.log("Connecting a new RTC user");

			console.log(roomList[roomName]["players"]);

			// Tell this client to open WebRTC connections
			for (id in roomList[roomName]["players"]) {
				if (playerList[id][1]) {
					// Tell all of the other clients to open a connection to this client
					io.to(`${id}`).emit("add_rtc_peer", {"id" : socket.id, "make_offer" : !canMakeOffer});
					if (id != socket.id) {
						socket.emit("add_rtc_peer", {"id" : id, "make_offer" : canMakeOffer});	
					}				
				}
			}

			playerList[socket.id][1] = true;

		});

		socket.on('relay_data', function(config) {
			if (config.peer_id in roomList[roomName]["players"]) {
				socketId = config.peer_id;
				config.peer_id = socket.id;
				io.to(`${socketId}`).emit(config.ev, config);
			}
		});

		socket.on("rtc_disconnect", rtc_disconnect);

		// If client disconnects, remove them from room and tell other users
		socket.on('disconnect', function () {
			let roomName = playerList[socket.id][0];
			console.log("Player " + socket.id + " disconnected from room " + roomName);

			// Disconnect the RTC connection
			rtc_disconnect();

			// Remove player from room
			roomList[roomName].removePlayer(socket.id);

			// Remove player from playerList
			delete playerList[socket.id];

			// Tells all users in room that user disconnected
			socket.to(roomName).emit("user-disconnected", socket.id);
		});

		function rtc_disconnect() {
			// Tell all of the other clients to close the connection to this client
			io.to(roomName).emit("remove_rtc_peer", socket.id);
			// Tell this client to close all WebRTC connections
			socket.emit("rtc_disconnect");

			playerList[socket.id][1] = false;
		}





	});

});


// Server-side update function
setInterval(function() {
	// Loop through each room and send all players in that room their room state at 60 ticks
	for (let roomName in roomList) {
		// First update room
		roomList[roomName].update();

		// Send new room state to all players
		roomList[roomName].sendDataToPlayers();
	}
}, 1000/60);
