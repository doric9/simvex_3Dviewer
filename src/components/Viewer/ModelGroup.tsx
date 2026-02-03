/**
 * ModelGroup Component (Hook 패턴 적용)
 * 
 * 이 컴포넌트는 3D 모델 그룹을 렌더링합니다.
 * - Hook을 조합해서 사용
 * - UI 로직만 포함
 * - Three.js 로직은 모두 Hook으로 분리
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Machinery } from '../../types';
import { useViewerStore } from '../../stores/viewerStore';

// Hook Import
import { useModelLoader } from '../../hooks/useModelLoader';
import { useModelAnimations } from '../../hooks/useModelAnimations';
import { usePartInteraction } from '../../hooks/usePartInteraction';

interface ModelGroupProps {
  machinery: Machinery;
  physicsEnabled: boolean;
}

export default function ModelGroup({ machinery, physicsEnabled }: ModelGroupProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Zustand Store
  const { explodeFactor, selectedPart, setSelectedPart } = useViewerStore();

  // 🎣 Hook 1: 모델 로딩 (공통)
  const { models, originalPositions, isLoading, error } = useModelLoader(machinery);

  // 🎣 Hook 2: 애니메이션 (상진님)
  const {
    calculateExplodePosition,
    applyHighlight
  } = useModelAnimations(explodeFactor, selectedPart);

  // 🎣 Hook 3: 인터랙션 (공통)
  const {
    handlePartClick,
    handlePointerOver,
    handlePointerOut
  } = usePartInteraction(selectedPart, setSelectedPart);

  // Calculate center for explosion animation (once positions are loaded)
  const center = useMemo(() => {
    if (originalPositions.size === 0) return new THREE.Vector3(0, 0, 0);

    const sum = new THREE.Vector3();
    let count = 0;

    originalPositions.forEach((pos) => {
      sum.add(pos);
      count++;
    });

    if (count === 0) return new THREE.Vector3(0, 0, 0);
    return sum.divideScalar(count);
  }, [originalPositions]);

  // 프레임마다 실행되는 애니메이션 루프
  useFrame(() => {
    if (!groupRef.current) return;

    models.forEach((model, partName) => {
      const originalPos = originalPositions.get(partName);
      if (!originalPos) return;

      // Find part metadata for explosion properties
      const partData = machinery.parts.find(p => p.name === partName);
      const explodeDirection = partData?.explodeDirection;
      const isGround = partData?.isGround;

      // 분해 애니메이션 적용
      const targetPos = calculateExplodePosition(originalPos, center, explodeFactor, explodeDirection, isGround);
      model.position.lerp(targetPos, 0.1);

      // 하이라이트 적용
      applyHighlight(model, partName, selectedPart);
    });
  });

  // 로딩 중
  if (isLoading) {
    return null;
  }

  // 에러 발생
  if (error) {
    console.error('모델 로딩 에러:', error);
    return null;
  }

  // Physics Hooks (only if enabled)
  // Note: In a real implementation with @react-three/cannon, we would map over the models and create a PhysicsPart component for each.
  // For this MVP step, we will use a simple wrapper loop or just render the primitives.
  // To strictly follow hooks rules, we can't conditionally call useBox inside a loop in this component if the loop length changes.
  // However, since 'models' is a map that might change size, using useBox in a sub-component is the correct pattern.

  // 렌더링
  return (
    <group ref={groupRef}>
      {Array.from(models.entries()).map(([partName, model]) => (
        <PhysicsPart
          key={partName}
          partName={partName}
          model={model}
          originalPos={originalPositions.get(partName) || new THREE.Vector3()}
          machinery={machinery}
          physicsEnabled={physicsEnabled}
          // Pass handlers
          onClick={handlePartClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        />
      ))}
    </group>
  );
}

// Sub-component to safely use physics hooks for each part
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function PhysicsPart({ model, physicsEnabled, onClick, onPointerOver, onPointerOut }: any) {
  // Only use physics hook if visualization is physics-enabled. 
  // BUT we cannot conditionally call hooks. 
  // We must rely on the PhysicsWrapper to handle the simulation context, but useBox MUST run.
  // If physicsEnabled is false, useBox might throw if not inside <Physics>.
  // So we need two different components or a robust way to handle it.

  // Simplest approach for this MVP Refactor:
  // If physicsEnabled is off, just render the primitive.
  // If on, use a component that calls useBox.

  if (!physicsEnabled) {
    return (
      <primitive
        object={model}
        onClick={onClick}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
      />
    );
  }

  return <PhysicsPartBody model={model} onClick={onClick} onPointerOver={onPointerOver} onPointerOut={onPointerOut} />;
}

import { useBox } from '@react-three/cannon';

function PhysicsPartBody({ model, onClick, onPointerOver, onPointerOut }: any) {
  // Basic box shape for all parts for now to enable collision
  // Mass 1 makes it dynamic (falls). Mass 0 would be static.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [ref] = useBox(() => ({ mass: 1, position: [model.position.x, model.position.y, model.position.z] }));

  // Sync React Three Fiber model with Physics body
  // We clone the model to avoid mutating the original shared resource improperly if needed, 
  // but here we just attach the primitive to the ref.
  return (
    <primitive
      ref={ref}
      object={model}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    />
  );
}
