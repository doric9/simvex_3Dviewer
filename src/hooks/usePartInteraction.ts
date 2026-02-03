import { useCallback } from 'react';
import { ThreeEvent } from '@react-three/fiber';

export function usePartInteraction(selectedPart: string | null, setSelectedPart: (part: string | null) => void) {
    /**
     * 부품 클릭 핸들러
     */
    const handlePartClick = useCallback((event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();

        // Raycasting hits specific Meshes, but partName is often stored on the parent Group.
        // We traverse up to find the metadata.
        let target = event.object;
        let partName = target.userData.partName;

        while (!partName && target.parent) {
            target = target.parent;
            partName = target.userData.partName;
        }

        if (partName) {
            // 같은 부품 재클릭 시 선택 해제
            const newSelection = selectedPart === partName ? null : partName;
            setSelectedPart(newSelection);

            console.log(`🖱️ [usePartInteraction] 부품 클릭: ${partName}`);
            console.log(`   선택 상태: ${newSelection ? '선택됨' : '해제됨'}`);
        }
    }, [selectedPart, setSelectedPart]);

    /**
     * 마우스 호버 핸들러 (진입)
     */
    const handlePointerOver = useCallback((event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        document.body.style.cursor = 'pointer';

        let target = event.object;
        let partName = target.userData.partName;

        while (!partName && target.parent) {
            target = target.parent;
            partName = target.userData.partName;
        }

        if (partName) {
            console.log(`👆 [usePartInteraction] 호버: ${partName}`);
        }
    }, []);

    /**
     * 마우스 호버 핸들러 (벗어남)
     */
    const handlePointerOut = useCallback(() => {
        document.body.style.cursor = 'auto';
    }, []);

    /**
     * 모든 선택 해제
     */
    const clearSelection = useCallback(() => {
        setSelectedPart(null);
        console.log('🧹 [usePartInteraction] 모든 선택 해제');
    }, [setSelectedPart]);

    return {
        handlePartClick,
        handlePointerOver,
        handlePointerOut,
        clearSelection
    };
}
