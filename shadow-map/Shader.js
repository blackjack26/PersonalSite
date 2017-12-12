class Shader {
    constructor(type, source, name, GL) {
        this.id = GL.createShader(type);
        this.name = name;
        this.compile(source, GL);
    }

    compile(source, GL) {
        GL.shaderSource(this.id, source);
        GL.compileShader(this.id);
        if (!GL.getShaderParameter(this.id, GL.COMPILE_STATUS)) {
            alert(`ERROR IN '${this.name}' SHADER : ` + GL.getShaderInfoLog(this.id));
            return false;
        }
    }
}

class VertexShader extends Shader {
    constructor(source, GL) {
        super(GL.VERTEX_SHADER, source, 'VERTEX', GL);
    }
}

class FragmentShader extends Shader {
    constructor(source, GL) {
        super(GL.FRAGMENT_SHADER, source, 'FRAGMENT', GL);
    }
}

class Attribute {

    constructor(id, size, type, normalized, stride, offset) {
        this.id = id;
        this.size = size;
        this.type = type;
        this.normalized = normalized;
        this.stride = stride;
        this.offset = offset;
    }

    setPointer(GL) {
        GL.vertexAttribPointer(this.id, this.size, this.type, this.normalized, this.stride, this.offset);
    }

}

class ShaderProgram {

    /**
     * Creates a shader program
     * @param GL WebGL ctx
     * @param vs VertexShader
     * @param fs FragmentShader
     */
    constructor(vs, fs, GL) {
        this.vs = vs;
        this.fs = fs;

        this.uniforms = {};
        this.attributes = {};

        this.id = GL.createProgram();
        GL.attachShader(this.id, this.vs.id);
        GL.attachShader(this.id, this.fs.id);
        GL.linkProgram(this.id);
    }

    addUniform(name, GL) {
        this.uniforms[name] = GL.getUniformLocation(this.id, name);
    }

    getUniform(name) {
        return this.uniforms[name];
    }

    addAttribute(name, size, type, normalized, stride, offset, GL) {
        const attrId = GL.getAttribLocation(this.id, name);
        this.attributes[name] = new Attribute(attrId, size, type, normalized, stride, offset);
    }

    enableAttribute(name, GL) {
        GL.enableVertexAttribArray(this.attributes[name].id);
    }

    disableAttribute(name, GL) {
        GL.disableVertexAttribArray(this.attributes[name].id);
    }

    attributePointer(name, GL) {
        this.getAttribute(name).setPointer(GL);
    }

    getAttribute(name) {
        return this.attributes[name];
    }

    use(GL) {
        GL.useProgram(this.id);
    }
}