/*
	Custom function stuff related to THREE.js objects?
*/


function createObject(objectData) {
  /*
    A function which creates THREE.js objects from a template "objectData" and returns the object itself

    Any extra information about the object is stored in the OBJECT.userData itself
    This information may be variables about the object such as those related to its selectability by the VR selection system.
    It could also be functions
      Functions can affect the .userData itself referenced through "this"
      They can also affect the OBJECT itself, referenced through "this.self"
      Or they could affect global variables like the selfPlayer object

  */

  // Object geometry is based on modelInfo attribute
  let geometry;
  if (objectData.modelInfo.shape == "sphere") {   // Spheres just have a single value as model size
    geometry = new THREE.SphereGeometry(objectData.modelInfo.size, 16, 16);
  } else if (objectData.modelInfo.shape == "box") {   // Boxes require 3 dimentions of size
    geometry = new THREE.BoxGeometry(objectData.modelInfo.size.x, objectData.modelInfo.size.y, objectData.modelInfo.size.z)
  } else if (objectData.modelInfo.shape == "cylinder") {   // Boxes require 3 dimentions of size
    geometry = new THREE.CylinderGeometry(objectData.modelInfo.size.r, objectData.modelInfo.size.r, objectData.modelInfo.size.h, 16, 16)
  }

  // Object material is currently always this
  let material = new THREE.MeshNormalMaterial();

  // Create the object itself
  let threeObject = new THREE.Mesh(geometry, material);
  threeObject.position.set(objectData.position.x, objectData.position.y, objectData.position.z);
  threeObject.rotation.set(objectData.rotation.x, objectData.rotation.y, objectData.rotation.z);

  // Each object also stores all the objectData which was used as the template for its creation.
  // This may also contain extra information about the object not used it its creation (collision/selectability), 
  // but which are still needed to be attached to the object and referenced easily.
  threeObject.userData = objectData;

  // Add a reference to the object itself inside of the object's userData
  // This is useful for functions within userData which require this 
  threeObject.userData.self = threeObject;



  // === Add functions attached to that object ===

  // Sets the state of the object (position/rotation)
  threeObject.userData.setState = object_setState;



  // Add object to the scene
  scene.add(threeObject);

  // Return the object
  return threeObject;
}



// Defining this function outside of the "createObject" function so that each object through its call 
// of "createObject" doesn't create its own version of the function (memory saving and stuff).
let object_setState = function(state) {
  this.self.position.set(state.position.x, state.position.y, state.position.z);
  this.self.rotation.set(state.rotation.x, state.rotation.y, state.rotation.z);
}










let objectFunctions = {
	"teleportPlayer":(newPos)=>{
		console.log("poof! you are teleported to", newPos);
		selfPlayer.setPosition(newPos)
	},


	"selectPiece":piece=>{
		room.selectPiece(piece)
	},
	"selectSquare":pos=>{
		room.selectSquare(pos);
	}
}

