import { ArrowLeft, Network } from 'lucide-react';
import { machineryData } from '../../data/machineryData';

interface HeaderProps {
  currentPage: 'home' | 'viewer' | 'flowchart';
  onBack: () => void;
  onFlowchart: () => void;
  selectedMachinery: string | null;
}

export default function Header({ currentPage, onBack, onFlowchart, selectedMachinery }: HeaderProps) {
  const machinery = selectedMachinery ? machineryData[selectedMachinery] : null;

  return (
    <header className="bg-white shadow-md px-6 py-4 flex items-center justify-between z-50">
      <div className="flex items-center gap-4">
        {currentPage !== 'home' && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="홈으로"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-primary">SIMVEX</h1>
          {machinery && (
            <p className="text-sm text-gray-600">{machinery.name}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {currentPage === 'viewer' && (
          <button
            onClick={onFlowchart}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors"
          >
            <Network className="w-5 h-5" />
            <span>워크플로우</span>
          </button>
        )}
      </div>
    </header>
  );
}
