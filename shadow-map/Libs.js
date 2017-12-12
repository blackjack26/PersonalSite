class Libs {
    static getJSON(url, func) {
        let xmlHttp = new XMLHttpRequest();
        xmlHttp.open("GET", url, true);
        xmlHttp.onreadystatechange = function() {
            if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
                func(JSON.parse(xmlHttp.responseText));
            }
        };
        xmlHttp.send();
    }

    static degToRad(angle) {
        return (angle * Math.PI / 180);
    }

    static projection(angle, a, zMin, zMax) {
        const tan = Math.tan(Libs.degToRad(0.5 * angle)),
            A = -(zMax + zMin) / (zMax - zMin),
            B = (-2 * zMax * zMin) / (zMax - zMin);

        return [
            0.5 / tan, 0, 0, 0,
            0, 0.5 * a / tan, 0, 0,
            0, 0, A, -1,
            0, 0, B, 0,
        ];
    }

    static ortho(width, a, zMin, zMax) {
        const right = width / 2,
              left = -width / 2,
              top = (width / a) / 2,
              bottom = -(width / a) / 2;

        return [
            2/(right-left), 0, 0, 0,
            0, 2/(top-bottom), 0, 0,
            0, 0, 2/(zMax-zMin), 0,
            0, 0, 0, 1
        ];
    }

    static ortho2(left, right, bottom, top, near, far) {
        const w = right - left;
        const h = top - bottom;
        const d = far - near;

        return [
            2.0/w, 0, 0, -(left+right)/w,
            0, 2.0/h, 0, -(top+bottom)/h,
            0, 0, -2.0/d, -(near+far)/d,
            0, 0, 0, 1
        ]
    }

    static lookAtDir(direction, up, C) {
        const z = [-direction[0], -direction[1], -direction[2]];
        const x = Libs.cross(up, z);
        Libs.normalize(x);

        const y = Libs.cross(z, x);

        return [
            x[0], y[0], z[0], 0,
            x[1], y[1], z[1], 0,
            x[2], y[2], z[2], 0,
            -(x[0]*C[0] + x[1]*C[1] + x[2]*C[2]),
            -(y[0]*C[0] + y[1]*C[1] + y[2]*C[2]),
            -(z[0]*C[0] + z[1]*C[1] + z[2]*C[2]),
            1
        ];
    }

    static cross(u, v) {
        return [
            u[1]*v[2] - v[1]*u[2],
            u[2]*v[0] - u[0]*v[2],
            u[0]*v[1] - u[1]*v[0],
        ];
    }

    static normalize(v) {
        const n = Libs.size(v);
        v[0] /= n; v[1] /= n; v[2] /= n;
    }

    static size(v) {
        return Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
    }

    static identity() {
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ];
    }

    static setIdentity(m) {
        m[0] = 1; m[1] = 0; m[2] = 0; m[3] = 0;
        m[4] = 0; m[5] = 1; m[6] = 0; m[7] = 0;
        m[8] = 0; m[9] = 0; m[10] = 1; m[11] = 0;
        m[12] = 0; m[13] = 0; m[14] = 0; m[15] = 1;
    }

    static rotate(m, xAngle, yAngle, zAngle) {
        Libs.rotateX(m, xAngle);
        Libs.rotateY(m, yAngle);
        Libs.rotateZ(m, zAngle);
    }

    static rotateX(m, angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const mv1 = m[1], mv5 = m[5], mv9 = m[9];
        m[1] = m[1] * c - m[2] * s;
        m[5] = m[5] * c - m[6] * s;
        m[9] = m[9] * c - m[10] * s;

        m[2] = m[2] * c + mv1 * s;
        m[6] = m[6] * c + mv5 * s;
        m[10] = m[10] * c + mv9 * s;
    }

    static rotateY(m, angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const mv0 = m[0], mv4 = m[4], mv8 = m[8];
        m[0] = c * m[0] + s * m[2];
        m[4] = c * m[4] + s * m[6];
        m[8] = c * m[8] + s * m[10];

        m[2] = c * m[2] - s * mv0;
        m[6] = c * m[6] - s * mv4;
        m[10] = c * m[10] - s * mv8;
    }

    static rotateZ(m, angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const mv0 = m[0], mv4 = m[4], mv8 = m[8];
        m[0] = c * m[0] - s * m[1];
        m[4] = c * m[4] - s * m[5];
        m[8] = c * m[8] - s * m[9];

        m[1] = c * m[1] + s * mv0;
        m[5] = c * m[5] + s * mv4;
        m[9] = c * m[9] + s * mv8;
    }

    static translate(m, x, y, z) {
        Libs.translateX(m, x);
        Libs.translateY(m, y);
        Libs.translateZ(m, z);
    }

    static translateX(m, t) {
        m[12] += t;
    }

    static translateY(m, t) {
        m[13] += t;
    }

    static translateZ(m, t) {
        m[14] += t;
    }
}