"use strict";

let x = 0.0, y = 0.0, z = 1.0, r = 0.0, speed = 0.01;
let default_x = 0.0, default_y = 0.0, default_z = 1.0, default_r = 0.0, default_speed = 0.01;

let pressedKeys = {};
window.onkeyup = function(e) { pressedKeys[e.keyCode] = false; };
window.onkeydown = function(e) { pressedKeys[e.keyCode] = true; };

function createShader(gl, type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }

  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
  return undefined;
}

function createProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }

  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
  return undefined;
}

function newProg(index) {
  if (pressedKeys[49]) return 0;
  if (pressedKeys[50]) return 1;
  return index + 1;
}

// Array to keep shader files
let fragmentShaders = [
  "./mandelbrot.glsl",
  "./test1.glsl"
];
let programs = [];
let currentShaderIndex = 0;
let currentProgram;

function settingShitUp(gl, timeUniformLocation, resolutionUniformLocation, viewUniformLocation, count, primitiveType, timeStamp, offset) {
  gl.useProgram(currentProgram);
  webglUtils.resizeCanvasToDisplaySize(gl.canvas);
  gl.uniform1f(timeUniformLocation, timeStamp / 1000.0);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
  gl.uniform4f(viewUniformLocation, x, y, z, r);
  gl.drawArrays(primitiveType, offset, count);
}

function setValues(gl, timeUniformLocation, viewUniformLocation, resolutionUniformLocation, positionAttributeLocation) {
  timeUniformLocation = gl.getUniformLocation(currentProgram, "u_time");
  viewUniformLocation = gl.getUniformLocation(currentProgram, "u_view");
  resolutionUniformLocation = gl.getUniformLocation(currentProgram, "u_resolution");
  positionAttributeLocation = gl.getAttribLocation(currentProgram, "a_position");
  return [timeUniformLocation, viewUniformLocation, resolutionUniformLocation, positionAttributeLocation];
}

function switchShader(gl, index, timeUniformLocation, viewUniformLocation, resolutionUniformLocation, positionAttributeLocation, count, primitiveType, timeStamp, offset) {
  if (index < fragmentShaders.length && index!=currentShaderIndex) {
    currentShaderIndex = index;

	// Switch to precompiled program
	currentProgram = programs[currentShaderIndex];
	let temp = setValues(gl, timeUniformLocation, viewUniformLocation, resolutionUniformLocation, positionAttributeLocation);
	timeUniformLocation = temp[0], viewUniformLocation = temp[1], resolutionUniformLocation = temp[2], positionAttributeLocation = temp[3];
	settingShitUp(gl, timeUniformLocation, resolutionUniformLocation, viewUniformLocation, count, primitiveType, timeStamp, offset);
  } else {
    console.log("ERROR: Shader index too high.");
  }
}

function loadShaders(gl) {
  // Load both vertex and all fragment shaders in parallel
  return Promise.all([fetch("./vertex.glsl"), ...fragmentShaders.map(url => fetch(url))])
    .then(responses => Promise.all(responses.map(res => res.text())));
}

function main() {
  // Get A WebGL context
  		var canvas = document.getElementById("c");
  		var gl = canvas.getContext("webgl2");
  		if (!gl) {
    		console.log("WebGL2 not supported!");
    		return;
  		}

  // Load and compile shaders
  		loadShaders(gl).then(values => {
    		const vertexShader = createShader(gl, gl.VERTEX_SHADER, values[0]);
			for (let i = 1; i < values.length; i++) {
			const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, values[i]);
			const program = createProgram(gl, vertexShader, fragmentShader);
			programs.push(program);
			}

    		currentProgram = programs[currentShaderIndex];
    		gl.useProgram(currentProgram);

			let timeUniformLocation, viewUniformLocation, resolutionUniformLocation, positionAttributeLocation, positionBuffer;
			let temp = setValues(gl, timeUniformLocation, viewUniformLocation, resolutionUniformLocation, positionAttributeLocation);
			timeUniformLocation = temp[0], viewUniformLocation = temp[1], resolutionUniformLocation = temp[2], positionAttributeLocation = temp[3];

			positionBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

			var positions = [
			-1.0, -1.0,
			-1.0,  1.0,
			1.0,  1.0,
			-1.0, -1.0,
			1.0, -1.0,
			1.0,  1.0,
			];
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

			let vao = gl.createVertexArray();
			gl.bindVertexArray(vao);
			gl.enableVertexAttribArray(positionAttributeLocation);
			var size = 2, type = gl.FLOAT, normalize = false, stride = 0, offset = 0;
			gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

			webglUtils.resizeCanvasToDisplaySize(gl.canvas);
			gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);

			let primitiveType = gl.TRIANGLES;
			let count = 6;

			function renderLoop(timeStamp) {
			settingShitUp(gl, timeUniformLocation, resolutionUniformLocation, viewUniformLocation, count, primitiveType, timeStamp, offset);


			let newIndex = newProg(currentShaderIndex);
			if (currentShaderIndex !== newIndex) switchShader(gl, newIndex, timeUniformLocation, viewUniformLocation, resolutionUniformLocation, positionAttributeLocation, count, primitiveType, timeStamp, offset);

			// Recursive call to render loop
			window.requestAnimationFrame(renderLoop);



			z/=(pressedKeys[32] ? 1.0+speed : 1.0);
			z*=(pressedKeys[16] ? 1.0+speed : 1.0);
			x+=
				z*
				(
					Math.cos(r)*
					(
						(pressedKeys[65] ? -speed : 0.0)+
						(pressedKeys[68] ? speed : 0.0)
					)
					-
					Math.sin(r)*
					(
						(pressedKeys[87] ? speed : 0.0)+
						(pressedKeys[83] ? -speed : 0.0)
					)
				);
			y+=
				z*(
					Math.sin(r)*
					(
						(pressedKeys[65] ? -speed : 0.0)+
						(pressedKeys[68] ? speed : 0.0)
					)
					+
					Math.cos(r)*
					(
						(pressedKeys[87] ? speed : 0.0)+
						(pressedKeys[83] ? -speed : 0.0)
					)
				);
			//x+=z*((pressedKeys[65] ? -speed : 0.0)+(pressedKeys[68] ? speed : 0.0));
			r+=(pressedKeys[81] ? speed : 0.0);
			r+=(pressedKeys[69] ? -speed : 0.0);
			speed*=(pressedKeys[88] ? 1.1 : 1.0);
			speed/=(pressedKeys[90] ? 1.1 : 1.0);
			if (pressedKeys[82]){
				z=default_z;
				x=default_x;
				y=default_y;
				r=default_r;
				speed=default_speed;
			}
			var tmp=newProg(currentShaderIndex)-1; 
			// trebe scazuta valoarea pt ca pula asa am ales io si daca imi schimbi o sa iti fut codu undeva 
			if (currentShaderIndex!=tmp)switchShader(gl, tmp);
			//console.log(tmp);
			}
			// begin the render loop
			window.requestAnimationFrame(renderLoop);
		})
}

main();
