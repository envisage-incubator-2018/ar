/*


*/
class Room_Music {
	constructor() {
		/*
			Not sure what would go here :/
		*/
	}
	createMeshes() {
		console.log("Creating Meshes")

		// Creates light
		this.directionalLight = new THREE.DirectionalLight( 0xffffff, 1);
		this.pointLight = new THREE.PointLight( 0xffd700, 1, 20 );

		// Create skybox
		this.textureLoader.load('tex/snow/sky.jpg', (skyTex)=>{
			var skyMat = new THREE.MeshToonMaterial({map: skyTex});

			// Creates sky mesh
			this.objLoader.load('mod/stars.obj', (skyBox)=>{
				this.skyBox = skyBox
				this.skyBox.traverse((node)=>{
					if (node.isMesh) node.material = skyMat
				})
			});
		})



		// Create ground mesh
		this.textureLoader.load('tex/ground.jpg', (groundTex)=>{
			var groundMat = new THREE.MeshToonMaterial({map: groundTex})
			var groundGeometry = new THREE.BoxGeometry( 40, 0.1, 40 )
			this.ground = new THREE.Mesh( groundGeometry,  groundMat )
		})


		// Create reference stick
		this.textureLoader.load('tex/box.jpg', (cubeTex)=>{
			var cubeMat = new THREE.MeshStandardMaterial({map: cubeTex})
			var geometry = new THREE.CylinderGeometry( 0.25, 0.25, 10, 32)
			this.stick = new THREE.Mesh( geometry, cubeMat )
		})




		/// Song loading

		// Pick song
		this.songList = ["song_posin", "song_do-i-wanna-know"];
		this.songName = this.songList[Math.floor(Math.random()*this.songList.length)];

		// Load song text file
		this.fileLoader.load("rooms/music/" + this.songName + ".txt", (text)=>{
			this.songText = text;
		})

		// Load song file'
		// For some reason the loadManager runs .onLoad() which triggers this.loadRoom() before actually loading the song file?
		this.audioLoader.load("rooms/music/" + this.songName + ".wav", (buffer)=>{
			console.log("loaded songgg")
			this.song = new THREE.Audio(selfPlayer.listener);	
			this.song.setBuffer(buffer);
			this.song.setLoop(true);
			this.song.setVolume(0.1);
			this.song.play();
		});


	}
	loadRoom() {
	
		console.log("Loading room")

		// Adds a light to the scene
		let lightPos = new THREE.Vector3(2,10,5)
		this.directionalLight.position.copy( lightPos)
		scene.add( this.directionalLight );

		this.pointLight.position.set(0, 3, 0 );
		scene.add( this.pointLight )


		// Adds starbox to scene
		this.skyBox.position.y=5
		scene.add( this.skyBox )

		// Add ground
		scene.add( this.ground )



		/// Make a song player and stuff

		// Song text variables
		this.transformSeperation = 1/30;	// Time between each transform

		// Convert song into array of frequency values
		this.songText = this.songText.split("\n");
		this.songArray = [];
		this.songTime = -1;
		for (let i=0; i<this.songText.length-1; i++) {
			this.songArray[i] = this.songText[i].split(",").map(x=>parseFloat(x));
		}

		// Begin song
		// This is where i should actually start the song if three.js wasnt being a pain


		// Create lots of sticks to bob up and down
		this.stickList = [];
		this.stickRadius = 10;
		this.stick.position.y = -5;
		for (let i=0; i<this.songArray[0].length; i++) {
			let stickClone = this.stick.clone();
			this.stickList.push(stickClone)
			let stickAngle = Math.PI*2 * (i/this.songArray[0].length);
			stickClone.position.x = this.stickRadius * Math.cos(stickAngle);
			stickClone.position.z = this.stickRadius * Math.sin(stickAngle);
			scene.add( stickClone )
		}


		beginAnimate();
	}
	updateRoom() {


		// Only do song stuff once it loads... -_-
		if (this.song != undefined) {
			this.songTime ++;

			if (this.songTime >= (60*this.transformSeperation) * this.songArray.length) {
				this.songTime = 0;
				this.song.stop();
				this.song.play();
			}

			// Render boxes based on song time
			let transformIndex = Math.floor(this.songTime / (60*this.transformSeperation));
			for (let i=0; i<this.stickList.length; i++) {
				this.stickList[i].position.y = -5 + 10*this.songArray[transformIndex][i];

				// Rotate them all a bit
				let stickAngle = Math.PI*2 * (i/this.stickList.length) + this.songTime/1000;
				this.stickList[i].position.x = this.stickRadius * Math.cos(stickAngle);
				this.stickList[i].position.z = this.stickRadius * Math.sin(stickAngle);
			}

		}


	}
}


