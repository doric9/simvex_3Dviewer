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
import { CameraControls as DreiCameraControls, PerspectiveCamera, Environment, Html, GizmoHelper, GizmoViewport } from '@react-three/drei';
import type CameraControlsImpl from 'camera-controls';

import { Machinery } from '../../types';
import ModelGroup from './ModelGroup';
import { useViewerStore } from '../../stores/viewerStore';

// Hook Import
import { useSceneSetup } from '../../hooks/useSceneSetup';
import { useOrbitControls } from '../../hooks/useOrbitControls';
import PhysicsWrapper from './PhysicsWrapper';

type CameraControlsRef = CameraControlsImpl | null;

interface Scene3DProps {
  machinery: Machinery;
}

export default function Scene3D({ machinery }: Scene3DProps) {
  const { physicsEnabled, showGrid } = useViewerStore();

  // 🎣 Hook 1: 씬 설정 (본인)
  const { lightingConfig, environment } = useSceneSetup();

  // 🎣 Hook 2: 카메라 컨트롤 설정 (도영님)
  const { controlsConfig } = useOrbitControls();
  const { resetTrigger, cameraPosition, cameraTarget } = useViewerStore();
  const controlsRef = useRef<CameraControlsRef>(null);

  return (
    <Canvas shadows>
      <CameraController
        controlsRef={controlsRef}
        targetPosition={cameraPosition}
        targetLookAt={cameraTarget}
        resetTrigger={resetTrigger ?? 0}
      />
      <KeyboardController controlsRef={controlsRef} />
      <PerspectiveCamera makeDefault position={[100, 100, 100]} fov={50} />

      {/* 네비게이션 기즈모 (UX 개선: 컨트롤 가이드와 겹침 방지를 위해 우측 상단 배치) */}
      <GizmoHelper
        alignment="top-right"
        margin={[100, 100]}
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

      {/* 카메라 컨트롤 (OrbitControls 대신 CameraControls 사용) */}
      {/* 마우스 조작: 왼쪽 드래그=패닝(이동), 우클릭 드래그=회전, 휠=줌 */}
      <DreiCameraControls
        ref={controlsRef}
        minDistance={controlsConfig.minDistance}
        maxDistance={controlsConfig.maxDistance}
        minPolarAngle={controlsConfig.minPolarAngle}
        maxPolarAngle={controlsConfig.maxPolarAngle}
        azimuthRotateSpeed={controlsConfig.rotateSpeed}
        polarRotateSpeed={controlsConfig.rotateSpeed}
        truckSpeed={controlsConfig.panSpeed * 2}
        dollySpeed={controlsConfig.zoomSpeed}
        dollyToCursor={true}
        makeDefault
        // 마우스 버튼 매핑: 좌=이동, 우=회전, 휠=줌
        mouseButtons={{
          left: 2,     // TRUCK (패닝)
          middle: 8,   // DOLLY (줌)
          right: 1,    // ROTATE (회전)
          wheel: 16    // ZOOM (줌) - DOLLY(8) 대신 ZOOM(16) 사용
        }}
      />

      {/* 그리드 */}
      {showGrid !== false && <gridHelper args={[200, 40, 0x888888, 0xcccccc]} />}
    </Canvas>
  );
}

interface CameraControllerProps {
  controlsRef: React.RefObject<CameraControlsRef>;
  targetPosition: [number, number, number] | null;
  targetLookAt: [number, number, number] | null;
  resetTrigger: number;
}

/**
 * 카메라 애니메이션을 제어하는 내부 컴포넌트
 */
function CameraController({ controlsRef, targetPosition, targetLookAt, resetTrigger }: CameraControllerProps) {

  // 카메라 위치/타겟 변경 시 로직
  useEffect(() => {
    if (controlsRef.current && targetPosition && targetLookAt) {
      // CameraControls.setLookAt(px, py, pz, tx, ty, tz, enableTransition)
      controlsRef.current.setLookAt(
        targetPosition[0], targetPosition[1], targetPosition[2],
        targetLookAt[0], targetLookAt[1], targetLookAt[2],
        true // smooth transition
      );
    }
  }, [targetPosition, targetLookAt, controlsRef]);

  // 리셋 트리거 발생 시 로직
  useEffect(() => {
    if (resetTrigger > 0 && controlsRef.current) {
      console.log('🔄 카메라 뷰 리셋 실행');
      controlsRef.current.reset(true);
    }
  }, [resetTrigger, controlsRef]);

  return null;
}

interface KeyboardControllerProps {
  controlsRef: React.RefObject<CameraControlsRef>;
}

/**
 * 키보드 방향키 제어를 위한 컴포넌트
 */
function KeyboardController({ controlsRef }: KeyboardControllerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!controlsRef.current) return;

      // Only handle arrow keys for camera rotation
      const arrowKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
      if (!arrowKeys.includes(e.key)) return;

      // Prevent page scrolling when using arrow keys for camera control
      e.preventDefault();

      const angle = 10 * (Math.PI / 180); // 10 degrees

      switch (e.key) {
        case 'ArrowLeft':
          controlsRef.current.rotate(-angle, 0, true);
          break;
        case 'ArrowRight':
          controlsRef.current.rotate(angle, 0, true);
          break;
        case 'ArrowUp':
          controlsRef.current.rotate(0, -angle, true);
          break;
        case 'ArrowDown':
          controlsRef.current.rotate(0, angle, true);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [controlsRef]);

  return null;
}
