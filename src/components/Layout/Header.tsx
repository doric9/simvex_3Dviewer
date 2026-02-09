import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Network, MoreVertical, FileDown, Share2, Settings, RefreshCcw, Box } from 'lucide-react';
import { machineryData } from '../../data/machineryData';
import { resetUserAccount } from '../../utils/aiService';
import { getAnonymousUserId } from '../../utils/user';
import { useNoteStore } from '../../stores/noteStore';
import { useAIStore } from '../../stores/aiStore';

interface HeaderProps {
  currentPage: 'home' | 'viewer' | 'flowchart';
  onBack: () => void;
  onFlowchart: () => void;
  selectedMachinery: string | null;
}

export default function Header({
  currentPage,
  onBack,
  onFlowchart,
  selectedMachinery,
}: HeaderProps) {
  const machinery = selectedMachinery ? machineryData[selectedMachinery] : null;
  const [menuOpen, setMenuOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { clearNotes } = useNoteStore();
  const { clearMessages } = useAIStore();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const handleExportPDF = () => {
    setMenuOpen(false);
    // Dispatch custom event for Sidebar to handle (has access to notes/AI stores)
    window.dispatchEvent(new CustomEvent('simvex:exportPDF'));
  };

  const handleReset = async () => {
    if (window.confirm('학습 기록, 작성한 노트, AI 대화 내용이 모두 초기화됩니다. 정말 초기화하시겠습니까?')) {
      setMenuOpen(false);
      setIsResetting(true);
      try {
        const userId = getAnonymousUserId();
        await resetUserAccount(userId);

        // Clear local stores
        clearNotes();
        if (selectedMachinery) {
          clearMessages(selectedMachinery);
        }

        alert('기록이 성공적으로 초기화되었습니다.');
        window.location.reload();
      } catch (error) {
        console.error('Failed to reset:', error);
        alert('초기화 중 오류가 발생했습니다.');
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between z-50">
      <div className="flex items-center gap-4">
        {currentPage !== 'home' && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100/50 rounded-xl transition-all hover:scale-110 active:scale-95"
            title="홈으로"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}
        <div className="flex items-center gap-2.5 group cursor-pointer" onClick={() => currentPage !== 'home' && onBack()}>
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
            <Box className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none">SIMVEX</h1>
            {machinery ? (
              <p className="text-[10px] font-bold text-primary/70 uppercase tracking-wider mt-1 line-clamp-1">{machinery.name}</p>
            ) : (
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">3D Learning Hub</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {currentPage === 'viewer' && (
          <>
            <button
              onClick={onFlowchart}
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors"
            >
              <Network className="w-5 h-5" />
              <span>워크플로우</span>
            </button>

            {/* Context Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="더보기"
              >
                <MoreVertical className="w-6 h-6 text-gray-700" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={handleExportPDF}
                    className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors"
                  >
                    <FileDown className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">PDF 내보내기</span>
                  </button>
                  <button
                    className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors opacity-50 cursor-not-allowed"
                    disabled
                  >
                    <Share2 className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">공유 (준비중)</span>
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={handleReset}
                    className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-red-50 text-red-600 transition-colors"
                  >
                    <RefreshCcw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
                    <span className="text-sm font-medium">학습 기록 초기화</span>
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors opacity-50 cursor-not-allowed"
                    disabled
                  >
                    <Settings className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">설정 (준비중)</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
