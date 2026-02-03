/**
 * Scene3D Component (Hook 패턴 적용)
 * 
 * 이 컴포넌트는 3D 씬을 렌더링합니다.
 * - Hook을 조합해서 사용
 * - UI 로직만 포함
 * - 설정값은 Hook에서 가져옴
 */

import { Suspense, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Html } from '@react-three/drei';
import { Machinery } from '../../types';
import ModelGroup from './ModelGroup';
import { useViewerStore } from '../../stores/viewerStore';

// Hook Import
import { useSceneSetup } from '../../hooks/useSceneSetup';
import { useOrbitControls } from '../../hooks/useOrbitControls';
import PhysicsWrapper from './PhysicsWrapper';

interface Scene3DProps {
  machinery: Machinery;
}

export default function Scene3D({ machinery }: Scene3DProps) {
  const { physicsEnabled, showGrid } = useViewerStore();

  // 🎣 Hook 1: 씬 설정 (본인)
  const { lightingConfig, environment } = useSceneSetup();

  // 🎣 Hook 2: 카메라 컨트롤 설정 (도영님)
  const { controlsConfig } = useOrbitControls();
  const { resetTrigger } = useViewerStore();
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  }, [resetTrigger]);

  return (
    <Canvas shadows>
      <PerspectiveCamera makeDefault position={[100, 100, 100]} fov={50} />

      {/* 조명 (설정값은 Hook에서) */}
      <ambientLight intensity={lightingConfig.ambient.intensity} />
      <directionalLight
        position={lightingConfig.directional.position as [number, number, number]}
        intensity={lightingConfig.directional.intensity}
        castShadow={lightingConfig.directional.castShadow}
        shadow-mapSize-width={lightingConfig.directional.shadowMapSize.width}
        shadow-mapSize-height={lightingConfig.directional.shadowMapSize.height}
      />
      <pointLight
        position={lightingConfig.point.position as [number, number, number]}
        intensity={lightingConfig.point.intensity}
      />
      <hemisphereLight intensity={lightingConfig.hemisphere.intensity} />

      {/* 환경 */}
      <Environment preset={environment as any} />

      {/* 3D 모델 그룹 */}
      {/* 3D 모델 그룹 */}
      <Suspense fallback={
        <Html center>
          <div className="flex flex-col items-center justify-center p-4 bg-white/80 backdrop-blur rounded-lg shadow-xl min-w-[200px]">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-gray-800 font-semibold">3D 모델 로딩중...</p>
          </div>
        </Html>
      }>
        {/* Physics Wrapper는 조건부로 적용하거나 항상 적용하되 enable prop 제어 */}
        {/* 간단한 구현을 위해 여기서는 PhysicsWrapper를 조건부 렌더링하지 않고 내부적으로 제어하거나 */}
        {/* ModelGroup이 Physics Context 내부에 있어야 하므로 여기서 감쌉니다. */}
        {/* 하지만 기존 로직 유지를 위해 PhysicsWrapper를 새로 만들었으므로 적용합니다. */}
        <PhysicsWrapper debug={physicsEnabled}>
          <ModelGroup machinery={machinery} physicsEnabled={physicsEnabled} />
        </PhysicsWrapper>
      </Suspense>

      {/* 카메라 컨트롤 (설정값은 Hook에서) */}
      <OrbitControls
        ref={controlsRef}
        enableDamping={controlsConfig.enableDamping}
        dampingFactor={controlsConfig.dampingFactor}
        minDistance={controlsConfig.minDistance}
        maxDistance={controlsConfig.maxDistance}
        minPolarAngle={controlsConfig.minPolarAngle}
        maxPolarAngle={controlsConfig.maxPolarAngle}
        enablePan={controlsConfig.enablePan}
        panSpeed={controlsConfig.panSpeed}
        rotateSpeed={controlsConfig.rotateSpeed}
        zoomSpeed={controlsConfig.zoomSpeed}
        autoRotate={controlsConfig.autoRotate}
        autoRotateSpeed={controlsConfig.autoRotateSpeed}
      />

      {/* 그리드 */}
      {showGrid !== false && <gridHelper args={[200, 40, 0x888888, 0xcccccc]} />}
    </Canvas>
  );
}
