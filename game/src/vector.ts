export class Vector3 {
    xyz: number[];
    constructor(x: number, y: number, z: number) {
      this.xyz = [x, y, z];
    }

    get x() {
        return this.xyz[0];
    }
    get y() {
        return this.xyz[1];
    }
    get z() {
        return this.xyz[2];
    }
    set x(value: number) {
        this.xyz[0] = value;
    }
    set y(value: number) {
        this.xyz[1] = value;
    }
    set z(value: number) {
        this.xyz[2] = value;
    }
    get magnitude() {
        return Math.sqrt(this.x * this.x +
                         this.y * this.y +
                         this.z * this.z);
    }
    
    set(index: number, value: number) {
        this.xyz[index] = value;
    }
    add(that: Vector3) {
        this.x = this.x + that.x;
        this.y = this.y + that.y;
        this.z = this.z + that.z;
    }
    subtract(that: Vector3) {
        this.x = this.x - that.x;
        this.y = this.y - that.y;
        this.z = this.z - that.z;
    }
    scalarMultiply(scalar: number) {
        this.x *= scalar;
        this.y *= scalar;
        this.z *= scalar;
    }

    /* p X q
    x = (py * qz - pz * qy)
    y = (pz * qx - px * qz)
    z = (px * qy - py * qx)
    */
	static crossProduct(p: Vector3, q: Vector3): Vector3 {
        let cross_product = new Vector3(0, 0, 0);
        
        cross_product.set(0, (p.y * q.z - p.z * q.y));
        cross_product.set(1, (p.z * q.x - p.x * q.z)); 
        cross_product.set(2, (p.x * q.y - p.y * q.x)); 

        return cross_product;
    }

    normalize() {
        let magnitude = this.magnitude;
        if (this.x != 0) {
            this.x /= magnitude;
        }
        if (this.y != 0) {
            this.y /= magnitude;
        }
        if (this.z != 0) {
            this.z /= magnitude;
        }
    }

    static zero() {
        return new Vector3(0, 0, 0);
    }

    static one() {
        return new Vector3(1, 1, 1);
    }

    toString() {
    return `[${this.x}, ${this.y}, ${this.z}]`;
    }

    lerp(b: Vector3, progression: number) {
        let lerp_vector = new Vector3(0, 0, 0);
        lerp_vector.set(0, (1 - progression ) * this.x + progression * b.x);
        lerp_vector.set(1, (1 - progression ) * this.y + progression * b.y);
        lerp_vector.set(2, (1 - progression ) * this.z + progression * b.z);
        return lerp_vector
    }
      
  }