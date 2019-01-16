


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

// this client's microphone / webcam
var local_media_stream;
// Dictionary of peer connections [indexed by player id]
var peers = {};
// Dictionary of PositionalAudio objects in three js [indexed by player id]
var peer_audio_objects = {};

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
  selfPlayer = new Player(true);

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

  initRTC(tempRoom);

  // Animation is triggered elsewhere once everything is loaded
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
        socket.emit("rtc_join", channel);
    });
  });

  socket.on('add_rtc_peer', function(config) {
    console.log('Signaling server said to add peer:', config.id);
    var peer_id = config.id;
    if (id in peers) {
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
        var sound = new THREE.PositionalAudio(players[socket.id].listener);
        // Turn the RTC stream into a source node, and stick it to the PositionalAudio object
        var node = sound.context.createMediaStreamSource(event.stream);
        sound.setNodeSource(node);

        // Attach the audio source to the player object
        players[peer_id].playerGroup.add(sound);
    }

    /* Add our local stream */
    conn.addStream(local_media_stream);

    /* One side of the P2P connection creates an offer, which the server relays to
     * the other client. That other client then creates and answer and sends it back.
     */
    if (config.make_offer) {
      conn.createOffer(
        function (local_description) {
          conn.setLocalDescription(local_description,
            function() {
              console.log("Creating RTC offer to ", peer_id);
              socket.emit('relay_data',
                  {'ev' : 'get_session_desc', 'peer_id': peer_id, 'session_description': local_description});
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
      var remote_description = config.session_description;

      var desc = new RTCSessionDescription(remote_description);
      var stuff = peer.setRemoteDescription(desc,
        function() {
          if (remote_description.type == "offer") {
            peer.createAnswer(
              function(local_description) {
                peer.setLocalDescription(local_description,
                  function() {
                    console.log("Answering remote offer description with: ", local_description);
                    socket.emit('relay_data',
                        {'ev' : 'get_session_desc', 'peer_id': peer_id, 'session_description': local_description});
                  },
                  function() { alert("Answering offer failed!"); }
                );
              },
              function(error) {
                console.log("Error creating answer: ", error);
                console.log(peer);
              });
          }
        },
        function(error) {
            console.log("Couldn't set the remote description: ", error);
        });
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

  navigator.getUserMedia({"audio" : true, "video" : false})
    .then(function(stream) {
      // If user accepts microphone access, set the local_media_stream variable
      console.log("Access granted to microphone.");
      local_media_stream = stream;

      if (callback) callback();
    })
    .catch(function(err) {
      // Otherwise, notify the user, and fail
      console.log("Access denied for microphone.");
      alert("You did not to provide access to the microphone. You will not be able to talk.");
    }
  );
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

  updateGame(delta);

  // Performs local updates on room (objects only visible to local user like snow for example)
  if(chosenRoom== 1){
    animateRoom1();
  }else if(chosenRoom== 2){
    animateRoom2()
  }else if(chosenRoom== 3){
    animateRoom3()
  }

  // Render the scene from selfPlayers camera view
  effect.render(scene, selfPlayer.camera);

  vrDisplay.requestAnimationFrame(animate);
}
