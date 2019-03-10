/// <reference path="webgl.d.ts" />

let cube = class {
    constructor(gl, pos, [l, b, h], url, ts) {
        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);


        // l along x, b along y, h along z
        this.positions = [
             // Front face
             -l / 2, -b / 2, h / 2,
             l / 2, -b / 2, h / 2,
             l / 2, b / 2, h / 2,
             -l / 2, b / 2, h / 2,
             //Back Face
             -l / 2, -b / 2, -h / 2,
             l / 2, -b / 2, -h / 2,
             l / 2, b / 2, -h / 2,
             -l / 2, b / 2, -h / 2,
             //Top Face
             -l / 2, b / 2, -h / 2,
             l / 2, b / 2, -h / 2,
             l / 2, b / 2, h / 2,
             -l / 2, b / 2, h / 2,
             //Bottom Face
             -l / 2, -b / 2, -h / 2,
             l / 2, -b / 2, -h / 2,
             l / 2, -b / 2, h / 2,
             -l / 2, -b / 2, h / 2,
             //Left Face
             -l / 2, -b / 2, -h / 2,
             -l / 2, b / 2, -h / 2,
             -l / 2, b / 2, h / 2,
             -l / 2, -b / 2, h / 2,
             //Right Face
             l / 2, -b / 2, -h / 2,
             l / 2, b / 2, -h / 2,
             l / 2, b / 2, h / 2,
             l / 2, -b / 2, h / 2,
        ];
        this.scaling = [1, 1, 1];
        this.rotation = 0;
        this.vy = 0;
        this.ay = 10;
        this.score = 0;
        this.isdraw = true;
        this.dim = [l, b, h];
        function loadTexture(gl, url) {
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            
            // Because images have to be download over the internet
            // they might take a moment until they are ready.
            // Until then put a single pixel in the texture so we can
            // use it immediately. When the image has finished downloading
            // we'll update the texture with the contents of the image.
            const level = 0;
            const internalFormat = gl.RGBA;
            const width = 1;
            const height = 1;
            const border = 0;
            const srcFormat = gl.RGBA;
            const srcType = gl.UNSIGNED_BYTE;
            const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                            width, height, border, srcFormat, srcType,
                            pixel);
            const image = new Image();
            // console.log(url);
            image.onload = function() {
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                            srcFormat, srcType, image);
            
                // WebGL1 has different requirements for power of 2 images
                // vs non power of 2 images so check if the image is a
                // power of 2 in both dimensions.
                if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
                    // Yes, it's a power of 2. Generate mips.
                    gl.generateMipmap(gl.TEXTURE_2D);
                } else {
                    // No, it's not a power of 2. Turn of mips and set
                    // wrapping to clamp to edge
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                }
            };
            image.src = url;
            
            return texture;
        }
            
        function isPowerOf2(value) {
        return (value & (value - 1)) == 0;
        }
        this.texture = loadTexture(gl, url);
        this.pos = pos;
        this.keypress_timestamp = 0;
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.positions), gl.STATIC_DRAW);
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        // This array defines each face as two triangles, using the
        // indices into the vertex array to specify each triangle's
        // position.

        const indices = [
            0, 1, 2,    0, 2, 3, // front
            4, 5, 6,    4, 6, 7,
            8, 9, 10,   8, 10, 11,
            12, 13, 14, 12, 14, 15,
            16, 17, 18, 16, 18, 19,
            20, 21, 22, 20, 22, 23, 
        ];
         // Now send the element array to GL
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices), gl.STATIC_DRAW);

        this.textureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordBuffer);
        this.textureCoordinates = [
            // Front
            ts,  ts,
            0.0,  ts,
            0.0,  0.0,
            ts,  0.0,
            // Back
            ts,  ts,
            0.0,  ts,
            0.0,  0.0,
            ts,  0.0,
            // Top
            ts,  ts,
            0.0,  ts,
            0.0,  0.0,
            ts,  0.0,
            // Bottom
            ts,  ts,
            0.0,  ts,
            0.0,  0.0,
            ts,  0.0,
            // Right
            ts,  ts,
            0.0,  ts,
            0.0,  0.0,
            ts,  0.0,
            // Left
            ts,  ts,
            0.0,  ts,
            0.0,  0.0,
            ts,  0.0,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.textureCoordinates),
        gl.STATIC_DRAW);
        // console.log(this.positions.length, this.textureCoordinates.length, indices.length);
        this.buffer = {
            position: this.positionBuffer,
            textureCoord: this.textureCoordBuffer,
            indices: this.indexBuffer,
        }

    } 

    drawCube(gl, projectionMatrix, programInfo, deltaTime) {
        const modelViewMatrix = mat4.create();
        mat4.translate(
            modelViewMatrix,
            modelViewMatrix,
            this.pos
        );
        
        //this.rotation += Math.PI / (((Math.random()) % 100) + 50);
        mat4.rotate(modelViewMatrix,
            modelViewMatrix,
            this.rotation,
            [1, 0, 0]);

        mat4.scale(
            modelViewMatrix,
            modelViewMatrix,
            this.scaling
        );
        
        {
            const numComponents = 3;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.position);
            gl.vertexAttribPointer(
                programInfo.attribLocations.vertexPosition,
                numComponents,
                type,
                normalize,
                stride,
                offset);
            gl.enableVertexAttribArray(
                programInfo.attribLocations.vertexPosition);
        }

        // Tell WebGL how to pull out the colors from the color buffer
        // into the vertexColor attribute.
        // {
        //     const numComponents = 4;
        //     const type = gl.FLOAT;
        //     const normalize = false;
        //     const stride = 0;
        //     const offset = 0;
        //     gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.color);
        //     gl.vertexAttribPointer(
        //         programInfo.attribLocations.vertexColor,
        //         numComponents,
        //         type,
        //         normalize,
        //         stride,
        //         offset);
        //     gl.enableVertexAttribArray(
        //         programInfo.attribLocations.vertexColor);
        // }

        // Tell WebGL how to pull out the texture coordinates from
        // the texture coordinate buffer into the textureCoord attribute.
        {
            const numComponents = 2;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.textureCoord);
            gl.vertexAttribPointer(
                programInfo.attribLocations.textureCoord,
                numComponents,
                type,
                normalize,
                stride,
                offset);
            gl.enableVertexAttribArray(
                programInfo.attribLocations.textureCoord);
        }

        // Tell WebGL which indices to use to index the vertices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer.indices);

        // Tell WebGL to use our program when drawing

        gl.useProgram(programInfo.program);

        // Set the shader uniforms

        gl.uniformMatrix4fv(
            programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix);
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix);
          // Specify the texture to map onto the faces.

        // Tell WebGL we want to affect texture unit 0
        gl.activeTexture(gl.TEXTURE0);

        // Bind the texture to texture unit 0
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        // Tell the shader we bound the texture to texture unit 0
        gl.uniform1i(programInfo.uniformLocations.uSampler, 0);
        
        {
            const vertexCount = 36;
            const type = gl.UNSIGNED_SHORT;
            const offset = 0;
            gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        }
    }
};