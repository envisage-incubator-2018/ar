/*
  Handles loading the three.js world
*/

var chosenRoom = 1;

// A temporary fix to halt rendering until all resources have been loaded
var resourcesToLoad = 6;  // Number of unloaded resources in room (decrements when each resources loads)


var cube;

//animating clouds & rain
var cloudMoveSpeed = 0.01
var rainSpeed = 1


var cloudRef = []
var trackCloudLocation =[]

//defining loaders
var gLoader
var loader
var textureLoader

var snowRef;
var snowRef2;

var snowTrack1 = 50
var snowTrack2 = 100


function loadWorld() {

  //Model Loaders 
  gLoader = new THREE.GLTFLoader();
  loader = new THREE.OBJLoader();
  //Texture Loaders
  textureLoader = new THREE.TextureLoader();  

  if(chosenRoom== 1){
    loadRoom1()
  }else if(chosenRoom== 2){
    loadRoom2()
  }

}

// Fired when a resource is loaded
function resourceLoaded() {
  resourcesToLoad --;
  if (resourcesToLoad == 0) {
    beginAnimate();
  }
  console.log("Loaded resource", resourcesToLoad, "left");
}


///////////////BEGIN LOAD ROOM 1/////////////
function loadRoom1(){     

  var snowTex = textureLoader.load('tex/snow/snow.jpg', resourceLoaded)
  var snowMat = new THREE.MeshToonMaterial({map: snowTex})
  
  var cubeTex = textureLoader.load('tex/box.jpg', resourceLoaded)
  var cubeMat = new THREE.MeshStandardMaterial({map: cubeTex})      
  
  var cloudTex = textureLoader.load('tex/cloud.jpg', resourceLoaded)
  var cloudMat = new THREE.MeshToonMaterial({map: cloudTex})
  
  var skyTex = textureLoader.load("tex/snow/sky.jpg", resourceLoaded)
  var skyMat = new THREE.MeshBasicMaterial({
      map: skyTex,
      side: THREE.BackSide
  });
  
  var white = new THREE.MeshBasicMaterial( { color: 0x707070  } )
  // load a resource
  
  
  loader.load(

    'mod/snow.obj',
    // called when resource is loaded
    function ( snow ) {
      resourceLoaded();
      
      snowRef = snow
      snow.traverse(function(node){
        if (node.isMesh) node.material = snowMat
      
      })
      
      scene.add( snow );

    }
  );
  
  loader.load(

    'mod/snow.obj',
    // called when resource is loaded
    function ( snow2 ) {
      resourceLoaded();
      
      snowRef2 = snow2
      snow2.traverse(function(node){
        if (node.isMesh) node.material = snowMat
        snow2.position.y=50
      
      })
      
      scene.add( snow2 );

    }
  );      

  
  //using a while loop because for loop would iterate through everything except what was underneath gLoader and then do that last with i held at 16
  var y = 0

  //cloud.position.y = 10   
  //var ambLight = new THREE.AmbientLight( 0x101010 ); // soft white light
  //scene.add( ambLight );
  
  // Adds the ground
  var groundGeometry = new THREE.BoxGeometry( 40, 0.1, 40 )
  ground = new THREE.Mesh( groundGeometry, snowMat )
  scene.add( ground )

  
  var geometry = new THREE.BoxGeometry( 1, 1, 1 )
  //var material = new THREE.MeshBasicMaterial( { color: 0xff0000 })          
  cube = new THREE.Mesh( geometry, cubeMat )
  scene.add( cube )

  
  var skyGeo = new THREE.SphereGeometry (50, 50, 50)      
  var skySphere = new THREE.Mesh( skyGeo, skyMat)
  scene.add( skySphere )      
  
  
  var directionalLight = new THREE.DirectionalLight( 0xffffff, 1);
  lightPos =   new THREE.Vector3(2,10,5)
  directionalLight.position.copy( lightPos)
  scene.add( directionalLight );
  //directionalLight.target = cube


  camera.position.z = 5;
  camera.position.y = 3;
  //player.position.z = 5;
  //player.position.y = 3;
  
}


//ANIMATE ROOM 1
function animateRoom1() {
  //skyCube.rotation.y +=0.001
  
  cube.position.y +=0.01
  cube.position.x -= 0.01
  cube.rotation.x += 0.01
  cube.rotation.y += 0.1
  var j = 0
  
  //console.log(snowRef.positon.y)
  snowRef.position.y -= 0.1
  snowTrack1 -= 0.1
  
  snowRef2.position.y-=0.1
  snowTrack2 -= 0.1
  
  //console.log("1: " + snowTrack1)
  //console.log("2: " + snowTrack2)
  if(snowTrack1 <= 0){
    snowRef.position.y+=100
    snowTrack1 = 100
    //console.log('succ')
  }
  
  if(snowTrack2 <= 0){
    snowRef2.position.y+=100
    snowTrack2 = 100
    //console.log('succ')
  }
  

  //console.log(snowRef.positon.y)
  //can add better tracking custom for snowfall
} 




  



///////////////BEGIN LOAD ROOM 2/////////////
function loadRoom2(){     

  var groundTex = textureLoader.load('tex/ground.jpg')
  var groundMat = new THREE.MeshStandardMaterial({map: groundTex})
  
  var cubeTex = textureLoader.load('tex/box.jpg')
  var cubeMat = new THREE.MeshStandardMaterial({map: cubeTex})      
  
  var cloudTex = textureLoader.load('tex/cloud.jpg')
  var cloudMat = new THREE.MeshToonMaterial({map: cloudTex})
  
  
  var white = new THREE.MeshBasicMaterial( { color: 0x707070  } )
  // load a resource
  loader.load(

    'mod/untitled.obj',
    // called when resource is loaded
    function ( ground ) {
      
      groundRef = ground
      ground.traverse(function(node){
        if (node.isMesh) node.material = groundMat
      
      })
      
      scene.add( ground );

    }
  );
  

  
  //using a while loop because for loop would iterate through everything except what was underneath gLoader and then do that last with i held at 16
  var y = 0
  for(i=0; i<32; i++){
    //console.log("check 0 i is " + i)
    gLoader.load("mod/cloud.gltf", function(gltf){
      gltf.scene.traverse( function ( node ) {
      //console.log("check 1 i is " + i)
        if ( node.isMesh ) {
          //console.log("check 2 i is " + i)
          
          node.material = cloudMat;
          node.position.y = 8
          node.position.z = Math.random() * 100 - 50
          var xVal = Math.random() * 100 - 50
          node.position.x = xVal
          trackCloudLocation[y] =xVal
          node.rotation.y= Math.PI/2
          //console.log("check 3 i is " + i)
          cloudRef[y]=gltf.scene
          //console.log("cloud " + y + " logged")
          //console.log(cloudRef[y])
          scene.add(gltf.scene)
          y++
        }

      } );  
      //console.log("check 4 i is " + i)
      


      
      })
    //console.log("check 5 i is " + i)
  }
  //cloud.position.y = 10   
  //var ambLight = new THREE.AmbientLight( 0x101010 ); // soft white light
  //scene.add( ambLight );
  


  
  var geometry = new THREE.BoxGeometry( 1, 1, 1 )
  //var material = new THREE.MeshBasicMaterial( { color: 0xff0000 })          
  cube = new THREE.Mesh( geometry, cubeMat )
  scene.add( cube )
  
  
  
  skyTex = textureLoader.load("tex/sky.jpg")
  var skyMat = new THREE.MeshBasicMaterial({
      map: skyTex,
      side: THREE.BackSide
  });
  
  var skyGeo = new THREE.BoxGeometry (50, 50, 50)     
  var skyCube = new THREE.Mesh( skyGeo, skyMat)
  skyCube.position.y=5
  scene.add( skyCube )      
  
  
  var directionalLight = new THREE.DirectionalLight( 0xffffff, 1);
  lightPos =   new THREE.Vector3(2,10,5)
  directionalLight.position.copy( lightPos)
  scene.add( directionalLight );
  //directionalLight.target = cube

  animateRoom2()
  
}

//ANIMATE ROOM 2
function animateRoom2() {
  
  //skyCube.rotation.y +=0.001

  cube.position.y +=0.01
  cube.position.x -= 0.01
  cube.rotation.x += 0.01
  cube.rotation.y += 0.1
  var j = 0
  while(j<32){
    //console.log("moving " + j)
    
    if (trackCloudLocation[j] < -50){ //Doesn't seem to be world position, local to something but I dont know what
    
      cloudRef[j].position.x = 50
      trackCloudLocation[j] = 50
      console.log("success" + j)
    }
    //console.log(getObjPos(cloudRef[j]))
    
    cloudRef[j].position.x -= cloudMoveSpeed
    trackCloudLocation[j] -= cloudMoveSpeed
    j+=1
  }
  //groundRef.position.x += 0.01
} 


//GETTING OBJECT POSITIONS
function getObjPos(obj){
  obj.updateMatrixWorld();
  var vec= new THREE.Vector3();
  vec.setFromMatrixPosition(obj.matrixWorld);
  return {vec: 'x'}; // Like this?
}