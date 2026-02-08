/**
 * Scene3D Component (Hook 패턴 적용)
 * 
 * 이 컴포넌트는 3D 씬을 렌더링합니다.
 * - Hook을 조합해서 사용
 * - UI 로직만 포함
 * - 설정값은 Hook에서 가져옴
 */

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, Environment, Html, GizmoHelper, GizmoViewport, TrackballControls } from '@react-three/drei';
import { Machinery } from '../../types';
import { ModelGroup_ai } from './ModelGroup_ai';
import { useViewerStore } from '../../stores/viewerStore';

// Hook Import
import { useSceneSetup } from '../../hooks/useSceneSetup';
import PhysicsWrapper from './PhysicsWrapper';

interface Scene3DProps {
  machinery: Machinery;
}

export default function Scene3D({ machinery }: Scene3DProps) {
  const {
    physicsEnabled,
    showGrid,
    explodeFactor,
    selectedPart,
    setSelectedPart,
    cameraPosition,
    cameraTarget
  } = useViewerStore();

  // 🎣 Hook 1: 씬 설정 (본인)
  const { lightingConfig, environment } = useSceneSetup();

  return (
    <Canvas shadows>
      <PerspectiveCamera makeDefault position={cameraPosition as [number, number, number]} fov={50} />

      {/* 네비게이션 기즈모 (UX 개선: 사이드바 겹침 방지를 위해 왼쪽 하단 배치) */}
      <GizmoHelper
        alignment="bottom-left"
        margin={[80, 80]}
      >
        <GizmoViewport axisColors={['#ff3653', '#0adb46', '#2c8fff']} labelColor="white" />
      </GizmoHelper>

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
      <Suspense fallback={
        <Html center>
          <div className="flex flex-col items-center justify-center p-4 bg-white/80 backdrop-blur rounded-lg shadow-xl min-w-[200px]">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-gray-800 font-semibold">3D 모델 로딩중...</p>
          </div>
        </Html>
      }>
        <PhysicsWrapper debug={physicsEnabled}>
          <ModelGroup_ai
            machinery={machinery}
            explodeFactor={explodeFactor}
            selectedPart={selectedPart}
            onPartClick={setSelectedPart}
          />
        </PhysicsWrapper>
      </Suspense>

      {/* 카메라 컨트롤 (TrackballControls: 자유 회전 + 패닝 보장) */}
      <TrackballControls
        makeDefault
        target={cameraTarget as [number, number, number]}
        mouseButtons={{
          LEFT: 2, // PAN
          MIDDLE: 1, // ZOOM
          RIGHT: 0  // ROTATE (Requirement: Right-click Rotate)
        }}
        noRotate={false}
        noZoom={false}
        noPan={false}
        rotateSpeed={3.0}
        zoomSpeed={1.2}
        panSpeed={0.8}
        staticMoving={true}
        dynamicDampingFactor={0.2}
        onChange={(e: any) => {
          // Update store with current camera state for persistence
          const controller = e?.target;
          if (controller && controller.object) {
            const cam = controller.object;
            const target = controller.target;
            // Update store directly to avoid re-renders while interacting
            useViewerStore.getState().setCameraPosition([cam.position.x, cam.position.y, cam.position.z]);
            if (target) {
              useViewerStore.getState().setCameraTarget([target.x, target.y, target.z]);
            }
          }
        }}
      />

      {/* 그리드 */}
      {showGrid !== false && <gridHelper args={[200, 40, 0x888888, 0xcccccc]} />}
    </Canvas >
  );
}
