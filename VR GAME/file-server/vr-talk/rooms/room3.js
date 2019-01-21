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
			
		//dummy box
		var testBoxGeo = new THREE.BoxGeometry(4,4,10)
		this.testBox =new THREE.Mesh(testBoxGeo, skyMat)
		
		
		// Creates ground mesh
		var groundGeometry = new THREE.BoxGeometry( 40, 0.1, 40 )
		this.ground = new THREE.Mesh( groundGeometry, skyMat )

		})








	}
	loadRoom() {
	
		console.log("Loading room")
		//creating object
		this.testBox.position.x=4
		this.testBound = new THREE.Box3().setFromObject(this.testBox)
		scene.add(this.testBox)

		// Adds a light to the scene
		let lightPos = new THREE.Vector3(2,10,5)
		this.directionalLight.position.copy( lightPos)
		scene.add( this.directionalLight );
		//directionalLight.target = cube

		// Adds starbox to scene
		scene.add( this.starBox );

		// Add ground
		scene.add( this.ground )
		
		////Collision stuff
		//Collision array
		this.thingsThatCollide =[];
		this.thingsThatCollide.push(this.testBound)

		beginAnimate();
	}
	updateRoom() {
		
		this.starBox.rotation.z +=0.002
		
		//testing collision(remember to update collision boxes)
		colliding=false
		for(let i=0; (i<this.thingsThatCollide.length)&&(colliding==false); i++){
			colliding = selfPlayer.playerCollider.intersectsBox(this.thingsThatCollide[i])
			//console.log(i, colliding)
		}
	}
}


