import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, RotateCcw, Sparkles, Loader2, Eye } from 'lucide-react';
import { quizData as staticQuizData } from '../../data/quizData';
import { generateQuiz, streamQuizFeedback, QuizQuestion as APIQuizQuestion } from '../../utils/aiService';
import { QuizQuestion } from '../../types';
import { getAnonymousUserId } from '../../utils/user';

interface QuizPanelProps {
  machineryId: string;
}

interface AnsweredQuestion {
  question: QuizQuestion;
  selectedAnswer: number;
  isCorrect: boolean;
  feedback: string | null;
}

export default function QuizPanel({ machineryId }: QuizPanelProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);

  // New states for backend integration
  const [isLoading, setIsLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [useBackend, setUseBackend] = useState(true);
  const [difficulty, setDifficulty] = useState<string>('보통');

  // Review mode states
  const [answeredQuestions, setAnsweredQuestions] = useState<AnsweredQuestion[]>([]);
  const [showReview, setShowReview] = useState(false);

  const userId = getAnonymousUserId();

  // Load questions - try backend first, fallback to static
  const loadQuestions = useCallback(async () => {
    setIsLoading(true);
    setAiFeedback(null);
    setAnsweredQuestions([]);
    setShowReview(false);

    if (useBackend) {
      try {
        const apiQuestions = await generateQuiz(machineryId, 5, userId);
        // Convert API format to local format
        const converted: QuizQuestion[] = apiQuestions.map((q: APIQuizQuestion) => ({
          id: q.id,
          machineryId: q.machinery_id,
          question: q.question,
          options: q.options,
          correctAnswer: q.correct_answer ?? 0,
        }));

        if (converted.length > 0) {
          setQuestions(converted);
          setCurrentIndex(0);
          setScore(0);
          setAnswered(0);
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.warn('Backend quiz unavailable, using static data:', error);
        setUseBackend(false);
      }
    }

    // Fallback to static data
    const filtered = staticQuizData.filter(q => q.machineryId === machineryId);
    setQuestions(filtered);
    setCurrentIndex(0);
    setScore(0);
    setAnswered(0);
    setIsLoading(false);
  }, [machineryId, useBackend, userId]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // Update difficulty based on accuracy
  useEffect(() => {
    if (answered === 0) {
      setDifficulty('보통');
    } else {
      const accuracy = score / answered;
      if (accuracy < 0.4) {
        setDifficulty('쉬움');
      } else if (accuracy < 0.7) {
        setDifficulty('보통');
      } else {
        setDifficulty('어려움');
      }
    }
  }, [score, answered]);

  const currentQuestion = questions[currentIndex];

  const handleAnswer = async (answerIndex: number) => {
    if (showResult || isLoading) return;

    setSelectedAnswer(answerIndex);
    setShowResult(true);
    setAnswered(answered + 1);

    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    if (isCorrect) {
      setScore(score + 1);
    }

    // Get AI feedback from backend
    if (useBackend) {
      setIsLoading(true);
      setAiFeedback('');

      let accumulated = '';

      try {
        await streamQuizFeedback(
          machineryId,
          currentQuestion.id,
          currentQuestion.question,
          currentQuestion.options,
          answerIndex,
          currentQuestion.correctAnswer,
          userId,
          // onResult — correctness already shown via local state
          () => {},
          // onChunk — accumulate tokens progressively
          (text: string) => {
            accumulated += text;
            setAiFeedback(accumulated);
          },
          // onComplete — finalize
          (feedback: string) => {
            const final = feedback || accumulated;
            setAiFeedback(final);
            setIsLoading(false);

            setAnsweredQuestions(prev => [...prev, {
              question: currentQuestion,
              selectedAnswer: answerIndex,
              isCorrect,
              feedback: final,
            }]);
          },
          // onError — fallback
          (error: string) => {
            console.error('Quiz stream error:', error);
            const fallback = isCorrect
              ? '정답입니다! 잘 하셨습니다.'
              : `정답은 ${currentQuestion.correctAnswer + 1}번 "${currentQuestion.options[currentQuestion.correctAnswer]}"입니다.`;
            setAiFeedback(fallback);
            setIsLoading(false);

            setAnsweredQuestions(prev => [...prev, {
              question: currentQuestion,
              selectedAnswer: answerIndex,
              isCorrect,
              feedback: fallback,
            }]);
          }
        );
      } catch (error) {
        console.error('Failed to get AI feedback:', error);
        const fallback = isCorrect
          ? '정답입니다! 잘 하셨습니다.'
          : `정답은 ${currentQuestion.correctAnswer + 1}번 "${currentQuestion.options[currentQuestion.correctAnswer]}"입니다.`;
        setAiFeedback(fallback);
        setIsLoading(false);

        setAnsweredQuestions(prev => [...prev, {
          question: currentQuestion,
          selectedAnswer: answerIndex,
          isCorrect,
          feedback: fallback,
        }]);
      }
    } else {
      // No backend — track without feedback
      setAnsweredQuestions(prev => [...prev, {
        question: currentQuestion,
        selectedAnswer: answerIndex,
        isCorrect,
        feedback: null,
      }]);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setAiFeedback(null);
    }
  };

  const handleReset = () => {
    setAnsweredQuestions([]);
    setShowReview(false);
    loadQuestions();
    setSelectedAnswer(null);
    setShowResult(false);
    setAiFeedback(null);
  };

  const handleGenerateNew = () => {
    setAnsweredQuestions([]);
    setShowReview(false);
    setUseBackend(true);
    loadQuestions();
  };

  // Loading state
  if (isLoading && questions.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 p-4">
        <Loader2 className="w-8 h-8 animate-spin mb-2" />
        <p>퀴즈를 불러오는 중...</p>
      </div>
    );
  }

  // No questions available
  if (questions.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 p-4">
        <p>이 장비에 대한 퀴즈가 없습니다</p>
        <button
          onClick={handleGenerateNew}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>AI 퀴즈 생성</span>
        </button>
      </div>
    );
  }

  // Review mode - show wrong answers
  if (showReview) {
    const wrongAnswers = answeredQuestions.filter(aq => !aq.isCorrect);

    return (
      <div className="h-full flex flex-col p-6 overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-red-500" />
          오답 복습 ({wrongAnswers.length}문제)
        </h3>

        <div className="flex-1 space-y-6">
          {wrongAnswers.map((aq, idx) => (
            <div key={idx} className="p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="font-medium text-gray-800 mb-3">{idx + 1}. {aq.question.question}</p>
              <div className="space-y-2 mb-3">
                {aq.question.options.map((option, optIdx) => (
                  <div
                    key={optIdx}
                    className={`p-2 rounded text-sm ${
                      optIdx === aq.question.correctAnswer
                        ? 'bg-green-100 text-green-800 font-medium'
                        : optIdx === aq.selectedAnswer
                          ? 'bg-red-100 text-red-800 line-through'
                          : 'text-gray-600'
                    }`}
                  >
                    {optIdx === aq.question.correctAnswer && <CheckCircle className="w-4 h-4 inline mr-1" />}
                    {optIdx === aq.selectedAnswer && optIdx !== aq.question.correctAnswer && <XCircle className="w-4 h-4 inline mr-1" />}
                    {option}
                  </div>
                ))}
              </div>
              {aq.feedback && (
                <div className="p-3 bg-purple-50 rounded border border-purple-200">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{aq.feedback}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 mt-6">
          <button
            onClick={() => setShowReview(false)}
            className="w-full py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            결과로 돌아가기
          </button>
          <button
            onClick={handleGenerateNew}
            className="w-full py-3 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors flex items-center gap-2 justify-center"
          >
            <Sparkles className="w-5 h-5" />
            <span>새 문제 생성</span>
          </button>
        </div>
      </div>
    );
  }

  // Quiz complete
  if (answered === questions.length && showResult) {
    const percentage = Math.round((score / questions.length) * 100);
    const wrongCount = answeredQuestions.filter(aq => !aq.isCorrect).length;

    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <div className="text-center">
          <h3 className="text-3xl font-bold text-gray-800 mb-4">퀴즈 완료!</h3>
          <div className="text-6xl font-bold text-primary mb-4">
            {percentage}%
          </div>
          <p className="text-lg text-gray-600 mb-2">
            {questions.length}문제 중 {score}문제 정답
          </p>
          <p className="text-sm text-gray-500 mb-8">
            난이도: {difficulty}
          </p>
          <div className="flex flex-col gap-3">
            {wrongCount > 0 && (
              <button
                onClick={() => setShowReview(true)}
                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 mx-auto"
              >
                <Eye className="w-5 h-5" />
                <span>오답 복습 ({wrongCount}문제)</span>
              </button>
            )}
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 mx-auto"
            >
              <RotateCcw className="w-5 h-5" />
              <span>다시 풀기</span>
            </button>
            <button
              onClick={handleGenerateNew}
              className="px-6 py-3 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors flex items-center gap-2 mx-auto"
            >
              <Sparkles className="w-5 h-5" />
              <span>새 문제 생성</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6">
      {/* Progress & Difficulty */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>문제 {currentIndex + 1} / {questions.length}</span>
          <span className="flex items-center gap-2">
            <span>정답: {score} / {answered}</span>
            {useBackend && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                {difficulty}
              </span>
            )}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-800 mb-6">
          {currentQuestion.question}
        </h3>

        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === currentQuestion.correctAnswer;
            const showCorrect = showResult && isCorrect;
            const showWrong = showResult && isSelected && !isCorrect;

            return (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={showResult}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${showCorrect
                  ? 'border-green-500 bg-green-50'
                  : showWrong
                    ? 'border-red-500 bg-red-50'
                    : isSelected
                      ? 'border-primary bg-blue-50'
                      : 'border-gray-300 hover:border-primary hover:bg-gray-50'
                  } ${showResult ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-800">{option}</span>
                  {showCorrect && <CheckCircle className="w-5 h-5 text-green-600" />}
                  {showWrong && <XCircle className="w-5 h-5 text-red-600" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* AI Feedback */}
        {showResult && (
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <div className="flex items-start gap-2">
              <Sparkles className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-purple-800 mb-1">AI 피드백</p>
                {isLoading && !aiFeedback ? (
                  <div className="flex items-center gap-2 text-purple-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">피드백 생성 중...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <p className="text-sm text-gray-700">{aiFeedback}</p>
                    {isLoading && <Loader2 className="w-3 h-3 animate-spin text-purple-400 flex-shrink-0" />}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Next Button */}
      {showResult && currentIndex < questions.length - 1 && !isLoading && (
        <button
          onClick={handleNext}
          className="w-full mt-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          다음 문제
        </button>
      )}
    </div>
  );
}
