import { useState, useEffect } from 'react';
import { machineryData } from '../../data/machineryData';
import Scene3D from './Scene3D';
import ExplodeSlider from './ExplodeSlider';
import ProductInfo from './ProductInfo';
import PartInfo from './PartInfo';
import Sidebar from './Sidebar';
import { useViewerStore } from '../../stores/viewerStore';

interface ViewerPageProps {
  machineryId: string;
}

export default function ViewerPage({ machineryId }: ViewerPageProps) {
  const machinery = machineryData[machineryId];
  const { selectedPart, explodeFactor, setExplodeFactor, setSelectedPart } = useViewerStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Ensure clean state when entering a device viewer
  useEffect(() => {
    setExplodeFactor(0);
    setSelectedPart(null);
  }, [machineryId, setExplodeFactor, setSelectedPart]);

  if (!machinery) {
    return <div>기계를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="w-full h-full flex">
      {/* 3D Viewer */}
      <div className="flex-1 flex flex-col relative">
        {/* 3D Scene */}
        <div
          id="viewer-canvas"
          className="flex-1 bg-gradient-to-br from-gray-100 to-gray-200"
        >
          <Scene3D machinery={machinery} />
        </div>

        {/* 분해도 슬라이더 */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-96">
          <ExplodeSlider
            value={explodeFactor}
            onChange={setExplodeFactor}
          />
        </div>

        {/* 완제품 정보 패널 */}
        {!selectedPart && (
          <div className="absolute top-4 left-4 max-w-md">
            <ProductInfo key={machinery.id} machinery={machinery} />
          </div>
        )}

        {/* 선택된 부품 정보 */}
        {selectedPart && (
          <div className="absolute top-4 left-4 max-w-md">
            <PartInfo
              part={machinery.parts.find(p => p.name === selectedPart)}
            />
          </div>
        )}
      </div>

      {/* Sidebar */}
      <Sidebar
        machineryId={machineryId}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
    </div>
  );
}

// GestureHint removed in favor of global ControlsHint
