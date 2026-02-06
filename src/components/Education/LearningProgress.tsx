import { useState, useEffect, useMemo } from 'react';
import { CheckCircle, Circle, TrendingUp, Target, BookOpen, FileDown, MessageSquare } from 'lucide-react';
import { useNoteStore } from '../../stores/noteStore';
import { useAIStore } from '../../stores/aiStore';
import { machineryData } from '../../data/machineryData';
import { getMachineryProgress } from '../../utils/aiService';
import { getAnonymousUserId } from '../../utils/user';
import StudySummary from './StudySummary';

interface LearningProgressProps {
    machineryId: string;
    onPartSelect?: (partName: string) => void;
}

interface PartProgress {
    name: string;
    hasNote: boolean;
    noteCount: number;
}

interface QuizStats {
    attempts: number;
    correct: number;
    accuracy: number;
}

export default function LearningProgress({ machineryId, onPartSelect }: LearningProgressProps) {
    const { getNotesByMachinery } = useNoteStore();
    const { getInteractionCount } = useAIStore();
    const [quizStats, setQuizStats] = useState<QuizStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showSummary, setShowSummary] = useState(false);

    const machinery = machineryData[machineryId];
    const notes = getNotesByMachinery(machineryId);
    const userId = getAnonymousUserId();
    const aiInteractions = getInteractionCount(machineryId);

    // Calculate part-level progress
    const partsProgress: PartProgress[] = useMemo(() => {
        if (!machinery) return [];

        return machinery.parts.map(part => {
            const partNotes = notes.filter(n => n.partName === part.name);
            return {
                name: part.name,
                hasNote: partNotes.length > 0,
                noteCount: partNotes.length,
            };
        });
    }, [machinery, notes]);

    // Load quiz stats from backend
    useEffect(() => {
        async function loadProgress() {
            try {
                const progress = await getMachineryProgress(userId, machineryId);
                setQuizStats({
                    attempts: progress.quiz_attempts,
                    correct: progress.quiz_correct,
                    accuracy: progress.quiz_accuracy,
                });
            } catch (error) {
                // Backend might not be available
                console.warn('Progress API unavailable:', error);
                setQuizStats(null);
            } finally {
                setIsLoading(false);
            }
        }
        loadProgress();
    }, [userId, machineryId]);

    const partsWithNotes = partsProgress.filter(p => p.hasNote).length;
    const totalParts = partsProgress.length;

    // Holistic progress: notes 40% + quiz 30% + AI interactions 30%
    const noteProgress = totalParts > 0 ? (partsWithNotes / totalParts) : 0;
    const quizProgress = quizStats && quizStats.attempts > 0 ? quizStats.accuracy : 0;
    const aiProgress = Math.min(aiInteractions / 10, 1); // Cap at 10 interactions = 100%
    const progressPercent = (noteProgress * 40) + (quizProgress * 30) + (aiProgress * 30);

    if (!machinery) {
        return <div className="p-4 text-gray-500">기계를 찾을 수 없습니다.</div>;
    }

    return (
        <div className="h-full flex flex-col p-4 overflow-y-auto">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        학습 진행률
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">노트, 퀴즈, AI 대화를 통해 학습 진행률이 올라갑니다</p>
                </div>
                <button
                    onClick={() => setShowSummary(true)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-primary"
                    title="학습 요약 보기"
                >
                    <FileDown className="w-5 h-5" />
                </button>
            </div>

            {/* Overall Progress Bar */}
            <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>종합 학습</span>
                    <span className="font-medium">{Math.round(progressPercent)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                        className="bg-gradient-to-r from-primary to-blue-400 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                    {progressPercent >= 100
                        ? '🎉 모든 학습을 완료했습니다!'
                        : `${Math.round(progressPercent)}% 완료`
                    }
                </p>
            </div>

            {/* Quiz Stats */}
            {!isLoading && quizStats && quizStats.attempts > 0 && (
                <div className="mb-6 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-800">퀴즈 성적</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                            <div className="text-lg font-bold text-gray-800">{quizStats.attempts}</div>
                            <div className="text-xs text-gray-500">시도</div>
                        </div>
                        <div>
                            <div className="text-lg font-bold text-green-600">{quizStats.correct}</div>
                            <div className="text-xs text-gray-500">정답</div>
                        </div>
                        <div>
                            <div className="text-lg font-bold text-primary">{Math.round(quizStats.accuracy * 100)}%</div>
                            <div className="text-xs text-gray-500">정확도</div>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Interaction Stats */}
            {aiInteractions > 0 && (
                <div className="mb-6 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">AI 대화</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center">
                        <div>
                            <div className="text-lg font-bold text-gray-800">{aiInteractions}</div>
                            <div className="text-xs text-gray-500">질문 수</div>
                        </div>
                        <div>
                            <div className="text-lg font-bold text-blue-600">{Math.round(aiProgress * 100)}%</div>
                            <div className="text-xs text-gray-500">AI 학습</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Parts List */}
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">부품별 진행</span>
                </div>
                <div className="space-y-2">
                    {partsProgress.map((part) => (
                        <button
                            key={part.name}
                            onClick={() => onPartSelect?.(part.name)}
                            className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left ${part.hasNote
                                ? 'bg-green-50 border-green-200 hover:bg-green-100'
                                : 'bg-white border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            {part.hasNote ? (
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                            ) : (
                                <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
                            )}
                            <span className={`text-sm flex-1 ${part.hasNote ? 'text-green-700' : 'text-gray-600'}`}>
                                {part.name}
                            </span>
                            {part.noteCount > 0 && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                    {part.noteCount}개 노트
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tips */}
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-xs text-yellow-800">
                    💡 <strong>팁:</strong> 3D 뷰어에서 부품을 클릭하면 해당 부품에 대한 노트를 쉽게 작성할 수 있어요!
                </p>
            </div>

            {/* Study Summary Modal */}
            {showSummary && (
                <StudySummary
                    machineryId={machineryId}
                    machineryName={machinery.name}
                    onClose={() => setShowSummary(false)}
                />
            )}
        </div>
    );
}
