/*
  Does game server stuff?

  Client attempts to connect to server
  Once connection is established, client waits until it recieves initial world state

  Upon recieving initial world state,
  - loop through each player and add to player list
  - if player is self, set self to current position and add to players list



  Objects are global to all players
  Client recieves initial position of all objects
  Objects is a dictionary of objects that exist in scene
  When an object is added to room, clients recieve the object information (which also contains the object id)
  When an object is removed from the room, clients recieve just the id of the object
  Each tick, the server sends a dictionary of all objects in scene
    - This dictionary may not need to contain all the information about the object, just the parts
      that may change (position/rotation) and other things like object model is only needed when the object is added
  Client creates/updates their own dictionary of the object list, different from what the server stores
    - Objects use an objectClass which has similar function to playerClass

*/


let socket;
let players = {};   // Stores a PlayerClass for each player keyed by the players id
let objects = {};   // Stores an ObjectClass for each object in scene keyed by a custom object id

function initGame() {

  // Create socket connected to node server hosted seperately from file server
  let ip = window.location.origin;
  let serverIp = ip.substring(0, ip.lastIndexOf(":")) + ":3000";
  console.log("Connecting to game server:", serverIp)
  socket = io.connect(serverIp);



  socket.on('connect', function() {
    console.log("Connected to server with id", socket.id);

    socket.emit("join-room", "room"+chosenRoom);
  });

  // Calculate player latency and displays it
  socket.on('pong', function(latency) {
    document.getElementById("ping").innerHTML = "Ping: " + latency;
  });


  // Creates cube and adds to scene when new user connects
  socket.on("user-connected", function(id) {
    console.log("User connected: " + id);

    players[id] = new PlayerClass();
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

    // Add each player class to players
    for (let id in data.players) {
      if (id == socket.id) {  // Add selfPlayer to scene with the recieved state
        players[id] = selfPlayer;
        selfPlayer.setState(data.players[id]);
      } else {  // Add other players to scene with their respective state
        players[id] = new PlayerClass();
        players[id].setState(data.players[id]);
      }
    }

    // Add each object to room
    for (let id in data.objects) {
      objects[id] = createObject(data.objects[id]);
    }

    if (room.initRoomData) {
       room.initRoomData(data);
    }


    // Now that user has world state, user begins updating
    // its own game state and sending it to server at a set tick rate
    setInterval(function() {
      let playerState = selfPlayer.getState();
      socket.emit("update-state", playerState);
      selfPlayer.playerData = {};   // Reset playerData after sending it to server
    }, 1000/60);


    // Recieves world state from server at a set tick rate and updates local version accordingly
    socket.on('update-world-state', function(data) {
      // Update each player from server data
      for (let id in data.players) {
        // Currently placing full trust in client to their selfPlayer position :O
        if (id != socket.id) players[id].setState(data.players[id]);
      }

      // Update each object from server data
      for (let id in data.objects) {
        objects[id].userData.setState(data.objects[id]);
      }

      // Store any extra data server-room sends into the client-room
      if (room.updateRoomData) {
        room.updateRoomData(data);
      }

    });

  });


  /*
  // Adds object to room
  socket.on("object-added", function(objectData) {
    console.log("Object added: " + objectData);

    // Creation of the object automatically adds to scene and this declaration adds to objects dictionary
    objects[objectData.id] = new ObjectClass(objectData);
  });*/

  // Adds object to room
  socket.on("object-removed", function(id) {
    console.log("Object removed: " + id);

    // Remove object from scene
    scene.remove(objects[id]);

    // Delete object from objects dictionary
    delete objects[id];
  });



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





let gamepad;
let joysticks = {
    "LeftHorizontal" : 0,
    "LeftVertical" : 1,
    "RightHorizontal" : 2,
    "RightVertical" : 3
}

window.addEventListener("gamepadconnected", (evt)=>{
    gamepad = evt.gamepad;
    //document.getElementById("log").innerHTML += "<br>yup"
    //document.getElementById("log").innerHTML += "<br>" + navigator.getGamepads()[0]
});

//window.addEventListener("gamepaddisconnected", function(e) {
  //document.getElementById("log").innerHTML += "<br>gamepad disconnected!!!"
//});

//let pads = navigator.getGamepads()
//for (i in pads) {
//  document.getElementById("log").innerHTML += "<br>gamepads: " + pads[i]
//}