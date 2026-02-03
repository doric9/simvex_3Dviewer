import { useState } from 'react';
import { Save, Plus, Trash2, FileText } from 'lucide-react';
import { useNoteStore } from '../../stores/noteStore';

interface NotePanelProps {
  machineryId: string;
}

export default function NotePanel({ machineryId }: NotePanelProps) {
  const { addNote, updateNote, deleteNote, getNotesByMachinery } = useNoteStore();
  const [currentNote, setCurrentNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const machineryNotes = getNotesByMachinery(machineryId);

  const handleSave = () => {
    if (!currentNote.trim()) return;

    if (editingId) {
      updateNote(editingId, currentNote);
      setEditingId(null);
    } else {
      addNote(machineryId, currentNote);
    }
    setCurrentNote('');
  };

  const handleEdit = (id: string, content: string) => {
    setEditingId(id);
    setCurrentNote(content);
  };

  return (
    <div className="h-full flex flex-col p-4">
      {/* Editor */}
      <div className="mb-4">
        <textarea
          value={currentNote}
          onChange={(e) => setCurrentNote(e.target.value)}
          placeholder="학습 내용을 메모하세요..."
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

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {machineryNotes.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>아직 작성된 노트가 없습니다</p>
          </div>
        ) : (
          machineryNotes.map((note) => (
            <div
              key={note.id}
              className="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
            >
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
