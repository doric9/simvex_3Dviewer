import { useState, useEffect } from 'react';
import { FileDown, FileText, MessageSquare, Brain, Trophy, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useNoteStore } from '../../stores/noteStore';
import { useAIStore } from '../../stores/aiStore';
import { getMachineryProgress, MachineryProgress } from '../../utils/aiService';
import { getAnonymousUserId } from '../../utils/user';
import { generateStudySummaryPDF } from '../../utils/pdfGenerator';
import { Note } from '../../types';

interface StudySummaryProps {
    machineryId: string;
    machineryName: string;
    onClose: () => void;
}


export default function StudySummary({ machineryId, machineryName, onClose }: StudySummaryProps) {
    const { getNotesByMachinery } = useNoteStore();
    const { getMessagesByMachinery } = useAIStore();
    const [progress, setProgress] = useState<MachineryProgress | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        notes: true,
        quiz: true,
        ai: false,
    });

    const notes = getNotesByMachinery(machineryId);
    const aiMessages = getMessagesByMachinery(machineryId);
    const userId = getAnonymousUserId();

    useEffect(() => {
        async function loadProgress() {
            try {
                const data = await getMachineryProgress(userId, machineryId);
                setProgress(data);
            } catch (error) {
                console.warn('Progress API unavailable:', error);
            }
        }
        loadProgress();
    }, [userId, machineryId]);

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            const viewerElement = document.getElementById('viewer-canvas');
            await generateStudySummaryPDF(
                machineryName,
                viewerElement,
                notes,
                aiMessages,
                progress
            );
        } catch (error) {
            console.error('PDF export failed:', error);
            alert('PDF 내보내기에 실패했습니다.');
        } finally {
            setIsExporting(false);
        }
    };

    // Group notes by part
    const notesByPart: Record<string, Note[]> = {};
    const untaggedNotes: Note[] = [];
    notes.forEach(note => {
        if (note.partName) {
            if (!notesByPart[note.partName]) {
                notesByPart[note.partName] = [];
            }
            notesByPart[note.partName].push(note);
        } else {
            untaggedNotes.push(note);
        }
    });

    // Get AI highlights (assistant messages only, limited to 5)
    const aiHighlights = aiMessages
        .filter(m => m.role === 'assistant')
        .slice(-5);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">학습 요약</h2>
                        <p className="text-sm text-gray-500">{machineryName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Stats Overview */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                            <FileText className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                            <div className="text-2xl font-bold text-blue-700">{notes.length}</div>
                            <div className="text-xs text-blue-600">노트</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3 text-center">
                            <Brain className="w-5 h-5 text-green-600 mx-auto mb-1" />
                            <div className="text-2xl font-bold text-green-700">
                                {progress ? Math.round(progress.quiz_accuracy * 100) : 0}%
                            </div>
                            <div className="text-xs text-green-600">퀴즈 정확도</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-3 text-center">
                            <MessageSquare className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                            <div className="text-2xl font-bold text-purple-700">{aiMessages.length}</div>
                            <div className="text-xs text-purple-600">AI 대화</div>
                        </div>
                    </div>

                    {/* Notes Section */}
                    <div className="border rounded-lg">
                        <button
                            onClick={() => toggleSection('notes')}
                            className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
                        >
                            <span className="font-medium flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                학습 노트 ({notes.length})
                            </span>
                            {expandedSections.notes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {expandedSections.notes && (
                            <div className="p-3 pt-0 space-y-3">
                                {notes.length === 0 ? (
                                    <p className="text-sm text-gray-500 italic">작성된 노트가 없습니다.</p>
                                ) : (
                                    <>
                                        {Object.entries(notesByPart).map(([partName, partNotes]) => (
                                            <div key={partName} className="bg-gray-50 rounded-lg p-2">
                                                <div className="text-xs font-medium text-primary mb-1">📌 {partName}</div>
                                                {partNotes.map(note => (
                                                    <p key={note.id} className="text-sm text-gray-700 ml-4">{note.content}</p>
                                                ))}
                                            </div>
                                        ))}
                                        {untaggedNotes.length > 0 && (
                                            <div className="bg-gray-50 rounded-lg p-2">
                                                <div className="text-xs font-medium text-gray-500 mb-1">📝 일반 노트</div>
                                                {untaggedNotes.map(note => (
                                                    <p key={note.id} className="text-sm text-gray-700 ml-4">{note.content}</p>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Quiz Results Section */}
                    <div className="border rounded-lg">
                        <button
                            onClick={() => toggleSection('quiz')}
                            className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
                        >
                            <span className="font-medium flex items-center gap-2">
                                <Trophy className="w-4 h-4" />
                                퀴즈 결과 ({progress?.quiz_attempts || 0}문제)
                            </span>
                            {expandedSections.quiz ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {expandedSections.quiz && (
                            <div className="p-3 pt-0">
                                {!progress || progress.quiz_attempts === 0 ? (
                                    <p className="text-sm text-gray-500 italic">아직 퀴즈를 풀지 않았습니다.</p>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-4 text-sm">
                                            <span className="text-green-600">✓ 정답: {progress.quiz_correct}</span>
                                            <span className="text-red-600">✗ 오답: {progress.quiz_attempts - progress.quiz_correct}</span>
                                        </div>
                                        {progress.topics_learned && progress.topics_learned.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {progress.topics_learned.map(topic => (
                                                    <span key={topic} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                                        {topic}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* AI Highlights Section */}
                    <div className="border rounded-lg">
                        <button
                            onClick={() => toggleSection('ai')}
                            className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
                        >
                            <span className="font-medium flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                AI 대화 하이라이트
                            </span>
                            {expandedSections.ai ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {expandedSections.ai && (
                            <div className="p-3 pt-0 space-y-2">
                                {aiHighlights.length === 0 ? (
                                    <p className="text-sm text-gray-500 italic">AI 대화 기록이 없습니다.</p>
                                ) : (
                                    aiHighlights.map(msg => (
                                        <div key={msg.id} className="bg-gray-50 rounded-lg p-2">
                                            <p className="text-sm text-gray-700 line-clamp-3">{msg.content}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t">
                    <button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                    >
                        <FileDown className="w-5 h-5" />
                        {isExporting ? 'PDF 생성 중...' : 'PDF로 내보내기'}
                    </button>
                </div>
            </div>
        </div>
    );
}
