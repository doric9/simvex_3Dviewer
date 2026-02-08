// src/utils/mateTransform.ts
// Mate Transform Calculator - Face-to-Face Alignment

import * as THREE from 'three';
import type { MateConstraint, Face, MateTransformResult } from '../types/assembly';

/**
 * MateTransformCalculator
 * Mate 제약에 따라 Part B의 변환(이동/회전) 계산
 */
export class MateTransformCalculator {
  /**
   * Coincident Mate (면-면 일치)
   * Part B를 이동/회전하여 Face B가 Face A와 정확히 일치하도록 함
   */
  public calculateCoincidentMate(
    faceA: Face,
    faceB: Face,
    flip: boolean = false,
    offset: number = 0
  ): MateTransformResult {
    try {
      // 1. 법선 벡터
      const normalA = new THREE.Vector3(...faceA.normal);
      const normalB = new THREE.Vector3(...faceB.normal);

      // 2. 목표 법선 (Face A의 반대 방향, 또는 flip 옵션에 따라)
      const targetNormal = flip
        ? normalA.clone()
        : normalA.clone().negate();

      // 3. 회전 계산 (normalB → targetNormal)
      const quaternion = new THREE.Quaternion();
      quaternion.setFromUnitVectors(normalB, targetNormal);

      // 4. 중심점
      const centerA = new THREE.Vector3(...faceA.center);
      const centerB = new THREE.Vector3(...faceB.center);

      // 5. centerB를 회전시킨 후의 위치
      const rotatedCenterB = centerB.clone().applyQuaternion(quaternion);

      // 6. 이동 벡터 계산
      // Part B의 원점(0,0,0)이 어디로 이동해야 하는지 계산
      const translation = centerA.clone().sub(rotatedCenterB);

      // 7. Offset 적용 (법선 방향으로 간격)
      if (offset !== 0) {
        const offsetVector = targetNormal.clone().multiplyScalar(offset);
        translation.add(offsetVector);
      }

      return {
        position: [translation.x, translation.y, translation.z],
        rotation: [quaternion.x, quaternion.y, quaternion.z, quaternion.w],
        success: true
      };
    } catch (error) {
      return {
        position: [0, 0, 0],
        rotation: [0, 0, 0, 1],
        success: false,
        error: `Coincident mate calculation failed: ${error}`
      };
    }
  }

  /**
   * Parallel Mate (평행)
   * 두 면의 법선이 평행하도록 회전만 수행
   */
  public calculateParallelMate(
    faceA: Face,
    faceB: Face,
    sameDirection: boolean = true
  ): MateTransformResult {
    try {
      const normalA = new THREE.Vector3(...faceA.normal);
      const normalB = new THREE.Vector3(...faceB.normal);

      const targetNormal = sameDirection
        ? normalA.clone()
        : normalA.clone().negate();

      const quaternion = new THREE.Quaternion();
      quaternion.setFromUnitVectors(normalB, targetNormal);

      return {
        position: [0, 0, 0],  // 평행 제약은 회전만
        rotation: [quaternion.x, quaternion.y, quaternion.z, quaternion.w],
        success: true
      };
    } catch (error) {
      return {
        position: [0, 0, 0],
        rotation: [0, 0, 0, 1],
        success: false,
        error: `Parallel mate calculation failed: ${error}`
      };
    }
  }

  /**
   * Perpendicular Mate (수직)
   * 두 면의 법선이 수직이 되도록 회전
   */
  public calculatePerpendicularMate(
    faceA: Face,
    faceB: Face
  ): MateTransformResult {
    try {
      const normalA = new THREE.Vector3(...faceA.normal);
      const normalB = new THREE.Vector3(...faceB.normal);

      // normalB가 normalA와 수직이 되도록 회전
      // 목표: normalB · normalA = 0

      // 간단한 구현: normalA에 수직인 벡터 중 하나 선택
      const perpendicular = new THREE.Vector3();
      if (Math.abs(normalA.x) < 0.9) {
        perpendicular.set(1, 0, 0);
      } else {
        perpendicular.set(0, 1, 0);
      }

      // Gram-Schmidt 직교화
      const projected = normalA.clone().multiplyScalar(perpendicular.dot(normalA));
      const targetNormal = perpendicular.clone().sub(projected).normalize();

      const quaternion = new THREE.Quaternion();
      quaternion.setFromUnitVectors(normalB, targetNormal);

      return {
        position: [0, 0, 0],
        rotation: [quaternion.x, quaternion.y, quaternion.z, quaternion.w],
        success: true
      };
    } catch (error) {
      return {
        position: [0, 0, 0],
        rotation: [0, 0, 0, 1],
        success: false,
        error: `Perpendicular mate calculation failed: ${error}`
      };
    }
  }

  /**
   * Concentric Mate (동축)
   * 원통형 면의 축을 일치시킴 (Phase 2)
   */
  public calculateConcentricMate(
    _faceA: Face,
    _faceB: Face
  ): MateTransformResult {
    // TODO: 원통형 면 처리 구현 예정
    return {
      position: [0, 0, 0],
      rotation: [0, 0, 0, 1],
      success: false,
      error: 'Concentric mate not implemented yet'
    };
  }

  /**
   * Distance Mate (거리 제약)
   * 두 면 사이의 거리를 지정된 값으로 유지
   */
  public calculateDistanceMate(
    faceA: Face,
    faceB: Face,
    distance: number
  ): MateTransformResult {
    // Coincident와 동일하지만 offset 적용
    return this.calculateCoincidentMate(faceA, faceB, false, distance);
  }

  /**
   * Mate Constraint에 따른 변환 계산 (통합 함수)
   */
  public calculateMateTransform(
    mate: MateConstraint,
    faceA: Face,
    faceB: Face
  ): MateTransformResult {
    switch (mate.type) {
      case 'coincident':
        return this.calculateCoincidentMate(
          faceA,
          faceB,
          mate.flip,
          mate.offset || 0
        );

      case 'parallel':
        return this.calculateParallelMate(faceA, faceB);

      case 'perpendicular':
        return this.calculatePerpendicularMate(faceA, faceB);

      case 'concentric':
        return this.calculateConcentricMate(faceA, faceB);

      case 'distance':
        return this.calculateDistanceMate(
          faceA,
          faceB,
          mate.offset || 0
        );

      default:
        return {
          position: [0, 0, 0],
          rotation: [0, 0, 0, 1],
          success: false,
          error: `Unknown mate type: ${mate.type}`
        };
    }
  }

  /**
   * 변환 적용 (Three.js Object3D에 직접 적용)
   */
  public applyTransform(
    object: THREE.Object3D,
    transform: MateTransformResult
  ): void {
    if (!transform.success) {
      console.error('[MateTransform] Cannot apply failed transform');
      return;
    }

    // 위치 설정
    object.position.set(...transform.position);

    // 회전 설정
    const quaternion = new THREE.Quaternion(...transform.rotation);
    object.quaternion.copy(quaternion);

    // 행렬 업데이트
    object.updateMatrix();
    object.updateMatrixWorld(true);
  }

  /**
   * 변환 결과 디버그 출력
   */
  public printTransform(transform: MateTransformResult, label: string = ''): void {
    console.log(`${label} Transform:`);
    console.log(`  Position: [${transform.position.map(p => p.toFixed(2)).join(', ')}]`);
    console.log(`  Rotation: [${transform.rotation.map(r => r.toFixed(3)).join(', ')}]`);
    console.log(`  Success: ${transform.success}`);
    if (transform.error) {
      console.log(`  Error: ${transform.error}`);
    }
  }
}

/**
 * 헬퍼 함수들
 */

/**
 * Quaternion을 Euler 각도로 변환 (디버그용)
 */
export function quaternionToEuler(
  quaternion: [number, number, number, number]
): { x: number; y: number; z: number } {
  const quat = new THREE.Quaternion(...quaternion);
  const euler = new THREE.Euler().setFromQuaternion(quat);
  return {
    x: (euler.x * 180) / Math.PI,
    y: (euler.y * 180) / Math.PI,
    z: (euler.z * 180) / Math.PI
  };
}

/**
 * 두 변환 합성 (Transform A 후 Transform B)
 */
export function composeTransforms(
  transformA: MateTransformResult,
  transformB: MateTransformResult
): MateTransformResult {
  if (!transformA.success || !transformB.success) {
    return {
      position: [0, 0, 0],
      rotation: [0, 0, 0, 1],
      success: false,
      error: 'Cannot compose failed transforms'
    };
  }

  const posA = new THREE.Vector3(...transformA.position);
  const posB = new THREE.Vector3(...transformB.position);
  const quatA = new THREE.Quaternion(...transformA.rotation);
  const quatB = new THREE.Quaternion(...transformB.rotation);

  // 합성된 회전
  const quatComposed = quatA.clone().multiply(quatB);

  // 합성된 이동
  const posBRotated = posB.clone().applyQuaternion(quatA);
  const posComposed = posA.clone().add(posBRotated);

  return {
    position: [posComposed.x, posComposed.y, posComposed.z],
    rotation: [quatComposed.x, quatComposed.y, quatComposed.z, quatComposed.w],
    success: true
  };
}

/**
 * 변환 역산 (Inverse Transform)
 */
export function inverseTransform(
  transform: MateTransformResult
): MateTransformResult {
  if (!transform.success) {
    return transform;
  }

  const pos = new THREE.Vector3(...transform.position);
  const quat = new THREE.Quaternion(...transform.rotation);

  // 역 회전
  const quatInv = quat.clone().invert();

  // 역 이동
  const posInv = pos.clone().negate().applyQuaternion(quatInv);

  return {
    position: [posInv.x, posInv.y, posInv.z],
    rotation: [quatInv.x, quatInv.y, quatInv.z, quatInv.w],
    success: true
  };
}

/**
 * 싱글톤 인스턴스
 */
export const mateTransformCalculator = new MateTransformCalculator();
