


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
    Room5,
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


  initGame();
  initRTC(chosenRoom);
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



function initRTC(channel) {
  // TODO This is copied from example code
  /** You should probably use a different stun server doing commercial stuff **/
  /** Also see: https://gist.github.com/zziuni/3741933 **/
  var ICE_SERVERS = [
      {url:"stun:stun.l.google.com:19302"}
  ];

  console.log(socket);
  socket.on("rtc_connect", function() {
    console.log("Connected to signaling server");
    setup_microphone(function() {
        /* once the user has given us access to their
         * microphone, join the channel and start peering up */
        console.log(local_media_stream != undefined);
        socket.emit("rtc_join", channel, local_media_stream != undefined);
    });
  });

  socket.on('add_rtc_peer', function(config) {
    if (config.id == socket.id) {
      return;
    }
    console.log('Signaling server said to add peer:', config.id);
    var peer_id = config.id;
    if (peer_id in peers) {
        /* This could happen if the user joins multiple channels where the other peer is also in. */
        console.log("Already connected to peer ", peer_id);
        return;
    }

    // Create and store the RTC P2P connection object
    var conn = new RTCPeerConnection(
        {"iceServers": ICE_SERVERS},
        {"optional": [{"DtlsSrtpKeyAgreement": true}]} /* this will no longer be needed by chrome
                                                        * eventually (supposedly), but is necessary
                                                        * for now to get firefox to talk to chrome */
    );
    peers[peer_id] = conn;

    conn.onicecandidate = function(event) {
        if (event.candidate) {
            socket.emit('relay_data', {
                'ev': 'ice_candidate',
                'peer_id': peer_id,
                'ice_candidate': {
                    'sdpMLineIndex': event.candidate.sdpMLineIndex,
                    'candidate': event.candidate.candidate
                }
            });
        }
    }
    conn.onaddstream = function(event) {
      // Create a new PositionalAudio object using the client as the listener
      if (peer_id == socket.id) {
        return;
      }
      console.log(selfPlayer);
      temp_sound = new Audio();
      temp_sound.srcObject = event.stream;
      var sound = new THREE.PositionalAudio(selfPlayer.listener);
      // sound.autoplay = true;
      sound.setMediaElementSource(temp_sound);
      console.log("Adding PositionalAudio object.");
      // Turn the RTC stream into a source node, and stick it to the PositionalAudio object
      var node = sound.context.createMediaStreamSource(event.stream);
      sound.setNodeSource(node);

      // Attach the audio source to the player object
      players[peer_id].playerGroup.add(sound);

      peer_audio_objects[peer_id] = sound;

    }

    /* Add our local stream */
    if (local_media_stream) {
      console.log("Setting the media stream for the description");
      conn.addStream(local_media_stream);
    }

    /* One side of the P2P connection creates an offer, which the server relays to
     * the other client. That other client then creates and answer and sends it back.
     */
    if (config.make_offer) {
      conn.createOffer(
        function (offer) {
          conn.setLocalDescription(offer,
            function() {
              console.log("Creating RTC offer to ", peer_id);
              socket.emit('relay_data',
                  {'ev' : 'get_session_desc', 'peer_id': peer_id, 'session_description': offer});
            },
            function() {console.log("Couldn't set local RTC description.")}
          );
        },
        function (error) {
          console.log("Error sending offer: ", error);
      });
    }
  });

  /**
   * Peers exchange session descriptions which contains information
   * about their audio settings.
   */
  socket.on('get_session_desc', function(config) {
    console.log('Remote description received: ', config);
    var peer_id = config.peer_id;
    var peer = peers[peer_id];
    if (peer.remoteDescription != null) {
      console.log("Remote description already set.");
      return;
    }
    var remote_description = config.session_description;

    var desc = new RTCSessionDescription(remote_description);
    var promise_chain = peer.setRemoteDescription(desc)
    .then(function() {
      if (remote_description.type == "offer") {
        peer.createAnswer(
          function(answer) {
            console.log(answer);
            peer.setLocalDescription(answer)
            .then(function() {
              var answer = peer.localDescription;
              console.log("Answering remote offer description with: ", answer);
              socket.emit('relay_data',
                {'ev' : 'get_session_desc', 'peer_id': peer_id, 'session_description': answer});
            })
            .catch(function(err) {
              alert("Answering offer failed:" + err);
            });
          },
          function(err) {
            console.log("here" + err);
          }
        );
      }
    })
    .catch(console.log);

    console.log("Description from other peer is " + desc);
  });

  /**
   * The offerer will send a number of ICE Candidate blobs to the answerer so they
   * can begin trying to find the best path to one another on the net.
   */
  socket.on('ice_candidate', function(config) {
      var peer = peers[config.peer_id];
      var ice_candidate = config.ice_candidate;
      peer.addIceCandidate(new RTCIceCandidate(ice_candidate));
  });

  socket.on("remove_rtc_peer", function(id) {
    // Close any connection, and clear assosciated objects from memory
    if (id in peer_audio_objects){
      peer_audio_objects[id].disconnect();
      delete peer_audio_objects[id];
    }
    if (id in peers) {
      peers[id].close();
      delete peers[id];
    }
  });

  socket.on("rtc_disconnect", function() {
    for (peer_id in peers) {
      // Remove all audio tags and close all peer connections
      peer_audio_objects[peer_id].disconnect();
      peers[peer_id].close();
    }

    peers = {};
    peer_audio_objects = {};
  });
}

// Setup access to the microphone on this client
function setup_microphone(callback) {
  if (local_media_stream) {
      // Fire the callback if the mic is already setup
      if (callback) callback();
      return;
  }

  // Ask user for permission to use the computer's microphone
  console.log("Requesting access to local microphone.");

  navigator.mediaDevices.getUserMedia({"audio" : true, "video" : false})
    .then(function(stream) {
      // If user accepts microphone access, set the local_media_stream variable
      console.log("Access granted to microphone.");
      local_media_stream = stream;

      if (callback) callback();
    })
    .catch(function(err) {
      // Otherwise, notify the user, and fail
      console.log("Access denied for microphone.");
      if (callback) callback();
      console.log("You did not to provide access to the microphone. You will not be able to talk.");
    }
  );
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

  //updateGame(delta);

  // Update player-specific code (movement, selection)
  selfPlayer.update(delta);

  // Performs local updates on room (objects only visible to local user like snow for example)
  // The equivilant of the old animate1()...
  room.updateRoom();

  // Render the scene from selfPlayers camera view
  effect.render(scene, selfPlayer.camera);

  // Loop back to animate next frame when possible
  vrDisplay.requestAnimationFrame(animate);
}
