/* 
 * Sphere function which requires a depth parameter for recursion .
 */
function Sphere (depth) {

	if(depth==undefined) {
		console.error("undefined depth using 0");
		depth  = 0;
	}

	/* Function to setup gl.ARRAY_BUFFERS with vertex information of an icosahedron. */
	this.initBuffers = function() {
		
	    var X = 0.525731112119133606;
	    var Z = 0.850650808352039932;
		
	    vertices =[
	    [-X, 0.0, Z],
	    [X, 0.0, Z],
	    [-X, 0.0, -Z],

	    [X, 0.0, -Z], 
	    [0.0, Z, X],
	    [0.0, Z, -X],

	    [0.0, -Z, X],
	    [0.0, -Z, -X], 
	    [Z, X, 0.0], 

	    [-Z, X, 0.0], 
	    [Z, -X, 0.0],
	    [-Z, -X, 0.0]
	    ];
		
	    vertexIndices = [ 
	    0,4,1, 0,9,4, 9,5,4, 4,5,8, 4,8,1,    
	    8,10,1, 8,3,10, 5,3,8, 5,2,3, 2,7,3,    
	    7,10,3, 7,6,10, 7,11,6, 11,0,6, 0,1,6, 
	    6,1,10, 9,0,11, 9,11,2, 9,2,5, 7,2,11 ];

	    /* vertex data to be drawn */	
	    vertexData = [];

	    /* vertex data to be subdevided */
	    unpackedVertexData = [];
	    /* [ [-X, 0.0, Z  ], [x, 0.0, Z  ], .. ] */

	    /* unpack vertex data of icosahedron */
	    for (var i=0; i < vertexIndices.length; i++) {
		unpackedVertexData.push( vertices[vertexIndices[i]] );
	    }
		
	    /* subdivide the icosahedron */
	    for(var i = 0; i < unpackedVertexData.length; i=i+3) {
		subdivide(unpackedVertexData[i], unpackedVertexData[i+1], unpackedVertexData[i+2], depth); 
	    }

	    /* setup the vertex information */
	    vertexPositionBuffer = gl.createBuffer();
	    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
	    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);
		
	    vertexPositionBuffer.itemSize = 3;
	    vertexPositionBuffer.numItems = vertexData.length/3;

	    /* create color buffer */	
	    vertexColorBuffer = gl.createBuffer();
	    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);

	    /* vertices colors rgb by xyz + const alpha */
	    var colors = []; 
	    for(var i=0; i<vertexData.length; i=i+3) {
		colors.push(vertexData[i], vertexData[i+1], vertexData[i+2], 1.0);
	    }

	    /* transform color values into the interval of [0,1] */
	    for(var i=0; i<colors.length; i++){
		if(colors[i]<0) { colors[i] *= -1.0; }  
	    }
	    
	    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

	    vertexColorBuffer.itemSize = 4;
	    vertexColorBuffer.numItems = vertexData.length;

	    console.log("Sphere consists of", vertexData.length, "vertices");
	}

	/*
	 * Function which takes 3x array of 3 elements and a number as depth value as argument.
	 */
	function subdivide (v1, v2, v3, depth) {
	    if(v1 == undefined || v2 == undefined || v3 == undefined){
		console.error("subdivide is missing parameters");
		return;
	    }

	    if(v1.length != 3 || v2.length != 3 || v3.length != 3) {
		console.error("subdivide got parameter of invalid length");
		return;
	    }

	    var v12 = vec3.create([0.0, 0.0, 0.0]);
	    var v23 = vec3.create([0.0, 0.0, 0.0]);
	    var v31 = vec3.create([0.0, 0.0, 0.0]);

	    if (depth <= 0) {
		vertexData.push(v1[0],v1[1],v1[2]);
		vertexData.push(v2[0],v2[1],v2[2]);
		vertexData.push(v3[0],v3[1],v3[2]);
		return;
	    }

	    for (var i = 0; i < 3; i++) {
		v12[i] = (v1[i] + v2[i]);
		v23[i] = (v2[i] + v3[i]);
		v31[i] = (v3[i] + v1[i]);
	    }

	    vec3.normalize(v12);
	    vec3.normalize(v23);
	    vec3.normalize(v31);
		
	    subdivide(v1, v12, v31, depth-1);
	    subdivide(v2, v23, v12, depth-1);
	    subdivide(v3, v31, v23, depth-1);
	    subdivide(v12, v23, v31, depth-1);
	}

	/*
	 * Function to draw a sphere using gl.drawArrays.
	 */
	this.draw = function(drawType) {

	    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
	    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
		vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

	    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
	    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute,
		vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);  

	    setMatrixUniforms();
	    // function of WebGL canvas
	    gl.drawArrays(drawType, 0, vertexPositionBuffer.numItems);
		
	}
}
