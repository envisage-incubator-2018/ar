


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

var chosenRoom;

function initVR(tempRoom) {
  chosenRoom = tempRoom
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

  // Loads world (textures, objects, etc)
  loadWorld();

  initGame();

  // Animation is triggered elsewhere once everything is loaded
}

// Adjusts camera to current display size
function onResize(e) {
  effect.setSize(window.innerWidth, window.innerHeight);
  selfPlayer.camera.aspect = window.innerWidth / window.innerHeight;
  selfPlayer.camera.updateProjectionMatrix();
}

// Starts animation of world
function beginAnimate() {
  // Start rendering
  navigator.getVRDisplays().then(function(displays) {
    if (displays.length > 0) {
      vrDisplay = displays[0];
      vrDisplay.requestAnimationFrame(animate);
    }
  });
}

// Request animation frame loop function
function animate(timestamp) {
  var delta = Math.min(timestamp - lastRenderTime, 500);
  lastRenderTime = timestamp;

  selfPlayer.update(delta);
  colliding=false

  updateGame(delta);

  // Performs local updates on room (objects only visible to local user like snow for example)
  if(chosenRoom== 1){
    animateRoom1();
  }else if(chosenRoom== 2){
    animateRoom2()
  }else if(chosenRoom== 3){
    animateRoom3()
  }else if(chosenRoom== 4){
    animateRoom4()
  }else if(chosenRoom== 5){
    animateRoom5()
  }
  
  
  
  //console.log(colliding)
  
  if(colliding==true){
	  if(selfPlayer.movedForward==true){
		selfPlayer.playerGroup.translateZ( 10* delta * selfPlayer.movementSpeed );
	  }
	  if(selfPlayer.movedBack==true){
		selfPlayer.playerGroup.translateZ( 10* delta * -selfPlayer.movementSpeed );
	  }
	  if(selfPlayer.movedLeft==true){
		selfPlayer.playerGroup.translateX( 10* delta * selfPlayer.movementSpeed );
	  }
	   if(selfPlayer.movedRight==true){
		selfPlayer.playerGroup.translateX( 10* delta * -selfPlayer.movementSpeed );
	  }
	  
  }


  // Render the scene from selfPlayers camera view
  effect.render(scene, selfPlayer.camera);

  vrDisplay.requestAnimationFrame(animate);
}
