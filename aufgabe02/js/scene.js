    var gl;

    function initGL(canvas) {
        try {
            gl = canvas.getContext("experimental-webgl");
            gl.viewportWidth = canvas.width;
            gl.viewportHeight = canvas.height;
        } catch (e) {
        }
        if (!gl) {
            alert("Could not initialise WebGL, sorry :-(");
        }
    }

    function getShader(gl, id) {
        var shaderScript = document.getElementById(id);
        if (!shaderScript) {
            return null;
        }

        var str = "";
        var k = shaderScript.firstChild;
        while (k) {
            if (k.nodeType == 3) {
                str += k.textContent;
            }
            k = k.nextSibling;
        }

        var shader;
        if (shaderScript.type == "x-shader/x-fragment") {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        } else if (shaderScript.type == "x-shader/x-vertex") {
            shader = gl.createShader(gl.VERTEX_SHADER);
        } else {
            return null;
        }

        gl.shaderSource(shader, str);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }


    var shaderProgram;

    function initShaders() {
        var fragmentShader = getShader(gl, "shader-fs");
        var vertexShader = getShader(gl, "shader-vs");

        shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            alert("Could not initialise shaders");
        }

        gl.useProgram(shaderProgram);

        shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
        gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

        shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
        gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

        shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
        shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    }


    var mvMatrix = mat4.create();
    var mvMatrixStack = [];
    var pMatrix = mat4.create();

    function mvPushMatrix() {
        var copy = mat4.create();
        mat4.set(mvMatrix, copy);
        mvMatrixStack.push(copy);
    }

    function mvPopMatrix() {
        if (mvMatrixStack.length == 0) {
            throw "Invalid popMatrix!";
        }
        mvMatrix = mvMatrixStack.pop();
    }


    function setMatrixUniforms() {
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
    }


    function degToRad(degrees) {
        return degrees * Math.PI / 180;
    }

  var sphere;

    function initBuffers() {
    
        cubevertices = [
            // Front face
            [-1.0, -1.0,  1.0],
             [1.0, -1.0,  1.0],
             [1.0,  1.0,  1.0],
            [-1.0,  1.0,  1.0],

            // Back face
            [-1.0, -1.0, -1.0],
            [-1.0,  1.0, -1.0],
             [1.0,  1.0, -1.0],
             [1.0, -1.0, -1.0],

            // Top face
            [-1.0,  1.0, -1.0],
            [-1.0,  1.0,  1.0],
             [1.0,  1.0,  1.0],
             [1.0,  1.0, -1.0],

            // Bottom face
            [-1.0, -1.0, -1.0],
             [1.0, -1.0, -1.0],
             [1.0, -1.0,  1.0],
            [-1.0, -1.0,  1.0],

            // Right face
             [1.0, -1.0, -1.0],
             [1.0,  1.0, -1.0],
             [1.0,  1.0,  1.0],
             [1.0, -1.0,  1.0],

            // Left face
            [-1.0, -1.0, -1.0],
            [-1.0, -1.0,  1.0],
            [-1.0,  1.0,  1.0],
            [-1.0,  1.0, -1.0]
        ];

    }

    var rPyramid = 0;
    var rCube = 0;

    function drawScene() {
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

        mat4.identity(mvMatrix);

	   mat4.translate(mvMatrix, [x, y, z]);

	    if(trianglePressed){
		drawType = gl.TRIANGLES;
	    }else if(loopPressed) {
		drawType = gl.LINE_LOOP;
	    }

        mat4.translate(mvMatrix, [-1.5, 0.0, -8.0]);

        mvPushMatrix();
	
        mat4.rotate(mvMatrix, degToRad(rPyramid), [0, 1, 0]);

        sphere.draw(drawType);
     
	mvPopMatrix();

        mat4.translate(mvMatrix, [3.0, 0.0, 0.0]);

	// draw 8 spheres at the cube
    	for (var i = 0; i < cubevertices.length; i++) {
		mvPushMatrix();
		mat4.rotate(mvMatrix, degToRad(rCube), [1, 1, 1]);
		mat4.translate(mvMatrix, cubevertices[i]);
		mat4.scale(mvMatrix, [0.25, 0.25, 0.25]);
		sphere.draw(drawType);
		mvPopMatrix();
    	}
    }


/* camera vector xyz starting position */
var x = -1.0;
var y = 0.0;
var z = -2.0;
/* key,value pairs of key = keyCode and value = boolean pressed state */
var currentlyPressedKeys = {};
/* global value to define the tesslation recursion depth */
var currentDepth = 2;
/* global value to define the mesh drawtype (e.g. gl.TRIANGLES or gl.LINELOOP) */
var drawType;
/*  */
var loopPressed = false;
var trianglePressed = true;

function handleKeyDown(event) {
    currentlyPressedKeys[event.keyCode] = true;
}

function handleKeyUp(event) {
    currentlyPressedKeys[event.keyCode] = false;
}

function handleKeys() {

    if (currentlyPressedKeys[81]) {
        // q to zoom in
        z += 0.05;
    }
    if (currentlyPressedKeys[69]) {
        // e to zoom out
        z -= 0.05;
    }

    if (currentlyPressedKeys[65]) {
        // left arrow
        x += 0.05;
    }
    if (currentlyPressedKeys[83]) {
        // up arrow
        y += 0.05;
    }
    if (currentlyPressedKeys[68]) {
        // right arrow
        x -= 0.05;
    }
    if (currentlyPressedKeys[87]) {
        // down arrow
        y -= 0.05;
    }
    if (currentlyPressedKeys[49]) {
        // one button
        trianglePressed = false;
        loopPressed = true;
    }
    if (currentlyPressedKeys[50]) {
        // two button
        trianglePressed = true;
        loopPressed = false;
    }
    if (currentlyPressedKeys[187]) {
        // plus
        speed += 0.25;
    }
    if (currentlyPressedKeys[189]) {
        // minus
        speed -= 0.25;
    }
}

    var lastTime = 0;
    /* global value to modify rotation speed */
    var speed = 1.0;

    function animate() {
        var timeNow = new Date().getTime();
        if (lastTime != 0) {
            var elapsed = (timeNow - lastTime) * speed;

            rPyramid += (90 * elapsed) / 1000.0;
            rCube -= (75 * elapsed) / 1000.0;
        }
        lastTime = timeNow;
    }


    function tick() {
        requestAnimFrame(tick);
	handleKeys();
        drawScene();
        animate();
    }


    function webGLStart() {
        var canvas = document.getElementById("canvas");
        initGL(canvas);
        initShaders()
        initBuffers();

	sphere = new Sphere(currentDepth);
        sphere.initBuffers();

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);

	document.onkeydown = handleKeyDown;
	document.onkeyup = handleKeyUp;

        tick();
    }
