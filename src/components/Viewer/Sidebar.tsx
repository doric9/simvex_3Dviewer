import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, FileText, MessageSquare, Brain, GraduationCap, BookOpen } from 'lucide-react';
import NotePanel from '../Notes/NotePanel';
import AIPanel from '../AI/AIPanel';
import QuizPanel from '../Quiz/QuizPanel';
import LearningProgress from '../Education/LearningProgress';
import KnowledgeSearch from '../Education/KnowledgeSearch';
import { generatePDF } from '../../utils/pdfGenerator';
import { useNoteStore } from '../../stores/noteStore';
import { useAIStore } from '../../stores/aiStore';
import { useViewerStore } from '../../stores/viewerStore';

interface SidebarProps {
  machineryId: string;
  isOpen: boolean;
  onToggle: () => void;
}

type Tab = 'note' | 'ai' | 'quiz' | 'progress' | 'search';

export default function Sidebar({ machineryId, isOpen, onToggle }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<Tab>('note');
  const { getNotesByMachinery } = useNoteStore();
  const { getMessagesByMachinery } = useAIStore();
  const { setSelectedPart } = useViewerStore();

  // Listen for PDF export event from Header menu
  useEffect(() => {
    const handleExportPDF = async () => {
      const viewerElement = document.getElementById('viewer-canvas');
      if (!viewerElement) return;

      const notes = getNotesByMachinery(machineryId)
        .map(n => n.content)
        .join('\n\n');

      const aiMessages = getMessagesByMachinery(machineryId);

      await generatePDF(machineryId, viewerElement, notes, aiMessages);
    };

    window.addEventListener('simvex:exportPDF', handleExportPDF);
    return () => {
      window.removeEventListener('simvex:exportPDF', handleExportPDF);
    };
  }, [machineryId, getNotesByMachinery, getMessagesByMachinery]);

  const handlePartSelect = (partName: string) => {
    setSelectedPart(partName);
    setActiveTab('note'); // Switch to note tab to write notes about selected part
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={`fixed right-0 top-1/2 transform -translate-y-1/2 ${isOpen ? 'right-96' : 'right-0'
          } bg-white shadow-lg p-2 rounded-l-lg transition-all duration-300 z-20`}
      >
        {isOpen ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>

      {/* Sidebar Panel */}
      <div
        className={`fixed right-0 top-24 bottom-0 w-96 bg-white shadow-2xl transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'
          } flex flex-col z-40 border-l border-gray-200 rounded-tl-xl`}
      >
        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('progress')}
            className={`flex-1 py-3 px-2 flex items-center justify-center gap-1 transition-colors ${activeTab === 'progress'
              ? 'bg-blue-50 text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:bg-gray-50'
              }`}
            title="학습 진행"
          >
            <GraduationCap className="w-5 h-5" />
            <span className="text-xs">학습</span>
          </button>
          <button
            onClick={() => setActiveTab('note')}
            className={`flex-1 py-3 px-2 flex items-center justify-center gap-1 transition-colors ${activeTab === 'note'
              ? 'bg-blue-50 text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:bg-gray-50'
              }`}
            title="노트"
          >
            <FileText className="w-5 h-5" />
            <span className="text-xs">노트</span>
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-3 px-2 flex items-center justify-center gap-1 transition-colors ${activeTab === 'ai'
              ? 'bg-blue-50 text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:bg-gray-50'
              }`}
            title="AI 어시스턴트"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs">AI</span>
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex-1 py-3 px-2 flex items-center justify-center gap-1 transition-colors ${activeTab === 'quiz'
              ? 'bg-blue-50 text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:bg-gray-50'
              }`}
            title="퀴즈"
          >
            <Brain className="w-5 h-5" />
            <span className="text-xs">퀴즈</span>
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-3 px-2 flex items-center justify-center gap-1 transition-colors ${activeTab === 'search'
              ? 'bg-blue-50 text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:bg-gray-50'
              }`}
            title="지식 검색"
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-xs">검색</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'progress' && (
            <LearningProgress
              machineryId={machineryId}
              onPartSelect={handlePartSelect}
            />
          )}
          {activeTab === 'note' && <NotePanel machineryId={machineryId} />}
          {activeTab === 'ai' && <AIPanel machineryId={machineryId} />}
          {activeTab === 'quiz' && <QuizPanel machineryId={machineryId} />}
          {activeTab === 'search' && <KnowledgeSearch machineryId={machineryId} />}
        </div>
      </div>
    </>
  );
}
