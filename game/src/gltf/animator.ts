import {Matrix4} from '../matrix';
import {Vector3} from '../vector';
import {Quaternion} from '../quaternion';
import type {ActiveAnimation} from './animation';
import {
  KeyFrame,
  Model,
  Skin,
  Transform
} from './types/model';

const getPreviousAndNextKeyFrame = (keyFrames: KeyFrame[], animationTime: number) => {
  let next = keyFrames[0];
  let previous = keyFrames[0];

  for (let i = 1; i < keyFrames.length; i ++) {
    next = keyFrames[i];
    if (next.time > animationTime) break;

    previous = keyFrames[i];
  }

  return { previous, next };
};

const getTransform = (keyFrames: KeyFrame[], duration: number) => {
  if (keyFrames.length === 1) {
    switch (keyFrames[0].type) {
      case 'translation':
      case 'scale':
        return keyFrames[0].transform as Vector3;
      case 'rotation': {
        return keyFrames[0].transform as Quaternion;
      }
    }
  }

  const animationTime = duration / 1000.0 % keyFrames[keyFrames.length - 1].time;
  const frames = getPreviousAndNextKeyFrame(keyFrames, animationTime);
  const progression = (animationTime - frames.previous.time) / (frames.next.time - frames.previous.time);

  switch(frames.previous.type) {
    case 'translation':
    case 'scale': {
      const result = (frames.previous.transform as Vector3).lerp(
        frames.next.transform as Vector3,
        progression
      );
      return result;
    }
    case 'rotation': {
      const result = (frames.previous.transform as Quaternion).slerp(
        frames.next.transform as Quaternion,
        progression
      );
      return result;
    }
  }
};

interface TransformMatrices {
  [key: number]: Matrix4;
}

const get = (c: Transform, elapsed: number) => {
  const t = c && c.translation.length > 0 ? getTransform(c.translation, elapsed) as Vector3 : Vector3.zero();
  const r = c && c.rotation.length > 0 ? getTransform(c.rotation, elapsed) as Quaternion : Quaternion.identity();
  const s = c && c.scale.length > 0 ? getTransform(c.scale, elapsed) as Vector3 : Vector3.one();
  return { t, r, s };
};

const applyTransform = (model: Model, appliedTransforms: Matrix4[], transforms: TransformMatrices, parentTransform: Matrix4, skin: Skin, nodeIndex: number, inverse: boolean) => {
  const node = model.nodes[nodeIndex];
  const transformIndex = skin.joints.indexOf(node.id);

  let childTransform = parentTransform;

  if (transforms[node.id]) {
    childTransform = parentTransform.multiplyMatrix(transforms[node.id]);
  }

  if (inverse) {
    const ibt = skin.inverseBindTransforms[transformIndex];

    if (ibt) {
      appliedTransforms[transformIndex] = childTransform.multiplyMatrix(ibt);
    }
  } else {
    appliedTransforms[transformIndex] = childTransform;
  }

  node.children.forEach(childNode => {
    applyTransform(model, appliedTransforms, transforms, childTransform, skin, childNode, inverse);
  });
};

/**
 * Blends two animations and returns their transform matrices
 * @param model GLTF Model
 * @param activeAnimations Currently running animations
 * @param blendTime Length of animation blend in milliseconds
 */
const getAnimationTransforms = (model: Model, activeAnimations: Record<string, ActiveAnimation[]>, blendTime = 0) => {
  const transforms: { [key: number]: Matrix4 } = {};

  Object.keys(activeAnimations).forEach(track => {
    activeAnimations[track].forEach(rootAnimation => {
      const blend = -((rootAnimation.elapsed - blendTime) / blendTime);

      Object.keys(model.animations[rootAnimation.key]).forEach(key => {
        let c = parseInt(key);
        const transform = get(model.animations[rootAnimation.key][c], rootAnimation.elapsed);

        activeAnimations[track].forEach(ac => {
          if (rootAnimation.key == ac.key || blend <= 0) return;

          const cTransform = get(model.animations[ac.key][c], ac.elapsed);
          transform.t = transform.t.lerp(cTransform.t, blend);
          transform.r = transform.r.slerp(cTransform.r, blend);
          transform.s = transform.s.lerp(cTransform.s, blend);
        });

        let localTransform = Matrix4.identity();
        const rotTransform = Matrix4.fromQuaternion(transform.r as Quaternion);

        localTransform = localTransform
          .multiplyMatrix(Matrix4.translate(transform.t.x, transform.t.y, transform.t.z))
          .multiplyMatrix(rotTransform)
          .multiplyMatrix(Matrix4.scale(transform.s.x, transform.s.y, transform.s.z));

        transforms[c] = localTransform;
      });
    });
  });

  return transforms;
};

/**
 * Applies transforms to skin
 * @param model GLTF Model
 * @param transforms Raw transforms
 * @param blendTime Use inverse bind transform
 */
const applyToSkin = (model: Model, transforms: { [key: number]: Matrix4 }, inverse = true) => {
  const appliedTransforms: Matrix4[] = [];

  model.skins.forEach(skin => {
    const root = model.rootNode;
    applyTransform(model, appliedTransforms, transforms, Matrix4.identity(), skin, root, inverse);
  });

  return appliedTransforms;
};

export {
  getAnimationTransforms,
  applyToSkin,
};
