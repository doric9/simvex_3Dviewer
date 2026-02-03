import { useState, useEffect } from 'react';
import { X, Box } from 'lucide-react';
import { MachineryPart } from '../../types';
import { useViewerStore } from '../../stores/viewerStore';

interface PartInfoProps {
  part?: MachineryPart;
}

export default function PartInfo({ part }: PartInfoProps) {
  const { setSelectedPart } = useViewerStore();
  const [isExpanded, setIsExpanded] = useState(true);

  // Auto-expand when a new part is selected
  useEffect(() => {
    if (part) {
      setIsExpanded(true);
    }
  }, [part?.name]);

  if (!part) return null;

  // Collapsed state: minimal badge
  if (!isExpanded) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 bg-primary/90 backdrop-blur-sm rounded-full shadow-lg px-4 py-2 hover:bg-primary transition-colors"
          title="부품 정보 보기"
        >
          <Box className="w-4 h-4 text-white" />
          <span className="text-sm font-medium text-white">{part.name}</span>
        </button>
        <button
          onClick={() => setSelectedPart(null)}
          className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
          title="선택 해제"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    );
  }

  // Expanded state: full panel
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg w-72 overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-primary/5">
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-gray-800">{part.name}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="최소화"
          >
            <span className="w-4 h-4 text-gray-500 text-xs">−</span>
          </button>
          <button
            onClick={() => setSelectedPart(null)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="닫기"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-2">
        {part.material && (
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-semibold text-gray-500 w-16">재질</span>
            <span className="text-sm text-gray-800">{part.material}</span>
          </div>
        )}
        {part.role && (
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-semibold text-gray-500 w-16">역할</span>
            <span className="text-sm text-gray-800">{part.role}</span>
          </div>
        )}
        {part.parent && (
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-semibold text-gray-500 w-16">연결</span>
            <span className="text-sm text-gray-800">{part.parent}</span>
          </div>
        )}
      </div>
    </div>
  );
}
