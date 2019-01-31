/*


*/
class Room5 {
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

		// Create ground mesh
		this.textureLoader.load('tex/ground.jpg', (groundTex)=>{
			var groundMat = new THREE.MeshToonMaterial({map: groundTex})
			var groundGeometry = new THREE.BoxGeometry( 40, 0.1, 40 )
			this.ground = new THREE.Mesh( groundGeometry,  groundMat )
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

		////Collision stuff
		//Collision array
		this.thingsThatCollide =[];
	//	this.cube.add(this.plane);

		beginAnimate();
	}
	updateRoom() {

		//testing collision(remember to update collision boxes)
		colliding=false
		for(let i=0; (i<this.thingsThatCollide.length)&&(colliding==false); i++){
			colliding = selfPlayer.playerCollider.intersectsBox(this.thingsThatCollide[i])
			//console.log(i, colliding)
		}
	}
}
