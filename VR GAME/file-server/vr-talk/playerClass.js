/*

  Each local client generates a player class for all other players in server in server including themselves

  The clients local version of players stores a list of player classes

  Player class can do a variety of things related to individual players:
  - have their position set
  - have their rotation set

  The self player is the player class representing the client themselves
  This player class can have its rotation/position extracted through a function which is then sent to server and distributed to all players
    - rotation extraction function must take into account rotation of whole player + the VR rotation


  All players also have a load function which loads them into the scene
   - this involes adding their plysical body parts into the scene
   - for the self player, a camera is also added to the scene



  Players also have a secondary rotation which represent direction body is facing
    - Both start off facing same direction, but as head rotates the secondary rotation follows when its difference to the head rotation passes a threshold


  //{"position": {x:0,y:0,z:0}, "rotation": {x:0,y:0,z:0}}

*/


class PlayerClass {
	constructor(self=false) {
		this.self = self;

		this.playerGroup = new THREE.Group();
		scene.add(this.playerGroup);

		var geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
		var material = new THREE.MeshNormalMaterial();
		this.cube = new THREE.Mesh(geometry, material);
		this.playerCollider = new THREE.Box3().setFromObject(this.cube)
		this.cube.position.set(0, 0, 0);
		this.cube.rotation.set(0, 0, 0);
		this.playerGroup.add(this.cube);
		//this.playerGroup.add(this.playerCollider);

		this.movementSpeed = 0.003;
		this.rotationSpeed = 0.0012;
		//this.duckLength =0.1;

		//collision handling
		this.oldState =[];
		this.veryOldState = [];

		// If player represents client
		if (this.self) {

			// Create a three.js camera.
			var aspect = window.innerWidth / window.innerHeight;
			this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 10000);

			// Add audio listener to the camera
			this.listener = new THREE.AudioListener();
			this.camera.add(this.listener);

			this.controls = new THREE.VRControls(this.camera);
			//this.controls.standing = true;

			// Camera should follow player
			this.playerGroup.add(this.camera);





			// === Selection variables === //

			// Raycasting stuff
			this.raycaster = new THREE.Raycaster();
			this.intersectingObject = undefined;   // Stores the object we are currently selecting
			this.intersectingTimer = 0;    // Starts from 0 and counts up in seconds until selection timer threshold


			this.selectionProgress = 0;  //progress 'x' in selecting an object where 0<=x<=1

			// Create selection canvas
			this.selectionCanvas = document.createElement('canvas');
			this.selectionCtx = this.selectionCanvas.getContext('2d');
			this.selectionCanvas.width = 512;
			this.selectionCanvas.height = 512;
			this.selectionCtx.strokeStyle = "#FF0000";
			this.selectionCtx.lineWidth = 5;

			// Create and add selection plane that follows camera
			var selectionCanvasTexture = new THREE.CanvasTexture(this.selectionCanvas)
			this.planeMat = new THREE.MeshStandardMaterial({map: selectionCanvasTexture, transparent:true});
			this.planeMat.depthTest = false;		// Always renders plane on top of all other objects
			var planeGeometry = new THREE.PlaneGeometry( 3, 3, 0 );
			this.plane = new THREE.Mesh( planeGeometry, this.planeMat );
			this.plane.position.z = -3
			this.camera.add(this.plane);

		}

	}
	update(delta) {

		if (gamepad != undefined) {

			this.updateGamepadInputs(delta);

		} else {  // Move with keyboard controls

			if (keyDown["KeyW"]) {

				let moveVector = new THREE.Vector3();
				this.camera.getWorldDirection(moveVector);

				moveVector = moveVector.multiplyScalar(delta * this.movementSpeed);

				this.playerGroup.position.add(moveVector);

				this.movedForward = true;
			}
			if (keyDown["KeyS"]) {

				let moveVector = new THREE.Vector3();
				this.camera.getWorldDirection(moveVector);

				moveVector = moveVector.multiplyScalar(delta * -this.movementSpeed);

				this.playerGroup.position.add(moveVector);


				this.movedBack=true;
			}
			if (keyDown["KeyA"]) {

				let moveVector = new THREE.Vector3();
				this.camera.getWorldDirection(moveVector);

				// Rotate camera world direction by 90 degrees clockwise around y axis (turn right)
				moveVector.applyAxisAngle(new THREE.Vector3(0,1,0), Math.PI/2)

				moveVector = moveVector.multiplyScalar(delta * this.movementSpeed);
				this.playerGroup.position.add(moveVector);

				this.movedLeft=true;
			}
			if (keyDown["KeyD"]) {

				let moveVector = new THREE.Vector3();
				this.camera.getWorldDirection(moveVector);

				// Rotate camera world direction by 90 degrees clockwise around y axis (turn right)
				moveVector.applyAxisAngle(new THREE.Vector3(0,1,0), -Math.PI/2)

				moveVector = moveVector.multiplyScalar(delta * this.movementSpeed);
				this.playerGroup.position.add(moveVector);

				this.movedRight=true;
			}


			if (keyDown["KeyE"]) {
				this.playerGroup.rotateY( delta * -this.rotationSpeed );
			}
			if (keyDown["KeyQ"]) {
				this.playerGroup.rotateY ( delta * this.rotationSpeed );
			}
			if (keyDown["KeyR"]) {
				this.playerGroup.rotateX( delta * this.rotationSpeed );
			}
			if (keyDown["KeyF"]) {
				this.playerGroup.rotateX( delta * -this.rotationSpeed );
			}
			if (keyDown["Space"]) {
				this.playerGroup.translateY( delta * this.movementSpeed );
			}
			if (keyDown["KeyR"]) {
				this.playerGroup.rotateX( delta * this.movementSpeed/2 );
			}
			if (keyDown["KeyF"]) {
				this.playerGroup.rotateX( delta * -this.movementSpeed/2 );
			}
			if (keyDown["ShiftLeft"]) {
				this.playerGroup.translateY( delta * -this.movementSpeed );
			}
			if (keyDown["KeyH"]) {

				for (var i = 0; i < intersects.length; i++) {
					//  if (intersects[i].object.position.y != 5) {
					//     intersects[0].object.material.color.set(0xff0000);
					//  }

					console.log(intersects);
				}
			}
		}

		//console.log(delta)

		//players[socket.id].rotation.set(camera.rotation.x, camera.rotation.y, camera.rotation.z);


		this.updateObjectSelection(delta);



		// Only update controls (looking around and stuff) if VRDisplay is presenting.
		if (vrButton.isPresenting()) {
			this.controls.update();
		}

		this.playerCollider.setFromObject(this.cube)
	}
	setState(state) {
		this.playerGroup.position.set(state.position.x, state.position.y, state.position.z);
		this.playerGroup.rotation.set(state.rotation.x, state.rotation.y, state.rotation.z);
	}
	setPosition(pos) {	// Sets position of player (but uses dictionary notation so Vector3's will work)
		this.playerGroup.position.set(pos.x, pos.y, pos.z);
	}

	getCopyState(){
		var xPos=this.playerGroup.position.x
		var yPos=this.playerGroup.position.y
		var zPos=this.playerGroup.position.z
		var xRot=this.playerGroup.rotation.x
		var yRot=this.playerGroup.rotation.y
		var zRot=this.playerGroup.rotation.z
		var xCam=this.camera.rotation.x
		var yCam=this.camera.rotation.y
		var zCam=this.camera.rotation.z

		var posArray=[xPos, yPos, zPos, xRot, yRot, zRot, xCam, yCam, zCam]
		return(posArray)

	}
	setCopyState(oldState){
		this.playerGroup.position.set(oldState[0], oldState[1], oldState[2])
		this.playerGroup.rotation.set(oldState[3]-oldState[6], oldState[4]-oldState[7], oldState[5]-oldState[8])

	}
	getState() {
		//return {"position": this.playerGroup.position, "rotation": {x:0,y:0,z:0}};
		return {
			"position": this.playerGroup.position,
			"rotation": {
				x:this.playerGroup.rotation.x + this.camera.rotation.x,
				y:this.playerGroup.rotation.y + this.camera.rotation.y,
				z:this.playerGroup.rotation.z + this.camera.rotation.z
			}
		}
	}
	addToScene() {

	}
	removeFromScene() {
		scene.remove(this.playerGroup);
	}

	updateGamepadInputs(delta) {
		// Updates the gamepad axes by requesting them again
		navigator.getGamepads()

		//document.getElementById("log").innerHTML = "<br>gamepad: " + gamepad.axes;
		//document.getElementById("log").innerHTML += "<br>gamepad navigator: " + navigator.getGamepads()[0].axes;


		// Move player
		if (Math.abs(gamepad.axes[joysticks['LeftVertical']]) > 0.05) {

			let moveVector = new THREE.Vector3();
			this.camera.getWorldDirection(moveVector);

			moveVector = moveVector.multiplyScalar(delta * this.movementSpeed * -gamepad.axes[joysticks['LeftVertical']]);

			this.playerGroup.position.add(moveVector);


			//this.playerGroup.translateZ( delta * this.movementSpeed * gamepad.axes[joysticks['LeftVertical']]);
		}
		if (Math.abs(gamepad.axes[joysticks['LeftHorizontal']]) > 0.05) {


			let moveVector = new THREE.Vector3();
			this.camera.getWorldDirection(moveVector);

			// Rotate camera world direction by 90 degrees clockwise around y axis (turn right)
			moveVector.applyAxisAngle(new THREE.Vector3(0,1,0), -Math.PI/2);

			moveVector = moveVector.multiplyScalar(delta * this.movementSpeed * gamepad.axes[joysticks['LeftHorizontal']]);
			this.playerGroup.position.add(moveVector);


			//this.playerGroup.translateX( delta * this.movementSpeed * gamepad.axes[joysticks['LeftHorizontal']]);
		}


		// Rotate camera
		if (Math.abs(gamepad.axes[joysticks["RightHorizontal"]]) > 0.05) {
			// Copied from new version of Three.js
			var q1 = new THREE.Quaternion();

			q1.setFromAxisAngle(new THREE.Vector3(0, 1, 0), gamepad.axes[joysticks['RightHorizontal']] * -0.05);
			this.playerGroup.quaternion.premultiply(q1);

		}
		if (Math.abs(gamepad.axes[joysticks["RightVertical"]]) > 0.05) {
			//this.playerGroup.rotateX(gamepad.axes[joysticks['RightVertical']] * -0.05);
		}
	}

	updateObjectSelection(delta) {

		// Clear the canvas at the beginning of each frame
		this.selectionCtx.clearRect(0, 0, this.selectionCanvas.width, this.selectionCanvas.height)

		// Draw circle in centre of screen
		this.selectionCtx.beginPath();
		this.selectionCtx.arc(this.selectionCanvas.width/2, this.selectionCanvas.height/2, this.selectionCanvas.width*0.005, 0, 2*Math.PI);
		this.selectionCtx.fill();

		// Draw rectangle bordering selection plane
		//this.selectionCtx.beginPath();
		//this.selectionCtx.rect(0, 0, this.selectionCanvas.width, this.selectionCanvas.height);
		//this.selectionCtx.stroke();


		// Selection raycasting

		// update the raycasting position
		this.raycaster.setFromCamera({x:0,y:0}, this.camera);
		let intersects = this.raycaster.intersectObjects(scene.children);
		if (intersects.length > 0 && intersects[0].object.userData.Selectable) {
			//console.log("Looking at a selectable item")
			this.intersectingObject = intersects[0];   // Store object

			// Only increment timer if object is within selection distance
			if (this.intersectingObject.distance <= this.intersectingObject.object.userData.ActivationDistance) {

				// selectionProgress becomes the timer as a percentage of the threshold required to select the object.
				this.selectionProgress = this.intersectingTimer/this.intersectingObject.object.userData.SelectThreshold;

				// Draw selection circle
				this.selectionCtx.beginPath();
				this.selectionCtx.arc(256, 256, 50, -0.5*Math.PI, this.selectionProgress*2*Math.PI-0.5*Math.PI);
				this.selectionCtx.stroke();

				// Increment object timer in seconds
				//console.log("Incrementing timer")
				this.intersectingTimer += delta/1000;

				// If object has reached selection timer, activate objects function and reset selection
				if (this.intersectingTimer >= this.intersectingObject.object.userData.SelectThreshold) {
					//console.log("Activating Selection Function!!!");
					objectFunctions[this.intersectingObject.object.userData.ActivationFunction](this.intersectingObject.object.userData.ActivationParameter);
					this.intersectingObject = undefined;
					this.intersectingTimer = 0;
				}

			} else {
				//console.log("Too far away from object")
				this.intersectingObject = undefined;
				this.intersectingTimer = 0;
			}

		} else {  // If not intersecting with selectable object, reset selection stuff
			//console.log("Not looking at a selectable item")
			this.intersectingObject = undefined;
			this.intersectingTimer = 0;
		}


		// Forces canvas gui plane to update material
		this.planeMat.map.needsUpdate = true;

	}


}
