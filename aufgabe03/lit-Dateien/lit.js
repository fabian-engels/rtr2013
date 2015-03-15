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
}

// Recalculate per face normals for a triangle mesh.
function perFaceNormals(arrays) {
  var n = arrays.indices.numElements;
  var idx = arrays.indices;
  var pos = arrays.position;
  var nrm = arrays.normal;
  for (var ti = 0; ti != n; ti++) {
    var i = idx.getElement(ti);
    var normal = nrm.getElement(i[0]);
    nrm.setElement(i[1], normal);
    nrm.setElement(i[2], normal);
  }
  return arrays;
};

// The main entry point.
function initialize() {
  // Setup the canvas widget for WebGL. 
  window.canvas = document.getElementById("canvas");
  window.gl = tdl.webgl.setupWebGL(canvas);

  // Create the shader programs.
  var programs = createProgramsFromTags();

  // Load textures.
  var textures = {
    earth: tdl.textures.loadTexture('earth-2k-land-ocean-noshade.png'),
  };

  // set the first shader program
  var frag =  window.location.hash.substring(1);
  var pnum = frag ? parseInt(frag) : 3;

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

  // Register a keypress-handler for shader program switching using the number
  // keys.
  window.onkeypress = function(event) {
    var n = String.fromCharCode(event.which);
    if (n == "s") {
      animate = !animate; 
	} else if(n == "q") {
		toggleShape = !toggleShape;
	} else if(n == "r") {
	  rotationAngel += 0.05;
	} else if(n == "w") {
		textureScale -= 50;
	} else if(n == "e") {
		textureScale += 50;
	} else if(n == "i") {
		if(colorVal < 20.0) colorVal += 0.25;
	} else if(n == "o") {
		if(colorVal > 0.0) colorVal -= 0.25;
	} else if(n == "k") {
		if(colorVal_2 < 20.0) colorVal_2 += 0.25;
	} else if(n == "l") {
		if(colorVal_2 > 0.0) colorVal_2 -= 0.25;	
	} else if(n == "c") {
	// value 0-3 for red, green, blue or white light
		if(lightColor <=3) lightColor++;
		if(lightColor > 3) lightColor = 0;
	} else if(n == "x") {
	// value 0-3 for red, green, blue or white light
		if(lightColor_2 <=3) lightColor_2++;
		if(lightColor_2 > 3) lightColor_2 = 0;
	} else if(n == "t") {
		tweenLight2 = !tweenLight2;
	} else if(n == "z") {
		textureColor = vec3.add(textureColor, [.75,.25,.25]);
	} else if(n == "h") {
		textureColor = vec3.subtract(textureColor, [.75,.25,.25]);
	} else if(!isNaN(n)) {
          torus.setProgram(programs[n % programs.length]);
	  cube.setProgram(programs[n % programs.length]);
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

  var eyePosition = vec3.create();
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
  var colorVal = 1.5;
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
 
  // Uniform variables that change for each torus in a frame.
  var torusPer = {
	model: model,
	color: color
  };
  
  var cubePer = {
	model: model,
	color: color
  };
  
  var toogleAnimationDirection = true;

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

    // Calculate the current eye position.
    eyePosition[0] = Math.sin(clock * eyeSpeed) * eyeRadius;
    eyePosition[1] = eyeHeight;
    eyePosition[2] = Math.cos(clock * eyeSpeed) * eyeRadius;
  
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
      0.1, 10,
      projection);

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
	
	if(lightColor == 1) torusConst.lightIntensity = vec3.create([0, colorVal, 0]);
	if(lightColor == 2) torusConst.lightIntensity = vec3.create([0, 0, colorVal]);
	if(lightColor == 3) torusConst.lightIntensity = vec3.create([colorVal, 0, 0]);
	if(lightColor == 0) torusConst.lightIntensity = vec3.create([colorVal, colorVal, colorVal]);
	
	if(lightColor_2 == 1) torusConst.lightIntensity_2 = vec3.create([0, colorVal_2, 0]);
	if(lightColor_2 == 2) torusConst.lightIntensity_2 = vec3.create([0, 0, colorVal_2]);
	if(lightColor_2 == 3) torusConst.lightIntensity_2 = vec3.create([colorVal_2, 0, 0]);
	if(lightColor_2 == 0) torusConst.lightIntensity_2 = vec3.create([colorVal_2, colorVal_2, colorVal_2]);
	

	if(lightColor == 1) cubeConst.lightIntensity = vec3.create([0, colorVal, 0]);
	if(lightColor == 2) cubeConst.lightIntensity = vec3.create([0, 0, colorVal]);
	if(lightColor == 3) cubeConst.lightIntensity = vec3.create([colorVal, 0, 0]);
	if(lightColor == 0) cubeConst.lightIntensity = vec3.create([colorVal, colorVal, colorVal]);
	
	if(lightColor_2 == 1) cubeConst.lightIntensity_2 = vec3.create([0, colorVal_2, 0]);
	if(lightColor_2 == 2) cubeConst.lightIntensity_2 = vec3.create([0, 0, colorVal_2]);
	if(lightColor_2 == 3) cubeConst.lightIntensity_2 = vec3.create([colorVal_2, 0, 0]);
	if(lightColor_2 == 0) cubeConst.lightIntensity_2 = vec3.create([colorVal_2, colorVal_2, colorVal_2]);
	

	torusConst.textureScale = textureScale;
	cubeConst.textureScale = textureScale;

        torusConst.textureColor = textureColor;
        cubeConst.textureColor = textureColor;
	
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
