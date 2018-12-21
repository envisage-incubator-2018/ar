


let socket;
let players = {};   // Stores the cubes of each player


function initGame() {

  // Create socket connected to node server hosted seperately from file server
  let serverIp = window.location.origin.split(":")[0] + ":" + window.location.origin.split(":")[1] + ":3000";
  socket = io.connect(serverIp);


  socket.on('connect', function() {
    console.log("Connected to server with id", socket.id);
  });

  // Calculate player latency and displays it
  socket.on('pong', function(latency) {
    document.getElementById("ping").innerHTML = "Ping: " + latency;
  });


  // Creates cube and adds to scene when new user connects
  socket.on("user-connected", function(data) {
    console.log("User connected: " + data);

    var geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    var material = new THREE.MeshNormalMaterial();
    players[data] = new THREE.Mesh(geometry, material);
    players[data].position.set(0, 0, 0);
    players[data].rotation.set(0, 0, 0);
    scene.add(players[data]);
  });

  // Remove cube from scene of users who have disconnected
  socket.on("user-disconnected", function(data) {
    console.log("User disconnected: " + data);

    scene.remove(players[data]);
    delete players[data];
  });


  // Recieves world state from server in response to the "new player" socket
  socket.on('init-world-state', function(data) {
    //console.log("scene", scene)

    console.log("Received init world state", data);

    // Store world state and get user position


    //players[socket.id].position.set(camera.position.x, camera.position.y, camera.position.z);
    //players[socket.id].rotation.set(camera.rotation.x, camera.rotation.y, camera.rotation.z);


    // Add each player cube to players
    for (var id in data) {
      var geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      var material = new THREE.MeshNormalMaterial();
      players[id] = new THREE.Mesh(geometry, material);
      players[id].position.set(data[id].position.x, data[id].position.y, data[id].position.z);
      players[id].rotation.set(data[id].rotation.x, data[id].rotation.y, data[id].rotation.z);
      scene.add(players[id]);
    }

    // Set users position to where server thinks they are
    camera.position.set(players[socket.id].position.x, players[socket.id].position.y, players[socket.id].position.z);
    camera.rotation.set(players[socket.id].rotation.x, players[socket.id].rotation.y, players[socket.id].rotation.z);


    // Now that user has world state, user begins updating 
    // its own game state and sending it to server at a set tick rate
    setInterval(function() {
      let userState = {
        "position": camera.position,
        "rotation": {x:camera.rotation.x, y:camera.rotation.y, z:camera.rotation.z}
      }
      //console.log(userState)
      socket.emit("update-state", userState);
    }, 1000/30);



    // Recieves world state from server at a set tick rate and updates local version accordingly
    socket.on('update-world-state', function(data) {

      // Update each player cube from server data
      for (var id in players) {
        players[id].position.set(data[id].position.x, data[id].position.y, data[id].position.z);
        players[id].rotation.set(data[id].rotation.x, data[id].rotation.y, data[id].rotation.z);
      }

      // Player uses local version of its state (it really shouldn't but it does for now)
      players[socket.id].position.set(camera.position.x, camera.position.y, camera.position.z);
      players[socket.id].rotation.set(camera.rotation.x, camera.rotation.y, camera.rotation.z);

    });


  });

}





function updateGame(delta) {

  // Apply rotation to cube mesh
  cube.rotation.y += delta * 0.0006;

  //cube.position.z += delta * 100;

  if (keyDown["KeyW"]) {
    camera.translateZ( delta * -0.001 );
  }
  if (keyDown["KeyS"]) {
    camera.translateZ( delta * 0.001 );
  }  
  if (keyDown["KeyA"]) {
    camera.translateX( delta * -0.001 );
  }  
  if (keyDown["KeyD"]) {
    camera.translateX( delta * 0.001 );
  }
  if (keyDown["Space"]) {
    camera.translateY( delta * 0.001 );
  }  
  if (keyDown["ShiftLeft"]) {
    camera.translateY( delta * -0.001 );
  }

  //console.log(delta)
  
  //players[socket.id].rotation.set(camera.rotation.x, camera.rotation.y, camera.rotation.z);

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
