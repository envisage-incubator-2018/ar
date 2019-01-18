/*


*/
class Room1 {
	constructor() {
		/*
			Not sure what would go here :/
		*/
	}
	createMeshes() {
		/*
			This function creates all the required meshes for a room
			Meshes (objects in a scene) require both geometries and materials to be loaded
			If the room requires files to be loaded, this function should load them all and then create the mesh that uses them
			All the meshes that are loaded should be saved to the room so that they can be added/updated globally through other functions in the room
			Once all the meshes are created, the loadRoom function will run where we can begin adding the objects to the scene

			An example mesh creation could be:

			textureLoader.load('tex/snow/snow.jpg', function(snowTex) {
				var snowMat = new THREE.MeshToonMaterial({map: snowTex});
				var groundGeometry = new THREE.BoxGeometry( 40, 0.1, 40 )
				this.ground = new THREE.Mesh( groundGeometry, snowMat )
			})



			Btw you can't use the variable "this" to reference the room inside any function that runs due to a load like:
			this.textureLoader.load("tex.png", function(tex) {
				this.tex = tex;		// "this" is not a working reference to the room
			});
			However, if you instead use ()=>{} as your function declaration rather than function(){}, it will work:
			this.textureLoader.load("tex.png", (tex)=>{
				this.tex = tex;		// "this" will reference the room properly
			});


		*/
		console.log("Creating Meshes")


		// Create snow related meshes
		var snowTex = this.textureLoader.load('tex/snow/snow.jpg');
		var snowMat = new THREE.MeshToonMaterial({map: snowTex})
		this.objLoader.load('mod/snow.obj', (snow)=>{
			this.snow1 = snow;
			this.snow1.traverse((node)=>{
				if (node.isMesh) {
					node.material = snowMat
				}
			})
		});


		// Create fire mesh
		this.mtlLoader.load( 'mod/mat/fire.mtl', (materials)=>{
			materials.preload()
			this.objLoader
				.setMaterials(materials)
				.load('mod/fire.obj', (fire)=>{
					this.fire = fire;
			});
		});


		// Create cabin mesh
		this.mtlLoader.load( 'mod/mat/cabin.mtl', (materials)=>{
			materials.preload()
			this.objLoader2
				.setMaterials(materials)
				.load('mod/cabin.obj', (cabin)=>{
					this.cabin = cabin;
			});
		});


		// Creates a ground object
		var groundGeometry = new THREE.BoxGeometry( 40, 0.1, 40 )
		this.ground = new THREE.Mesh( groundGeometry, snowMat )
		

		// Create a random spinny cube object
		this.textureLoader.load('tex/box.jpg', (cubeTex)=> {
			var cubeMat = new THREE.MeshStandardMaterial({map: cubeTex})
			var geometry = new THREE.BoxGeometry( 1, 2, 1 )
			//var material = new THREE.MeshBasicMaterial( { color: 0xff0000 })
			this.cube = new THREE.Mesh( geometry, cubeMat )
		})


		// Creates a skybox object
		this.textureLoader.load("tex/snow/sky.jpg", (skyTex)=>{
			var skyMat = new THREE.MeshBasicMaterial({
				map: skyTex,
				side: THREE.BackSide
			});
			var skyGeo = new THREE.SphereGeometry (50, 50, 50)
			this.skyBox = new THREE.Mesh( skyGeo, skyMat)
		})



		// Create light objects
		this.directionalLight = new THREE.DirectionalLight( 0xffffff, 1);
		this.pointLight = new THREE.PointLight( 0xffd700, 1, 6 );



	}
	loadRoom() {
		/*
			This function sets up the THREE.Scene by adding all the objects to the scene and performing any initialisation
			on them such as setting their position.
			It is only run after all meshes in this.createMeshes() have been loaded so you don't need to worry about adding objects
			that use models/textures which are not loaded yet.
			After this function runs, animate room will begin running for each render cycle


			An example mesh addition to scene could be:

			this.ground.position.set(0, 1, 0);
			this.ground.rotation.set(0, 0.5, 0);
			scene.add( this.ground );

		*/
		console.log("Loading Room")

		// Add cabin to scene
		this.cabin.position.y = 0;
		this.cabin.position.x = 10;
		scene.add( this.cabin );


		// Add snow to scene
		this.snowTrack1 = 50;
		this.snowTrack2 = 100;

		this.snow2 = this.snow1.clone();
		this.snow2.position.y=50

		scene.add( this.snow1 );
		scene.add( this.snow2 );


		// Add fire to scene
		this.fire.position.z =0
		this.fire.position.x =13
		scene.add (this.fire)


		// Add other stuff to scene
		scene.add( this.ground )
		scene.add( this.cube )
		scene.add( this.skyBox )


		// Add light sources to scene
		let lightPos = new THREE.Vector3(-40,20,20);
		this.directionalLight.position.copy(lightPos)
		scene.add( this.directionalLight );

		this.pointLight.position.set(12, 1, 0 );
		scene.add( this.pointLight )




		beginAnimate();
	}
	updateRoom() {
		/*
			This function performs updates on objects in the scene
			This may include moving objects or rotating them.

			It could also add/remove new objects to the scene which have not been created yet, however...
			 - If you wanted to add a new cube to the scene for example, I would recommend pre-creating the object 
			   in createMeshes/loadRoom and then only use updateRoom to add/remove the object from the scene rather
			   than using it to do everything like loading the required materials/models and generating the object.
			 - Mesh.clone() is a thing too so if you were unsure how many of a particular object to create in 
			   loadRoom (perhaps for a ball game?) you could could create a reference object in loadRoom stored as 
			   this.referenceBall and then add it to the scene with scene.add( this.referenceBall.clone() )


			An example update could be:
			
			this.cube.position.y +=0.01
			this.cube.position.x -= 0.01
			this.cube.rotation.x += 0.01
			this.cube.rotation.y += 0.1
			this.fire.rotation.y +=1
		*/
		//console.log("Updating room")


		// Spin cube
		this.cube.position.y +=0.01
		this.cube.position.x -= 0.01
		this.cube.rotation.x += 0.01
		this.cube.rotation.y += 0.1


		// Update snow to make it fall
		this.snow1.position.y -= 0.1
		this.snowTrack1 -= 0.1

		this.snow2.position.y-=0.1
		this.snowTrack2 -= 0.1

		if(this.snowTrack1 <= 0){
			this.snow1.position.y+=100
			this.snowTrack1 = 100
		}

		if(this.snowTrack2 <= 0){
			this.snow2.position.y+=100
			this.snowTrack2 = 100
		}


		// Spin fire
		this.fire.rotation.y +=1

	}
}


