import { Vector3 } from "./vector.js";
import { Quaternion } from "./quaternion.js";

export class Matrix4 {

    // Define a parameterless constructor that allocates the matrix's elements as a Float32Array with 16 slots.
    // The Float32Array class is a builtin type in JavaScript's standard library, and it stores 4-byte floats.
    // JavaScript's default number type has double precision, but most graphics cards expect single precision.
    // See MDN to learn the interface of Float32Array.
    matrix: Float32Array;

    constructor() {
        // Your Float32Array is a flat 16-element array, but you want to think of it as a 4×4 two-dimensional array.
        // By the conventions of WebGL, the first four elements are the first column of the matrix.
        // The next four are the second column. This ordering is called column major.
        // In a comment, lay out the numbers 0 through 15 in a 4×4 column major “map” of the matrix.
        // You should be able to look at the map and figure out at which index of the array you can physically
        // find an element at a logical row and column.

        /*
        this.matrix = [
            0, 4, 8, 12
            1, 5, 9, 13,
            2, 6, 10, 14,
            3, 7, 11, 15
        ]
        */
        this.matrix = new Float32Array(16);

        for (let i = 0; i < this.matrix.length - 1; i++) {
            this.matrix[i] = 0;
        }

        this.matrix[15] = 1;
    }

    get(row: number, column: number): number {
        return this.matrix[row + column * 4];
    }

    set(row: number, column: number, val: number) {
        this.matrix[row + column * 4] = val;
    }

    // returns the float32Array
    toFloats(): Float32Array {
        return this.matrix;
    }

    static scale(x: number, y: number, z: number): Matrix4 {
        let res = new Matrix4();

        res.set(0, 0, x);
        res.set(1, 1, y);
        res.set(2, 2, z);

        return res;
    }

    // accepts three parameters for the x, y and z offsets
    // returns a matrix that translates by the given offsets
    static translate (x: number, y: number, z: number): Matrix4 {
        // return new Float32Array
        let translated = new Matrix4();
        // sets the default 1's
        translated.set(0, 0, 1);
        translated.set(1, 1, 1);
        translated.set(2, 2, 1);

        // sets the x y and z
        translated.set(0, 3, x);
        translated.set(1, 3, y);
        translated.set(2, 3, z);
        return translated
    }

    static rotateX(degrees: number): Matrix4 {
        // turn the number into radians then apply the formula in the book
        let radians = degrees * (Math.PI / 180)
        let rotatedX = new Matrix4();
        // set takes a row col and then the value you want to set it to
        rotatedX.set(0, 0, 1)
        rotatedX.set(1, 1, Math.cos(radians))
        rotatedX.set(1, 2, -(Math.sin(radians)))

        rotatedX.set(2, 1, (Math.sin(radians)))
        rotatedX.set(2, 2, Math.cos(radians))

        return rotatedX
    }

    static rotateY(degrees: number): Matrix4 {
        let radians = degrees * (Math.PI / 180)
        let rotatedY = new Matrix4();

        rotatedY.set(0, 0, Math.cos(radians));
        rotatedY.set(0, 2, -1 * (Math.sin(radians)));
        rotatedY.set(1, 1, 1);
        rotatedY.set(2, 0, Math.sin(radians));
        rotatedY.set(2, 2, Math.cos(radians));

        return rotatedY;
    }

    static rotateZ(degrees: number): Matrix4 {
        let radians = degrees * (Math.PI / 180)
        let roZ = new Matrix4();

        // set defaults
        roZ.set(2, 2, 1);

        // sets new ones
        // cos a -sin a
        // sin a  cos a

        roZ.set(0, 0, Math.cos(radians));
        roZ.set(0, 1, Math.sin(-radians));
        roZ.set(1, 0, Math.sin(radians));
        roZ.set(1, 1, Math.cos(radians));

        return roZ;
    }

    // Multiplying a vector or matrix by the identity matrix is akin to multiplying a scalar number by 1.
    // The identity matrix is essentially a scale matrix in which the scale factors are all 1.
    // (Or a translation matrix with offsets of 0. Or a rotation by 0.)
    static identity(): Matrix4 {
        let iden = new Matrix4();

        iden.set(0, 0, 1);
        iden.set(1, 1, 1);
        iden.set(2, 2, 1);
        return iden;
    }

    multiplyMatrix(that: Matrix4): Matrix4 {

        // for each row r of product
        //     for each column c of product
        //         d = dot(row r of left, column c of right)
        //         set element (r, c) of product to d

        let mult = new Matrix4();

        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                let sum = 0;
                for (let inside = 0; inside < 4; inside++) {
                    sum += this.get(row, inside) * that.get(inside, col);
                }
                mult.set(row, col, sum);
            }
        }

        return mult
    }

    // It accepts as parameters a Vector3 and a homogeneous coordinate.
    // (x * elem 0) + (x * elem 1) + (x * elem 2) + (x * elem 3)
    // (y * elem 4) + (y * elem 5) + (y * elem 6) + (y * elem 7)
    // (z * elem 8) + (z * elem 9) + (z * elem 10) + (z * elem 11)
    // (w * elem 12) + (w * elem 13) + (w * elem 14) + (w * elem 15)
    multiplyVector3(vector: Vector3, w: number): Vector3{
        // for each index i
        //     d = dot(row i of matrix, vector with w)
        //     set element i of transformed vector to d
        // Need to finish

        let vec = new Vector3(0, 0, 0);

        let x = this.get(0, 0) * vector.x + this.get(0, 1) * vector.y + this.get(0, 2) * vector.z + this.get(0, 3) * w;
        let y = this.get(1, 0) * vector.x + this.get(1, 1) * vector.y + this.get(1, 2) * vector.z + this.get(1, 3) * w;
        let z = this.get(2, 0) * vector.x + this.get(2, 1) * vector.y + this.get(2, 2) * vector.z + this.get(2, 3) * w;


        vec.set(0, x);
        vec.set(1, y);
        vec.set(2, z);

        return vec;
    }
    
    // Implement Matrix4.perspective to build a perspective matrix. Have it accept the four parameters of a perspective
    // viewing volume.
    // fov is degrees
    // aspectRatio is width to height ratio
    static perspective(fov: number, aspectRatio: number, near:number, far: number): Matrix4 {
        let per = new Matrix4();
        
        // need to find top
        let top = Math.tan(fov / 2) * near;
        
        // need to find right
        let right = aspectRatio * top;
        

        // do we need x eye, y eye, and z eye?
        // let zplane = -1 * near
        // yplane = near * (y_eye / -z_eye)
        
        // matrix
        // near/right     0                0                           0
        //     0      near/top             0                           0
        //     0          0    (near + far)/(near-far)                 -1
        //     0          0    (2 * near * far)/(near-far)             0
        
        per.set(0, 0, near/right);
        per.set(1, 1, near/top);
        per.set(2, 2, (near + far)/(near-far));
        per.set(2, 3, (2 * near * far)/(near-far));
        per.set(3, 2, -1);
        per.set(3, 3, 0);

        return per;
    }

    static rotateAround (axis: Vector3, degrees: number) {
        let rotated = new Matrix4();
        let a = degrees * (Math.PI / 180);
        let s = Math.sin(a);
        let c = Math.cos(a);
        let d = 1 - c;
        rotated.set (0, 0, (d * axis.x * axis.x + c));
        rotated.set (0, 1, (d * axis.y * axis.x + s * axis.z));
        rotated.set (0, 2, (d * axis.z * axis.x - s * axis.y));
        rotated.set (1, 0, (d * axis.x * axis.y - s * axis.z));
        rotated.set (1, 1, (d * axis.y * axis.y + c));
        rotated.set (1, 2, (d * axis.z * axis.y + s * axis.x));
        rotated.set (2, 0, (d * axis.x * axis.z + s * axis.y));
        rotated.set (2, 1, (d * axis.y * axis.z - s * axis.x));
        rotated.set (2, 2, (d * axis.z * axis.z + c));
        return rotated;
    }
    
    static fromBuffer(buffer: Float32Array | Uint16Array) {
        let m = Matrix4.identity();
        for (let i = 0; i < 16; ++i) {
          m.matrix[i] = buffer[i];
        }
        return m;
      }
    static fromElements(elements: number[]) {
        let m = Matrix4.identity();
        for (let i = 0; i < 16; ++i) {
          // TODO: rename floats to your Float32 array
          m.matrix[i] = elements[i];
        }
        return m;
      }
      
      static fromQuaternion(q: Quaternion) {
        let m = Matrix4.identity();
      
        let x2 = q.get(0) + q.get(0);
        let y2 = q.get(1) + q.get(1);
        let z2 = q.get(2) + q.get(2);
      
        let xx = q.get(0) * x2;
        let yx = q.get(1) * x2;
        let yy = q.get(1) * y2;
        let zx = q.get(2) * x2;
        let zy = q.get(2) * y2;
        let zz = q.get(2) * z2;
        let wx = q.get(3) * x2;
        let wy = q.get(3) * y2;
        let wz = q.get(3) * z2;
      
        return Matrix4.fromElements([
          1 - yy - zz, yx + wz, zx - wy, 0,
          yx - wz, 1 - xx - zz, zy + wx, 0,
          zx + wy, zy - wx, 1 - xx - yy, 0,
          0, 0, 0, 1
        ]);
      }

      inverse() {
        let m = new Matrix4();
    
        let a0 = this.get(0, 0) * this.get(1, 1) - this.get(0, 1) * this.get(1, 0);
        let a1 = this.get(0, 0) * this.get(1, 2) - this.get(0, 2) * this.get(1, 0);
        let a2 = this.get(0, 0) * this.get(1, 3) - this.get(0, 3) * this.get(1, 0);
    
        let a3 = this.get(0, 1) * this.get(1, 2) - this.get(0, 2) * this.get(1, 1);
        let a4 = this.get(0, 1) * this.get(1, 3) - this.get(0, 3) * this.get(1, 1);
        let a5 = this.get(0, 2) * this.get(1, 3) - this.get(0, 3) * this.get(1, 2);
    
        let b0 = this.get(2, 0) * this.get(3, 1) - this.get(2, 1) * this.get(3, 0);
        let b1 = this.get(2, 0) * this.get(3, 2) - this.get(2, 2) * this.get(3, 0);
        let b2 = this.get(2, 0) * this.get(3, 3) - this.get(2, 3) * this.get(3, 0);
    
        let b3 = this.get(2, 1) * this.get(3, 2) - this.get(2, 2) * this.get(3, 1);
        let b4 = this.get(2, 1) * this.get(3, 3) - this.get(2, 3) * this.get(3, 1);
        let b5 = this.get(2, 2) * this.get(3, 3) - this.get(2, 3) * this.get(3, 2);
    
        let determinant = a0 * b5 - a1 * b4 + a2 * b3 + a3 * b2 - a4 * b1 + a5 * b0;
    
        if (determinant != 0) {
          let inverseDeterminant = 1 / determinant;
          m.set(0, 0, (+this.get(1, 1) * b5 - this.get(1, 2) * b4 + this.get(1, 3) * b3) * inverseDeterminant);
          m.set(0, 1, (-this.get(0, 1) * b5 + this.get(0, 2) * b4 - this.get(0, 3) * b3) * inverseDeterminant);
          m.set(0, 2, (+this.get(3, 1) * a5 - this.get(3, 2) * a4 + this.get(3, 3) * a3) * inverseDeterminant);
          m.set(0, 3, (-this.get(2, 1) * a5 + this.get(2, 2) * a4 - this.get(2, 3) * a3) * inverseDeterminant);
          m.set(1, 0, (-this.get(1, 0) * b5 + this.get(1, 2) * b2 - this.get(1, 3) * b1) * inverseDeterminant);
          m.set(1, 1, (+this.get(0, 0) * b5 - this.get(0, 2) * b2 + this.get(0, 3) * b1) * inverseDeterminant);
          m.set(1, 2, (-this.get(3, 0) * a5 + this.get(3, 2) * a2 - this.get(3, 3) * a1) * inverseDeterminant);
          m.set(1, 3, (+this.get(2, 0) * a5 - this.get(2, 2) * a2 + this.get(2, 3) * a1) * inverseDeterminant);
          m.set(2, 0, (+this.get(1, 0) * b4 - this.get(1, 1) * b2 + this.get(1, 3) * b0) * inverseDeterminant);
          m.set(2, 1, (-this.get(0, 0) * b4 + this.get(0, 1) * b2 - this.get(0, 3) * b0) * inverseDeterminant);
          m.set(2, 2, (+this.get(3, 0) * a4 - this.get(3, 1) * a2 + this.get(3, 3) * a0) * inverseDeterminant);
          m.set(2, 3, (-this.get(2, 0) * a4 + this.get(2, 1) * a2 - this.get(2, 3) * a0) * inverseDeterminant);
          m.set(3, 0, (-this.get(1, 0) * b3 + this.get(1, 1) * b1 - this.get(1, 2) * b0) * inverseDeterminant);
          m.set(3, 1, (+this.get(0, 0) * b3 - this.get(0, 1) * b1 + this.get(0, 2) * b0) * inverseDeterminant);
          m.set(3, 2, (-this.get(3, 0) * a3 + this.get(3, 1) * a1 - this.get(3, 2) * a0) * inverseDeterminant);
          m.set(3, 3, (+this.get(2, 0) * a3 - this.get(2, 1) * a1 + this.get(2, 2) * a0) * inverseDeterminant);
        } else {
          throw Error('Matrix is singular.');
        }
    
        return m;
      }
      
      static combineMatrices(matrices: Array<Matrix4>): Matrix4 {
        for (let i = 1; i < matrices.length; i++) {
          matrices[0] = matrices[0].multiplyMatrix(matrices[i]);
        }
        return matrices[0];
      }
}