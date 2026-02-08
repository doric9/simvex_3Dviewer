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
     * Update part constraint dynamically (e.g. from AI)
     */
    updatePartConstraint(partName: string, constraint: AssemblyConstraint): void {
        const part = this.parts.get(partName);
        if (part) {
            part.constraint = constraint;
            // Clear cache for this part to force re-calculation
            this.resolvedPositions.delete(partName);
        } else {
            console.warn(`[Resolver] Cannot update constraint: Part ${partName} not found`);
        }
    }

    /**
     * 메쉬 등록 (ModelGroup에서 로드 후 호출)
     */
    registerMesh(partName: string, mesh: THREE.Object3D, logicalScale: number = 1.0): void {
        this.parts.get(partName); // just check existence
        this.meshCache.set(partName, mesh);

        // 1. 임시로 Scale 초기화하여 원본(Raw) BBox 계산
        const originalScale = mesh.scale.clone();
        mesh.scale.set(1, 1, 1);
        mesh.updateMatrixWorld(true); // Force update

        const box = new THREE.Box3().setFromObject(mesh);

        // 2. Scale 복구
        mesh.scale.copy(originalScale);
        mesh.updateMatrixWorld(true);

        // 3. 논리적 스케일 적용 (Logical Scale)
        if (logicalScale !== 1.0) {
            box.min.multiplyScalar(logicalScale);
            box.max.multiplyScalar(logicalScale);
        }

        this.boundingBoxCache.set(partName, box);
        // console.log(`[Resolver] Registered ${partName} bbox:`, box);

        // 위치 재계산 필요하므로 캐시 초기화
        this.resolvedPositions.clear();

        const size = box.getSize(new THREE.Vector3());
        console.log(`[Resolver] ${partName} BBox 등록:`, {
            min: { x: box.min.x.toFixed(2), y: box.min.y.toFixed(2), z: box.min.z.toFixed(2) },
            max: { x: box.max.x.toFixed(2), y: box.max.y.toFixed(2), z: box.max.z.toFixed(2) },
            size: { x: size.x.toFixed(2), y: size.y.toFixed(2), z: size.z.toFixed(2) }
        });
    }

    /**
     * 전체 스케일 설정 및 BBox 재계산
     */
    setGlobalScale(scale: number): void {
        console.log(`[Resolver] Updating global scale to ${scale}`);
        this.meshCache.forEach((mesh, partName) => {
            // 1. 임시로 Scale 초기화하여 원본(Raw) BBox 계산
            const originalScale = mesh.scale.clone();
            mesh.scale.set(1, 1, 1);
            mesh.updateMatrixWorld(true);

            const box = new THREE.Box3().setFromObject(mesh);

            // 2. Scale 복구
            mesh.scale.copy(originalScale);
            mesh.updateMatrixWorld(true);

            // 3. 새 스케일 적용
            box.min.multiplyScalar(scale);
            box.max.multiplyScalar(scale);

            this.boundingBoxCache.set(partName, box);
        });
        this.resolvedPositions.clear();
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

        // ⭐ 물리 기반 스택킹: BoundingBox Top <-> Bottom 정렬
        // 1. 부모의 최상단 Y (World 좌표계 기준)
        const parentBox = this.boundingBoxCache.get(parentName);
        // 부모 박스가 없으면 높이만 더하는 방식으로 fallback (기존 로직)
        if (!parentBox) {
            const height = this.getPartHeight(parentName);
            const manualOffset = constraint.offset || [0, 0, 0];
            return parentPos.clone().add(new THREE.Vector3(manualOffset[0], height + manualOffset[1], manualOffset[2]));
        }

        // 주의: parentBox는 Local 좌표계(메쉬 원점 기준)임.
        // 우리는 부모가 놓인 위치(parentPos)를 알고 있음.
        // 부모의 World Max Y = parentPos.y + parentBox.max.y (Scaling 고려 안함. 1.0 가정)
        const parentTopY = parentBox.max.y; // 로컬 최상단

        // 2. 자식의 최하단 Y (Local 좌표계 기준)
        const childBox = this.boundingBoxCache.get(part.name);
        const childBottomY = childBox ? childBox.min.y : 0; // 자식 박스 없으면 0 가정

        // 3. 정렬 위치 계산
        // 목표: Child World Y + Child Bottom Y = Parent World Y + Parent Top Y
        // Child World Y = Parent World Y + Parent Top Y - Child Bottom Y

        const manualOffset = constraint.offset || [0, 0, 0];

        // 자동 계산된 Y 오프셋 (부모 Top - 자식 Bottom)
        const autoOffsetY = parentTopY - childBottomY;

        // 최종 오프셋 적용 (수동 오프셋이 있으면 추가)
        const finalOffsetY = manualOffset[1] !== 0 ? manualOffset[1] : autoOffsetY;

        const offset = new THREE.Vector3(
            manualOffset[0],
            finalOffsetY,
            manualOffset[2]
        );

        console.log(`[StackedOn] ${part.name} on ${parentName}:`, {
            parentTopY: parentTopY.toFixed(2),
            childBottomY: childBottomY.toFixed(2),
            autoOffsetY: autoOffsetY.toFixed(2),
            manualOffset: manualOffset[1],
            finalPos: {
                y: (parentPos.y + finalOffsetY).toFixed(2)
            }
        });

        return parentPos.clone().add(new THREE.Vector3(offset.x, finalOffsetY, offset.z));
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
