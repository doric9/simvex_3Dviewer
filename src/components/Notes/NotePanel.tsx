import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, FileText, Tag, Lightbulb, Loader2 } from 'lucide-react';
import { useNoteStore } from '../../stores/noteStore';
import { useViewerStore } from '../../stores/viewerStore';

interface NotePanelProps {
  machineryId: string;
}

// Quick note templates for structured learning
const noteTemplates = [
  { label: '역할', template: '이 부품의 역할:\n• ' },
  { label: '배운 점', template: '오늘 배운 점:\n• ' },
  { label: '질문', template: '❓ 궁금한 점:\n' },
];

export default function NotePanel({ machineryId }: NotePanelProps) {
  const { addNote, updateNote, deleteNote, getNotesByMachinery, loadNotes, isLoading } = useNoteStore();
  const { selectedPart } = useViewerStore();

  // Load notes on mount
  useEffect(() => {
    loadNotes();
  }, [loadNotes]);
  const [currentNote, setCurrentNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterByPart, setFilterByPart] = useState(false);

  const allNotes = getNotesByMachinery(machineryId);

  // Filter notes by selected part if filter is active
  const machineryNotes = filterByPart && selectedPart
    ? allNotes.filter(note => note.partName === selectedPart)
    : allNotes;

  const handleSave = () => {
    if (!currentNote.trim()) return;

    if (editingId) {
      updateNote(editingId, currentNote);
      setEditingId(null);
    } else {
      // Auto-tag with selected part if available
      addNote(machineryId, currentNote, selectedPart || undefined);
    }
    setCurrentNote('');
  };

  const handleEdit = (id: string, content: string) => {
    setEditingId(id);
    setCurrentNote(content);
  };

  const handleTemplateClick = (template: string) => {
    const prefix = selectedPart ? `[${selectedPart}] ` : '';
    setCurrentNote(prefix + template);
  };

  return (
    <div className="h-full flex flex-col p-4">
      {/* Selected Part Indicator */}
      {selectedPart && (
        <div className="mb-3 flex items-center gap-2 text-sm">
          <Tag className="w-4 h-4 text-primary" />
          <span className="text-gray-600">선택된 부품:</span>
          <span className="font-medium text-primary">{selectedPart}</span>
          <span className="text-xs text-gray-400">(새 노트에 자동 태그)</span>
        </div>
      )}

      {/* Editor */}
      <div className="mb-4">
        <textarea
          value={currentNote}
          onChange={(e) => setCurrentNote(e.target.value)}
          placeholder={selectedPart
            ? `${selectedPart}에 대한 메모를 작성하세요...`
            : '학습 내용을 메모하세요...'
          }
          className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleSave}
            disabled={!currentNote.trim()}
            className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{editingId ? '수정' : '추가'}</span>
          </button>
          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setCurrentNote('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
          )}
        </div>
      </div>

      {/* Quick Templates */}
      <div className="mb-3 flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-yellow-500" />
        <span className="text-xs text-gray-500">템플릿:</span>
        {noteTemplates.map((t) => (
          <button
            key={t.label}
            onClick={() => handleTemplateClick(t.template)}
            className="text-xs px-2 py-1 bg-yellow-50 text-yellow-700 rounded border border-yellow-200 hover:bg-yellow-100 transition-colors"
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filter by Part */}
      {allNotes.filter(n => n.partName).length > 0 && (
        <div className="mb-3 flex items-center gap-2">
          <button
            onClick={() => setFilterByPart(!filterByPart)}
            className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors ${filterByPart
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            <Tag className="w-3 h-3" />
            {filterByPart ? '부품 필터 해제' : '선택 부품만'}
          </button>
          {filterByPart && !selectedPart && (
            <span className="text-xs text-orange-600">3D에서 부품을 선택하세요</span>
          )}
        </div>
      )}

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p className="text-sm">노트를 불러오는 중...</p>
          </div>
        ) : machineryNotes.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>
              {filterByPart && selectedPart
                ? `${selectedPart}에 대한 노트가 없습니다`
                : '아직 작성된 노트가 없습니다'
              }
            </p>
          </div>
        ) : (
          machineryNotes.map((note) => (
            <div
              key={note.id}
              className="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
            >
              {/* Part Tag */}
              {note.partName && (
                <div className="flex items-center gap-1 mb-2">
                  <Tag className="w-3 h-3 text-primary" />
                  <span className="text-xs font-medium text-primary">{note.partName}</span>
                </div>
              )}

              <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.content}</p>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200">
                <span className="text-xs text-gray-500">
                  {new Date(note.timestamp).toLocaleString('ko-KR')}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(note.id, note.content)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
