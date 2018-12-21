


let socket;
let players = {};   // Stores the cubes of each player
let gamepad;

let joysticks = {
    "LeftHorizontal" : 0,
    "LeftVertical" : 1,
    "RightHorizontal" : 2,
    "RightVertical" : 3
}

function initGamepad(evt) {
    gamepad = evt.gamepad;
}

function initGame() {

  // Create socket connected to node server seperate from file server
  let serverIp = window.location.origin.split(":")[0] + ":" + window.location.origin.split(":")[1] + ":3000";
  socket = io.connect(serverIp);  // could use something like window.location.origin to dynamically set connection point

  //socket = io.connect('http://120.153.145.248:3000');

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
    //for (var i in data) {
    //  console.log(i, data[i])
    //}

    // Store world state and get user position

    // Add each player cube to players
    for (var id in data) {
      var geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      var material = new THREE.MeshNormalMaterial();
      players[id] = new THREE.Mesh(geometry, material);
      players[id].position.set(data[id].x, data[id].y, data[id].z);
      scene.add(players[id]);
    }

    // Set users position to where server thinks they are
    camera.position.set(players[socket.id].position.x, players[socket.id].position.y, players[socket.id].position.z);


    // Now that user has world state, user begins updating 
    // its own game state and sending it to server at a set tick rate
    setInterval(function() {
      socket.emit("update-position", camera.position);
    }, 1000/30);



    // Recieves world state from server at a set tick rate and updates local version accordingly
    socket.on('update-world-state', function(data) {

      // Add each player cube to players
      for (var id in players) {
        players[id].position.set(data[id].x, data[id].y, data[id].z);
      }

      // Player uses local version of its position (it really shouldn't but it does for now)
      players[socket.id].position.set(camera.position.x, camera.position.y, camera.position.z);

    });


  });

}





function updateGame(delta) {

  // Apply rotation to cube mesh
  cube.rotation.y += delta * 0.0006;

  //cube.position.z += delta * 100;

  if (Math.abs(gamepad.axes[joysticks['LeftVertical']])) {
    camera.translateZ( delta * 0.001 * gamepad.axes[joysticks['LeftVertical']]);
  }
  if (Math.abs(gamepad.axes[joysticks['LeftHorizontal']])) {
    camera.translateX( delta * 0.001 * gamepad.axes[joysticks['LeftHorizontal']]);
  }
  if (keyDown["Space"]) {
    camera.translateY( delta * 0.001 );
  }  
  if (keyDown["ShiftLeft"]) {
    camera.translateY( delta * -0.001 );
  }

  
  
  camera.rotation.y += gamepad.axes[joysticks['RightHorizontal']] * 0.0001;
  camera.rotation.x += gamepad.axes[joysticks['RightVertical']] * 0.0001;
  
  //console.log(delta)
  
  
  //cube2.position.set(camera.position.x, camera.position.y, camera.position.z);



}











keyDown = {};

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
