import { useEffect } from 'react';
import { useViewerStore } from '../stores/viewerStore';

/**
 * CameraControls configuration for @react-three/drei
 */
export interface CameraControlsConfig {
    minDistance: number;
    maxDistance: number;
    minPolarAngle: number;
    maxPolarAngle: number;
    rotateSpeed: number;
    panSpeed: number;
    zoomSpeed: number;
}

export function useOrbitControls() {
    const { triggerCameraReset } = useViewerStore();

    useEffect(() => {
        console.log('✅ [useOrbitControls] 카메라 컨트롤 초기화');

        return () => {
            console.log('🧹 [useOrbitControls] 정리 완료');
        };
    }, []);

    return {
        // CameraControls-compatible configuration
        controlsConfig: {
            minDistance: 10,
            maxDistance: 500,
            minPolarAngle: 0,
            maxPolarAngle: Math.PI, // Allow full spherical rotation (0 to 180 degrees)
            rotateSpeed: 1.0,
            panSpeed: 1.2,
            zoomSpeed: 1.2,
        } as CameraControlsConfig,
        // 컨트롤 함수들
        resetCamera: () => {
            console.log('🔄 카메라 리셋 호출');
            triggerCameraReset();
        },
        focusOnPart: (partName: string) => {
            console.log(`🎯 부품에 포커스: ${partName}`);
            // TODO: Implement logic to update camera target based on part position
        }
    };
}
