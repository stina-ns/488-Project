import { Matrix4 } from 'src/matrix';
import {Vector3} from 'src/vector';
import {Quaternion} from 'src/quaternion';

export interface Model {
  name: string;
  meshes: Mesh[];
  nodes: Node[];
  rootNode: number;
  animations: Animation;
  skins: Skin[];
}

export interface Node {
  id: number;
  name: string;
  children: number[];
  localBindTransform: Matrix4;
  skin?: number;
  mesh?: number;
}

export interface Skin {
  joints: number[];
  inverseBindTransforms: Matrix4[];
}

export interface Animation {
  [name: string]: Channel;
}

export interface Channel {
  [key: number]: Transform;
}

export interface Transform {
  [key: string]: KeyFrame[];

  translation: KeyFrame[];
  rotation: KeyFrame[];
  scale: KeyFrame[];
}

export interface KeyFrame {
  time: number;
  transform: Vector3 | Quaternion;
  type: 'translation' | 'rotation' | 'scale';
}

export interface GLBuffer {
  buffer: number[];
  count: number;
  type: number;
  size: number;
}

export interface Mesh {
  elementCount: number;
  indices: GLBuffer | null;
  positions: GLBuffer;
  normals: GLBuffer | null;
  tangents: GLBuffer | null;
  texCoord: GLBuffer | null;
  joints: GLBuffer | null;
  weights: GLBuffer | null;
}
