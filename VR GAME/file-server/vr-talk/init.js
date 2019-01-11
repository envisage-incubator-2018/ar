


// Last time the scene was rendered.
var lastRenderTime = 0;
// Currently active VRDisplay.
var vrDisplay;

// Various global THREE.Objects.
var scene;
var controls;
var effect;
var camera;
var player;

// EnterVRButton for rendering enter/exit UI.
var vrButton;


function initVR() {
  // Setup three.js WebGL renderer. Note: Antialiasing is a big performance hit.
  // Only enable it if you actually need to.
  var renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setPixelRatio(window.devicePixelRatio);

  // Append the canvas element created by the renderer to document body element.
  document.body.appendChild(renderer.domElement);

  // Create a three.js scene.
  scene = new THREE.Scene();

  // Player holds camera AND cube
  //player = new THREE.Group();


  // Create a three.js camera.
  var aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 10000);

  // Add audio listener to the camera
  var listener = new THREE.AudioListener();
  camera.add(listener);

  controls = new THREE.VRControls(camera);
  controls.standing = true;
  //camera.position.y = controls.userHeight;


  //player.add(camera);


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
    camera.quaternion.set(0, 0, 0, 1);
    camera.position.set(0, controls.userHeight, 0);
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
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
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

  updateGame(delta);

  // Performs local updates on room (objects only visible to local user like snow for example)
  if(chosenRoom== 1){
    animateRoom1();
  }else if(chosenRoom== 2){
    animateRoom2()
  }else if(chosenRoom== 3){
    animateRoom3()
  }

  // Only update controls (looking around and stuff) if VRDisplay is presenting.
  if (vrButton.isPresenting()) {
    controls.update();
  }
  // Render the scene.
  effect.render(scene, camera);

  vrDisplay.requestAnimationFrame(animate);
}
