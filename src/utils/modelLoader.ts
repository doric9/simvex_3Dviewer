import * as THREE from 'three';
// @ts-ignore
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export function calculateExplodePosition(
  originalPosition: THREE.Vector3,
  centerPosition: THREE.Vector3,
  explodeFactor: number
): THREE.Vector3 {
  const direction = new THREE.Vector3()
    .subVectors(originalPosition, centerPosition)
    .normalize();

  const distance = originalPosition.distanceTo(centerPosition);
  const explodeDistance = distance * explodeFactor * 3; // 분해 거리 계수

  return new THREE.Vector3().addVectors(
    originalPosition,
    direction.multiplyScalar(explodeDistance)
  );
}

export function loadModel(url: string): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf: { scene: THREE.Group }) => resolve(gltf.scene),
      undefined,
      (error: unknown) => reject(error)
    );
  });
}

// Alias for compatibility if needed, or replace usages
export const loadGLBModel = loadModel;

export function getModelCenter(object: THREE.Object3D): THREE.Vector3 {
  const box = new THREE.Box3().setFromObject(object);
  const center = new THREE.Vector3();
  box.getCenter(center);
  return center;
}

export function getModelSize(object: THREE.Object3D): THREE.Vector3 {
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  box.getSize(size);
  return size;
}
