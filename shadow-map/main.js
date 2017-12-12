let CANVAS, GL;

let cube, floor;
let fb, rb, textureRtt;

let shaderProgramShadow, shaderProgram;

let camera, shadowCamera;
let LIGHTDIR = [0.5, 0.5, -0.5], THETA, PHI;

let drag = false;
const AMORTIZATION = 0.95;
let dX = 0, dY = 0;

let timeOld = 0;

let showDepthMap = false;

function init() {
    CANVAS = document.getElementById('gl_canvas');
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;

    /*=== Capture Mouse Events ===*/
    let oldX, oldY;

    CANVAS.addEventListener("mousedown", function(e) {
        drag = true;
        oldX = e.pageX;
        oldY = e.pageY;
        e.preventDefault();
        return false;
    }, false);
    CANVAS.addEventListener("mouseup", function() {
        drag = false;
    }, false);
    CANVAS.addEventListener("mouseout", function() {
        drag = false;
    }, false);
    CANVAS.addEventListener("mousemove", function(e) {
        if (!drag) return false;
        dX = (e.pageX - oldX) * 2 * Math.PI / CANVAS.width;
        dY = (e.pageY - oldY) * 2 * Math.PI / CANVAS.height;
        THETA += dX;
        PHI += dY;
        oldX = e.pageX;
        oldY = e.pageY;
        e.preventDefault();
    }, false);

    /*=== WebGL Context ===*/
    GL = CANVAS.getContext('webgl', {antialias: true});
    let EXT = GL.getExtension('OES_element_index_uint') ||
        GL.getExtension('MOZ_OES_element_index_uint') ||
        GL.getExtension('WEBKIT_OES_element_index_uint');
    let EXT_STD_DERI = GL.getExtension("OES_standard_derivatives") ||
        GL.getExtension("MOZ_OES_standard_derivatives") ||
        GL.getExtension("WEBKIT_OES_standard_derivatives");


    /*=== Shaders ===*/
    // Shadow shaders
    const vShadowMap = new VertexShader(document.getElementById('shadow-vertex').text, GL);
    const fShadowMap = new FragmentShader(document.getElementById('shadow-fragment').text, GL);

    shaderProgramShadow = new ShaderProgram(vShadowMap, fShadowMap, GL);

    shaderProgramShadow.addUniform('pMatrix', GL);
    shaderProgramShadow.addUniform('lMatrix', GL);
    shaderProgramShadow.addUniform('mMatrix', GL);
    shaderProgramShadow.addUniform('filterType', GL);
    shaderProgramShadow.addAttribute('position', 3, GL.FLOAT, false, 4*(3+3+2), 0, GL);

    // Default shaders
    const vShader = new VertexShader(document.getElementById('vertex-shader').text, GL);
    const fShader = new FragmentShader(document.getElementById('fragment-shader').text, GL);

    shaderProgram = new ShaderProgram(vShader, fShader, GL);

    shaderProgram.addUniform('pMatrix', GL);
    shaderProgram.addUniform('vMatrix', GL);
    shaderProgram.addUniform('mMatrix', GL);
    shaderProgram.addUniform('lMatrix', GL);
    shaderProgram.addUniform('pMatrixLight', GL);
    shaderProgram.addUniform('sourceDirection', GL);
    shaderProgram.addUniform('sampler', GL);
    shaderProgram.addUniform('samplerShadowMap', GL);

    shaderProgram.addUniform('filterType', GL);
    shaderProgram.addUniform('tolerance', GL);

    shaderProgram.addAttribute('position', 3, GL.FLOAT, false, 4*(3+3+2), 0, GL);
    shaderProgram.addAttribute('normal', 3, GL.FLOAT, false, 4*(3+3+2), 4*3, GL);
    shaderProgram.addAttribute('uv', 2, GL.FLOAT, false, 4*(3+3+2), 4*(3+3), GL);

    shaderProgram.use(GL);

    GL.uniform1f(shaderProgram.getUniform('tolerance'), 0.002);
    GL.uniform1i(shaderProgram.getUniform('sampler'), 0);
    GL.uniform1i(shaderProgram.getUniform('samplerShadowMap'), 1);
    GL.uniform3fv(shaderProgram.getUniform('sourceDirection'), LIGHTDIR);

    /*=== The Cube ===*/
    cube = new Cube(GL);
    cube.setTexture('res/crate.png', GL);
    cube.hasShadow = true;

    /*=== The Floor ===*/
    floor = new Plane(10, 10, GL);
    floor.setTexture('res/granite.jpg', GL);
    floor.setPosition(0, -2, 0);

    /*=== Matrix ===*/
    THETA = 0;
    PHI = 0;

    camera = new Camera();
    camera.move(0, -2, -22);
    camera.rotate(Libs.degToRad(20), 0, 0);
    camera.setProjection(40, CANVAS.width / CANVAS.height, 1, 100);

    shadowCamera = new Camera();
    shadowCamera.setOrtho(20, 1, 5, 50); // NOTE: change width to 80 for PCF
    shadowCamera.matrix = Libs.lookAtDir(LIGHTDIR, [0,1,0], [0,0,0]);

    /*=== Render to Texture ===*/
    fb = GL.createFramebuffer();
    GL.bindFramebuffer(GL.FRAMEBUFFER, fb);

    rb = GL.createRenderbuffer();
    GL.bindRenderbuffer(GL.RENDERBUFFER, rb);
    GL.renderbufferStorage(GL.RENDERBUFFER, GL.DEPTH_COMPONENT16, 512, 512);

    GL.framebufferRenderbuffer(GL.FRAMEBUFFER, GL.DEPTH_ATTACHMENT, GL.RENDERBUFFER, rb);

    textureRtt = GL.createTexture();
    GL.bindTexture(GL.TEXTURE_2D, textureRtt);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
    GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, 512, 512, 0, GL.RGBA, GL.UNSIGNED_BYTE, null);

    GL.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, textureRtt, 0);

    GL.bindTexture(GL.TEXTURE_2D, null);
    GL.bindFramebuffer(GL.FRAMEBUFFER, null);

    /*=== Drawing ===*/
    GL.clearColor(0.0, 0.0, 0.0, 0.0);

    GL.enable(GL.DEPTH_TEST);
    GL.depthFunc(GL.LEQUAL);
    GL.clearDepth(1.0);

    render(0);
}

function renderShadowMap() {
    shaderProgramShadow.use(GL);

    shaderProgramShadow.enableAttribute('position', GL);

    GL.viewport(0.0, 0.0, 512, 512);
    GL.clearColor(1.0, 0.0, 0.0, 1.0); //red -> Z=Zfar on the shadow map
    GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    GL.uniformMatrix4fv(shaderProgramShadow.getUniform('pMatrix'), false, shadowCamera.projMatrix);
    GL.uniformMatrix4fv(shaderProgramShadow.getUniform('lMatrix'), false, shadowCamera.matrix);


    cube.draw(shaderProgramShadow, GL.UNSIGNED_INT, null, GL);
    floor.draw(shaderProgramShadow, GL.UNSIGNED_SHORT, null, GL);

    shaderProgramShadow.disableAttribute('position', GL);
}

function render(time) {
    const dt = time - timeOld;
    if (!drag) {
        dX *= AMORTIZATION;
        dY *= AMORTIZATION;
        THETA += dX;
        PHI += dY;
    }

    cube.setRotation(PHI, THETA, 0);

    timeOld = time;

    // Render Shadow Map
    if (!showDepthMap) {
        GL.bindFramebuffer(GL.FRAMEBUFFER, fb);
    }

    renderShadowMap();

    if (!showDepthMap) {
        GL.bindFramebuffer(GL.FRAMEBUFFER, null);

        // Render Scene
        shaderProgram.use(GL);

        shaderProgram.enableAttribute('position', GL);
        shaderProgram.enableAttribute('normal', GL);
        shaderProgram.enableAttribute('uv', GL);

        GL.viewport(0.0, 0.0, CANVAS.width, CANVAS.height);
        GL.clearColor(0.0, 0.0, 0.0, 0.0); //red -> Z=Zfar on the shadow map
        GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

        GL.uniformMatrix4fv(shaderProgram.getUniform('pMatrix'), false, camera.projMatrix);
        GL.uniformMatrix4fv(shaderProgram.getUniform('vMatrix'), false, camera.matrix);
        GL.uniformMatrix4fv(shaderProgram.getUniform('pMatrixLight'), false, shadowCamera.projMatrix);
        GL.uniformMatrix4fv(shaderProgram.getUniform('lMatrix'), false, shadowCamera.matrix);

        cube.draw(shaderProgram, GL.UNSIGNED_INT, textureRtt, GL);
        floor.draw(shaderProgram, GL.UNSIGNED_SHORT, null, GL);

        shaderProgram.disableAttribute('position', GL);
        shaderProgram.disableAttribute('normal', GL);
        shaderProgram.disableAttribute('uv', GL);
    }

    GL.flush();

    requestAnimationFrame(render);
}

function setLightDir() {
    const x = Number(document.getElementById('lightX').value);
    const y = Number(document.getElementById('lightY').value);
    const z = Number(document.getElementById('lightZ').value);

    LIGHTDIR = [x, y, z];
    shaderProgram.use(GL);
    GL.uniform3fv(shaderProgram.getUniform('sourceDirection'), LIGHTDIR);
    shadowCamera.matrix = Libs.lookAtDir(LIGHTDIR, [0,1,0], [0,0,0]);
}

function setQuality(level) {
    shadowCamera.setOrtho(level, 1, 5, 50);
}

function setFilter(filter) {
    shaderProgram.use(GL);
    GL.uniform1i(shaderProgram.getUniform('filterType'), filter);

    shaderProgramShadow.use(GL);
    GL.uniform1i(shaderProgramShadow.getUniform('filterType'), filter);

    const els = document.getElementsByClassName('code');
    for (let i = 0; i < els.length; i++) {
        els[i].style.display = 'none';
    }

    switch(filter) {
        case 1:
            document.getElementById('pcf-filter-code').style.display = 'block';
            document.getElementById("not-msg").textContent = "The Percent Closer Filter (PCF) averages a collection of texels around " +
                "the desired color to generate a penumbra. The larger the penumbra, the lower the performance.";
            break;
        case 2:
            document.getElementById('var-filter-code').style.display = 'block';
            document.getElementById("not-msg").textContent = "The Variance Shadow Map (VSM) is an improvement on the PCF. It uses the " +
                "chebyshev probabilist prediction which relies on mean variance. Instead of storing just the depth (red), we also store a biased " +
                "depth squared (green) that is added into the calculation.";
            break;
        case 0:
        default:
            document.getElementById('no-filter-code').style.display = 'block';
            document.getElementById("not-msg").textContent = "The normal shadow map uses a depth buffer, or z-buffer to calculate a " +
                "shadow coefficient. This is a number between 0 and 1 indicating how much of the pixel's color should be displayed. " +
                "0 means a full shadow and 1 means no shadow. The shadow map is stored in a renderbuffer as a texture to be rendered " +
                "onto the scene.";
            break;
    }
}

function setTolerance() {
    const t = Number(document.getElementById('tolerance').value);
    shaderProgram.use(GL);
    GL.uniform1f(shaderProgram.getUniform('tolerance'), t);

    const els = document.getElementsByClassName('tolerance');
    for (let i = 0; i < els.length; i++) {
        const e = els[i];
        e.textContent = (t < 0 ? `(${t})` : t);
        e.classList.add('updated');

        clearTimeout(window[`tolerance${i}`]);

        window[`tolerance${i}`] = setTimeout(function() {
            e.classList.remove('updated');
        }, 1000);
    }

    if (t < 0.002) {
        document.getElementById("not-msg").textContent = "This visual artifact is called \"Shadow Acne\". It occurs from the angle of the light rays on the surface. " +
            "The tolerance (or bias) of what is determined to be in a shadow can be changed to fix this. ";
    }
}

function toggleShadowMap(e) {
    showDepthMap = !showDepthMap;
    if (showDepthMap) {
        e.textContent = 'Hide';
        document.getElementById("not-msg").innerHTML = "This view is how the light source sees the scene." +
            "We use the red value to store the depth of each pixel.<br />" +
            "<i>Notice the <code>shadowMapColor.r</code> in the code is used to get the depth.</i>";
    } else {
        e.textContent = 'Show';
    }
}