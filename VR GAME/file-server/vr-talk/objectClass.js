/*
  


*/


class ObjectClass {
  constructor(objectData) {

    this.id = objectData.id;

    var geometry = new THREE.SphereGeometry(0.5, 16, 16);
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