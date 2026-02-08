// src/types/assembly.d.ts
// CAD Assembly System - Type Definitions

/**
 * 면(Face) 정보
 * STL 파일에서 자동 추출된 평면 정보
 */
export interface Face {
  id: string;                          // 'face_0', 'face_1', ...
  normal: [number, number, number];    // 법선 벡터 (normalized)
  center: [number, number, number];    // 중심점 좌표
  area: number;                        // 면적 (mm²)
  vertices: number[][];                // 꼭지점 좌표 배열 (디버그용)
  type: 'planar' | 'cylindrical' | 'spherical';  // 면 타입
  color?: string;                      // 시각화용 색상
}

/**
 * Face 정보를 포함한 파트 정의
 */
export interface PartWithFaces {
  id: string;
  name?: string;
  modelPath: string;
  color?: string;
  description?: string;
  faces: Face[];                       // 추출된 면 목록
  thumbnail?: string;                  // 파트 썸네일
}

/**
 * Mate Constraint 타입
 * UGNX, SolidWorks 등의 CAD Assembly 제약과 동일
 */
export type MateType = 
  | 'coincident'      // 면-면 일치 (가장 기본)
  | 'parallel'        // 평행
  | 'perpendicular'   // 수직
  | 'concentric'      // 동축 (원통형 면)
  | 'tangent'         // 접선
  | 'distance';       // 거리 제약

/**
 * Mate Constraint (조립 제약)
 * 두 파트의 면을 연결하는 관계
 */
export interface MateConstraint {
  id: string;                          // 'mate_1', 'mate_2', ...
  type: MateType;
  
  // Part A (첫 번째 선택)
  partA: string;                       // 파트 ID
  faceA: string;                       // 면 ID
  
  // Part B (두 번째 선택)
  partB: string;
  faceB: string;
  
  // 추가 옵션
  flip?: boolean;                      // B를 뒤집을지 여부 (법선 반대)
  offset?: number;                     // 간격 (mm, 기본 0)
  locked?: boolean;                    // 잠금 여부
  
  // 메타데이터
  createdAt?: Date;
  description?: string;
}

/**
 * Assembly Definition (전체 조립 정의)
 */
export interface AssemblyDefinition {
  id: string;                          // 'Suspension', 'RobotGripper', ...
  name: string;
  description?: string;
  
  basePart: string;                    // 고정 기준 파트 ID
  parts: PartWithFaces[];              // 모든 파트 (Face 포함)
  mates: MateConstraint[];             // Mate 제약 목록
  
  // 메타데이터
  version?: string;
  createdAt?: Date;
  modifiedAt?: Date;
  author?: string;
  thumbnail?: string;
}

/**
 * Animation Keyframe (애니메이션 키프레임)
 */
export interface AnimationKeyframe {
  time: number;                        // 시간 (초)
  partId: string;
  position: [number, number, number];
  rotation: [number, number, number, number];  // Quaternion [x, y, z, w]
  scale?: [number, number, number];
}

/**
 * Assembly Sequence (조립 순서)
 */
export interface AssemblySequence {
  id: string;
  assemblyId: string;
  steps: AssemblyStep[];
  totalDuration: number;               // 총 시간 (초)
}

/**
 * Assembly Step (조립 단계)
 */
export interface AssemblyStep {
  stepNumber: number;
  mateId: string;                      // 관련 Mate
  partId: string;                      // 조립할 파트
  description?: string;                // 설명 (예: "SPRING을 BASE 위에 조립")
  duration: number;                    // 단계 소요 시간 (초)
  keyframes: AnimationKeyframe[];      // 애니메이션 키프레임
}

/**
 * Face Selection State (면 선택 상태)
 */
export interface FaceSelection {
  partId: string;
  face: Face;
  timestamp: Date;
}

/**
 * Assembly Workbench State (워크벤치 상태)
 */
export interface WorkbenchState {
  assembly: AssemblyDefinition;
  selectedPartA?: FaceSelection;
  selectedPartB?: FaceSelection;
  hoveredFace?: { partId: string; faceId: string };
  mode: 'select' | 'mate' | 'move' | 'rotate';
  history: WorkbenchAction[];          // Undo/Redo용
}

/**
 * Workbench Action (워크벤치 액션)
 */
export interface WorkbenchAction {
  type: 'ADD_MATE' | 'DELETE_MATE' | 'MOVE_PART' | 'ROTATE_PART';
  data: any;
  timestamp: Date;
}

/**
 * Face Extraction Options (면 추출 옵션)
 */
export interface FaceExtractionOptions {
  minArea?: number;                    // 최소 면적 (작은 면 무시)
  normalTolerance?: number;            // 법선 허용 오차 (degree)
  mergeCoplanar?: boolean;             // 동일 평면 병합 여부
  detectCylinders?: boolean;           // 원통형 면 감지
  detectSpheres?: boolean;             // 구형 면 감지
}

/**
 * Mate Transform Result (Mate 변환 결과)
 */
export interface MateTransformResult {
  position: [number, number, number];
  rotation: [number, number, number, number];  // Quaternion
  success: boolean;
  error?: string;
}

/**
 * Assembly Validation Result (조립 검증 결과)
 */
export interface AssemblyValidationResult {
  valid: boolean;
  errors: AssemblyValidationError[];
  warnings: AssemblyValidationWarning[];
}

export interface AssemblyValidationError {
  type: 'MISSING_BASE' | 'CYCLIC_DEPENDENCY' | 'INVALID_MATE' | 'COLLISION';
  message: string;
  relatedIds: string[];                // 관련 파트/Mate ID
}

export interface AssemblyValidationWarning {
  type: 'LARGE_GAP' | 'SMALL_AREA' | 'UNUSUAL_ANGLE';
  message: string;
  severity: 'low' | 'medium' | 'high';
}

/**
 * Export Format (내보내기 형식)
 */
export type AssemblyExportFormat = 
  | 'json'           // 순수 JSON
  | 'machineryData'  // machineryData.ts 형식
  | 'step'           // STEP CAD 형식 (향후)
  | 'gltf';          // GLTF 3D 형식 (향후)
