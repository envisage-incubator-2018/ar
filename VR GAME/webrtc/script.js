/*
	WebRTC

	Chrome allows mic/cam access on localhost
*/

document.getElementById("text").innerHTML += "<br>script.js ran";

console.log("SCript")

let userMedia;

let constraints = {
	audio: false,
	video: true
};

function init() {
	console.log("Doing thing")

	document.getElementById("text").innerHTML += "<br>init ran";

	navigator.mediaDevices.enumerateDevices().then(devices=>{
		document.getElementById("text").innerHTML += "<br>" + devices;
		console.log(devices);

		cam = devices.find(device=>device.kind == "videoinput");
		document.getElementById("text").innerHTML += "<br>" + cam;

		if (cam) {
			constraints = { 
				audio: false,
				video: { deviceId: { exact: cam.deviceId } } 
			};
			document.getElementById("text").innerHTML += "<br>" + constraints;



			navigator.mediaDevices.getUserMedia(constraints).then((stream)=>{
				userMedia = stream;
				console.log("Got user media", userMedia);
				document.getElementById("text").innerHTML += "<br>Got user media";


				document.getElementById("vid").srcObject = userMedia;

			},(e)=>{

				console.log("Access to cam/mic denied :(");
				document.getElementById("text").innerHTML += "<br>Access to cam/mic denied :(";
				console.log(e)

			});


		}
	})

	/*
	navigator.mediaDevices.getUserMedia(constraints).then((stream)=>{
		userMedia = stream;
		console.log("Got user media", userMedia);
		document.getElementById("text").innerHTML += "Got user media";


		document.getElementById("vid").srcObject = userMedia;

	},(e)=>{

		console.log("Access to cam/mic denied :(");
		document.getElementById("text").innerHTML += "Access to cam/mic denied :(";
		console.log(e)

	});*/

}

/*

navigator.mediaDevices.enumerateDevices().then(devices=>{
	console.log(devices);
	cam = devices.find(device=>device.kind == "videoinput");

	console.log(cam)

	if (cam) {
		var constraints = { 
			audio: false,
			video: { deviceId: { exact: cam.deviceId } } 
		};
		console.log("Constraints", constraints);
	}

})

*/