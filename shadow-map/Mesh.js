class Mesh {

    constructor(vertices, indices, vType, iType, GL) {
        this.position = {
            x: 0, y: 0, z: 0
        };
        this.rotation = {
            x: 0, y: 0, z: 0
        };

        this.vertices = vertices;
        this.indices = indices;

        this.vertexBuffer = GL.createBuffer();
        GL.bindBuffer(GL.ARRAY_BUFFER, this.vertexBuffer);
        GL.bufferData(GL.ARRAY_BUFFER, new vType(this.vertices), GL.STATIC_DRAW);

        this.indexBuffer = GL.createBuffer();
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new iType(this.indices), GL.STATIC_DRAW);

        this.matrix = Libs.identity();

        this.hasShadow = false;
    }

    draw(program, type, shadow, GL) {
        const { x, y, z } = this.position;
        const { x: rX, y: rY, z: rZ } = this.rotation;
        Libs.setIdentity(this.matrix);
        Libs.translate(this.matrix, x, y, z);
        Libs.rotate(this.matrix, rX, rY, rZ);

        GL.uniformMatrix4fv(program.getUniform('mMatrix'), false, this.matrix);

        if (this.image.webglTexture) {
            if (this.hasShadow && shadow !== null) {
                GL.activeTexture(GL.TEXTURE1);
                GL.bindTexture(GL.TEXTURE_2D, shadow);
            }
            GL.activeTexture(GL.TEXTURE0);
            GL.bindTexture(GL.TEXTURE_2D, this.image.webglTexture);
        }

        GL.bindBuffer(GL.ARRAY_BUFFER, this.vertexBuffer);
        const keys = Object.keys(program.attributes);
        for (let i = 0; i < keys.length; i++) {
            program.attributePointer(keys[i], GL);
        }

        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        GL.drawElements(GL.TRIANGLES, this.indices.length, type, 0);
    }

    setTexture(imageURL, GL) {
        const image = new Image();
        image.crossOrigin = 'Anonymous';
        image.src = imageURL;
        image.webglTexture = false;
        image.onload = function(e) {
            const texture = GL.createTexture();
            GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, 1);
            GL.bindTexture(GL.TEXTURE_2D, texture);
            GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, image);
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST_MIPMAP_LINEAR);
            GL.generateMipmap(GL.TEXTURE_2D);
            GL.bindTexture(GL.TEXTURE_2D, null);
            image.webglTexture = texture;
        };
        this.image = image;
    }

    setPosition(x, y, z) {
        this.position.x = x;
        this.position.y = y;
        this.position.z = z;
    }

    setRotation(x, y, z) {
        this.rotation.x = x;
        this.rotation.y = y;
        this.rotation.z = z;
    }

}

class Cube extends Mesh {

    constructor(GL) {
        super([
            //  POS         NORMAL     UV
            -1, -1, -1,   0,  0, -1,  0, 0,    // Back face
             1, -1, -1,   0,  0, -1,  1, 0,
             1,  1, -1,   0,  0, -1,  1, 1,
            -1,  1, -1,   0,  0, -1,  0, 1,

            -1, -1,  1,   0,  0,  1,  0, 0,    // Front face
             1, -1,  1,   0,  0,  1,  1, 0,
             1,  1,  1,   0,  0,  1,  1, 1,
            -1,  1,  1,   0,  0,  1,  0, 1,

            -1, -1, -1,  -1,  0,  0,  0, 0,    // Left face
            -1,  1, -1,  -1,  0,  0,  1, 0,
            -1,  1,  1,  -1,  0,  0,  1, 1,
            -1, -1,  1,  -1,  0,  0,  0, 1,

             1, -1, -1,   1,  0,  0,  0, 0,    // Right face
             1,  1, -1,   1,  0,  0,  1, 0,
             1,  1,  1,   1,  0,  0,  1, 1,
             1, -1,  1,   1,  0,  0,  0, 1,

            -1, -1, -1,   0, -1,  0,  0, 0,    // Bottom face
            -1, -1,  1,   0, -1,  0,  1, 0,
             1, -1,  1,   0, -1,  0,  1, 1,
             1, -1, -1,   0, -1,  0,  0, 1,

            -1,  1, -1,   0,  1,  0,  0, 0,    // Top face
            -1,  1,  1,   0,  1,  0,  1, 0,
             1,  1,  1,   0,  1,  0,  1, 1,
             1,  1, -1,   0,  1,  0,  0, 1,
        ], [
             0,  1,  2,
             0,  2,  3,

             4,  5,  6,
             4,  6,  7,

             8,  9, 10,
             8, 10, 11,

            12, 13, 14,
            12, 14, 15,

            16, 17, 18,
            16, 18, 19,

            20, 21, 22,
            20, 22, 23,
        ], Float32Array, Uint32Array, GL);
    }

}

class Plane extends Mesh {

    constructor(w, d, GL) {
        super([
            -w, 0, -d,   0, 1, 0,   0, 0,
            -w, 0,  d,   0, 1, 0,   0, 1,
             w, 0,  d,   0, 1, 0,   1, 1,
             w, 0, -d,   0, 1, 0,   1, 0,
        ], [
            0, 1, 2,
            0, 2, 3
        ], Float32Array, Uint16Array, GL);
    }

}