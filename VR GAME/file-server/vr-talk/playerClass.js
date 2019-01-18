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
		this.movedForward = false
		this.movedBack = false
		this.movedLeft = false
		this.movedRight = false

		// If player represents client
		if (this.self) {

			// Create a three.js camera.
			var aspect = window.innerWidth / window.innerHeight;
			this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 10000);
			this.camera.position.set(0, 1.5, 0 )

			// Add audio listener to the camera
			var listener = new THREE.AudioListener();
			this.camera.add(listener);

			this.controls = new THREE.VRControls(this.camera);
			//this.controls.standing = true;

			this.playerGroup.add(this.camera);
		}

	}
	update(delta) {
		this.movedForward = false
		this.movedBack = false
		this.movedLeft = false
		this.movedRight = false


		//this.playerGroup.translateZ( delta * -0.001 );
		//this.playerGroup.rotateY ( delta * 0.0001 )

		if (gamepad != undefined) {
			if (Math.abs(gamepad.axes[joysticks['LeftVertical']]) > 0.05) {
				this.playerGroup.translateZ( delta * 0.001 * gamepad.axes[joysticks['LeftVertical']]);
			}
			if (Math.abs(gamepad.axes[joysticks['LeftHorizontal']]) > 0.05) {
				this.playerGroup.translateX( delta * 0.001 * gamepad.axes[joysticks['LeftHorizontal']]);
			}
			if (Math.abs(gamepad.axes[joysticks["RightHorizontal"]]) > 0.05) {
				// Copied from new version of Three.js
				var q1 = new THREE.Quaternion();

				q1.setFromAxisAngle(new THREE.Vector3(0, 1, 0), gamepad.axes[joysticks['RightHorizontal']] * -0.05);
				this.playerGroup.quaternion.premultiply(q1);

			}
			if (Math.abs(gamepad.axes[joysticks["RightVertical"]]) > 0.05) {
				this.playerGroup.rotateX(gamepad.axes[joysticks['RightVertical']] * -0.05);
			}

		} else {  // Move with keyboard controls

			if (keyDown["KeyW"]) {
				this.playerGroup.translateZ( delta * -this.movementSpeed );
				this.movedForward = true
			}
			if (keyDown["KeyS"]) {
				this.playerGroup.translateZ( delta * this.movementSpeed );
				this.movedBack=true
				//console.log("movng back")
			}
			if (keyDown["KeyA"]) {
				this.playerGroup.translateX( delta * -this.movementSpeed );
				this.movedLeft=true
			}
			if (keyDown["KeyD"]) {
				this.playerGroup.translateX( delta * this.movementSpeed );
				this.movedRight=true
			}
			if (keyDown["KeyE"]) {
				this.playerGroup.rotateY( delta * -this.rotationSpeed );
			}
			if (keyDown["KeyQ"]) {
				this.playerGroup.rotateY ( delta * this.rotationSpeed );
			}
			if (keyDown["Space"]) {
				//this.playerGroup.translateY( delta * this.movementSpeed );
			}
			if (keyDown["ShiftLeft"]) {
				this.playerGroup.translateY( delta * -this.movementSpeed );
			}
      if (keyDown["KeyH"]) {

        for (var i = 0; i < intersects.length; i++) {
        //  if (intersects[i].object.position.y != 5) {
            intersects[0].object.material.color.set(0xff0000);
        //  }

            console.log(intersects);
          }
      }
			else{
				this.camera.position.set(0, 1.5, 0 )
			}

		}

		//console.log(delta)

		//players[socket.id].rotation.set(camera.rotation.x, camera.rotation.y, camera.rotation.z);



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

}
