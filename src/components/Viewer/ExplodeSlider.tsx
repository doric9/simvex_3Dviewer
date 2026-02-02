import { Maximize2, Minimize2, RotateCcw, Grid3X3 } from 'lucide-react';
import { useViewerStore } from '../../stores/viewerStore';

interface ExplodeSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export default function ExplodeSlider({ value, onChange }: ExplodeSliderProps) {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4">
      <div className="flex items-center gap-4">
        <Minimize2 className="w-5 h-5 text-gray-600" />
        <div className="flex-1">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
        <Maximize2 className="w-5 h-5 text-gray-600" />
      </div>

      <div className="flex items-center justify-between mt-3 px-2">
        <div className="text-sm text-gray-600">
          분해도: {Math.round(value * 100)}%
        </div>
        <button
          onClick={() => useViewerStore.getState().triggerCameraReset()}
          className="flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 transition-colors"
          title="기본 시점으로 초기화 (분해도 유지)"
        >
          <RotateCcw className="w-3 h-3" />
          <span>뷰 초기화</span>
        </button>
        <button
          onClick={() => {
            const store = useViewerStore.getState();
            store.setShowGrid(!store.showGrid);
          }}
          className="flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 transition-colors"
          title="그리드 보기/숨기기"
        >
          <Grid3X3 className="w-3 h-3" />
          <span>그리드</span>
        </button>
      </div>
    </div>
  );
}
