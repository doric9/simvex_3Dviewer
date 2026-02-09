import { useMemo } from 'react';
import { useNoteStore } from '../stores/noteStore';
import { useAIStore } from '../stores/aiStore';
import { machineryList } from '../data/machineryData';

export function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  return `${Math.floor(days / 30)}개월 전`;
}

interface MachineryProgress {
  noteCount: number;
  partsWithNotes: number;
  aiInteractionCount: number;
  progressPercent: number;
  lastActivityTimestamp: number | null;
}

export function useMachineryProgress(machineryId: string): MachineryProgress {
  const notes = useNoteStore((s) => s.notes);
  const aiMessages = useAIStore((s) => s.messages);

  return useMemo(() => {
    const machinery = machineryList.find((m) => m.id === machineryId);
    const totalParts = machinery?.parts.length ?? 1;

    const machineryNotes = notes.filter((n) => n.machineryId === machineryId);
    const noteCount = machineryNotes.length;
    const partsWithNotes = new Set(machineryNotes.map((n) => n.partName).filter(Boolean)).size;

    const machineryMessages = aiMessages[machineryId] || [];
    const aiInteractionCount = machineryMessages.filter((m) => m.role === 'user').length;

    // Progress: notes 50% + AI 50%
    // Notes: capped at totalParts (one per part is "complete")
    // AI: capped at 5 interactions as "complete"
    const noteProgress = Math.min(noteCount / totalParts, 1);
    const aiProgress = Math.min(aiInteractionCount / 5, 1);
    const progressPercent = Math.round((noteProgress * 0.5 + aiProgress * 0.5) * 100);

    // Last activity across notes and AI messages
    const noteTimestamps = machineryNotes.map((n) => n.timestamp);
    const aiTimestamps = machineryMessages.map((m) => m.timestamp);
    const allTimestamps = [...noteTimestamps, ...aiTimestamps];
    const lastActivityTimestamp = allTimestamps.length > 0 ? Math.max(...allTimestamps) : null;

    return {
      noteCount,
      partsWithNotes,
      aiInteractionCount,
      progressPercent,
      lastActivityTimestamp,
    };
  }, [machineryId, notes, aiMessages]);
}

export function useLastStudiedMachinery(): { machineryId: string; timestamp: number } | null {
  const notes = useNoteStore((s) => s.notes);
  const aiMessages = useAIStore((s) => s.messages);

  return useMemo(() => {
    let latest: { machineryId: string; timestamp: number } | null = null;

    // Check notes
    for (const note of notes) {
      if (!latest || note.timestamp > latest.timestamp) {
        latest = { machineryId: note.machineryId, timestamp: note.timestamp };
      }
    }

    // Check AI messages
    for (const [machineryId, messages] of Object.entries(aiMessages)) {
      for (const msg of messages) {
        if (!latest || msg.timestamp > latest.timestamp) {
          latest = { machineryId, timestamp: msg.timestamp };
        }
      }
    }

    return latest;
  }, [notes, aiMessages]);
}

export function useHasLearningActivity(): boolean {
  const notes = useNoteStore((s) => s.notes);
  const aiMessages = useAIStore((s) => s.messages);

  return useMemo(() => {
    if (notes.length > 0) return true;
    for (const messages of Object.values(aiMessages)) {
      if (messages.length > 0) return true;
    }
    return false;
  }, [notes, aiMessages]);
}
