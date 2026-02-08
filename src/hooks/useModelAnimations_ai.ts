// src/hooks/useModelAnimations_ai.ts
// AI-powered assembly position calculator with GPT-4 Vision API

import { useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { MachineryPart as PartDefinition } from '../types';
import { aiAssemblyService, AIAssemblyResult } from '../utils/aiAssemblyService';

/**
 * AI 기반 조립 위치 계산 Hook
 * GPT-4 Vision API를 사용하여 조립도 이미지 분석
 */
export function useModelAnimations_ai(
  parts: PartDefinition[],
  explodeFactor: number,
  machineryId: string,
  thumbnailUrl?: string
) {
  const [positions, setPositions] = useState<Map<string, THREE.Vector3>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AIAssemblyResult | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  /**
   * GPT-4 Vision API로 조립도 분석
   */
  const analyzeAssemblyWithAI = useCallback(async (
    imageUrl: string,
    partIds: string[]
  ): Promise<AIAssemblyResult | null> => {
    try {
      setLoading(true);
      setError(null);

      console.log(`[AI] Analyzing assembly image with AI Service...`);

      // Use the centralized service (handles caching, Gemini fallback, etc.)
      const result = await aiAssemblyService.analyzeAssembly(
        imageUrl,
        partIds,
        machineryId,
        {
          useCache: true,
          temperature: 0.1
        }
      );

      console.log('[AI] Analysis successful:', result);
      console.log(`[AI] Confidence: ${(result.confidence * 100).toFixed(1)}%`);

      return result;

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[AI] Analysis failed:', errorMsg);
      setError(errorMsg);
      setUseFallback(true);
      return null;
    } finally {
      setLoading(false);
    }
  }, [machineryId]);

  /**
   * AI 결과로부터 위치 계산
   */
  const calculatePositionsFromAI = useCallback((
    result: AIAssemblyResult,
    factor: number
  ): Map<string, THREE.Vector3> => {
    const posMap = new Map<string, THREE.Vector3>();

    // Helper to normalize keys (remove spaces, lowercase)
    const normalize = (s: string) => s.toLowerCase().replace(/[\s\-_]/g, '');

    result.parts.forEach(part => {
      // part.id from AI might differ from machine part names (e.g. "Main Frame" vs "Main_frame")

      const assembledPos = new THREE.Vector3(...part.position);
      const explodeDir = new THREE.Vector3(...part.explodeDirection).normalize();

      const explodeDistance = 15; // 기본 분해 거리
      const explodedPos = assembledPos.clone().add(
        explodeDir.multiplyScalar(factor * explodeDistance)
      );

      console.log(`[AI Hook] Part: ${part.id} -> Pos: ${explodedPos.toArray()}`);

      // Store original ID
      posMap.set(part.id, explodedPos);

      // Also store normalized ID mapping if different
      const normId = normalize(part.id);

      // Match with known parts to ensure we have the correct key
      const matchedPart = parts.find(p => normalize(p.name) === normId);
      if (matchedPart) {
        if (matchedPart.name !== part.id) {
          console.log(`[AI Hook] Normalized Match: '${part.id}' -> '${matchedPart.name}'`);
          posMap.set(matchedPart.name, explodedPos);
        }
      }
    });

    console.log('[AI Hook] Position Map Keys:', Array.from(posMap.keys()));
    return posMap;
  }, []);

  /**
   * 메인 Effect: AI 분석 실행
   */
  useEffect(() => {
    if (!thumbnailUrl || useFallback) {
      return;
    }

    // AI 분석 실행
    const partIds = parts.map(p => p.name);

    analyzeAssemblyWithAI(thumbnailUrl, partIds).then(result => {
      if (result) {
        setAiResult(result);
        const pos = calculatePositionsFromAI(result, explodeFactor);
        setPositions(pos);
      }
    });
  }, [
    machineryId,
    thumbnailUrl,
    parts,
    useFallback,
    analyzeAssemblyWithAI,
    calculatePositionsFromAI,
    explodeFactor
  ]);

  /**
   * explodeFactor 변경 시 위치 재계산
   */
  useEffect(() => {
    if (!aiResult) return;

    const pos = calculatePositionsFromAI(aiResult, explodeFactor);
    setPositions(pos);
  }, [explodeFactor, aiResult, calculatePositionsFromAI]);

  /**
   * Fallback 강제 전환 함수
   */
  const forceFallback = useCallback(() => {
    console.log('[AI] Forcing fallback to traditional method');
    setUseFallback(true);
    setError('Using fallback method');
  }, []);

  /**
   * AI 재시도 함수
   */
  const retryAI = useCallback(() => {
    console.log('[AI] Retrying AI analysis');
    setUseFallback(false);
    setError(null);
    setAiResult(null);

    // 캐시 삭제 (Service에 위임 - Service는 v2/v3 등의 키를 관리하므로 Service에서 clearCache 호출 필요)
    // 하지만 Service clearCache는 동기적이지 않거나 복잡할 수 있음.
    // 여기서는 간단히 상태만 리셋하고, Service의 강제 분석 옵션을 사용할 수도 있음.
    // 현재는 hook에서의 캐시 사용을 제거했으므로, Service가 캐시를 무시하게 하거나 새로운 키를 쓰게 해야 함.
    // 일단 여기서는 로컬 상태만 초기화.

    // TODO: Service에 clearCache 기능 강화 필요
    aiAssemblyService.clearCache(machineryId);
  }, [machineryId]);

  return {
    positions,
    loading,
    error,
    aiResult,
    useFallback,
    forceFallback,
    retryAI,
    confidence: aiResult?.confidence || 0
  };
}

/**
 * calculateExplodePosition_ai
 * AI 결과 기반 분해 위치 계산 (기존 함수와 호환)
 */
export function calculateExplodePosition_ai(
  aiPartData: { position: [number, number, number]; explodeDirection: [number, number, number] },
  explodeFactor: number,
  explodeDistance: number = 15
): THREE.Vector3 {
  const assembledPos = new THREE.Vector3(...aiPartData.position);
  const explodeDir = new THREE.Vector3(...aiPartData.explodeDirection).normalize();

  return assembledPos.clone().add(
    explodeDir.multiplyScalar(explodeFactor * explodeDistance)
  );
}
