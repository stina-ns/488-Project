import { FirstPersonCamera } from './first-person-camera';
import { Matrix4 } from './matrix';
import { Quaternion } from './quaternion';
import { ShaderProgram } from './shader-program';
import { Vector3 } from './vector';
import { VertexArray } from './vertex-array';
import { VertexAttributes } from './vertex-attributes';
import { Terrain } from './terrain';

import * as Cannon from 'cannon-es';
import * as gltf from './gltf';

let canvas: HTMLCanvasElement;
// let camera: FirstPersonCamera;
// let camera2: FirstPersonCamera;
let cameras: FirstPersonCamera[];
let clipFromEye: Matrix4;
let shader: ShaderProgram;
let vao: VertexArray;
let attributes: VertexAttributes;
let backgroundColor = new Vector3(0.5, 0.5, 0.8);
let horizontal = 0;
let vertical = 0;
let p1_turn = 0;
let p1_move = 0;
let p1_brake = 0;
let p2_turn = 0;
let p2_move = 0;
let p2_brake = 0;
let lastMillis = 0;
let terrain: Terrain;
let chassisVao: VertexArray;
let chassisVao2: VertexArray;
let wheelVao: VertexArray;
let wheelVao2: VertexArray;
let smallBoatModel: gltf.Model;
let smallBoatModel2: gltf.Model;

// Cannon
let physics: Cannon.World;
let terrainBody: Cannon.Body;
let vehicle1: Cannon.RaycastVehicle;
let vehicle2: Cannon.RaycastVehicle;
let chassisBody1: Cannon.Body;
let chassisBody2: Cannon.Body;

// Physics Creation
function initializePhysics() {
  // Physics
  physics = new Cannon.World({
    gravity: new Cannon.Vec3(0, -9.81, 0),
  });
  physics.broadphase = new Cannon.SAPBroadphase(physics);
  physics.defaultContactMaterial.friction = 0.0;
  
  // Terrain Collider
  const groundMaterial = new Cannon.Material('ground');
  terrainBody = new Cannon.Body({
    type: Cannon.Body.STATIC,
    shape: new Cannon.Heightfield(terrain.toArrays(), {
    elementSize: 1, 
    }),
    position: new Cannon.Vec3(0, 0, 0),
    material: groundMaterial,
  });
  terrainBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  // Add Physics Simulation to Terrain Body
  physics.addBody(terrainBody);
  
  // Car 1 Chassis Body
  let chassisDimensions1 = new Vector3(3.5, 1, 6);
  const chassisShape1 = new Cannon.Box(new Cannon.Vec3(
    chassisDimensions1.x * 0.5,
    chassisDimensions1.y * 0.5,
    chassisDimensions1.z * 0.5,
  ));
  chassisBody1 = new Cannon.Body({
    mass: 250,
    angularDamping: 0.8,
    linearDamping: 0.1,
    position: new Cannon.Vec3(15, 10, -20),
  });
  chassisBody1.addShape(chassisShape1);

  // car 2 chassis body
  let chassisDimensions2 = new Vector3(3.5, 1, 6);
  const chassisShape2 = new Cannon.Box(new Cannon.Vec3(
    chassisDimensions2.x * 0.5,
    chassisDimensions2.y * 0.5,
    chassisDimensions2.z * 0.5,
  ));
  chassisBody2 = new Cannon.Body({
    mass: 250,
    angularDamping: 0.8,
    linearDamping: 0.1,
    position: new Cannon.Vec3(15, 10, -20),
  });
  chassisBody2.addShape(chassisShape2);

  // Add Physics Simulation to Chassis Body
  vehicle1 = new Cannon.RaycastVehicle({
    chassisBody: chassisBody1,
    indexRightAxis: 0,
    indexUpAxis: 1,
    indexForwardAxis: 2,
  });
  vehicle2 = new Cannon.RaycastVehicle({
    chassisBody: chassisBody2,
    indexRightAxis: 0,
    indexUpAxis: 1,
    indexForwardAxis: 2,
  });

  const wheelOptions = {
    radius: 1,
    directionLocal: new Cannon.Vec3(0, -1, 0),
    suspensionStiffness: 30,
    suspensionRestLength: 0.3,
    frictionSlip: 1.4,
    dampingRelaxation: 2.3,
    dampingCompression: 4.4,
    maxSuspensionForce: 100000,
    rollInfluence: 0.00001,
    axleLocal: new Cannon.Vec3(1, 0, 0),
    chassisConnectionPointLocal: new Cannon.Vec3(),
    maxSuspensionTravel: 0.1,
    customSlidingRotationalSpeed: -10,
    useCustomSlidingRotationalSpeed: true,
  };

  const wheelOptions2 = {
    radius: 1,
    directionLocal: new Cannon.Vec3(0, -1, 0),
    suspensionStiffness: 30,
    suspensionRestLength: 0.3,
    frictionSlip: 1.4,
    dampingRelaxation: 2.3,
    dampingCompression: 4.4,
    maxSuspensionForce: 100000,
    rollInfluence: 0.00001,
    axleLocal: new Cannon.Vec3(1, 0, 0),
    chassisConnectionPointLocal: new Cannon.Vec3(),
    maxSuspensionTravel: 0.1,
    customSlidingRotationalSpeed: -10,
    useCustomSlidingRotationalSpeed: true,
  };
  
  // Front left is wheel 0
  wheelOptions.chassisConnectionPointLocal.set(-2.5, 0, -2);
  vehicle1.addWheel(wheelOptions);
  
  // Front right is wheel 1
  wheelOptions.chassisConnectionPointLocal.set(2.5, 0, -2);
  vehicle1.addWheel(wheelOptions);
  
  // Back left is wheel 2
  wheelOptions.chassisConnectionPointLocal.set(-2.5, 0, 2);
  vehicle1.addWheel(wheelOptions);
  
  // Back right is wheel 3
  wheelOptions.chassisConnectionPointLocal.set(2.5, 0, 2);
  vehicle1.addWheel(wheelOptions);
  
  
  vehicle1.addToWorld(physics);

  // vehicle 2

   // Front left is wheel 0
  wheelOptions2.chassisConnectionPointLocal.set(-2.5, 0, -2);
  vehicle2.addWheel(wheelOptions2);
  
  // Front right is wheel 1
  wheelOptions2.chassisConnectionPointLocal.set(2.5, 0, -2);
  vehicle2.addWheel(wheelOptions2);
  
  // Back left is wheel 2
  wheelOptions2.chassisConnectionPointLocal.set(-2.5, 0, 2);
  vehicle2.addWheel(wheelOptions2);
  
  // Back right is wheel 3
  wheelOptions2.chassisConnectionPointLocal.set(2.5, 0, 2);
  vehicle2.addWheel(wheelOptions2);
  
  
  vehicle2.addToWorld(physics);
}

function render() {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(backgroundColor.x, backgroundColor.y, backgroundColor.z, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  for (let i = 0; i < 2; i++) {
    gl.viewport((canvas.width * i) / 2, 0, canvas.width / 2, canvas.height);
    const aspectRatio = (canvas.width / 2) / canvas.height;
    clipFromEye = Matrix4.perspective(45, aspectRatio, 0.1, 1500);
    let eyeFromModel = Matrix4.translate(0, 0, -10);

    shader.bind();
    shader.setUniformMatrix4fv('clipFromEye', clipFromEye.toFloats());
    shader.setUniformMatrix4fv('eyeFromWorld', cameras[i].eyeFromWorld.toFloats());
    shader.setUniformMatrix4fv('worldFromModel', Matrix4.identity().toFloats());
    shader.setUniformMatrix4fv('eyeFromModel', eyeFromModel.toFloats());
    shader.setUniform3f('albedo', 1, 1, 1);
    // shader.setUniform3f('diffuseColor', 1, 1, 1);
    // shader.setUniform1f('ambientFactor', 1);
    // shader.setUniform3f('specularColor', 1, 1, 1);
    // shader.setUniform1f('shininess', 25);
    shader.setUniform1i('skin', 1);
    // shader.setUniform1i('terrain', 1);
    vao.bind();
    vao.drawIndexed(gl.TRIANGLES);
    vao.unbind();

      shader.setUniform1i('skin', 0);


      //shader.setUniform3f('albedo', 1, 0, 0);


      for (let i = 0; i < 4; ++i) {
        const {position, quaternion} = vehicle1.wheelInfos[i].worldTransform;
        const translater = Matrix4.translate(position.x, position.y, position.z);
        const rotater = Matrix4.fromQuaternion(new Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w));
        const transform = translater.multiplyMatrix(rotater);
        shader.setUniformMatrix4fv('worldFromModel', transform.toFloats());
        wheelVao.bind();
        wheelVao.drawIndexed(gl.TRIANGLES);
        wheelVao.unbind();
      }

      {
        const translater = Matrix4.translate(chassisBody1.position.x, chassisBody1.position.y, chassisBody1.position.z);
        const rotater = Matrix4.fromQuaternion(new Quaternion(chassisBody1.quaternion.x, chassisBody1.quaternion.y, chassisBody1.quaternion.z, chassisBody1.quaternion.w));
        const transform = translater.multiplyMatrix(rotater);
        shader.setUniformMatrix4fv('worldFromModel', transform.toFloats());
        chassisVao.bind();
        chassisVao.drawIndexed(gl.TRIANGLES);
        chassisVao.unbind();
      }

      shader.setUniform1i('skin', 2);

      for (let i = 0; i < 4; ++i) {
        const {position, quaternion} = vehicle2.wheelInfos[i].worldTransform;
        const translater = Matrix4.translate(position.x, position.y, position.z);
        const rotater = Matrix4.fromQuaternion(new Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w));
        const transform = translater.multiplyMatrix(rotater);
        shader.setUniformMatrix4fv('worldFromModel', transform.toFloats());
        wheelVao2.bind();
        wheelVao.drawIndexed(gl.TRIANGLES);
        wheelVao2.unbind();
      }

      {
        const translater = Matrix4.translate(chassisBody2.position.x, chassisBody2.position.y, chassisBody2.position.z);
        const rotater = Matrix4.fromQuaternion(new Quaternion(chassisBody2.quaternion.x, chassisBody2.quaternion.y, chassisBody2.quaternion.z, chassisBody2.quaternion.w));
        const transform = translater.multiplyMatrix(rotater);
        shader.setUniformMatrix4fv('worldFromModel', transform.toFloats());
        chassisVao2.bind();
        chassisVao2.drawIndexed(gl.TRIANGLES);
        chassisVao2.unbind();
      }

      shader.unbind();

  }
}

function onResizeWindow() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  const aspectRatio = canvas.width / canvas.height;
  clipFromEye = Matrix4.perspective(45, aspectRatio, 0.1, 1000);
}

async function initialize() {
  canvas = document.getElementById('canvas') as HTMLCanvasElement;
  window.gl = canvas.getContext('webgl2', {alpha: false}) as WebGL2RenderingContext;

  gl.enable(gl.DEPTH_TEST);

  const vertexSource = `
uniform mat4 worldFromModel;
uniform mat4 eyeFromWorld;
uniform mat4 clipFromEye;
uniform mat4 eyeFromModel;

in vec3 position;
in vec3 normal;
in vec2 texPosition;

out vec3 mixNormal;
out vec3 mixPositionEye;
out vec2 mixTexPosition;

void main() {
  gl_Position = clipFromEye * eyeFromWorld * worldFromModel * vec4(position, 1.0);
  gl_PointSize = 3.0;
  mixNormal = (eyeFromWorld * worldFromModel * vec4(normal, 0.0)).xyz;
  mixPositionEye = (eyeFromModel * worldFromModel * vec4(position, 1.0)).xyz;
  mixTexPosition = texPosition;
}
    `;

  const fragmentSource = `
uniform sampler2D skin;
// uniform sampler2D terrain;
uniform vec3 albedo;
uniform vec3 lightPosition;
// uniform vec3 diffuseColor;
// uniform vec3 specularColor;
// uniform float ambientFactor;
// uniform float shininess;

// const vec3 lightDirection = normalize(vec3(1.0, 1.0, 1.0));

in vec3 mixNormal;
in vec3 mixPositionEye;
in vec2 mixTexPosition;

out vec4 fragmentColor;

void main() {
  vec3 normal = normalize(mixNormal);
  
  // Compute diffuse term
  vec3 lightDirection = normalize(lightPosition - mixPositionEye);
  // float litness = max(0.0, dot(normal, lightDirection));
  // vec3 ambient = ambientFactor * albedo * diffuseColor;
  // vec3 diffuse = (1.0 - ambientFactor) * litness * albedo * diffuseColor;

  // // Compute specular term
  // vec3 eyeDirection = normalize(-mixPositionEye);
  // vec3 halfDirection = normalize(eyeDirection + lightDirection);
  // float specularity = pow(max(0.0, dot(halfDirection, normal)), shininess);
  // vec3 specular = specularity * specularColor;

  // vec3 rgb = ambient + diffuse + specular;


  float litness = max(dot(lightDirection, normal), 0.0);
  vec3 rgb = albedo * litness;
  fragmentColor = vec4(rgb, 1.0) * texture(skin, mixTexPosition);
  //fragmentColor = vec4(vec3(mixTexPosition, 1.0) * rgb, 1.0);
}
  `;

  shader = new ShaderProgram(vertexSource, fragmentSource);
  terrain = await initializeTerrain();

  await initializeChassisModel();
  await initializeChassis2Model();
  await initializeWheelModel();
  await initializeWheel2Model();
  await initializeChassis2Model();
  await initializePhysics();

  cameras = [
  new FirstPersonCamera(new Vector3(15, 12, -5), new Vector3(15, 10, -20), new Vector3(0, 1, 0)),
  new FirstPersonCamera(new Vector3(15, 12, -5), new Vector3(15, 10, -20), new Vector3(0, 1, 0))];

  // Event listeners
  window.addEventListener('resize', () => {
    onResizeWindow();
    render();
  });

  window.addEventListener('pointerdown', event => {
    document.body.requestPointerLock();
  });

  window.addEventListener('mousemove', event => {
    if (document.pointerLockElement) {
      render();
    }
  });

  window.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') {
      p2_turn = -1;
    } else if (event.key === 'ArrowLeft') {
      p2_turn = 1;
    } else if (event.key === 'ArrowUp') {
      p2_move = 1;
    } else if (event.key === 'ArrowDown') {
      p2_move = -1;
		} else if (event.key === '0') {
      p2_brake = 1;
    } else if (event.key === 'd') {
      p1_turn = -1;
    } else if (event.key === 'a') {
      p1_turn = 1;
    } else if (event.key === 'w') {
      p1_move = 1;
    } else if (event.key === 's') {
      p1_move = -1;
		} else if (event.key === ' ') {
      p1_brake = 1;
    }
  });

  window.addEventListener('keyup', event => {
		if (event.key === 'ArrowUp') {
      p2_move = 0;
    } else if (event.key === 'ArrowDown') {
      p2_move = 0;
    } else if (event.key === 'ArrowLeft') {
      p2_turn = 0;
    } else if (event.key === 'ArrowRight') {
      p2_turn = 0;
    } else if (event.key === '0') {
      p2_brake = 0;
		} else if (event.key === 'w') {
      p1_move = 0;
    } else if (event.key === 's') {
      p1_move = 0;
    } else if (event.key === 'a') {
      p1_turn = 0;
    } else if (event.key === 'd') {
      p1_turn = 0;
    } else if (event.key === ' ') {
      p1_brake = 0;
		}
  });

  onResizeWindow();
  animate();
}

function animate() {
  let currentMillis = performance.now();
  let elapsedMillis = currentMillis - lastMillis;

  physics.fixedStep();
  
  // Third Person Camera Setup
  let back = new Cannon.Vec3(0, 0, 20);
  back = chassisBody1.quaternion.vmult(back);
  back.y = 6;
  const from = chassisBody1.position.vadd(back);
  cameras[0] = new FirstPersonCamera(
    new Vector3(from.x, from.y, from.z),
    new Vector3(chassisBody1.position.x, chassisBody1.position.y, chassisBody1.position.z),
    new Vector3(0, 1, 0)
  );

  let back2 = new Cannon.Vec3(0, 0, 20);
  back2 = chassisBody2.quaternion.vmult(back2);
  back2.y = 6;
  const from2 = chassisBody2.position.vadd(back2);
  cameras[1] = new FirstPersonCamera(
    new Vector3(from2.x, from2.y, from2.z),
    new Vector3(chassisBody2.position.x, chassisBody2.position.y, chassisBody2.position.z),
    new Vector3(0, 1, 0)
  );
  
  vehicle1.applyEngineForce(1000 * p1_move, 2);
  vehicle1.applyEngineForce(1000 * p1_move, 3);
  vehicle1.setSteeringValue(0.5 * p1_turn, 0);
  vehicle1.setSteeringValue(0.5 * p1_turn, 1);
  vehicle1.setBrake(100000 * p1_brake, 0);
  vehicle1.setBrake(100000 * p1_brake, 1);
  vehicle1.setBrake(100000 * p1_brake, 2);
  vehicle1.setBrake(100000 * p1_brake, 3);

  vehicle2.applyEngineForce(1000 * p2_move, 2);
  vehicle2.applyEngineForce(1000 * p2_move, 3);
  vehicle2.setSteeringValue(0.5 * p2_turn, 0);
  vehicle2.setSteeringValue(0.5 * p2_turn, 1);
  vehicle2.setBrake(100000 * p2_brake, 0);
  vehicle2.setBrake(100000 * p2_brake, 1);
  vehicle2.setBrake(100000 * p2_brake, 2);
  vehicle2.setBrake(100000 * p2_brake, 3);
  render();
  lastMillis = currentMillis;
  requestAnimationFrame(animate);
}

async function readImage(url: string) {
  const image = new Image();
  image.src = url;
  await image.decode();
  return image;
}

async function initializeTerrain() {
  // Add Textures
  let ocean = await readImage('grandline.png');
  createTexture2d(ocean, gl.TEXTURE1);
  gl.activeTexture(gl.TEXTURE1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, ocean);

  // Generate Heightmap
  const image = await readImage('track.png');
  terrain = await Terrain.imageToTerrain(image);

  const mesh = terrain.toTrimesh();
  const attributes = new VertexAttributes();
  attributes.addAttribute('position', terrain.width * terrain.depth, 3, mesh.positions);
  attributes.addAttribute('normal', terrain.width * terrain.depth, 3, mesh.normals);
  attributes.addIndices(mesh.indices);
  vao = new VertexArray(shader, attributes);

  return terrain;
}

async function initializeWheelModel() {
  const model = await gltf.readModel('wheel.gltf');
  wheelVao = modelToVertexArray(model);
}

async function initializeChassisModel() {
  smallBoatModel = await gltf.readModel('bg_small_boat_player_1_blue.gltf'); // texCoords in model for textures
  chassisVao = modelToVertexArray(smallBoatModel);
  const texture = await readImage('player_1_texture.png');
  createTexture2d(texture, gl.TEXTURE0);
  gl.activeTexture(gl.TEXTURE0);
}

async function initializeWheel2Model() {
  const model = await gltf.readModel('wheel.gltf');
  wheelVao2 = modelToVertexArray(model);
}

async function initializeChassis2Model() {
  smallBoatModel2 = await gltf.readModel('bg_small_boat_player_1_blue.gltf'); // texCoords in model for textures
  chassisVao2 = modelToVertexArray(smallBoatModel);
  const texture = await readImage('player_2_texture.png');
  createTexture2d(texture, gl.TEXTURE2);
  gl.activeTexture(gl.TEXTURE2);
}

function modelToVertexArray(model: gltf.Model) {
  const mesh = model.meshes[0];
  const attributes = new VertexAttributes();
  attributes.addAttribute('position', mesh.positions.count, mesh.positions.size, mesh.positions.buffer);
  attributes.addAttribute('normal', mesh.normals!.count, mesh.normals!.size, mesh.normals!.buffer);
  attributes.addAttribute('texPosition', mesh.texCoord!.count, mesh.texCoord!.size, mesh.texCoord!.buffer);
  console.log(mesh.texCoord);
  attributes.addIndices(mesh.indices!.buffer);
  return new VertexArray(shader, attributes);
}

function createTexture2d(image: any, textureUnit: any= gl.TEXTURE0) {
  gl.activeTexture(textureUnit);
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.generateMipmap(gl.TEXTURE_2D);
  return texture;
}

function pointToAngle(x: number, y: number): number {
    const angleInRadians = Math.atan2(y, x);
    let angleInDegrees = angleInRadians * (180 / Math.PI);
    angleInDegrees = angleInDegrees >= 0 ? angleInDegrees : 360 + angleInDegrees;
    return angleInDegrees
}

window.addEventListener('load', () => initialize());
