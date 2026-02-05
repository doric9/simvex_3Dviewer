// src/utils/assemblyConstraintResolver.ts
// v0.3.3: 자동 BoundingBox 기반 조립 위치 계산

import * as THREE from 'three';
import type { MachineryPart, AssemblyConstraint } from '../types';

export class AssemblyConstraintResolver {
    private parts: Map<string, MachineryPart>;
    private resolvedPositions: Map<string, THREE.Vector3>;
    private meshCache: Map<string, THREE.Object3D>;
    private boundingBoxCache: Map<string, THREE.Box3>;

    constructor(parts: MachineryPart[]) {
        // name을 key로 사용 (기존 타입 호환)
        this.parts = new Map(parts.map(p => [p.name, p]));
        this.resolvedPositions = new Map();
        this.meshCache = new Map();
        this.boundingBoxCache = new Map();
    }

    /**
     * 메쉬 등록 (ModelGroup에서 로드 후 호출)
     */
    registerMesh(partName: string, mesh: THREE.Object3D): void {
        this.meshCache.set(partName, mesh);

        // BoundingBox 계산 및 캐싱
        const box = new THREE.Box3().setFromObject(mesh);
        this.boundingBoxCache.set(partName, box);

        const size = box.getSize(new THREE.Vector3());
        console.log(`[Resolver] ${partName} BBox 등록:`, {
            min: { x: box.min.x.toFixed(2), y: box.min.y.toFixed(2), z: box.min.z.toFixed(2) },
            max: { x: box.max.x.toFixed(2), y: box.max.y.toFixed(2), z: box.max.z.toFixed(2) },
            size: { x: size.x.toFixed(2), y: size.y.toFixed(2), z: size.z.toFixed(2) }
        });
    }

    /**
     * 부품의 실제 크기 가져오기
     */
    private getPartSize(partName: string): THREE.Vector3 {
        const box = this.boundingBoxCache.get(partName);
        if (!box) {
            console.warn(`[Resolver] ${partName} BBox not cached, returning zero`);
            return new THREE.Vector3(0, 0, 0);
        }
        return box.getSize(new THREE.Vector3());
    }

    /**
     * 부품의 실제 높이 가져오기
     */
    private getPartHeight(partName: string): number {
        return this.getPartSize(partName).y;
    }

    /**
     * 부품의 BoundingBox 가져오기 (디버그용)
     */
    getBoundingBox(partName: string): THREE.Box3 | undefined {
        return this.boundingBoxCache.get(partName);
    }

    /**
     * 모든 BoundingBox 정보 가져오기 (디버그 UI용)
     */
    getAllBoundingBoxes(): Map<string, { box: THREE.Box3; size: THREE.Vector3 }> {
        const result = new Map<string, { box: THREE.Box3; size: THREE.Vector3 }>();

        this.boundingBoxCache.forEach((box, partName) => {
            result.set(partName, {
                box: box.clone(),
                size: box.getSize(new THREE.Vector3())
            });
        });

        return result;
    }

    /**
     * 부품의 조립 위치 계산 (자동 크기 계산)
     */
    resolvePosition(part: MachineryPart): THREE.Vector3 {
        // 이미 계산된 경우 캐시 반환
        if (this.resolvedPositions.has(part.name)) {
            return this.resolvedPositions.get(part.name)!.clone();
        }

        const constraint = part.constraint;
        if (!constraint) {
            // constraint 없으면 assemblyOffset 사용 (하위 호환)
            const pos = new THREE.Vector3(...(part.assemblyOffset || [0, 0, 0]));
            this.resolvedPositions.set(part.name, pos);
            return pos.clone();
        }

        let position: THREE.Vector3;

        switch (constraint.type) {
            case 'Fixed':
                position = new THREE.Vector3(...(constraint.offset || [0, 0, 0]));
                break;

            case 'StackedOn':
                position = this.resolveStackedOn(part, constraint);
                break;

            case 'Threaded':
                position = this.resolveThreaded(part, constraint);
                break;

            case 'RadialAroundCenter':
                position = this.resolveRadial(part, constraint);
                break;

            default:
                console.warn(`Unknown constraint type: ${(constraint as any).type}`);
                position = new THREE.Vector3(0, 0, 0);
        }

        this.resolvedPositions.set(part.name, position);
        return position.clone();
    }

    /**
     * StackedOn: 부모 위에 쌓기 (자동 높이 계산)
     */
    private resolveStackedOn(
        part: MachineryPart,
        constraint: AssemblyConstraint
    ): THREE.Vector3 {
        const parentName = constraint.parentPart;
        if (!parentName) {
            console.error(`StackedOn constraint missing parentPart for ${part.name}`);
            return new THREE.Vector3(0, 0, 0);
        }

        const parentPart = this.parts.get(parentName);
        if (!parentPart) {
            console.error(`Parent part ${parentName} not found`);
            return new THREE.Vector3(0, 0, 0);
        }

        // 부모 위치 재귀 계산
        const parentPos = this.resolvePosition(parentPart);

        // ⭐ 핵심: offset.y가 없거나 0이면 부모 높이로 자동 계산
        const manualOffset = constraint.offset || [0, 0, 0];
        const autoOffsetY = manualOffset[1] !== 0
            ? manualOffset[1]  // 수동 offset이 있으면 사용
            : this.getPartHeight(parentName);  // ← 자동 계산!

        const offset = new THREE.Vector3(
            manualOffset[0],
            autoOffsetY,
            manualOffset[2]
        );

        console.log(`[StackedOn] ${part.name} → ${parentName}:`, {
            parentHeight: this.getPartHeight(parentName).toFixed(2),
            manualOffset: manualOffset[1],
            finalOffset: autoOffsetY.toFixed(2),
            finalPos: {
                x: (parentPos.x + offset.x).toFixed(2),
                y: (parentPos.y + offset.y).toFixed(2),
                z: (parentPos.z + offset.z).toFixed(2)
            }
        });

        return parentPos.clone().add(offset);
    }

    /**
     * Threaded: 나사 결합 (자동 ROD 길이 계산)
     */
    private resolveThreaded(
        part: MachineryPart,
        constraint: AssemblyConstraint
    ): THREE.Vector3 {
        const threadedPartName = constraint.threadedOn;
        if (!threadedPartName) {
            console.error(`Threaded constraint missing threadedOn for ${part.name}`);
            return new THREE.Vector3(0, 0, 0);
        }

        const threadedPart = this.parts.get(threadedPartName);
        if (!threadedPart) {
            console.error(`Threaded part ${threadedPartName} not found`);
            return new THREE.Vector3(0, 0, 0);
        }

        // ROD의 위치 계산
        const rodPos = this.resolvePosition(threadedPart);

        // ⭐ ROD 길이 자동 계산!
        const rodHeight = this.getPartHeight(threadedPartName);

        // 나사 깊이 (0=ROD 하단, 1=ROD 상단)
        const depth = constraint.threadDepth ?? 0.5; // 기본값 중간
        const offset = new THREE.Vector3(...(constraint.offset || [0, 0, 0]));

        // NUT 위치 = ROD 시작점 + (깊이 * ROD 길이)
        const finalPos = rodPos.clone().add(
            new THREE.Vector3(0, rodHeight * depth, 0)
        ).add(offset);

        console.log(`[Threaded] ${part.name} on ${threadedPartName}:`, {
            rodHeight: rodHeight.toFixed(2),
            depth,
            finalPos: {
                x: finalPos.x.toFixed(2),
                y: finalPos.y.toFixed(2),
                z: finalPos.z.toFixed(2)
            }
        });

        return finalPos;
    }

    /**
     * RadialAroundCenter: 방사형 배치
     */
    private resolveRadial(
        part: MachineryPart,
        constraint: AssemblyConstraint
    ): THREE.Vector3 {
        const centerPartName = constraint.centerPart;
        if (!centerPartName) {
            console.error(`Radial constraint missing centerPart for ${part.name}`);
            return new THREE.Vector3(0, 0, 0);
        }

        const centerPart = this.parts.get(centerPartName);
        if (!centerPart) {
            console.error(`Center part ${centerPartName} not found`);
            return new THREE.Vector3(0, 0, 0);
        }

        const centerPos = this.resolvePosition(centerPart);
        const angle = constraint.angle ?? 0;
        const radius = constraint.radius ?? 5;
        const offset = new THREE.Vector3(...(constraint.offset || [0, 0, 0]));

        const x = Math.cos((angle * Math.PI) / 180) * radius;
        const z = Math.sin((angle * Math.PI) / 180) * radius;

        return centerPos.clone().add(new THREE.Vector3(x, 0, z)).add(offset);
    }

    /**
     * 모든 부품 위치 일괄 계산
     */
    resolveAll(): Map<string, THREE.Vector3> {
        this.resolvedPositions.clear();

        for (const part of this.parts.values()) {
            this.resolvePosition(part);
        }

        return new Map(this.resolvedPositions);
    }

    /**
     * 캐시 초기화
     */
    clearCache(): void {
        this.resolvedPositions.clear();
        this.meshCache.clear();
        this.boundingBoxCache.clear();
    }
}
