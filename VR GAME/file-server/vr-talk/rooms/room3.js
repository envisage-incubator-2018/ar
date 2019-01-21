/*


*/
class Room3 {
	constructor() {
		/*
			Not sure what would go here :/
		*/
	}
	createMeshes() {
		console.log("Creating Meshes")

		// Creates a light
		this.directionalLight = new THREE.DirectionalLight( 0xffffff, 1);


		// Creates stuff using sky.jpg
		this.textureLoader.load('tex/snow/sky.jpg', (skyTex)=>{
			var skyMat = new THREE.MeshToonMaterial({map: skyTex});

			// Creates sky mesh
			this.objLoader.load('mod/stars.obj', (starBox)=>{
				this.starBox = starBox
				this.starBox.traverse((node)=>{
					if (node.isMesh) node.material = skyMat
				})
			});

			// Creates ground mesh
			var groundGeometry = new THREE.BoxGeometry( 40, 0.1, 40 )
			this.ground = new THREE.Mesh( groundGeometry, skyMat )

		})








	}
	loadRoom() {
	
		console.log("Loading room")

		// Adds a light to the scene
		let lightPos = new THREE.Vector3(2,10,5)
		this.directionalLight.position.copy( lightPos)
		scene.add( this.directionalLight );
		//directionalLight.target = cube

		// Adds starbox to scene
		scene.add( this.starBox );

		// Add ground
		scene.add( this.ground )


		beginAnimate();
	}
	updateRoom() {
		
		this.starBox.rotation.z +=0.002
		
	}
}


