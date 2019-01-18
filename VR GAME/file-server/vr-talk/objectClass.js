/*
  


*/


class ObjectClass {
  constructor(objectData) {

    this.id = objectData.id;

    this.modelInfo = objectData.modelInfo;

    // Object geometry is based on modelInfo attribute
    var geometry;
    if (this.modelInfo.shape == "sphere") {   // Spheres just have a single value as model size
      geometry = new THREE.SphereGeometry(this.modelInfo.size, 16, 16);
    } else if (this.modelInfo.shape == "box") {   // Boxes require 3 dimentions of size
      geometry = new THREE.BoxGeometry(this.modelInfo.size.x, this.modelInfo.size.y, this.modelInfo.size.z)
    }

    var material = new THREE.MeshNormalMaterial();


    this.threeObject = new THREE.Mesh(geometry, material);
    this.threeObject.position.set(objectData.position.x, objectData.position.y, objectData.position.z);
    this.threeObject.rotation.set(objectData.rotation.x, objectData.rotation.y, objectData.rotation.z);

    scene.add(this.threeObject);

  }
  setState(state) {   // Sets the new state of the object within the room as recieved from server
    this.threeObject.position.set(state.position.x, state.position.y, state.position.z);
    this.threeObject.rotation.set(state.rotation.x, state.rotation.y, state.rotation.z);
  }
  removeFromScene() {
    scene.remove(this.threeObject);
  }

}