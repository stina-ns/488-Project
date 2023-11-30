import { Vector3 } from './vector';

/*
 * Creates the terrain.
 */
export class Terrain {
    width: number;
    depth: number;
    heights: number[];
    scale: number;
  
    constructor(width: number, depth: number, heights: number[]) {
      this.width = width;
      this.depth = depth;
      this.heights = heights;
      this.scale = 0.03;
    }
  
    vertexHeight(x: number, z: number) {
      return this.heights[z * this.width + x] * this.scale;
    }
  
    interpolateHeight(x: number, z: number) {
      const floorX = Math.floor(x);
      const floorZ = Math.floor(z);
      const fractionX = x - floorX;
      const fractionZ = z - floorZ;
  
      const nearLeftHeight = this.vertexHeight(floorX, floorZ);
      const nearRightHeight = this.vertexHeight(floorX + 1, floorZ);
      const nearMixHeight = (1 - fractionX) * nearLeftHeight + fractionX * nearRightHeight;
  
      const farLeftHeight = this.vertexHeight(floorX, floorZ + 1);
      const farRightHeight = this.vertexHeight(floorX + 1, floorZ + 1);
      const farMixHeight = (1 - fractionX) * farLeftHeight + fractionX * farRightHeight;
  
      const mixHeight = (1 - fractionZ) * nearMixHeight + fractionZ * farMixHeight;
      return mixHeight;
    }
  
    toTrimesh() {
      const positions = [];
      const normals = [];
      for (let z = 0; z < this.depth; ++z) {
        for (let x = 0; x < this.width; ++x) {
          let y = this.vertexHeight(x, z);
          positions.push(x, y, -z);
  
          let right;
          let up;
          if (x < this.width - 1 && z < this.depth - 1) {
            right = new Vector3(1, this.vertexHeight(x + 1, z) - y, 0);
            up = new Vector3(0, this.vertexHeight(x, z + 1) - y, 1);
          } else {
            right = new Vector3(-1, this.vertexHeight(x - 1, z) - y, 0);
            up = new Vector3(0, this.vertexHeight(x, z - 1) - y, -1);
          }
          const normal = Vector3.crossProduct(up, right);
          normal.normalize();
          normals.push(normal.x, normal.y, normal.z);
        }
      }
  
      const indices: number[] = [];
      for (let z = 0; z < this.depth - 1; ++z) {
        let nextZ = z + 1;
        for (let x = 0; x < this.width - 1; ++x) {
          let nextX = x + 1;
          indices.push(
            z * this.width + x,
            z * this.width + nextX,
            nextZ * this.width + x,
          );
          indices.push(
            z * this.width + nextX,
            nextZ * this.width + nextX,
            nextZ * this.width + x,
          );
        }
      }
  
      return {
        positions,
        normals,
        indices,
      };
    }
  
    toArrays() {
      const heights: number[][] = [];
      for (let x = 0; x < this.width; ++x) {
        let row: number[] = [];
        for (let z = 0; z < this.depth; ++z) {
          row.push(this.vertexHeight(x, z));
        }
        heights.push(row);
      }
      return heights;
    }

    static async imageToTerrain(image: HTMLImageElement): Promise<Terrain> {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
      
        const context = canvas.getContext('2d')!;
        context.drawImage(image, 0, 0, image.width, image.height);
        const pixels = context.getImageData(0, 0, image.width, image.height);
      
        const grays = new Array(image.width * image.height);
        for (let i = 0; i < image.width * image.height; ++i) {
          grays[i] = pixels.data[i * 4];
        }
        return new Terrain(image.width, image.height, grays);
      }
  }