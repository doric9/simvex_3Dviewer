import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MousePointer2, Move, ZoomIn } from 'lucide-react';
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
  const { selectedPart, explodeFactor, setExplodeFactor } = useViewerStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showGestureHint, setShowGestureHint] = useState(true);

  const dismissGestureHint = useCallback(() => {
    setShowGestureHint(false);
  }, []);

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
          onPointerDown={dismissGestureHint}
          onWheel={dismissGestureHint}
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
            <ProductInfo machinery={machinery} />
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

      {/* Gesture Hint Overlay */}
      <GestureHint show={showGestureHint} />
    </div>
  );
}

interface GestureHintProps {
  show: boolean;
}

function GestureHint({ show }: GestureHintProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-44 left-6 flex flex-col gap-1 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg text-white text-xs z-50 pointer-events-none"
        >
          <div className="flex items-center gap-2">
            <MousePointer2 className="w-3 h-3 opacity-70" />
            <span>드래그: 회전</span>
          </div>
          <div className="flex items-center gap-2">
            <Move className="w-3 h-3 opacity-70" />
            <span>우클릭: 이동</span>
          </div>
          <div className="flex items-center gap-2">
            <ZoomIn className="w-3 h-3 opacity-70" />
            <span>휠: 확대</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
