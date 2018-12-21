
/*
	
	Currently all trust is placed in the clients
	They send their game state to the server rather than their inputs
	Later, clients should send their user inputs, which are then processed by the server and only accepted if they are valid (e.g. not teleporting)

	Server runs at a 30 tick rate

	
*/

// Make the output visible
let messages = document.getElementById('messages');

// Connect to our server.js, which is listening on port 3000
//let socket = io.connect('http://120.153.145.248:3000');
let serverIp = window.location.origin.split(":")[0] + ":" + window.location.origin.split(":")[1] + ":3000";
console.log(serverIp)
var socket = io.connect(serverIp);	// could use something like window.location.origin to dynamically set connection point




// == Tracks player key presses ==
keyDown = {};

// Keys
document.addEventListener("keydown", function(evt) {    
  keyDown[evt.code] = true;
  if (evt.code == "Space") {	// Stops space from scrolling
    evt.preventDefault();
  }
});

document.addEventListener("keyup", function(evt) {
  keyDown[evt.code] = false;
});



let players = {};
let userPos;


socket.on('connect', function() {

	messages.innerHTML += 'Connected<br/>';

	console.log("Connected to server with id", socket.id);

});



// Recieves world state from server in response to the "new player" socket
socket.on('init-world-state', function(data) {
	// Store world state and get user position
	players = data;
	userPos = players[socket.id];


	// Now that user has world state, user begins updating 
	// its own game state and sending it to server at a set tick rate
	setInterval(function() {
		let dt = 1/30;

		// Calculate new game state and send to server
		if (keyDown["KeyW"]) {
			userPos.y -= 100 * dt;
			if (userPos.y < 0) userPos.y = 0;
		}
		if (keyDown["KeyS"]) {
			userPos.y += 100 * dt;
			if (userPos.y > document.getElementById("canvas").height) userPos.y = document.getElementById("canvas").height;
		}
		if (keyDown["KeyA"]) {
			userPos.x -= 100 * dt;
			if (userPos.x < 0) userPos.x = 0;
		}
		if (keyDown["KeyD"]) {
			userPos.x += 100 * dt;
			if (userPos.x > document.getElementById("canvas").width) userPos.x = document.getElementById("canvas").width;
		}


		socket.emit("update-position", userPos);

	}, 1000/30);



	// Recieves world state from server at a set tick rate and updates local version accordingly
	socket.on('update-world-state', function(data) {

		players = data;

		// Player uses local version of its position (it really shouldn't but it does for now)
		players[socket.id] = userPos;	

	});


	// Start rendering at 60 times per second
	setInterval(function() {

		let canvas = document.getElementById("canvas");
		let ctx = canvas.getContext("2d");
		ctx.fillStyle = "lightblue";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Loop through and render each player
		for (let id in players) {
			ctx.beginPath();
			ctx.fillStyle = "red";
			ctx.arc(players[id].x, players[id].y, 10, 0, 2*Math.PI);
			ctx.fill();

			var img = document.createElement("img");
			if (id.charCodeAt(0) < 97) {
				img.src = "anpan.gif";
			} else {
				img.src = "doggo.jpg";
			}

			ctx.drawImage(img, players[id].x-50, players[id].y-50, 100, 100);
		}

	}, 1000/60);


});




// Calculate player latency and displays it
socket.on('pong', function(latency) {
	document.getElementById("ping").innerHTML = "Ping: " + latency;
});









socket.on('myMessageType', 
	function(data) {
		messages.innerHTML += 'Server says: "' + data.toString() + '"<br/>';

		// Respond to the server
		socket.emit('myResponseType', { my: 'data' });
	}
);



