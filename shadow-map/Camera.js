class Camera {

    constructor() {
        this.position = {
            x: 0, y: 0, z: 0
        };
        this.rotation = {
            x: 0, y: 0, z: 0
        };

        this.projMatrix = Libs.identity();

        this.update();
    }

    update() {
        this.matrix = Libs.identity();
        Libs.rotate(this.matrix, this.rotation.x, this.rotation.y, this.rotation.z);
        Libs.translate(this.matrix, this.position.x, this.position.y, this.position.z);
    }

    move(x, y, z) {
        this.position.x += x;
        this.position.y += y;
        this.position.z += z;
        this.update();
    }

    rotate(x, y, z) {
        this.rotation.x += x;
        this.rotation.y += y;
        this.rotation.z += z;
        this.update();
    }

    setProjection(fov, ratio, near, far) {
        this.projMatrix = Libs.projection(fov, ratio, near, far);
    }

    setOrtho(width, a, zMin, zMax) {
        this.projMatrix = Libs.ortho(width, a, zMin, zMax);
    }

}