/*


*/
class Room2 {
	constructor() {
		/*
			Not sure what would go here :/
		*/
	}
	createMeshes() {
		console.log("Creating Meshes")

		// Creates a light
		this.directionalLight = new THREE.DirectionalLight( 0xffffff, 1);


		// Creates a sky
		this.textureLoader.load("tex/sky.jpg", (skyTex)=>{
			var skyMat = new THREE.MeshBasicMaterial({
				map: skyTex,
				side: THREE.BackSide
			});
			var skyGeo = new THREE.BoxGeometry (50, 50, 50)
			this.skyBox = new THREE.Mesh( skyGeo, skyMat)
		})


		// Creates a ground mesh
		this.objLoader.load('mod/untitled.obj', (ground)=>{
			this.ground = ground;
			this.textureLoader.load('tex/ground.jpg', (groundTex)=>{
				var groundMat = new THREE.MeshStandardMaterial({map: groundTex});
				this.ground.traverse((node)=>{
					if (node.isMesh) node.material = groundMat
				});
			});
		});


		// Creates cube mesh
		this.textureLoader.load('tex/box.jpg', (cubeTex)=>{

			var cubeMat = new THREE.MeshStandardMaterial({map: cubeTex})
			var geometry = new THREE.BoxGeometry( 1, 1, 1 )
			//var material = new THREE.MeshBasicMaterial( { color: 0xff0000 })
			this.cube = new THREE.Mesh( geometry, cubeMat )

			var colGeo = new THREE.BoxGeometry( 2, 2, 2)
			this.testBox = new THREE.Mesh(colGeo, cubeMat)

		});


		// Creates a reference cloud mesh
		this.textureLoader.load('tex/cloud.jpg', (cloudTex)=>{
			var cloudMat = new THREE.MeshToonMaterial({map: cloudTex})
			this.gltfLoader.load("mod/cloud.gltf", (cloud)=>{
				this.cloud = cloud.scene;
				this.cloud.traverse((node)=>{
					if (node.isMesh) {
						node.material = cloudMat;
					}
				})
			})
		})



	}
	loadRoom() {
		console.log("Loading room")

		// Adds a light to the scene
		let lightPos = new THREE.Vector3(2,10,5)
		this.directionalLight.position.copy( lightPos)
		scene.add( this.directionalLight );
		//directionalLight.target = cube

		// Adds sky
		this.skyBox.position.y=5
		scene.add( this.skyBox )

		// Adds ground
		scene.add( this.ground );


		// Cube stuff
		this.cubeBound = new THREE.Box3().setFromObject(this.cube)
		scene.add( this.cube )

		this.testBox.position.z-=2
		this.testBox.position.y+=1
		this.testBound = new THREE.Box3().setFromObject(this.testBox)
		scene.add( this.testBox )


		// Create a bunch of clouds
		this.cloudMoveSpeed = 0.01;
		this.cloud.position.y = 8;
		this.cloud.rotation.y= Math.PI/2
		this.cloudList = [];
		for (let i=0; i<32; i++) {
			let cloneCloud = this.cloud.clone();
			this.cloudList.push(cloneCloud);
			scene.add( cloneCloud );

			cloneCloud.position.z = Math.random() * 100 - 50
			cloneCloud.position.x = Math.random() * 100 - 50
		}



		// Tali's collision variables
		this.oldState = selfPlayer.getCopyState();
		this.colliding = false

		beginAnimate();
	}
	updateRoom() {
		
		this.cube.position.y +=0.01
		this.cube.position.x -= 0.01
		this.cube.position.z -= 0.02
		this.cube.rotation.x += 0.01
		this.cube.rotation.y += 0.1


		// Moves all the clouds
		for (let i=0; i<32; i++) {
			this.cloudList[i].position.x -= this.cloudMoveSpeed
			if (this.cloudList[i] < -50) { 
				this.cloudList[i].position.x = 50
			}
		}



		// Tali's collision code
		// It seems to work for what it is, if you rotate around a little you can usually get out of the collision
		// I think the only reason you can do that though is because you are a cube and rotating can physically move you out of the box without actually changing position
		this.cubeBound.setFromObject(this.cube)
		this.colliding = selfPlayer.playerCollider.intersectsBox(this.testBound) || selfPlayer.playerCollider.intersectsBox(this.cubeBound)

		if (this.colliding) {
			selfPlayer.setCopyState(this.oldState);
		}

		// Store player state ready for next update cycle
		this.oldState = selfPlayer.getCopyState();


	}
}


