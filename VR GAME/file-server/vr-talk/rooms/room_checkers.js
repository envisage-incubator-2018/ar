/*


*/
class Room_Checkers {
	constructor() {
		/*
			Not sure what would go here :/
		*/
	}
	createMeshes() {
		console.log("Creating Meshes")

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



		// Creates checkers board mesh
		this.textureLoader.load('tex/snow/sky.jpg', (skyTex)=>{
			let mat = new THREE.MeshToonMaterial({map: skyTex});
			let geo = new THREE.BoxGeometry( 8.5, 0.5, 8.5 )
			this.checkersBoard = new THREE.Mesh( geo, mat )
		})


		// Create both player colours		
		let matWhite = new THREE.MeshLambertMaterial({color: "#ffffff"});
		let matBlack = new THREE.MeshLambertMaterial({color: "#333333"});

		// Creates the two types of pieces (black/white)
		let geoPiece = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 16, 16);
		this.pieceWhite = new THREE.Mesh(geoPiece, matWhite);
		this.pieceBlack = new THREE.Mesh(geoPiece, matBlack);

		// Create the selectable checkered board squares themselves
		let geoSquare = new THREE.PlaneGeometry( 1,1 );
		this.squareWhite = new THREE.Mesh(geoSquare,  matWhite);
		this.squareBlack = new THREE.Mesh(geoSquare,  matBlack);


	}
	loadRoom() {

		console.log("Loading room")

		// Creates and adds a light to the scene
		this.directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5);
		this.directionalLight.position.set(2,4,3);
		scene.add( this.directionalLight );

		this.directionalLight2 = new THREE.DirectionalLight( 0xffffff, 0.5);
		this.directionalLight2.position.set(-2,4,-3);
		scene.add( this.directionalLight2 );


		// Adds starbox to scene
		this.skyBox.position.y=5
		scene.add( this.skyBox )

		// Add ground
		scene.add( this.ground )

		////Collision stuff
		//Collision array
		this.thingsThatCollide =[];
	//	this.cube.add(this.plane);







		// Checkers related variables

		// Add checkers board
		this.checkersBoard.position.y = 0.25
		scene.add( this.checkersBoard )

		// Stores the currently selected piece
		// Pieces range from 0 to 23, -1 means NO piece is selected
		this.selectedPiece;	

		// Multi-dimentional array of checkers board
		// 0 if player 0, 1 if player 1, -1 if empty square
		this.boardState;

		this.checkersPieces = [];

		// Make square planes flat
		this.squareWhite.rotation.x = -Math.PI/2;
		this.squareBlack.rotation.x = -Math.PI/2;

		// Create a board of square planes that can be selected
		this.boardSquares = [];
		for (let y=0; y<8; y++) {
			this.boardSquares.push([]);
			for (let x=0; x<8; x++) {

				let square = ((x%2==y%2) ? this.squareWhite : this.squareBlack).clone();

				square.position.set(
					x - 3.5, 
					0.501,
					y - 3.5
				);

				square.userData = {
					Selectable: false,
					SelectThreshold: 2,	
					ActivationDistance: 10,
					ActivationFunction: "selectSquare",	
					ActivationParameter: {x:x,y:y},

					boardPos: {x:x,y:y},
				}

				this.boardSquares[y].push(square);
				scene.add(square)
			}
		}


	}
	updateRoom() {





	}
	initRoomData(roomData) {		// Runs when server send initial room data (only runs once)

		this.boardState = roomData.boardState;
		this.refreshBoard(this.boardState);

	}
	updateRoomData(roomData) {		// Runs whenever the server sends an updated room state

		if (roomData.boardState) {
			console.log("Recieved new board state from server")
			this.selectedPiece = undefined;		// Remove current piece selection
			this.boardState = roomData.boardState;		// Set new board state
			this.refreshBoard();		// Update board pieces in scene
		}

	}
	refreshBoard() {		// Places board pieces according to this.boardState

		// First clear current board state
		for (let i=0; i<this.checkersPieces.length; i++) {
			scene.remove(this.checkersPieces[i]);
		}
		this.checkersPieces = [];


		// Add new pieces to board
		for (let y=0; y<8; y++) {
			for (let x=0; x<8; x++) {
				let piece = this.boardState[y][x];

				// Do nothing if empty square
				if (piece==-1) continue;	

				piece = ((piece==0) ? this.pieceWhite : this.pieceBlack).clone();
				
				// Move piece in correct place on board
				piece.position.set(
					x - 3.5, 
					0.6,
					y - 3.5
				);

				// Give piece a selectable function that runs "checkersMove" with the piece index as the parameter
				piece.userData = {
					Selectable: true,
					SelectThreshold: 2,	
					ActivationDistance: 10,
					ActivationFunction: "selectPiece",	
					ActivationParameter: piece,

					boardPos: {x:x,y:y},
				}

				this.checkersPieces.push(piece);
				scene.add(piece);
			}
		}


		// Make all board squares non-selectable again
		for (let y=0; y<8; y++) {
			for (let x=0; x<8; x++) {
				this.boardSquares[y][x].userData.Selectable = false;
			}
		}


	}
	selectPiece(piece) {

		// First make all board squares non-selectable
		for (let y=0; y<8; y++) {
			for (let x=0; x<8; x++) {
				this.boardSquares[y][x].userData.Selectable = false;
			}
		}


		let boardPos = piece.userData.boardPos;

		// If player selected same piece, deselect it
		if (this.selectedPiece == piece) {
			console.log("Player de-selected piece " + boardPos.x + "," + boardPos.y);
			piece.position.y = 0.6;
			this.selectedPiece = undefined;
			return;
		}

		console.log("Player selected piece " + boardPos.x + "," + boardPos.y)

		// Move previously selected piece back down
		if (this.selectedPiece) {
			this.selectedPiece.position.y = 0.6;
		}

		// Store new selected piece
		this.selectedPiece = piece;

		// Move selected piece up a bit
		piece.position.y = 1;

		// Send piece selection to server so that player can also see a hovering piece
		selfPlayer.playerData.selectedPiece = boardPos;


		// Make the squares of valid moves selectable
		let validMoves = this.getValidMoves();
		for (let i=0; i<validMoves.length; i++) {
			this.boardSquares[validMoves[i].y][validMoves[i].x].userData.Selectable = true;
		}

	}
	getValidMoves() {	// Returns an array of possible moves 
		/*
			Loop through each square that is empty
			Check each diagonal if player can move onto that square

			Take into account:
				Whether the piece is of the same colour as player
				Whether piece is "kinged" or not (will need to change board representation)

		*/
		let validMoves = [];

		// The currently selected board position (possible moves stem from this position)
		let pos = this.selectedPiece.userData.boardPos;

		if (pos.x>0 && pos.y>0 && this.boardState[pos.y-1][pos.x-1] == -1) {
			validMoves.push({x:pos.x-1,y:pos.y-1}); 
		}
		if (pos.x>0 && pos.y<7 && this.boardState[pos.y+1][pos.x-1] == -1)  {
			validMoves.push({x:pos.x-1,y:pos.y+1}); 
		}
		if (pos.x<7 && pos.y>0 && this.boardState[pos.y-1][pos.x+1] == -1) {
			validMoves.push({x:pos.x+1,y:pos.y-1}); 
		}
		if (pos.x<7 && pos.y<7 && this.boardState[pos.y+1][pos.x+1] == -1) {
			validMoves.push({x:pos.x+1,y:pos.y+1}); 
		}

		return validMoves;
	}
	selectSquare(pos) {

		// Player made move

		console.log("Player selected square " + pos.x + "," + pos.y)

		selfPlayer.playerData.selectedMove = [
			this.selectedPiece.userData.boardPos,
			pos
		];

	}
}


/*

	Server sends room data to client every tick

	Make some assumptions about room data per room,
	e.g. if boardState is sent through room data, boardState must have changed and i can update pieces accordingly and assume that it is now my move
	e.g. if pieceSelected is sent, other user must have selected a piece and move piece upwards

	future optimisations...
	e.g. if object is sent, update object position, otherwise don't bother?
	e.g. if player is sent, update player position, otherwise don't bother?



	Each piece stores its location in the board
	When a move is recieved from the server, the refreshBoard function will run with the new board state as a parameter
		All pieces are removed from game
		A loop will loop through each square, creating pieces at their new positions and adding them to scene


*/