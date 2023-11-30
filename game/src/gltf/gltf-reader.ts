import * as gltf from './types/gltf';
import { Matrix4 } from '../matrix';
import {Quaternion} from '../quaternion';
import {Vector3} from '../vector';

import {
  Animation,
  Channel,
  GLBuffer,
  KeyFrame,
  Mesh,
  Model,
  Node,
  Skin,
} from './types/model';

type GLContext = WebGL2RenderingContext;

interface StringToNumber {
  [key: string]: number;
}

const accessorSizes: StringToNumber = {
  'SCALAR': 1,
  'VEC2': 2,
  'VEC3': 3,
  'VEC4': 4,
  'MAT2': 4,
  'MAT3': 9,
  'MAT4': 16
};

export interface Buffer {
  data: Float32Array | Uint16Array;
  size: number;
  type: string;
  componentType: BufferType;
}

export enum BufferType {
  UnsignedByte = 5121,
  Short = 5123,
  Int = 5125,
  Float = 5126,
}

async function readExternalBuffer(path: string, buffer: string) {
  const directory = path.split('/').slice(0, -1).join('/');
  const response = await fetch(`${directory}/${buffer}`);
  return await response.arrayBuffer();
}

async function getTexture(gl: GLContext, uri: string) {
  return new Promise<WebGLTexture>(resolve => {
    const img = new Image();
    img.onload = () => {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      const ext = gl.getExtension('EXT_texture_filter_anisotropic');
      if (ext) {
        const max = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
        gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, max);
      }

      gl.generateMipmap(gl.TEXTURE_2D);
      resolve(texture!);
    }
    img.src = uri;
    img.crossOrigin = 'undefined';
  });
}

function extractBuffer(gltf: gltf.Root, buffers: ArrayBuffer[], accessor: gltf.Accessor) {
  const bufferView = gltf.bufferViews![accessor.bufferView as number];
  const size = accessorSizes[accessor.type];
  const componentType = accessor.componentType as BufferType;
  const type = accessor.type;

  let data;
  if (componentType == BufferType.Float) {
    data = new Float32Array(buffers[bufferView.buffer], (accessor.byteOffset || 0) + (bufferView.byteOffset || 0), accessor.count * size)
  } else if (componentType == BufferType.Int) {
    data = new Uint32Array(buffers[bufferView.buffer], (accessor.byteOffset || 0) + (bufferView.byteOffset || 0), accessor.count * size);
  } else if (componentType == BufferType.Short) {
    data = new Uint16Array(buffers[bufferView.buffer], (accessor.byteOffset || 0) + (bufferView.byteOffset || 0), accessor.count * size);
  } else if (componentType == BufferType.UnsignedByte) {
    data = new Uint8Array(buffers[bufferView.buffer], (accessor.byteOffset || 0) + (bufferView.byteOffset || 0), accessor.count * size);
  } else {
    throw `unknown component type ${componentType}`;
  }

  return {
    size,
    data,
    type,
    componentType,
  } as Buffer;
}

function getAccessor(gltf: gltf.Root, mesh: gltf.Mesh, attributeName: string) {
  const attribute = mesh.primitives[0].attributes[attributeName];
  return gltf.accessors![attribute];
}

function extractNamedBuffer(gltf: gltf.Root, buffers: ArrayBuffer[], mesh: gltf.Mesh, name: string) {
  if (mesh.primitives[0].attributes[name] === undefined) {
    return null;
  }

  const accessor = getAccessor(gltf, mesh, name);
  const bufferData = extractBuffer(gltf, buffers, accessor);

  return {
    buffer: Array.from(bufferData.data),
    size: bufferData.size,
    type: bufferData.componentType,
    count: bufferData.data.length / bufferData.size,
  } as GLBuffer;
}

function loadNodes(index: number, node: gltf.Node): Node {
  let transform;

  if (node.matrix) {
    transform = Matrix4.fromElements(node.matrix);
  } else {
    transform = Matrix4.identity();

    if (node.scale) {
      transform = Matrix4.scale(node.scale[0], node.scale[1], node.scale[2]);
    }

    if (node.rotation) {
      transform = Matrix4.fromQuaternion(Quaternion.fromElements(node.rotation[0], node.rotation[1], node.rotation[2], node.rotation[3])).multiplyMatrix(transform);
    }

    if (node.translation) {
      transform = Matrix4.translate(node.translation[0], node.translation[1], node.translation[2]).multiplyMatrix(transform);
    }
  }

  return {
    id: index,
    name: node.name,
    children: node.children || [],
    localBindTransform: transform,
    animatedTransform: Matrix4.identity(),
    skin: node.skin,
    mesh: node.mesh
  } as Node;
}

function loadAnimation(gltf: gltf.Root, animation: gltf.Animation, buffers: ArrayBuffer[]) {
  const channels = animation.channels.map(c => {
    const sampler = animation.samplers[c.sampler];
    const time = extractBuffer(gltf, buffers, gltf.accessors![sampler.input]);
    const buffer = extractBuffer(gltf, buffers, gltf.accessors![sampler.output]);

    return {
      node: c.target.node,
      type: c.target.path,
      time,
      buffer,
      interpolation: sampler.interpolation ? sampler.interpolation : 'LINEAR',
    };
  });

  const c: Channel = {};
  channels.forEach((channel) => {
    if (c[channel.node!] === undefined) {
      c[channel.node!] = {
        translation: [],
        rotation: [],
        scale: [],
      };
    }

    for (let i = 0; i < channel.time.data.length; i ++) {
      const size = channel.interpolation === 'CUBICSPLINE' ? channel.buffer.size * 3 : channel.buffer.size;
      const offset = channel.interpolation === 'CUBICSPLINE' ? channel.buffer.size : 0;

      const transform = channel.type === 'rotation'
        ? new Quaternion(
            channel.buffer.data[i * size + offset],
            channel.buffer.data[i * size + offset + 1],
            channel.buffer.data[i * size + offset + 2],
            channel.buffer.data[i * size + offset + 3]
          )
        : new Vector3(
          channel.buffer.data[i * size + offset],
          channel.buffer.data[i * size + offset + 1],
          channel.buffer.data[i * size + offset + 2]
        );

      c[channel.node!][channel.type].push({
        time: channel.time.data[i],
        transform: transform,
        type: channel.type,
      } as KeyFrame)
    }
  });

  return c;
}

function loadMesh(gltf: gltf.Root, mesh: gltf.Mesh, buffers: ArrayBuffer[]) {
  let indices: {buffer: number[], count: number} | null = null;

  if (mesh.primitives[0].indices) {
    const indexAccessor = gltf.accessors![mesh.primitives[0].indices!];
    const indexBuffer = extractBuffer(gltf, buffers, indexAccessor);
    indices = {
      buffer: Array.from(indexBuffer.data),
      count: indexBuffer.data.length,
    };
  }

  return {
    indices,
    positions: extractNamedBuffer(gltf, buffers, mesh, 'POSITION'),
    normals: extractNamedBuffer(gltf, buffers, mesh, 'NORMAL'),
    tangents: extractNamedBuffer(gltf, buffers, mesh, 'TANGENT'),
    texCoord: extractNamedBuffer(gltf, buffers, mesh, 'TEXCOORD_0'),
    joints: extractNamedBuffer(gltf, buffers, mesh, 'JOINTS_0'),
    weights: extractNamedBuffer(gltf, buffers, mesh, 'WEIGHTS_0'),
  } as Mesh;
}

/**
 * Loads a GLTF model and its assets.
 * @param url URL at which model resides
 */
export async function readModel(url: string) {
  const response = await fetch(url);
  const gltf = await response.json() as gltf.Root;

  const bufferPromises = gltf.buffers!.map(buffer => readExternalBuffer(url, buffer.uri!));
  const buffers = await Promise.all(bufferPromises);

  const sceneIndex = gltf.scene || 0;
  const scene = gltf.scenes![sceneIndex];
  const meshes = gltf.meshes!.map(mesh => loadMesh(gltf, mesh, buffers));

  const rootNode = scene.nodes![0];
  const nodes = gltf.nodes!.map((node, i) => loadNodes(i, node));

  const animations = {} as Animation;
  if (gltf.animations) {
    for (let animation of gltf.animations) {
      animations[animation.name] = loadAnimation(gltf, animation, buffers);
    }
  }

  let skins: Skin[];
  if (gltf.skins) {
    skins = gltf.skins.map(skin => {
      const bindTransforms = extractBuffer(gltf, buffers, gltf.accessors![skin.inverseBindMatrices!]);
      const inverseBindTransforms = skin.joints.map((_, i) => {
        return Matrix4.fromBuffer(bindTransforms.data.slice(i * 16, i * 16 + 16))
      });
      return {
        joints: skin.joints,
        inverseBindTransforms,
      };
    });
  } else {
    skins = [];
  }

  // Use last component as name.
  const pathComponents = url.split('/');
  const name = pathComponents[pathComponents.length - 1];

  return {
    name,
    meshes,
    nodes,
    rootNode,
    animations,
    skins,
  } as Model;
}
