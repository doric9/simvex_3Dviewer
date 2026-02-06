import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ThumbsUp, ThumbsDown, Sparkles, Zap, Bookmark } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAIStore } from '../../stores/aiStore';
import { useNoteStore } from '../../stores/noteStore';
import { useViewerStore } from '../../stores/viewerStore';
import { streamMessageFromAI, submitFeedback } from '../../utils/aiService';
import { getAnonymousUserId } from '../../utils/user';

interface AIPanelProps {
  machineryId: string;
}

// Quick action presets
interface QuickAction {
  label: string;
  icon: React.ReactNode;
  getMessage: (selectedPart: string | null) => string;
}

const quickActions: QuickAction[] = [
  {
    label: '이 부품 설명',
    icon: <Sparkles className="w-3 h-3" />,
    getMessage: (part) => part ? `${part}에 대해 자세히 설명해줘` : '이 기계의 주요 부품들에 대해 설명해줘',
  },
  {
    label: '핵심 요약',
    icon: <Zap className="w-3 h-3" />,
    getMessage: () => '이 기계의 핵심 내용을 3줄로 요약해줘',
  },
  {
    label: '쉽게 설명',
    icon: <Bot className="w-3 h-3" />,
    getMessage: (part) => part
      ? `${part}를 초등학생도 이해할 수 있게 쉽게 설명해줘`
      : '이 기계를 초등학생도 이해할 수 있게 쉽게 설명해줘',
  },
];

export default function AIPanel({ machineryId }: AIPanelProps) {
  const { getMessagesByMachinery, addMessage, isLoading, setLoading } = useAIStore();
  const { addNote } = useNoteStore();
  const { selectedPart } = useViewerStore();
  const [input, setInput] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'up' | 'down'>>({});
  const [savedMessages, setSavedMessages] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = getMessagesByMachinery(machineryId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (messageText?: string) => {
    const userMessage = (messageText || input).trim();
    if (!userMessage || isLoading) return;

    setInput('');
    setStreamingText('');
    addMessage(machineryId, 'user', userMessage);
    setLoading(true);

    try {
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      // Include selected part context in the conversation
      let contextMessage = userMessage;
      if (selectedPart && !userMessage.includes(selectedPart)) {
        contextMessage = `[현재 선택된 부품: ${selectedPart}] ${userMessage}`;
      }

      const userId = getAnonymousUserId();
      let fullResponse = '';

      await streamMessageFromAI(
        machineryId,
        contextMessage,
        conversationHistory,
        userId,
        (chunk) => {
          fullResponse += chunk;
          setStreamingText(fullResponse);
        },
        (_topics) => {
          // On complete, add the full message
          addMessage(machineryId, 'assistant', fullResponse);
          setStreamingText('');
        },
        (error) => {
          console.error('Streaming error:', error);
          addMessage(machineryId, 'assistant', '죄송합니다. 오류가 발생했습니다.');
          setStreamingText('');
        }
      );
    } catch (error) {
      console.error('AI 응답 오류:', error);
      addMessage(machineryId, 'assistant', '죄송합니다. 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      setStreamingText('');
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    const message = action.getMessage(selectedPart);
    handleSend(message);
  };

  const handleFeedback = (messageId: string, type: 'up' | 'down') => {
    setFeedbackGiven(prev => ({ ...prev, [messageId]: type }));

    // Find the preceding user message to send as context
    const msgIndex = messages.findIndex(m => m.id === messageId);
    if (msgIndex > 0) {
      const precedingUserMsg = messages.slice(0, msgIndex).reverse().find(m => m.role === 'user');
      if (precedingUserMsg) {
        submitFeedback(machineryId, precedingUserMsg.content, type === 'up').catch(() => {});
      }
    }
  };

  const handleSaveToNote = (messageId: string, content: string) => {
    addNote(machineryId, `[AI 응답]\n${content}`, selectedPart || undefined);
    setSavedMessages(prev => new Set(prev).add(messageId));
  };

  return (
    <div className="h-full flex flex-col p-4">
      {/* Context indicator */}
      {selectedPart && (
        <div className="mb-3 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span className="text-sm text-blue-700">
            <span className="font-medium">{selectedPart}</span> 선택됨
          </span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>AI 어시스턴트에게 질문하세요</p>
            <p className="text-xs mt-1 text-gray-400">
              {selectedPart ? `${selectedPart}에 대해 물어보세요!` : '아래 버튼으로 빠르게 시작해보세요'}
            </p>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
          >
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.role === 'user' ? 'bg-primary' : 'bg-gray-200'
                }`}
            >
              {message.role === 'user' ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4 text-gray-600" />
              )}
            </div>
            <div className="flex-1">
              <div
                className={`p-3 rounded-lg ${message.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-800'
                  }`}
              >
                {message.role === 'assistant' ? (
                  <div className="text-sm [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_h1]:text-base [&_h1]:font-bold [&_h1]:mb-1 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mb-1 [&_p]:mb-1 [&_p:last-child]:mb-0 [&_li]:mb-0.5 [&_strong]:font-semibold [&_code]:bg-gray-200 [&_code]:px-1 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-gray-200 [&_pre]:p-2 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre]:text-xs [&_blockquote]:border-l-2 [&_blockquote]:border-gray-300 [&_blockquote]:pl-2 [&_blockquote]:italic">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                )}
                <span className="text-xs opacity-70 mt-1 block">
                  {new Date(message.timestamp).toLocaleTimeString('ko-KR')}
                </span>
              </div>

              {/* Feedback & bookmark buttons for AI responses */}
              {message.role === 'assistant' && (
                <div className="flex items-center gap-2 mt-1.5 ml-1">
                  <span className="text-xs text-gray-400">도움이 됐나요?</span>
                  <button
                    onClick={() => handleFeedback(message.id, 'up')}
                    className={`p-1 rounded transition-colors ${feedbackGiven[message.id] === 'up'
                      ? 'bg-green-100 text-green-600'
                      : 'hover:bg-gray-100 text-gray-400'
                      }`}
                    disabled={!!feedbackGiven[message.id]}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleFeedback(message.id, 'down')}
                    className={`p-1 rounded transition-colors ${feedbackGiven[message.id] === 'down'
                      ? 'bg-red-100 text-red-600'
                      : 'hover:bg-gray-100 text-gray-400'
                      }`}
                    disabled={!!feedbackGiven[message.id]}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleSaveToNote(message.id, message.content)}
                    className={`p-1 rounded transition-colors ${savedMessages.has(message.id)
                      ? 'bg-yellow-100 text-yellow-600'
                      : 'hover:bg-gray-100 text-gray-400'
                      }`}
                    disabled={savedMessages.has(message.id)}
                    title="노트에 저장"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <Bot className={`w-4 h-4 text-gray-600 ${!streamingText && 'animate-pulse'}`} />
            </div>
            <div className="flex-1 p-3 rounded-lg bg-gray-100">
              {streamingText ? (
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{streamingText}<span className="animate-pulse">▌</span></p>
              ) : (
                <p className="text-sm text-gray-600">생각 중...</p>
              )}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-3">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={() => handleQuickAction(action)}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 text-purple-700 rounded-full border border-purple-200 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {action.icon}
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={selectedPart ? `${selectedPart}에 대해 질문하세요...` : '질문을 입력하세요...'}
          disabled={isLoading}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
