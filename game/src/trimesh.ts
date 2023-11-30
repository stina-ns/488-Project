import {Vector3} from './vector.js';

async function readFromUrl(url: string) : Promise<string> {
    let text: string = await fetch(url).then(response => response.text());
    return text;
}

export class Trimesh {

    vertices: Vector3[];
    indices: number[];
    normals: Vector3[];

    constructor(array: Vector3[], indices: number[], normals: Vector3[]) {
        this.vertices = array;
        this.indices = indices;
        this.normals = normals;
    }

    static async readFromGltf(url: string): Promise<any> {
        let content = await readFromUrl(url);
        let object = JSON.parse(content);
        return object;
    }

    static async extractVector3s(gltf: any, accessorIndex: number): Promise<any[]> {
        const accessor = gltf.accessors[accessorIndex];
        const bufferView = gltf.bufferViews[accessor.bufferView];
        const buffer = gltf.buffers[bufferView.buffer];
        let arrayBuffer = await fetch(buffer.uri)
          .then(response => response.blob())
          .then(blob => new Response(blob).arrayBuffer());
        const slice = arrayBuffer.slice(bufferView.byteOffset, bufferView.byteOffset + bufferView.byteLength);
        const scalars = new Float32Array(slice);
        const vectors = [];
        for (let i = 0; i < scalars.length; i += 3) {
          vectors.push(new Vector3(scalars[i], scalars[i + 1], scalars[i + 2]));
        }
        return vectors;
      }

      static async extractTriangles(gltf: any, accessorIndex: number): Promise<number[]> {
        const accessor = gltf.accessors[accessorIndex];
        const bufferView = gltf.bufferViews[accessor.bufferView];
        const buffer = gltf.buffers[bufferView.buffer];
        let arrayBuffer = await fetch(buffer.uri)
          .then(response => response.blob())
          .then(blob => new Response(blob).arrayBuffer());
        const slice = arrayBuffer.slice(bufferView.byteOffset, bufferView.byteOffset + bufferView.byteLength);
        const scalars = new Uint32Array(slice);
        const vectors = [];
        for (let i = 0; i < scalars.length; i++) {
          vectors.push(scalars[i]);
        }
        return vectors;
      }
}