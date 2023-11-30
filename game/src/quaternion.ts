// --------------------------------------------------------------------------- 

export class Quaternion {
  data: number[];

  constructor(x: number, y: number, z: number, w: number) {
    this.data = [x, y, z, w];
  }

  static fromElements(x: number, y: number, z: number, w: number) {
    return new Quaternion(x, y, z, w);
  }

  static identity() {
    return Quaternion.fromElements(0, 0, 0, 1);
  }

  get(i: number): number {
    if (i >= 0 && i < 4) {
      return this.data[i];
    } else {
      throw Error(`Bad index: ${i}`);
    }
  }

  set(i: number, value: number) {
    if (i >= 0 && i < 4) {
      this.data[i] = value;
    } else {
      throw Error(`Bad index: ${i}`);
    }
  }

  get x(): number {
    return this.data[0];
  }

  get y(): number {
    return this.data[1];
  }

  get z(): number {
    return this.data[2];
  }

  get w(): number {
    return this.data[3];
  }

  set x(value: number) {
    this.data[0] = value;
  }

  set y(value: number) {
    this.data[1] = value;
  }

  set z(value: number) {
    this.data[2] = value;
  }

  set w(value: number) {
    this.data[3] = value;
  }

  // get magnitude(): number {
    // return Math.sqrt(this.data.reduce((accumulator, datum) => accumulator + datum * datum, 0));
  // }

	negate() {
		return Quaternion.fromElements(-this.x, -this.y, -this.z, -this.w);
	}

  slerp(that: Quaternion, t: number) {
		let cosine = this.x * that.x + this.y * that.y + this.z * that.z + this.w * that.w;
		if (cosine < 0.0) {
			cosine = -cosine;
			that = that.negate();
		}

    let a;
    let b;

    if (1.0 - cosine > 0.0001) {
      let radians = Math.acos(cosine);
      let sine = Math.sin(radians);
      a = Math.sin((1.0 - t) * radians) / sine;
      b = Math.sin(t * radians) / sine;
    } else {
      a = 1 - t;
      b = t;
    }

    return Quaternion.fromElements(
      a * this.x + b * that.x,
      a * this.y + b * that.y,
      a * this.z + b * that.z,
      a * this.w + b * that.w,
    );
	}

  toArray(): number[] {
    return this.data.slice(0);
  }

  toString(): string {
    return `[${this.data.join(', ')}]`;
  }
}

// --------------------------------------------------------------------------- 
