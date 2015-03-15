// Required TDL modules.
tdl.require('tdl.programs');
tdl.require('tdl.models');
tdl.require('tdl.primitives');
tdl.require('tdl.textures');

// Loads all shader programs from the DOM and return them in an array.
function createProgramsFromTags() {
  var vs = $('script[id^="vs"]');
  var fs = $('script[id^="fs"]');
  var programs = [];
  for (var i = 0; i != vs.length; i++)
    programs[i] = tdl.programs.loadProgram(vs[i].text, fs[i].text)
      return programs;
}

// Registers an onload handler.
window.onload = function() {
  $(window).resize(function() {
      var width = $('#canvas-container').innerWidth();
      $('#canvas')
      .attr('width', width)
      .attr('height', width * 0.6);
      });
  $(window).resize();
  try {
    initialize();
  } catch (e) {
    $('#error').text(e.message || e);
    $('#error').css('display', 'block');
  }

  var havePointerLock = 'pointerLockElement' in document ||
    'mozPointerLockElement' in document ||
    'webkitPointerLockElement' in document;
  if(!havePointerLock) {
    displayError("Your browser does not support pointer lock.");
  }
}

// The main entry point.
function initialize() {
  // Setup the canvas widget for WebGL. 
  window.canvas = document.getElementById("canvas");
  window.gl = tdl.webgl.setupWebGL(canvas);

  // Create the shader programs.
  var programs = createProgramsFromTags();

  // Load textures.
  var textures = {
       skybox: tdl.textures.loadTexture(
          ['img/SantaMariaDeiMiracoli/posx.jpg',
	   'img/SantaMariaDeiMiracoli/negx.jpg',
	   'img/SantaMariaDeiMiracoli/pos-y.jpg',
	   'img/SantaMariaDeiMiracoli/neg-y.jpg',
	   'img/SantaMariaDeiMiracoli/posz.jpg',
	   'img/SantaMariaDeiMiracoli/negz.jpg'])
  };

  // set the first shader program
  var frag =  window.location.hash.substring(1);
  var pnum = frag ? parseInt(frag) : 4;

  // Create a torus mesh that initialy is renderd using the first shader
  // program.
  var torus = new tdl.models.Model(
      programs[pnum],
      tdl.primitives.createTorus(0.4, 0.1, 32.0, 32.0),
      textures
      );

  var cube = new tdl.models.Model(
      programs[pnum],
      tdl.primitives.createCube(0.5),
      textures
      );
  
  var skybox = new tdl.models.Model(
      programs[6], //todo apply shader only for skybox
      tdl.primitives.createCube(1),
      textures
      );


  var keyboardSpeed = 0.075;
  var keyboardEventTime = 0;
  var flymode = false;
  var wasd = [0.0, 0.0, 0.0];
  // Register a keypress-handler for shader program switching using the number
  // keys.
  window.onkeypress = function(event) {
    var n = String.fromCharCode(event.which);
    switch(n){
    case "s": 
      wasd[2] = keyboardSpeed; break;
    case "q": 
      toggleShape = !toggleShape; break;
    case "r":
      rotationAngel += 0.05; break;
    case "w":
      wasd[2] = -keyboardSpeed; break;
    case "a":
      wasd[0] = -keyboardSpeed; break;
    case "d":
      wasd[0] = keyboardSpeed; break;
    case "e":
      textureScale += 50; break;
    case "f":
      flymode = !flymode; break;
    case "i":
      if(colorVal < 20.0) colorVal += 0.25; break;
    case "o":
      if(colorVal > 0.0) colorVal -= 0.25; break;
    case "k":
      if(colorVal_2 < 20.0) colorVal_2 += 0.25; break;
    case "l":
      if(colorVal_2 > 0.0) colorVal_2 -= 0.25; break;	
    case "c":
      // value 0-3 for red, green, blue or white light
      lightColor <= 3 ? lightColor++ : lightColor = 0; break;
    case "x":
      // value 0-3 for red, green, blue or white light
      lightColor_2 <= 3 ? lightColor_2++ : lightColor_2; break;
    case "t":
      tweenLight2 = !tweenLight2; break;
    case "z":
      textureColor = vec3.add(textureColor, [.75,.25,.25]); break;
    case "h":
      textureColor = vec3.subtract(textureColor, [.75,.25,.25]); break;
    default:
      if(!isNaN(n)){
	torus.setProgram(programs[n % programs.length]);
       	cube.setProgram(programs[n % programs.length]);
      }
    }
  };

  window.onkeyup = function(event){
	var n = String.fromCharCode(event.which);
	if(n == "A" || n == "D") {
	  wasd[0] = 0;
	}else if(n == "W" || n == "S") {
	  wasd[2] = 0;
	}
  };


  //todo set movement to zero if button releaseed

  // Mouse variables for communication between mouse events and render method.
  var diffX = 0;
  var diffY = 0;
  var mouseEventTime = 0;
  var toggleMouseMove = false;

  window.onmousemove = function getMousePosition(evt) {
    // http://www.html5rocks.com/en/tutorials/pointerlock/intro/
    // http://updates.html5rocks.com/2012/02/Pointer-Lock-API-Brings-FPS-Games-to-the-Browser

    if(toggleMouseMove)	{
      diffX = evt.movementX ||
	evt.mozMovementX    ||
	evt.webkitMovementX ||
	0;
      diffY = evt.movementY ||
	evt.mozMovementY    ||
	evt.webkitMovementY ||
	0;
      mouseEventTime = evt.timeStamp;
    }
  };

  window.addEventListener('pointerlockchange', pointerLockChange, false);
  window.addEventListener('mozpointerlockchange', pointerLockChange, false);
  window.addEventListener('webkitpointerlockchange', pointerLockChange, false);
  // JS does not contain the != assignment operator
  function pointerLockChange(evt) {
    toggleMouseMove = (toggleMouseMove) ? false : true ;
  };

  window.onmousedown = function(evt) {
    if(evt.target.id == "canvas" ) {
      // Due to missing direct access to the pointer lock state,
      // we look for the toggleMouseMove to request the mouse pointer lock.
      if(evt.button == 0 && !toggleMouseMove) {
	var elem = evt.target;

	elem.requestPointerLock = elem.requestPointerLock ||
	  elem.mozRequestPointerLock ||
	  elem.webkitRequestPointerLock;
	// Ask the browser to lock the pointer
	// Firefox 17.0 will not lock the pointer without being in fullscreen
	// elem.mozRequestFullScreen();
	elem.requestPointerLock();
      }
      // only if the mouse can already be moved we exit the mouse lock
      if(evt.button == 0 && toggleMouseMove) {
	document.exitPointerLock = document.exitPointerLock ||
	  document.mozExitPointerLock ||
	  document.webkitExitPointerLock;
	document.exitPointerLock();				   
      }
    }
  };

  // Create some matrices and vectors now to save time later.
  var projection = mat4.create();
  var view = mat4.create();
  var model = mat4.create();

  // Uniforms for lighting.
  var lightPosition = vec3.create([10, 10, 10]);
  var lightPosition_2 = vec3.create([0, 0, 0]);
  var lightIntensity = vec3.create([1, 1, 1]);
  var lightIntensity_2 = vec3.create([1, 0, 0]);
  var color = vec3.create();
  var textureScale = 400.0;
  var textureColor = vec3.create([0.50, 0.50, 0.50]);

  var eyePosition = vec3.create([0.0,0.0,3.0]);
  var target = vec3.create();
  var up = vec3.create([0, 1, 0]);

  // Animation parameters for the rotating eye-point.
  var eyeSpeed = 0.2;
  var eyeHeight = 2;
  var eyeRadius = 3.5;
  var animate = true;

  // Animation needs accurate timing information.
  var elapsedTime = 0.0;
  var then = 0.0;
  var clock = 0.0;

  // Custome variables to modify the scene. 
  var rotationAngel = 0;
  var tweenLight1 = true;
  var tweenLight2 = false;
  var lightColor = 0;
  var colorVal = 3.0;
  var lightColor_2 = 0;
  var colorVal_2 = 1.0;
  var textureScaleVal = 1.0;
  var toggleShape = true;

  // Uniform variables that are the same for all torus in one frame.
  var torusConst = {
view: view,
      projection: projection,
      eyePosition: eyePosition,
      lightPosition: lightPosition,
      lightPosition_2: lightPosition_2,
      lightIntensity: lightIntensity,
      lightIntensity_2: lightIntensity_2,
      textureScale: textureScale,
      textureColor: textureColor,
      time: clock
  };

  var cubeConst = {
view: view,
      projection: projection,
      eyePosition: eyePosition,
      lightPosition: lightPosition,
      lightPosition_2: lightPosition_2,
      lightIntensity: lightIntensity,
      lightIntensity_2: lightIntensity_2,
      textureScale: textureScale,
      textureColor: textureColor,
      time: clock
  };

  var skyboxConst = {
view: view,
      projection: projection,
      eyePosition: eyePosition,
      lightPosition: lightPosition,
      lightPosition_2: lightPosition_2,
      lightIntensity: lightIntensity,
      lightIntensity_2: lightIntensity_2,
      textureScale: textureScale,
      textureColor: textureColor,
      time: clock
  };

  // Uniform variables that change for each torus in a frame.
  var torusPer = {
model: model,
       color: color
  };

  var cubePer = {
model: model,
       color: color
  };

  var skyboxPer = {
model: model,
       color: color
  }

  var toogleAnimationDirection = true;
  var lastMouseEventTime;
  var mouseSpeed = 0.01;
  var deltaAngle = 180.64;
  // vector to store the direction torwards the camera target
  var direction = vec3.create();
  // vector to enable the movement
  var movement = vec3.create();

  // Renders one frame and registers itself for the next frame.
  function render() {
    tdl.webgl.requestAnimationFrame(render, canvas);
    // Do the time keeping.
    var now = (new Date()).getTime() * 0.001;
    elapsedTime = (then == 0.0 ? 0.0 : now - then);
    then = now;
    if (animate) {
      clock += elapsedTime;
    }

    // Setup global WebGL rendering behavior.
    gl.viewport(0, 0, canvas.width, canvas.width * 0.6); 
    gl.colorMask(true, true, true, true);
    gl.depthMask(true);
    gl.clearColor(0.5, 0.5, 0.5, 1);
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // Calculate the perspective projection matrix.
    mat4.perspective(
	60, 
	canvas.clientWidth / canvas.clientHeight, 
	0.1, 100,
	projection);

    // We only update the target vector if there was a new mouse event.
    if(lastMouseEventTime != mouseEventTime) {
      deltaAngle += mouseSpeed * diffX;

      // we uniform the angle for the usage of the parametric equation of a circle
      // x = a + r cos t
      // y = b + r sin t
      // the eyeposition will have a magnitude of 1 so the radius r is 1 and can be excluded
      uniAngle = (deltaAngle % 360);
      if(uniAngle < 0) { uniAngle += 360 }

      target[0] = eyePosition[0] + Math.cos(uniAngle);
      target[1] -= mouseSpeed * diffY;			
      target[2] = eyePosition[2] + Math.sin(uniAngle);

      lastMouseEventTime = mouseEventTime;
    }

    // handle keyboard controls
    vec3.subtract(eyePosition, target, direction);
    if(!flymode) { direction[1] = 0; }
    if(wasd[2] != 0) {
	  if(wasd[2] < 0) {
	  direction[2] = direction[2] * -1;
	  direction[1] = direction[1] * -1;
	  direction[0] = direction[0] * -1;
	  // vec3.multiply(direction, -1); // does not work as the code above
}
    vec3.add(eyePosition, direction);
    vec3.add(target, direction);
    }

	// move sideways		
	if(wasd[0] != 0) {
		vec3.cross(direction, up);
		if(wasd[0] > 0) {
			direction[2] = direction[2] * -1;
			direction[1] = direction[1] * -1;
			direction[0] = direction[0] * -1;
		}
	vec3.add(eyePosition, direction);
	vec3.add(target, direction);
    	}
	
    // Calculate the viewing transfomation.
    mat4.lookAt(eyePosition, target, up, view);  

    torusConst.time = clock;
    cubeConst.time = clock;

    /**
     * Frame depending light position tween.
     * @param {vec3} the light position
     * @param {number} axis to animate x=0 y=1 z=2
     * @param {number} bounding value which switches the animation direction
     * @param {tweenSpeed} each frame the light position is increased or decreased by this value
     */	
    var tweenLight = function(lightVec, tweenAxis, tweenMaxValue, tweenSpeed) {

      if (lightVec[tweenAxis] < tweenMaxValue && toogleAnimationDirection) { 
	lightVec[tweenAxis] += tweenSpeed;
	if(lightVec[tweenAxis] >= tweenMaxValue)
	  toogleAnimationDirection =! toogleAnimationDirection;

      }else if(lightVec[tweenAxis] > -tweenMaxValue && !toogleAnimationDirection) {
	lightVec[tweenAxis] -= tweenSpeed;
	if(lightVec[tweenAxis] <= -tweenMaxValue)
	  toogleAnimationDirection =! toogleAnimationDirection;
      }
    }

    if(tweenLight1) tweenLight(torusConst.lightPosition, 2, 20, 0.05);
    if(tweenLight2)	tweenLight(torusConst.lightPosition_2, 1, 4, 0.05);

    // handle light color 1
    if(lightColor == 1){
      torusConst.lightIntensity = vec3.create([0, colorVal, 0]);
      cubeConst.lightIntensity = vec3.create([0, colorVal, 0]);
    }
    if(lightColor == 2){
      torusConst.lightIntensity = vec3.create([0, 0, colorVal]);
      cubeConst.lightIntensity = vec3.create([0, 0, colorVal]);
    }
    if(lightColor == 3){
      torusConst.lightIntensity = vec3.create([colorVal, 0, 0]);
      cubeConst.lightIntensity = vec3.create([colorVal, 0, 0]);
    }
    if(lightColor == 0){
      torusConst.lightIntensity = vec3.create([colorVal, colorVal, colorVal]);
      cubeConst.lightIntensity = vec3.create([colorVal, colorVal, colorVal]);
    }

    // handle light color 2
    if(lightColor_2 == 1){
      torusConst.lightIntensity_2 = vec3.create([0, colorVal_2, 0]);
      cubeConst.lightIntensity_2 = vec3.create([0, colorVal_2, 0]);
    }
    if(lightColor_2 == 2){
      torusConst.lightIntensity_2 = vec3.create([0, 0, colorVal_2]);
      cubeConst.lightIntensity_2 = vec3.create([0, 0, colorVal_2]);
    }
    if(lightColor_2 == 3){
      torusConst.lightIntensity_2 = vec3.create([colorVal_2, 0, 0]);
      cubeConst.lightIntensity_2 = vec3.create([colorVal_2, 0, 0]);
    }
    if(lightColor_2 == 0){
      torusConst.lightIntensity_2 = vec3.create([colorVal_2, colorVal_2, colorVal_2]);
      cubeConst.lightIntensity_2 = vec3.create([colorVal_2, colorVal_2, colorVal_2]);
    }

    torusConst.textureScale = textureScale;
    cubeConst.textureScale = textureScale;
    skyboxConst.textureScale = textureScale;

    torusConst.textureColor = textureColor;
    cubeConst.textureColor = textureColor;
    skyboxConst.textureColor = textureColor;

    // add the skybox to the scene
    skybox.drawPrep(skyboxConst);
    mat4.scale(mat4.identity(skyboxPer.model), [-100,-100,-100]);
    // add keyboard movement to skybox
  //  mat4.translate(mat4.identity(skyboxPer.model), direction);
    skybox.draw(skyboxPer);

    if(toggleShape) {
      // Prepare rendering of tori.
      torus.drawPrep(torusConst);

      var across = 3;
      var half = (across - 1) * 0.5;
      for (var xx = 0; xx < across; ++xx) {
	for (var yy = 0; yy < across; ++yy) {
	  for (var zz = 0; zz < across; ++zz) {

	    mat4.translate(mat4.identity(torusPer.model),
		[xx - half, yy - half, zz - half]);
	    mat4.rotate(torusPer.model, rotationAngel, [0,0,1]);
	    torusPer.color[0] = xx / (across - 1);
	    torusPer.color[1] = yy / (across - 1);
	    torusPer.color[2] = zz / (across - 1);

	    // Actually render one torus.
	    torus.draw(torusPer);

	  }
	}
      }
    } 
    if(!toggleShape) {
      // Prepare rendering of cubes.
      cube.drawPrep(cubeConst);

      var across = 3;
      var half = (across - 1) * 0.5;
      for (var xx = 0; xx < across; ++xx) {
	for (var yy = 0; yy < across; ++yy) {
	  for (var zz = 0; zz < across; ++zz) {

	    mat4.translate(mat4.identity(cubePer.model),
		[xx - half, yy - half, zz - half]);
	    mat4.rotate(cubePer.model, rotationAngel, [0,0,1]);
	    cubePer.color[0] = xx / (across - 1);
	    cubePer.color[1] = yy / (across - 1);
	    cubePer.color[2] = zz / (across - 1);

	    // Actually render one torus.
	    cube.draw(cubePer);

	  }
	}
      }
    }

  }

  // Initial call to get the rendering started.
  render();
}
