// Deklarasi isian dari Vertex Shader
var vertexShaderText =
	[
		'precision mediump float;',
		'',
		'attribute vec3 aVertPosition;',
		'attribute vec2 aVertTexCoord;',
		'varying vec2 vFragTexCoord;',
		'uniform mat4 uMWorld;',
		'uniform mat4 uMView;',
		'uniform mat4 uMProj;',
		'',
		'void main()',
		'{',
		'  vFragTexCoord = aVertTexCoord;',
		'  gl_Position = uMProj * uMView * uMWorld * vec4(aVertPosition, 1.0);',
		'}'
	].join('\n');

// Deklarasi isian dari Fragment Shader
var fragmentShaderText =
	[
		'precision mediump float;',
		'',
		'varying vec2 vFragTexCoord;',
		'uniform sampler2D uSampler;',
		'',
		'void main()',
		'{',
		'  gl_FragColor = texture2D(uSampler, vFragTexCoord);',
		'}'
	].join('\n');

// Fungsi Utama Program
var InitDemo = function () {
	// Cek apabila aplikasi dapat bekerja atau tidak
	console.log('This is working');

	// Inisialisasi WebGL
	var canvas = document.getElementById('game-surface');
	var gl = canvas.getContext('webgl');

	// Cek apabila web tidak support, maka akan menggunakan experimental-webgl sebagai alternatif
	if (!gl) {
		console.log('WebGL not supported, falling back on experimental-webgl');
		gl = canvas.getContext('experimental-webgl');
	}

	// Cek apabila web tidak support, maka akan mengeluarkan output tidak support
	if (!gl) {
		alert('Your browser does not support WebGL');
	}

	// Inisialisasi matriks transformasi dan lokasi uniform
	var identityMatrix = new Float32Array(16);
	mat4.identity(identityMatrix);

	// Digunakan untuk memberikan Warna Pada Background
	gl.clearColor(0.75, 0.85, 0.8, 1.0);
	// Digunakan untuk membersihkan Buffer-Rendering pada WebGL
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	// Digunakan untuk mengaktifkan pengujian kedalaman (depth testing) dalam WebGL.
	gl.enable(gl.DEPTH_TEST);
	// Digunakan untuk mengaktifkan penampilan (culling) dalam WebGL.
	gl.enable(gl.CULL_FACE);
	// Digunakan untuk mengatur orientasi sudut pandang (front face) dalam WebGL
	gl.frontFace(gl.CCW);
	// Digunakan untuk mengatur jenis penampilan (culling) yang akan diaplikasikan.
	gl.cullFace(gl.BACK);

	// Membuat Dua Buah Sebuah Shader dan Fragmen Shader
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

	gl.shaderSource(vertexShader, vertexShaderText);
	gl.shaderSource(fragmentShader, fragmentShaderText);

	//Mengkompilasi vertex shader dan fragment shader
	gl.compileShader(vertexShader);
	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
		console.error('ERROR compiling vertex shader!', gl.getShaderInfoLog(vertexShader));
		return;
	}
	gl.compileShader(fragmentShader);
	if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
		console.error('ERROR compiling fragment shader!', gl.getShaderInfoLog(fragmentShader));
		return;
	}

	//Membuat dan Menghubungkan Program Vertex Shader dan Fragment Shader
	var program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error('ERROR linking program!', gl.getProgramInfoLog(program));
		return;
	}
	gl.validateProgram(program);
	if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
		console.error('ERROR validating program!', gl.getProgramInfoLog(program));
		return;
	}

	// Membuat koordinat donat
	var donutVertices = [];
	var donutIndices = [];

	var numSides = 32; // Jumlah sisi donat
	var numRings = 16; // Jumlah cincin donat
	var donutRadius = 1.75; // Radius donat
	var tubeRadius = 0.75; // Radius tabung donat

	for (var ring = 0; ring <= numRings; ring++) {
		var theta = (ring / numRings) * Math.PI * 2;
		var sinTheta = Math.sin(theta);
		var cosTheta = Math.cos(theta);

		for (var side = 0; side < numSides; side++) {
			var phi = (side / numSides) * Math.PI * 2;
			var sinPhi = Math.sin(phi);
			var cosPhi = Math.cos(phi);

			var x = (donutRadius + tubeRadius * cosTheta) * cosPhi;
			var y = (donutRadius + tubeRadius * cosTheta) * sinPhi;
			var z = tubeRadius * sinTheta;

			var u = side / numSides;
			var v = ring / numRings;

			donutVertices.push(x, y, z, u, v);
		}
	}

	for (var ring = 0; ring < numRings; ring++) {
		for (var side = 0; side < numSides; side++) {
			var nextSide = (side + 1) % numSides;
			var nextRing = ring + 1;

			var vertexIndex = side + ring * numSides;
			var nextVertexIndex = nextSide + ring * numSides;
			var nextRingVertexIndex = side + nextRing * numSides;
			var nextRingNextSideVertexIndex = nextSide + nextRing * numSides;

			donutIndices.push(vertexIndex, nextVertexIndex, nextRingVertexIndex);
			donutIndices.push(nextRingVertexIndex, nextVertexIndex, nextRingNextSideVertexIndex);
		}
	}

	//Mendefinisikan atribut vertex
	var donutVertexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, donutVertexBufferObject);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(donutVertices), gl.STATIC_DRAW);

	var donutIndexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, donutIndexBufferObject);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(donutIndices), gl.STATIC_DRAW);

	var positionAttribLocation = gl.getAttribLocation(program, 'aVertPosition');
	var texCoordAttribLocation = gl.getAttribLocation(program, 'aVertTexCoord');
	gl.vertexAttribPointer(
		positionAttribLocation,
		3,
		gl.FLOAT,
		gl.FALSE,
		5 * Float32Array.BYTES_PER_ELEMENT,
		0
	);
	gl.vertexAttribPointer(
		texCoordAttribLocation,
		2,
		gl.FLOAT,
		gl.FALSE,
		5 * Float32Array.BYTES_PER_ELEMENT,
		3 * Float32Array.BYTES_PER_ELEMENT
	);

	gl.enableVertexAttribArray(positionAttribLocation);
	gl.enableVertexAttribArray(texCoordAttribLocation);

	//Membuat sebuah texture pada donat
	var donutTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, donutTexture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texImage2D(
		gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
		gl.UNSIGNED_BYTE,
		document.getElementById('dougnut')
	);
	gl.bindTexture(gl.TEXTURE_2D, null);

	// Memberitahukan OpenGL bahwa program harus aktif
	gl.useProgram(program);

	matWorldUniformLocation = gl.getUniformLocation(program, 'uMWorld');
	matViewUniformLocation = gl.getUniformLocation(program, 'uMView');
	matProjUniformLocation = gl.getUniformLocation(program, 'uMProj');

	var worldMatrix = new Float32Array(16);
	var viewMatrix = new Float32Array(16);
	var projMatrix = new Float32Array(16);
	mat4.identity(worldMatrix);
	mat4.lookAt(viewMatrix, [0, 0, -8], [0, 0, 0], [0, 1, 0]);
	mat4.perspective(projMatrix, glMatrix.toRadian(45), canvas.clientWidth / canvas.clientHeight, 0.1, 1000.0);

	gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
	gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
	gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);

	var angle = 0;
	var xTranslation = 0.0;
	var yTranslation = 0.0;
	var zTranslation = 0.0;


	var sliderX = document.getElementById('x-slider');
	var sliderY = document.getElementById('y-slider');
	var sliderZ = document.getElementById('z-slider');

	// Add event listeners to the sliders
	sliderX.addEventListener('input', function () {
		// Update the X translation based on the slider value
		xTranslation = parseFloat(sliderX.value);
	});

	sliderY.addEventListener('input', function () {
		// Update the Y translation based on the slider value
		yTranslation = parseFloat(sliderY.value);
	});

	sliderZ.addEventListener('input', function () {
		// Update the Z translation based on the slider value
		zTranslation = parseFloat(sliderZ.value);
	});

	var MovingObject = false;

	playbutton.addEventListener('click', function () {
		// Toggle nilai boolean untuk menghentikan atau melanjutkan gerakan
		MovingObject = !MovingObject;
	});



	document.addEventListener('keydown', function (event) {
		if (event.key === 'a') {
			MovingObject = !MovingObject;
		}
	});

	//Program Render Berulang
	var loop = function () {
		if (!MovingObject) {
			angle = performance.now() / 1000 / 6 * 2 * Math.PI;

			// Apply the translation and rotation to the world matrix
			mat4.identity(worldMatrix);
			mat4.translate(worldMatrix, worldMatrix, [xTranslation, yTranslation, zTranslation]);
			mat4.rotate(worldMatrix, worldMatrix, angle, [0, 1, 0]);

			// Apply the rotation to the world matrix
			mat4.rotate(worldMatrix, worldMatrix, angle, [0, 1, 0]);

			gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
			gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);

			gl.clearColor(0.75, 0.85, 0.8, 1.0);
			gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

			gl.bindTexture(gl.TEXTURE_2D, donutTexture);
			gl.activeTexture(gl.TEXTURE0);

			// Ganti untuk menggambar donat
			gl.drawElements(gl.TRIANGLES, donutIndices.length, gl.UNSIGNED_SHORT, 0);

			requestAnimationFrame(loop);

		} else {
			requestAnimationFrame(loop);
		}

	};
	requestAnimationFrame(loop);
};

// Panggil fungsi InitDemo untuk memulai program
InitDemo();

