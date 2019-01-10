
/*
	Matty public ip: 120.153.145.248

	http://120.153.145.248:8080/boilerplate/

*/

// List of players
// Players are stored as: {id:{}, id:{}}
let players = {};

setInterval(function() {
	console.log("Logging Time: " + (new Date().getTime()));
	console.log("Players online: " + Object.keys(players).length);
	console.log(players);
}, 1000);


// Listen on port 3000 
let io = require('socket.io').listen(3000);
io.set("heartbeat interval", 1000);

console.log("Starting server");

io.sockets.on('connection', function (socket) {

	console.log("Player connected: ", socket.id);

	// Tells all users that a user connected
	socket.broadcast.emit("user-connected", socket.id);



	// Create players position in world state
	players[socket.id] = {
        "position": {x:0, y:3, z:5},
        "rotation": {x:0, y:0, z:0}
    };

	// Send world state to new player to allow them to start updating their own position
	socket.emit('init-world-state', players);

	// Start sending world state to client 30 times per second
	setInterval(function() {
		socket.emit('update-world-state', players);
	}, 1000/30);


	// Wait for client to send their own state
	socket.on('update-state', function (data) {
		players[socket.id] = data;
	});






	// If client disconnects, remove them from game
	socket.on('disconnect', function () {
		console.log("Player disconnected: " + socket.id);
		delete players[socket.id];

		// Tells all users that a user disconnected
		//io.sockets.emit("user-disconnected", socket.id);
		socket.broadcast.emit("user-disconnected", socket.id);
	});




});


