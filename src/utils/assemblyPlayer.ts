// src/utils/assemblyPlayer.ts
// Assembly Animation Player - Mate 기반 조립/분해 애니메이션

import * as THREE from 'three';
import type {
  AssemblyDefinition,
  MateConstraint,
  AnimationKeyframe,
  AssemblySequence,
  AssemblyStep
} from '../types/assembly';
import { MateTransformCalculator } from './mateTransform';

/**
 * AssemblyPlayer
 * 저장된 Mate 정보로부터 조립/분해 애니메이션 자동 생성
 */
export class AssemblyPlayer {
  private transformCalculator: MateTransformCalculator;

  constructor() {
    this.transformCalculator = new MateTransformCalculator();
  }

  /**
   * Assembly Sequence 생성
   * Mate 순서대로 조립 단계 계산
   */
  public generateAssemblySequence(
    assembly: AssemblyDefinition,
    stepDuration: number = 1.0  // 각 단계 소요 시간 (초)
  ): AssemblySequence {
    const steps: AssemblyStep[] = [];
    const partPositions = new Map<string, THREE.Vector3>();
    const partRotations = new Map<string, THREE.Quaternion>();

    // 1. Base part 고정
    partPositions.set(assembly.basePart, new THREE.Vector3(0, 0, 0));
    partRotations.set(assembly.basePart, new THREE.Quaternion());

    // 2. Mate 순서대로 위치 계산
    assembly.mates.forEach((mate, index) => {
      const step = this.createAssemblyStep(
        mate,
        assembly,
        partPositions,
        partRotations,
        index,
        stepDuration
      );

      if (step) {
        steps.push(step);
      }
    });

    return {
      id: `${assembly.id}_sequence`,
      assemblyId: assembly.id,
      steps,
      totalDuration: steps.reduce((sum, step) => sum + step.duration, 0)
    };
  }

  /**
   * 단일 조립 단계 생성
   */
  private createAssemblyStep(
    mate: MateConstraint,
    assembly: AssemblyDefinition,
    partPositions: Map<string, THREE.Vector3>,
    partRotations: Map<string, THREE.Quaternion>,
    stepNumber: number,
    duration: number
  ): AssemblyStep | null {
    // Part A가 이미 배치되어 있는지 확인
    const partAPos = partPositions.get(mate.partA);
    if (!partAPos) {
      console.error(`[AssemblyPlayer] Part A ${mate.partA} not positioned yet`);
      return null;
    }

    // Face 정보 가져오기
    const faceA = this.getFace(assembly, mate.partA, mate.faceA);
    const faceB = this.getFace(assembly, mate.partB, mate.faceB);

    if (!faceA || !faceB) {
      console.error(`[AssemblyPlayer] Face not found for mate ${mate.id}`);
      return null;
    }

    // Mate Transform 계산
    const transform = this.transformCalculator.calculateMateTransform(mate, faceA, faceB);

    if (!transform.success) {
      console.error(`[AssemblyPlayer] Transform failed for mate ${mate.id}`);
      return null;
    }

    // Part B 위치 저장
    const positionB = new THREE.Vector3(...transform.position);
    const rotationB = new THREE.Quaternion(...transform.rotation);
    partPositions.set(mate.partB, positionB);
    partRotations.set(mate.partB, rotationB);

    // 키프레임 생성 (조립 애니메이션)
    const keyframes: AnimationKeyframe[] = [
      // 시작 위치 (분해 상태)
      {
        time: stepNumber * duration,
        partId: mate.partB,
        position: this.calculateExplodedPosition(positionB, faceB, 10),  // 10 단위 떨어진 위치
        rotation: [rotationB.x, rotationB.y, rotationB.z, rotationB.w]
      },
      // 끝 위치 (조립 완료)
      {
        time: stepNumber * duration + duration,
        partId: mate.partB,
        position: [positionB.x, positionB.y, positionB.z],
        rotation: [rotationB.x, rotationB.y, rotationB.z, rotationB.w]
      }
    ];

    return {
      stepNumber: stepNumber + 1,
      mateId: mate.id,
      partId: mate.partB,
      description: `Assemble ${mate.partB} to ${mate.partA}`,
      duration,
      keyframes
    };
  }

  /**
   * 분해 위치 계산 (면 법선 방향으로 이동)
   */
  private calculateExplodedPosition(
    assembledPos: THREE.Vector3,
    face: any,
    distance: number
  ): [number, number, number] {
    const normal = new THREE.Vector3(...face.normal);
    const exploded = assembledPos.clone().add(normal.multiplyScalar(-distance));
    return [exploded.x, exploded.y, exploded.z];
  }

  /**
   * Face 가져오기 헬퍼
   */
  private getFace(assembly: AssemblyDefinition, partId: string, faceId: string): any {
    const part = assembly.parts.find(p => p.id === partId);
    if (!part) return null;
    return part.faces.find(f => f.id === faceId);
  }

  /**
   * 분해 애니메이션 생성 (조립의 역순)
   */
  public generateExplodeSequence(
    assembly: AssemblyDefinition,
    _explodeFactor: number = 1.0,  // 0~1
    stepDuration: number = 1.0
  ): AssemblySequence {
    const assemblySeq = this.generateAssemblySequence(assembly, stepDuration);

    // 순서 반전 & 키프레임 반전
    const explodeSteps = assemblySeq.steps.reverse().map((step, index) => ({
      ...step,
      stepNumber: index + 1,
      description: (step.description || '').replace('Assemble', 'Disassemble'),
      keyframes: step.keyframes.reverse().map(kf => ({
        ...kf,
        time: index * stepDuration + (kf.time - step.keyframes[0].time)
      }))
    }));

    return {
      id: `${assembly.id}_explode`,
      assemblyId: assembly.id,
      steps: explodeSteps,
      totalDuration: assemblySeq.totalDuration
    };
  }

  /**
   * 특정 explodeFactor에 대한 모든 파트 위치 계산
   * (SimVex 3D Viewer의 슬라이더 연동용)
   */
  public calculatePositionsAtFactor(
    assembly: AssemblyDefinition,
    explodeFactor: number  // 0 = 조립, 1 = 완전 분해
  ): Map<string, { position: THREE.Vector3; rotation: THREE.Quaternion }> {
    const positions = new Map<string, { position: THREE.Vector3; rotation: THREE.Quaternion }>();

    // Base part는 항상 원점
    positions.set(assembly.basePart, {
      position: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Quaternion()
    });

    // 각 Mate별로 보간
    assembly.mates.forEach(mate => {
      const faceA = this.getFace(assembly, mate.partA, mate.faceA);
      const faceB = this.getFace(assembly, mate.partB, mate.faceB);

      if (!faceA || !faceB) return;

      // 조립 위치
      const transform = this.transformCalculator.calculateMateTransform(mate, faceA, faceB);
      if (!transform.success) return;

      const assembledPos = new THREE.Vector3(...transform.position);
      const rotation = new THREE.Quaternion(...transform.rotation);

      // 분해 위치
      const explodedPos = new THREE.Vector3(
        ...this.calculateExplodedPosition(assembledPos, faceB, 10)
      );

      // 보간 (0 = 조립, 1 = 분해)
      const finalPos = new THREE.Vector3().lerpVectors(
        assembledPos,
        explodedPos,
        explodeFactor
      );

      positions.set(mate.partB, {
        position: finalPos,
        rotation
      });
    });

    return positions;
  }

  /**
   * 애니메이션 재생 (Three.js AnimationMixer용 클립 생성)
   */
  public createAnimationClip(
    sequence: AssemblySequence,
    targetObjects: Map<string, THREE.Object3D>
  ): THREE.AnimationClip {
    const tracks: THREE.KeyframeTrack[] = [];

    sequence.steps.forEach(step => {
      const obj = targetObjects.get(step.partId);
      if (!obj) return;

      // Position Track
      const posTimes = step.keyframes.map(kf => kf.time);
      const posValues = step.keyframes.flatMap(kf => kf.position);

      const posTrack = new THREE.VectorKeyframeTrack(
        `${obj.name}.position`,
        posTimes,
        posValues
      );
      tracks.push(posTrack);

      // Rotation Track (Quaternion)
      const rotTimes = step.keyframes.map(kf => kf.time);
      const rotValues = step.keyframes.flatMap(kf => kf.rotation);

      const rotTrack = new THREE.QuaternionKeyframeTrack(
        `${obj.name}.quaternion`,
        rotTimes,
        rotValues
      );
      tracks.push(rotTrack);
    });

    return new THREE.AnimationClip(sequence.id, sequence.totalDuration, tracks);
  }

  /**
   * 디버그: Sequence 정보 출력
   */
  public printSequence(sequence: AssemblySequence): void {
    console.log(`\n=== Assembly Sequence: ${sequence.id} ===`);
    console.log(`Total Duration: ${sequence.totalDuration.toFixed(2)}s`);
    console.log(`Steps: ${sequence.steps.length}\n`);

    sequence.steps.forEach(step => {
      console.log(`[Step ${step.stepNumber}] ${step.description}`);
      console.log(`  Part: ${step.partId}`);
      console.log(`  Mate: ${step.mateId}`);
      console.log(`  Duration: ${step.duration}s`);
      console.log(`  Keyframes: ${step.keyframes.length}`);
    });
  }
}

/**
 * 싱글톤 인스턴스
 */
export const assemblyPlayer = new AssemblyPlayer();
