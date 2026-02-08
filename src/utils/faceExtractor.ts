// src/utils/faceExtractor.ts
// Face Extraction from STL/GLTF Models

import * as THREE from 'three';
import type { Face, FaceExtractionOptions, PartWithFaces } from '../types/assembly';

/**
 * Triangle 정보
 */
interface Triangle {
  vertices: THREE.Vector3[];
  normal: THREE.Vector3;
  center: THREE.Vector3;
  area: number;
}

/**
 * Plane Cluster (같은 평면에 속한 삼각형 그룹)
 */
interface PlaneCluster {
  normal: THREE.Vector3;
  triangles: Triangle[];
  center: THREE.Vector3;
  area: number;
  vertices: THREE.Vector3[];
}

/**
 * FaceExtractor
 * STL/GLTF 메쉬에서 평면 자동 추출
 */
export class FaceExtractor {
  private options: Required<FaceExtractionOptions>;

  constructor(options: FaceExtractionOptions = {}) {
    this.options = {
      minArea: options.minArea ?? 1.0,                    // 최소 면적 1mm²
      normalTolerance: options.normalTolerance ?? 5.0,    // ±5도
      mergeCoplanar: options.mergeCoplanar ?? true,
      detectCylinders: options.detectCylinders ?? true,
      detectSpheres: options.detectSpheres ?? false       // Phase 2에서 구현
    };
  }

  /**
   * 메쉬에서 Face 추출 (메인 함수)
   */
  public extractFaces(mesh: THREE.Mesh): Face[] {
    console.log(`[FaceExtractor] Extracting faces from mesh...`);

    const geometry = mesh.geometry as THREE.BufferGeometry;

    // 1. Geometry에서 삼각형 추출
    const triangles = this.extractTriangles(geometry);
    console.log(`[FaceExtractor] Found ${triangles.length} triangles`);

    // 2. 법선 벡터 기준으로 클러스터링
    const clusters = this.clusterByNormal(triangles);
    console.log(`[FaceExtractor] Clustered into ${clusters.length} planes`);

    // 3. 각 클러스터를 Face로 변환
    const faces = clusters
      .map((cluster, index) => this.clusterToFace(cluster, index))
      .filter(face => face.area >= this.options.minArea);  // 최소 면적 필터

    console.log(`[FaceExtractor] Extracted ${faces.length} faces (after filtering)`);

    return faces;
  }

  /**
   * Geometry에서 모든 삼각형 추출
   */
  private extractTriangles(geometry: THREE.BufferGeometry): Triangle[] {
    const triangles: Triangle[] = [];

    const positions = geometry.attributes.position;

    if (!positions) {
      console.error('[FaceExtractor] No position attribute found');
      return [];
    }

    // 인덱스가 있으면 사용, 없으면 순차적으로 처리
    const indices = geometry.index?.array;
    const vertexCount = indices ? indices.length : positions.count;

    for (let i = 0; i < vertexCount; i += 3) {
      // 삼각형의 3개 정점 인덱스
      const i0 = indices ? indices[i] : i;
      const i1 = indices ? indices[i + 1] : i + 1;
      const i2 = indices ? indices[i + 2] : i + 2;

      // 정점 좌표
      const v0 = new THREE.Vector3(
        positions.getX(i0),
        positions.getY(i0),
        positions.getZ(i0)
      );
      const v1 = new THREE.Vector3(
        positions.getX(i1),
        positions.getY(i1),
        positions.getZ(i1)
      );
      const v2 = new THREE.Vector3(
        positions.getX(i2),
        positions.getY(i2),
        positions.getZ(i2)
      );

      // 법선 계산 (외적)
      const edge1 = new THREE.Vector3().subVectors(v1, v0);
      const edge2 = new THREE.Vector3().subVectors(v2, v0);
      const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();

      // 중심점
      const center = new THREE.Vector3()
        .add(v0)
        .add(v1)
        .add(v2)
        .divideScalar(3);

      // 면적 (헤론의 공식)
      const area = edge1.cross(edge2).length() / 2;

      triangles.push({
        vertices: [v0, v1, v2],
        normal,
        center,
        area
      });
    }

    return triangles;
  }

  /**
   * 법선 벡터 기준으로 삼각형 클러스터링
   * 같은 평면에 속한 삼각형들을 그룹화
   */
  private clusterByNormal(triangles: Triangle[]): PlaneCluster[] {
    const clusters: PlaneCluster[] = [];
    const used = new Set<number>();

    const threshold = Math.cos((this.options.normalTolerance * Math.PI) / 180);

    for (let i = 0; i < triangles.length; i++) {
      if (used.has(i)) continue;

      const seedTriangle = triangles[i];
      const cluster: PlaneCluster = {
        normal: seedTriangle.normal.clone(),
        triangles: [seedTriangle],
        center: new THREE.Vector3(),
        area: 0,
        vertices: []
      };
      used.add(i);

      // 같은 법선을 가진 삼각형 찾기
      for (let j = i + 1; j < triangles.length; j++) {
        if (used.has(j)) continue;

        const triangle = triangles[j];
        const dotProduct = seedTriangle.normal.dot(triangle.normal);

        // 법선이 비슷하면 (±tolerance 이내) 같은 클러스터에 추가
        if (Math.abs(dotProduct) >= threshold) {
          cluster.triangles.push(triangle);
          used.add(j);
        }
      }

      // 클러스터 평균 법선 계산
      if (cluster.triangles.length > 1) {
        cluster.normal.set(0, 0, 0);
        cluster.triangles.forEach(tri => {
          cluster.normal.add(tri.normal);
        });
        cluster.normal.normalize();
      }

      clusters.push(cluster);
    }

    // 동일 평면 병합 (옵션)
    if (this.options.mergeCoplanar) {
      return this.mergeCoplanarClusters(clusters);
    }

    return clusters;
  }

  /**
   * 동일 평면에 있는 클러스터 병합
   */
  private mergeCoplanarClusters(clusters: PlaneCluster[]): PlaneCluster[] {
    // TODO: 추가 구현 - 같은 평면상에 있지만 떨어진 클러스터 병합
    // 현재는 법선만으로 클러스터링되므로, 평면 방정식(ax+by+cz=d)까지 고려 필요
    return clusters;
  }

  /**
   * PlaneCluster를 Face로 변환
   */
  private clusterToFace(cluster: PlaneCluster, index: number): Face {
    // 전체 면적 계산
    let totalArea = 0;
    const allVertices: THREE.Vector3[] = [];

    cluster.triangles.forEach(tri => {
      totalArea += tri.area;
      allVertices.push(...tri.vertices);
    });

    // 중심점 계산 (모든 정점의 평균)
    const center = new THREE.Vector3();
    allVertices.forEach(v => center.add(v));
    center.divideScalar(allVertices.length);

    // 정점을 배열 형태로 변환
    const vertices = allVertices.map(v => [v.x, v.y, v.z]);

    return {
      id: `face_${index}`,
      normal: [cluster.normal.x, cluster.normal.y, cluster.normal.z],
      center: [center.x, center.y, center.z],
      area: totalArea,
      vertices,
      type: 'planar',
      color: this.generateFaceColor(index)
    };
  }

  /**
   * 디버그용 색상 생성 (면마다 다른 색)
   */
  private generateFaceColor(index: number): string {
    const hue = (index * 137.5) % 360;  // 황금각으로 분산
    return `hsl(${hue}, 70%, 60%)`;
  }

  /**
   * PartDefinition에 Face 추가하여 PartWithFaces 생성
   */
  public async extractFacesForPart(
    partId: string,
    modelPath: string,
    mesh: THREE.Mesh
  ): Promise<PartWithFaces> {
    const faces = this.extractFaces(mesh);

    return {
      id: partId,
      modelPath,
      faces
    };
  }

  /**
   * 디버그: Face 정보 출력
   */
  public printFaceInfo(face: Face): void {
    console.log(`Face ${face.id}:`);
    console.log(`  Normal: [${face.normal.map(n => n.toFixed(2)).join(', ')}]`);
    console.log(`  Center: [${face.center.map(c => c.toFixed(2)).join(', ')}]`);
    console.log(`  Area: ${face.area.toFixed(2)} mm²`);
    console.log(`  Type: ${face.type}`);
    console.log(`  Vertices: ${face.vertices.length} points`);
  }

  /**
   * 원통형 면 감지 (Phase 2)
   */
  /**
   * 원통형 면 감지 (Phase 2)
   */
  // private detectCylindricalFaces(_triangles: Triangle[]): Face[] {
  //   // TODO: 구현 예정
  //   // 1. 곡률 계산
  //   // 2. 원통 축 찾기
  //   // 3. 반지름 계산
  //   return [];
  // }

  /**
   * 구형 면 감지 (Phase 2)
   */
  // private detectSphericalFaces(_triangles: Triangle[]): Face[] {
  //   // TODO: 구현 예정
  //   return [];
  // }
}

/**
 * 간단한 헬퍼 함수
 */
export function createFaceExtractor(options?: FaceExtractionOptions): FaceExtractor {
  return new FaceExtractor(options);
}

/**
 * 법선 벡터 정규화
 */
export function normalizeNormal(normal: [number, number, number]): [number, number, number] {
  const vec = new THREE.Vector3(...normal);
  vec.normalize();
  return [vec.x, vec.y, vec.z];
}

/**
 * 두 법선 벡터 사이의 각도 (degree)
 */
export function angleBetweenNormals(
  normalA: [number, number, number],
  normalB: [number, number, number]
): number {
  const vecA = new THREE.Vector3(...normalA);
  const vecB = new THREE.Vector3(...normalB);
  const dotProduct = vecA.dot(vecB);
  const angle = Math.acos(Math.max(-1, Math.min(1, dotProduct)));
  return (angle * 180) / Math.PI;
}
