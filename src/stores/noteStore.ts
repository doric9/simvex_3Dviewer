import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Note } from '../types';
import { getUserNotes, createNote as apiCreateNote, updateNote as apiUpdateNote, deleteNote as apiDeleteNote } from '../utils/aiService';
import { getAnonymousUserId } from '../utils/user';

interface NoteStore {
  notes: Note[];
  isLoading: boolean;
  loadNotes: () => Promise<void>;
  addNote: (machineryId: string, content: string, partName?: string) => Promise<void>;
  updateNote: (id: string, content: string, partName?: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  getNotesByMachinery: (machineryId: string) => Note[];
  getNotesByPart: (machineryId: string, partName: string) => Note[];
  clearNotes: () => void;
}

export const useNoteStore = create<NoteStore>()(
  persist(
    (set, get) => ({
      notes: [],
      isLoading: false,
      loadNotes: async () => {
        set({ isLoading: true });
        try {
          const userId = getAnonymousUserId();
          const notes = await getUserNotes(userId);
          // Convert timestamp strings from API to numbers if needed
          const formattedNotes: Note[] = notes.map(n => ({
            id: n.id,
            machineryId: n.machinery_id,
            content: n.content,
            timestamp: typeof n.timestamp === 'string' ? new Date(n.timestamp).getTime() : n.timestamp as number,
            partName: n.part_name,
          }));
          set({ notes: formattedNotes });
        } catch (error) {
          console.error('Failed to load notes:', error);
        } finally {
          set({ isLoading: false });
        }
      },
      addNote: async (machineryId, content, partName) => {
        const userId = getAnonymousUserId();
        try {
          const newNote = await apiCreateNote({
            id: Date.now().toString(),
            user_id: userId,
            machineryId, // Backend might expect machinery_id
            machinery_id: machineryId,
            content,
            partName,
            part_name: partName,
          } as any);

          const formattedNote: Note = {
            id: newNote.id,
            machineryId: newNote.machinery_id,
            content: newNote.content,
            timestamp: typeof newNote.timestamp === 'string' ? new Date(newNote.timestamp).getTime() : newNote.timestamp as number,
            partName: newNote.part_name,
          };

          set((state) => ({ notes: [...state.notes, formattedNote] }));
        } catch (error) {
          console.error('Failed to create note:', error);
          // Fallback to local only if API fails
          const fallbackNote: Note = {
            id: Date.now().toString(),
            machineryId,
            content,
            timestamp: Date.now(),
            partName,
          };
          set((state) => ({ notes: [...state.notes, fallbackNote] }));
        }
      },
      updateNote: async (id, content, partName) => {
        try {
          await apiUpdateNote(id, content, partName);
          set((state) => ({
            notes: state.notes.map((note) =>
              note.id === id
                ? { ...note, content, timestamp: Date.now(), ...(partName !== undefined && { partName }) }
                : note
            ),
          }));
        } catch (error) {
          console.error('Failed to update note:', error);
        }
      },
      deleteNote: async (id) => {
        try {
          await apiDeleteNote(id);
          set((state) => ({
            notes: state.notes.filter((note) => note.id !== id),
          }));
        } catch (error) {
          console.error('Failed to delete note:', error);
        }
      },
      getNotesByMachinery: (machineryId) => {
        return get().notes.filter((note) => note.machineryId === machineryId);
      },
      getNotesByPart: (machineryId, partName) => {
        return get().notes.filter(
          (note) => note.machineryId === machineryId && note.partName === partName
        );
      },
      clearNotes: () => {
        set({ notes: [] });
      },
    }),
    {
      name: 'simvex-notes-storage',
    }
  )
);
