/*
  Does game server stuff?

  Client attempts to connect to server
  Once connection is established, client waits until it recieves initial world state

  Upon recieving initial world state, 
  - loop through each player and add to player list
  - if player is self, set self to current position and add to players list






*/


let socket;
let players = {};   // Stores the cubes of each player
let gamepad;

let joysticks = {
    "LeftHorizontal" : 0,
    "LeftVertical" : 1,
    "RightHorizontal" : 2,
    "RightVertical" : 3
}


function initGame() {

  // Create socket connected to node server hosted seperately from file server
  let ip = window.location.origin;
  let serverIp = ip.substring(0, ip.lastIndexOf(":")) + ":3000";
  console.log("Connecting to game server:", serverIp)
  socket = io.connect(serverIp);


  socket.on('connect', function() {
    console.log("Connected to server with id", socket.id);
  });

  // Calculate player latency and displays it
  socket.on('pong', function(latency) {
    document.getElementById("ping").innerHTML = "Ping: " + latency;
  });


  // Creates cube and adds to scene when new user connects
  socket.on("user-connected", function(id) {
    console.log("User connected: " + id);

    players[id] = new Player();
  });

  // Remove players who have disconnected from scene
  socket.on("user-disconnected", function(id) {
    console.log("User disconnected: " + id);

    players[id].removeFromScene();
    delete players[id];
  });


  // Recieves world state from server in response to the "new player" socket
  socket.on('init-world-state', function(data) {
    console.log("Received init world state", data);

    // Store world state and get user position

    // Add each player cube to players
    for (let id in data) {
      if (id == socket.id) {  // Add selfPlayer to scene with the recieved state
        players[id] = selfPlayer;
        selfPlayer.setState(data[id]);
      } else {  // Add other players to scene with their respective state
        players[id] = new Player();
        players[id].setState(data[id]);
      }
    }


    // Now that user has world state, user begins updating 
    // its own game state and sending it to server at a set tick rate
    setInterval(function() {
      let userState = selfPlayer.getState();
      socket.emit("update-state", userState);
    }, 1000/30);


    // Recieves world state from server at a set tick rate and updates local version accordingly
    socket.on('update-world-state', function(data) {
      // Update each player cube from server data
      for (var id in players) {
        // Currently placing full trust in client to their selfPlayer position
        if (id != socket.id) players[id].setState(data[id]);
      }
    });

  });

}





function updateGame(delta) {

  // Doesnt really do anything anymore :/
  // Will probably use it for something soon


}





let keyDown = {};

// Keys
document.addEventListener("keydown", function(evt) {
  keyDown[evt.code] = true;
  if (evt.code == "Space") {
    evt.preventDefault();
  }
  //main.keyPressed[evt.code] = true;
});

document.addEventListener("keyup", function(evt) {
  keyDown[evt.code] = false;
});

window.addEventListener("gamepadconnected", (evt)=>{
    gamepad = evt.gamepad;
});