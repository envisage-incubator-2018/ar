/*


*/
class Room4 {
	constructor() {
		/*
			Not sure what would go here :/
		*/
	}
	createMeshes() {
		console.log("Creating Meshes")

		// Creates a light
		this.directionalLight = new THREE.DirectionalLight( 0xffffff, 1);

		// Create skybox
		this.textureLoader.load("tex/sky.jpg", (skyTex)=>{
			var skyMat = new THREE.MeshBasicMaterial({
				map: skyTex,
				side: THREE.BackSide
			});
			var skyGeo = new THREE.BoxGeometry (1000, 1000, 1000)
			this.skyBox = new THREE.Mesh( skyGeo, skyMat)
		})

		this.textureLoader.load('tex/ground.jpg', (groundTex)=>{
			var groundMat = new THREE.MeshToonMaterial({map: groundTex})
			var groundGeometry = new THREE.BoxGeometry( 20, 0.1, 30 )
			this.ground = new THREE.Mesh( groundGeometry,  groundMat )
		})



		this.textureLoader.load('tex/box.jpg', (wallTex)=>{
			var wallMat = new THREE.MeshStandardMaterial({map: wallTex})

			// Add walls
			var geometry1 = new THREE.BoxGeometry( 20, 1, 0.1 )
			this.wall1 = new THREE.Mesh( geometry1, wallMat )

			var geometry2 = new THREE.BoxGeometry( 20, 1, 0.1 )
			this.wall2 = new THREE.Mesh( geometry2, wallMat )

			var geometry3 = new THREE.BoxGeometry( 0.1, 1, 30 )
			this.wall3 = new THREE.Mesh( geometry3, wallMat )

			var geometry4 = new THREE.BoxGeometry( 0.1, 1, 30 )
			this.wall4 = new THREE.Mesh( geometry4, wallMat )
		})


	}
	loadRoom() {
	
		console.log("Loading room")

		// Adds a light to the scene
		let lightPos = new THREE.Vector3(2,10,5)
		this.directionalLight.position.copy( lightPos)
		scene.add( this.directionalLight );

		// Adds starbox to scene
		this.skyBox.position.y=5
		scene.add( this.skyBox )

		// Add ground
		scene.add( this.ground )

		// Add walls around stadium
		this.wall1.position.set(0,0.5,-15);
		scene.add( this.wall1 )
		this.wall2.position.set(0,0.5,15);
		scene.add( this.wall2 )
		this.wall3.position.set(10,0.5,0);
		scene.add( this.wall3 )
		this.wall4.position.set(-10,0.5,0);
		scene.add( this.wall4 )


		beginAnimate();
	}
	updateRoom() {
		

	}
}


