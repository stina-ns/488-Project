import {Vector3} from './vector';
import {Matrix4} from './matrix';

export class FirstPersonCamera {
    /*Constructor
        The constructor receives the camera's position, the position at which it's looking,
        and the world's up vector. From the two positions, it computes the forward vector.
        The eyeFromWorld matrix must be rebuilt whenever the camera's position or directions
        change, so it would not be wise to build the matrix in the constructor. Instead, the
        matrix is built in a method named reorient, which the constructor calls.*/
    position: Vector3;
    look: Vector3;
    forward: Vector3;
    right: Vector3;
    worldUp: Vector3;
    eyeFromWorld: Matrix4 = new Matrix4();

    constructor(position: Vector3, look: Vector3, worldUp: Vector3) {
        this.position = position;
        this.look = look;
        this.worldUp = worldUp;
        
        this.forward = new Vector3(0, 0, 0);
        this.right = new Vector3(0, 0, 0);
        
        // forward = normalize(to - from)
        
        this.forward.add(this.look);
        this.forward.subtract(this.position);
        this.forward.normalize();

        // let toFrom = new Vector3(0, 0, 0);
        // toFrom.add(this.look);
        // toFrom.subtract(this.position);
        // toFrom.normalize();
        
        // this.forward.add(toFrom);
        // this.forward.normalize();
        // console.log("position: %d %d %d", this.position.x, this.position.y, this.position.z);

        this.reorient();
    }

    reorient() {
        
        // right = normalize(cross(forward, worldUp))
        this.right = Vector3.crossProduct(this.forward, this.worldUp);
        // this.right.add(crossForUp);
        this.right.normalize();

        // up = normalize(cross(right, forward))
        let up = Vector3.crossProduct(this.right, this.forward);
        up.normalize();

        //console.log("position %d %d %d", this.position.x, this.position.y, this.position.z);
        //console.log("forward %d %d %d", this.forward.x, this.forward.y, this.forward.z);
        //console.log("right %d %d %d", this.right.x, this.right.y, this.right.z);

        let translater = Matrix4.translate(-this.position.x, -this.position.y, -this.position.z);
        let rotater = new Matrix4();
        rotater.set(0, 0, this.right.x);
        rotater.set(0, 1, this.right.y);
        rotater.set(0, 2, this.right.z);
        rotater.set(1, 0, up.x);
        rotater.set(1, 1, up.y);
        rotater.set(1, 2, up.z);
        rotater.set(2, 0, -this.forward.x);
        rotater.set(2, 1, -this.forward.y);
        rotater.set(2, 2, -this.forward.z);
        this.eyeFromWorld = rotater.multiplyMatrix(translater);
    }

    /**
     * Through the constructor we can place the camera anywhere in the world.
     * Once the camera is positioned, we might want to move it to nearby
     * locations. One common camera motion in games is the strafe, in which
     * the player sidesteps to the left or right without turning. We strafe
     * the camera by pushing its position along its right vector and then
     * rebuilding the camera's transformation matrix, as shown in this pseudocode:
     */
    strafe(distance: number) {
        // from = from + right * distance
        let from = new Vector3(this.right.x, this.right.y, this.right.z);
        from.scalarMultiply(distance);
        this.position.add(from);
        this.reorient();
    }

    advance(distance: number) {
        let from = new Vector3(this.forward.x, this.forward.y, this.forward.z);
        from.scalarMultiply(distance);
        this.position.add(from);
        this.reorient();
    }

    yaw(degrees: number) {
        this.forward = Matrix4.rotateAround(this.worldUp, degrees).multiplyVector3(this.forward, 1);
        this.reorient();
        
        // this.forward.scalarMultiply(forward);
        // reorient camera
    }

    pitch(degrees: number) {
        this.forward = Matrix4.rotateAround(this.right, degrees).multiplyVector3(this.forward, 1);
        this.reorient();
    }

    
}