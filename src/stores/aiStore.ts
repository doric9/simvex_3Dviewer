import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AIMessage } from '../types';

interface AIStore {
  messages: Record<string, AIMessage[]>;
  isLoading: boolean;
  addMessage: (machineryId: string, role: 'user' | 'assistant', content: string) => void;
  setLoading: (loading: boolean) => void;
  getMessagesByMachinery: (machineryId: string) => AIMessage[];
  getInteractionCount: (machineryId: string) => number;
  clearMessages: (machineryId: string) => void;
}

export const useAIStore = create<AIStore>()(
  persist(
    (set, get) => ({
      messages: {},
      isLoading: false,
      addMessage: (machineryId, role, content) => {
        const newMessage: AIMessage = {
          id: Date.now().toString(),
          role,
          content,
          timestamp: Date.now(),
        };
        set((state) => ({
          messages: {
            ...state.messages,
            [machineryId]: [...(state.messages[machineryId] || []), newMessage],
          },
        }));
      },
      setLoading: (loading) => set({ isLoading: loading }),
      getMessagesByMachinery: (machineryId) => {
        return get().messages[machineryId] || [];
      },
      getInteractionCount: (machineryId) => {
        return (get().messages[machineryId] || []).filter(m => m.role === 'user').length;
      },
      clearMessages: (machineryId) => {
        set((state) => {
          const newMessages = { ...state.messages };
          delete newMessages[machineryId];
          return { messages: newMessages };
        });
      },
    }),
    {
      name: 'simvex-ai-storage',
    }
  )
);
