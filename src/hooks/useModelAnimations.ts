import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AnimationState {
  isExploding: boolean;
  isRotating: boolean;
  rotationSpeed: number;
}

export function useModelAnimations(explodeFactor: number, selectedPart: string | null) {
  const animationStateRef = useRef<AnimationState>({
    isExploding: false,
    isRotating: false,
    rotationSpeed: 0.01
  });

  useEffect(() => {
    console.log('✅ [useModelAnimations] 애니메이션 시스템 초기화');
    console.log(`   - 분해 계수: ${explodeFactor}`);
    console.log(`   - 선택된 부품: ${selectedPart || '없음'}`);
  }, [explodeFactor, selectedPart]);

  /**
   * 분해 애니메이션 계산 함수
   * @param originalPos - Original logical position (for direction calculation)
   * @param center - Center of all parts (fallback for radial explosion)
   * @param factor - Explosion factor 0-1
   * @param explodeDirection - Optional explicit direction vector
   * @param isGround - If true, part stays fixed
   */
  const calculateExplodePosition = (
    originalPos: THREE.Vector3,
    center: THREE.Vector3,
    factor: number,
    explodeDirection?: [number, number, number],
    isGround?: boolean
  ): THREE.Vector3 => {
    // Ground parts don't move
    if (isGround) {
      return new THREE.Vector3(0, 0, 0);
    }

    let direction: THREE.Vector3;

    if (explodeDirection) {
      // Use explicit direction
      direction = new THREE.Vector3(explodeDirection[0], explodeDirection[1], explodeDirection[2]).normalize();
    } else {
      // Fallback: radial explosion from center
      direction = new THREE.Vector3()
        .subVectors(originalPos, center)
        .normalize();

      // If direction is zero (part at center), default to up
      if (direction.length() === 0) {
        direction.set(0, 1, 0);
      }
    }

    const explodeDistance = factor * 150; // Scale for visibility
    return direction.multiplyScalar(explodeDistance);
  };

  /**
   * 부품 하이라이트 적용
   */
  const applyHighlight = (model: THREE.Object3D, partName: string, selectedPartName: string | null) => {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (partName === selectedPartName) {
          // 선택된 부품: 녹색 하이라이트
          const mat = child.material as THREE.MeshStandardMaterial; // Casting for safety
          if (mat.emissive) {
            mat.emissive.setHex(0x00ff00);
            mat.emissiveIntensity = 0.3;
          }
        } else {
          // 일반 부품: 하이라이트 제거
          const mat = child.material as THREE.MeshStandardMaterial;
          if (mat.emissive) {
            mat.emissive.setHex(0x000000);
            mat.emissiveIntensity = 0;
          }
        }
      }
    });
  };

  /**
   * 자동 회전 토글
   */
  const toggleAutoRotate = () => {
    animationStateRef.current.isRotating = !animationStateRef.current.isRotating;
    console.log(`🔄 자동 회전: ${animationStateRef.current.isRotating ? 'ON' : 'OFF'}`);
  };

  /**
   * 회전 속도 설정
   */
  const setRotationSpeed = (speed: number) => {
    animationStateRef.current.rotationSpeed = speed;
    console.log(`⚡ 회전 속도 변경: ${speed}`);
  };

  return {
    // 애니메이션 계산 함수
    calculateExplodePosition,
    applyHighlight,

    // 컨트롤 함수
    toggleAutoRotate,
    setRotationSpeed,

    // 상태
    animationState: animationStateRef.current
  };
}
