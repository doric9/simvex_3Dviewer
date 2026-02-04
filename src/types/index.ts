// TypeScript Types
export interface MachineryPart {
  name: string;
  file: string;
  material?: string;
  role?: string;
  parent?: string;
  position?: [number, number, number]; // [x, y, z] for explosion direction calculation
  assemblyOffset?: [number, number, number]; // [x, y, z] visual offset for assembly alignment
  explodeDirection?: [number, number, number]; // Direction vector for explosion (normalized)
  isGround?: boolean; // If true, this part stays fixed during explosion
}

export interface Machinery {
  id: string;
  name: string;
  description: string;
  theory: string;
  thumbnail: string;
  parts: MachineryPart[];
}

export interface ViewerState {
  selectedMachinery: string | null;
  selectedPart: string | null;
  explodeFactor: number;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  zoom: number;
  physicsEnabled: boolean;
  resetTrigger?: number;
  showGrid?: boolean;
}

export interface Note {
  id: string;
  machineryId: string;
  content: string;
  timestamp: number;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface QuizQuestion {
  id: string;
  machineryId: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    note?: string;
    attachments?: string[];
  };
}
