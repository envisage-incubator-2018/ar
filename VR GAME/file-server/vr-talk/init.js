


// Last time the scene was rendered.
var lastRenderTime = 0;

// Currently active VRDisplay.
var vrDisplay;

// Various global THREE.Objects.
var scene;
var effect;

// EnterVRButton for rendering enter/exit UI.
var vrButton;

// The player which represents the client themselves
var selfPlayer;


var chosenRoom = -1;  // Store a global version of chosen room so socket code knows which room to join
var room;   // The room class that the player is currently in

//colliding is global
var colliding = false;


// WebRTC stuff
var oldPosition;
// this client's microphone / webcam
var local_media_stream;
// Dictionary of peer connections [indexed by player id]
var peers = {};
// Dictionary of PositionalAudio objects in three js [indexed by player id]
var peer_audio_objects = {};




function initVR(roomNum) {
  chosenRoom = roomNum;

  // Removes buttons
  document.getElementById("roomCreate").parentNode.removeChild(document.getElementById("roomCreate"));

  // Setup three.js WebGL renderer. Note: Antialiasing is a big performance hit.
  // Only enable it if you actually need to.
  var renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setPixelRatio(window.devicePixelRatio);

  // Append the canvas element created by the renderer to document body element.
  document.body.appendChild(renderer.domElement);

  // Create a three.js scene.
  scene = new THREE.Scene();

  // Create self player
  selfPlayer = new PlayerClass(true);


  // Apply VR stereo rendering to renderer.
  effect = new THREE.VREffect(renderer);
  effect.setSize(window.innerWidth, window.innerHeight);

  // Adjust camera when resizing (browser size change on PC, flipping phone, etc)
  window.addEventListener('resize', onResize, true);
  window.addEventListener('vrdisplaypresentchange', onResize, true);

  // Initialize the WebVR UI.
  var uiOptions = {
    color: 'black',
    background: 'white',
    corners: 'square'
  };
  vrButton = new webvrui.EnterVRButton(renderer.domElement, uiOptions);
  vrButton.on('exit', function() {
    selfPlayer.camera.quaternion.set(0, 0, 0, 1);
    selfPlayer.camera.position.set(0, selfPlayer.controls.userHeight, 0);
  });
  vrButton.on('hide', function() {
    document.getElementById('ui').style.display = 'none';
  });
  vrButton.on('show', function() {
    document.getElementById('ui').style.display = 'inherit';
  });
  document.getElementById('vr-button').appendChild(vrButton.domElement);
  document.getElementById('magic-window').addEventListener('click', function() {
    vrButton.requestEnterFullscreen();
  });


  /*
    The stuff below needs to be syncronized properly
    Should begin by spending time connecting to server (fetching positions of static and dynamic objects in the world)
    Only after this is complete should the required models/textures be loaded in
    Once this is complete, the scene can begin rendering.
    This will prevent errors of textures not being loaded while the game is trying to use them.
  */


  // Create the room
  // This is the list of room and their classes
  let roomList = [
    Room_Music,
    Room1,
    Room2,
    Room3,
    Room_Soccer,
    Room_Checkers,
    Room6
  ]
  room = new roomList[chosenRoom]();



  //// Do some setup which is the same in every room so I don't need to manually change each room file when a change is made
  // loadManager tracks which files have been loaded through each of the loaders
  // Due to OBJLoader.setMaterial being used by multiple loaders at once, the current fix it to have multiple OBJLoader's
  room.loadManager = new THREE.LoadingManager();
  room.textureLoader = new THREE.TextureLoader(room.loadManager);
  room.objLoader = new THREE.OBJLoader(room.loadManager);
  room.objLoader2 = new THREE.OBJLoader(room.loadManager);
  room.mtlLoader = new THREE.MTLLoader(room.loadManager);
  room.gltfLoader = new THREE.GLTFLoader(room.loadManager);
  room.fileLoader = new THREE.FileLoader(room.loadManager);
  room.audioLoader = new THREE.AudioLoader(room.loadManager);

  room.loadManager.onProgress = function(url, itemsLoaded, itemsTotal ) {
    console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
  }

  // After all files have been loaded, loadRoom will run
  room.loadManager.onLoad = ()=>{
    console.log("==== Finished loading meshes for room ====")
    room.loadRoom();
    initGame();
    initRTC(chosenRoom);
    beginAnimate();
  }

  // loadManager.onLoad will not trigger if it never needed to load a single resource
  room.neededResources = false;   // Assume no resources are needed
  room.loadManager.onStart = ()=>{  // If loadManager starts, resources were needed
    room.neededResources = true;
  }

  // Being loading room by creating meshes
  room.createMeshes();

  // If no resources were needed, manually trigger the room.loadRoom function
  if (room.neededResources == false) room.loadManager.onLoad();

}

// This function is run once the room is loaded
function beginAnimate() {
  // Start rendering
  navigator.getVRDisplays().then(function(displays) {
    if (displays.length > 0) {
      vrDisplay = displays[0];
      vrDisplay.requestAnimationFrame(animate);
    }
  });
}



// Adjusts camera to current display size
function onResize(e) {
  effect.setSize(window.innerWidth, window.innerHeight);
  selfPlayer.camera.aspect = window.innerWidth / window.innerHeight;
  selfPlayer.camera.updateProjectionMatrix();
}


// Request animation frame loop function
function animate(timestamp) {
  var delta = Math.min(timestamp - lastRenderTime, 500);
  lastRenderTime = timestamp;

	if (colliding) {
		selfPlayer.setCopyState(selfPlayer.veryOldState);
	}

	// Store player state ready for next update cycle
	selfPlayer.veryOldState =selfPlayer.oldState
	selfPlayer.oldState = selfPlayer.getCopyState();

  // Update player-specific code (movement, selection)
  selfPlayer.update(delta);

  // Performs local updates on room (objects only visible to local user like snow for example)
  room.updateRoom();

  // Render the scene from selfPlayers camera view
  effect.render(scene, selfPlayer.camera);

  // Loop back to animate next frame when possible
  vrDisplay.requestAnimationFrame(animate);
}
