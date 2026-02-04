import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ViewerState } from '../types';

interface ViewerStore extends ViewerState {
  setSelectedMachinery: (id: string | null) => void;
  setSelectedPart: (name: string | null) => void;
  setExplodeFactor: (factor: number) => void;
  setCameraPosition: (position: [number, number, number]) => void;
  setCameraTarget: (target: [number, number, number]) => void;
  setZoom: (zoom: number) => void;
  setPhysicsEnabled: (enabled: boolean) => void;
  triggerCameraReset: () => void;
  setShowGrid: (show: boolean) => void;
  reset: () => void;
}

const initialState: ViewerState = {
  selectedMachinery: null,
  selectedPart: null,
  explodeFactor: 0,
  cameraPosition: [100, 100, 100], // Updated default matching Scene3D
  cameraTarget: [0, 0, 0],
  zoom: 1,
  physicsEnabled: false,
  resetTrigger: 0,
  showGrid: true,
};

export const useViewerStore = create<ViewerStore>()(
  persist(
    (set) => ({
      ...initialState,
      setSelectedMachinery: (id) => set({ selectedMachinery: id }),
      setSelectedPart: (name) => set({ selectedPart: name }),
      setExplodeFactor: (factor) => set({ explodeFactor: factor }),
      setCameraPosition: (position) => set({ cameraPosition: position }),
      setCameraTarget: (target) => set({ cameraTarget: target }),
      setZoom: (zoom) => set({ zoom }),
      setPhysicsEnabled: (enabled) => set({ physicsEnabled: enabled }),
      triggerCameraReset: () => set((state) => ({
        resetTrigger: (state.resetTrigger ?? 0) + 1,
        cameraPosition: initialState.cameraPosition,
        cameraTarget: initialState.cameraTarget
      })),
      setShowGrid: (show) => set({ showGrid: show }),
      reset: () => set(initialState),
    }),
    {
      name: 'simvex-viewer-storage',
    }
  )
);
