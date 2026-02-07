/// <reference types="vite/client" />

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Fallback to direct OpenAI if no backend configured
const useBackend = !!import.meta.env.VITE_API_BASE_URL;

// Keep legacy OpenAI support for backwards compatibility
import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

const openai = apiKey ? new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true,
}) : null;

const systemPrompts: Record<string, string> = {
  V4_Engine: '당신은 자동차 엔진 전문가입니다. V4 엔진의 구조와 작동 원리에 대해 학생들이 이해하기 쉽게 설명해주세요.',
  Drone: '당신은 드론 전문가입니다. 드론의 비행 원리와 각 부품의 역할을 학생들에게 쉽게 설명해주세요.',
  Suspension: '당신은 자동차 섀시 전문가입니다. 서스펜션의 작동 원리와 역할을 학생들에게 설명해주세요.',
  'Leaf Spring': '당신은 기계공학 전문가입니다. 판 스프링의 원리와 응용을 학생들에게 설명해주세요.',
  'Machine Vice': '당신은 공작기계 전문가입니다. 바이스의 구조와 사용법을 학생들에게 설명해주세요.',
  'Robot Arm': '당신은 로봇공학 전문가입니다. 로봇 팔의 구조와 제어 원리를 학생들에게 설명해주세요.',
  'Robot Gripper': '당신은 로봇공학 전문가입니다. 로봇 그리퍼의 메커니즘을 학생들에게 설명해주세요.',
};

export async function sendMessageToAI(
  machineryId: string,
  userMessage: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [],
  userId?: string
): Promise<string> {
  // Try backend first if configured
  if (useBackend) {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/${machineryId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversation_history: conversationHistory,
          user_id: userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.warn('Backend unavailable, falling back to direct OpenAI:', error);
      // Fall through to direct OpenAI
    }
  }

  // Fallback to direct OpenAI
  if (!openai) {
    return 'OpenAI API Key가 설정되지 않았습니다. .env 파일을 확인해주세요.';
  }

  try {
    const systemPrompt = systemPrompts[machineryId] || '당신은 기계공학 전문가입니다.';

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: userMessage },
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content || '응답을 생성할 수 없습니다.';
  } catch (error: any) {
    console.error('OpenAI API 에러:', error);
    console.error('에러 상세:', error?.message, error?.status, error?.code);

    if (error?.status === 401) {
      return 'API 키가 유효하지 않습니다. .env 파일의 VITE_OPENAI_API_KEY를 확인해주세요.';
    }
    if (error?.status === 429) {
      return 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
    }
    if (error?.status === 500) {
      return 'OpenAI 서버 오류입니다. 잠시 후 다시 시도해주세요.';
    }

    return `AI 응답 중 오류가 발생했습니다: ${error?.message || '알 수 없는 오류'}`;
  }
}

/**
 * Stream a message to AI and receive tokens as they arrive.
 * Uses Server-Sent Events (SSE) for real-time streaming.
 */
export interface SourceReference {
  source_name: string;
  section?: string;
  machinery_id?: string;
  relevance_score: number;
}

export async function streamMessageFromAI(
  machineryId: string,
  userMessage: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [],
  userId: string | undefined,
  onChunk: (text: string) => void,
  onComplete?: (topics: string[], sources?: SourceReference[]) => void,
  onError?: (error: string) => void
): Promise<void> {
  // Only works with backend
  if (!useBackend) {
    // Fall back to non-streaming
    const response = await sendMessageToAI(machineryId, userMessage, conversationHistory, userId);
    onChunk(response);
    onComplete?.([]);
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/chat/${machineryId}/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage,
        conversation_history: conversationHistory,
        user_id: userId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Stream error: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));

            if (data.text) {
              onChunk(data.text);
            }

            if (data.done) {
              onComplete?.(data.topics || [], data.sources || []);
            }

            if (data.error) {
              onError?.(data.error);
            }
          } catch (parseError) {
            // Ignore JSON parse errors for partial data
          }
        }
      }
    }
  } catch (error: any) {
    console.error('Stream error:', error);
    onError?.(error?.message || 'Streaming failed');

    // Fall back to non-streaming on error
    try {
      const response = await sendMessageToAI(machineryId, userMessage, conversationHistory, userId);
      onChunk(response);
      onComplete?.([]);
    } catch (fallbackError) {
      onError?.('Failed to get response');
    }
  }
}

// Quiz API functions
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  machinery_id: string;
  correct_answer?: number;
}

export interface QuizAnswerResponse {
  is_correct: boolean;
  correct_answer: number;
  feedback: string;
}

export async function generateQuiz(
  machineryId: string,
  count: number = 3,
  userId?: string
): Promise<QuizQuestion[]> {
  if (!useBackend) {
    throw new Error('Backend API not configured. Set VITE_API_BASE_URL in .env');
  }

  const response = await fetch(`${API_BASE_URL}/quiz/${machineryId}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      count,
      user_id: userId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Quiz generation failed: ${response.status}`);
  }

  const data = await response.json();
  return data.questions;
}

export async function submitQuizAnswer(
  machineryId: string,
  questionId: string,
  questionText: string,
  options: string[],
  selectedAnswer: number,
  correctAnswer: number,
  userId?: string
): Promise<QuizAnswerResponse> {
  if (!useBackend) {
    throw new Error('Backend API not configured. Set VITE_API_BASE_URL in .env');
  }

  const response = await fetch(`${API_BASE_URL}/quiz/${machineryId}/answer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question_id: questionId,
      question_text: questionText,
      options,
      selected_answer: selectedAnswer,
      correct_answer: correctAnswer,
      user_id: userId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Answer submission failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Stream quiz feedback via SSE for faster perceived response.
 * Falls back to submitQuizAnswer() on error.
 */
export async function streamQuizFeedback(
  machineryId: string,
  questionId: string,
  questionText: string,
  options: string[],
  selectedAnswer: number,
  correctAnswer: number,
  userId: string | undefined,
  onResult: (isCorrect: boolean, correctAnswer: number) => void,
  onChunk: (text: string) => void,
  onComplete: (feedback: string) => void,
  onError?: (error: string) => void
): Promise<void> {
  if (!useBackend) {
    onError?.('Backend API not configured');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/quiz/${machineryId}/answer/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question_id: questionId,
        question_text: questionText,
        options,
        selected_answer: selectedAnswer,
        correct_answer: correctAnswer,
        user_id: userId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Stream error: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));

            if (data.is_correct !== undefined && data.correct_answer !== undefined && !data.done) {
              onResult(data.is_correct, data.correct_answer);
            }

            if (data.text) {
              onChunk(data.text);
            }

            if (data.done) {
              onComplete(data.feedback || '');
            }

            if (data.error) {
              onError?.(data.error);
            }
          } catch {
            // Ignore JSON parse errors for partial data
          }
        }
      }
    }
  } catch (error: any) {
    console.error('Quiz stream error:', error);

    // Fallback to non-streaming
    try {
      const response = await submitQuizAnswer(
        machineryId, questionId, questionText, options,
        selectedAnswer, correctAnswer, userId
      );
      onResult(response.is_correct, response.correct_answer);
      onChunk(response.feedback);
      onComplete(response.feedback);
    } catch (fallbackError: any) {
      onError?.(fallbackError?.message || 'Failed to get feedback');
    }
  }
}

// Progress API functions
export interface MachineryProgress {
  machinery_id: string;
  topics_learned: string[];
  quiz_attempts: number;
  quiz_correct: number;
  quiz_accuracy: number;
  last_quiz_at: string | null;
}

export interface UserProgress {
  user_id: string;
  total_quiz_attempts: number;
  total_quiz_correct: number;
  overall_accuracy: number;
  machinery_progress: MachineryProgress[];
  last_active: string;
}

export async function getUserProgress(userId: string): Promise<UserProgress> {
  if (!useBackend) {
    throw new Error('Backend API not configured. Set VITE_API_BASE_URL in .env');
  }

  const response = await fetch(`${API_BASE_URL}/progress/${userId}`);

  if (!response.ok) {
    throw new Error(`Progress fetch failed: ${response.status}`);
  }

  return response.json();
}

export async function getMachineryProgress(
  userId: string,
  machineryId: string
): Promise<MachineryProgress> {
  if (!useBackend) {
    throw new Error('Backend API not configured. Set VITE_API_BASE_URL in .env');
  }

  const response = await fetch(`${API_BASE_URL}/progress/${userId}/${machineryId}`);

  if (!response.ok) {
    throw new Error(`Progress fetch failed: ${response.status}`);
  }

  return response.json();
}

// Health check
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api/v1', '')}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

// Note API functions
export interface Note {
  id: string;
  user_id: string;
  machinery_id: string;
  part_name?: string;
  content: string;
  timestamp: number | string;
}

export async function getUserNotes(userId: string): Promise<Note[]> {
  if (!useBackend) return [];
  const response = await fetch(`${API_BASE_URL}/notes/${userId}`);
  if (!response.ok) return [];
  return response.json();
}

export async function createNote(note: Omit<Note, 'timestamp'>): Promise<Note> {
  if (!useBackend) {
    return { ...note, timestamp: Date.now() };
  }
  const response = await fetch(`${API_BASE_URL}/notes/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note),
  });
  if (!response.ok) throw new Error('Failed to create note');
  return response.json();
}

export async function updateNote(noteId: string, content: string, partName?: string): Promise<Note> {
  if (!useBackend) {
    throw new Error('Backend needed for update');
  }
  const response = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, part_name: partName }),
  });
  if (!response.ok) throw new Error('Failed to update note');
  return response.json();
}

export async function deleteNote(noteId: string): Promise<void> {
  if (!useBackend) return;
  await fetch(`${API_BASE_URL}/notes/${noteId}`, {
    method: 'DELETE',
  });
}

export async function resetUserAccount(userId: string): Promise<void> {
  if (!useBackend) return;
  await fetch(`${API_BASE_URL}/progress/${userId}/reset`, {
    method: 'POST',
  });
}

// Feedback
export async function submitFeedback(
  machineryId: string,
  question: string,
  positive: boolean
): Promise<void> {
  if (!useBackend) return;

  await fetch(`${API_BASE_URL}/chat/${machineryId}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, positive }),
  });
}

// PDF upload
export interface PDFUploadResponse {
  message: string;
  source_name: string;
  chunks_created: number;
  machinery_id?: string;
}

export async function uploadPDF(
  file: File,
  machineryId?: string
): Promise<PDFUploadResponse> {
  if (!useBackend) {
    throw new Error('Backend API not configured. Set VITE_API_BASE_URL in .env');
  }

  const formData = new FormData();
  formData.append('file', file);

  const params = machineryId ? `?machinery_id=${encodeURIComponent(machineryId)}` : '';
  const response = await fetch(`${API_BASE_URL}/knowledge/ingest/pdf${params}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `PDF upload failed: ${response.status}`);
  }

  return response.json();
}

// Knowledge search
export interface KnowledgeSearchResult {
  content: string;
  source_name: string;
  source_type: string;
  section?: string;
  machinery_id?: string;
  relevance_score: number;
  language: string;
}

export interface KnowledgeSearchResponse {
  query: string;
  results: KnowledgeSearchResult[];
  count: number;
}

export async function searchKnowledge(
  query: string,
  machineryId?: string,
  limit: number = 10
): Promise<KnowledgeSearchResponse> {
  if (!useBackend) {
    return { query, results: [], count: 0 };
  }

  const params = new URLSearchParams({ q: query, limit: String(limit) });
  if (machineryId) params.set('machinery_id', machineryId);

  const response = await fetch(`${API_BASE_URL}/knowledge/search?${params}`);
  if (!response.ok) {
    throw new Error(`Knowledge search failed: ${response.status}`);
  }
  return response.json();
}
