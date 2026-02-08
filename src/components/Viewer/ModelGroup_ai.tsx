// src/components/Viewer/ModelGroup_ai.tsx
// AI-powered ModelGroup with Constraint Resolver for tight assembly

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { Machinery, MachineryPart } from '../../types';
import { useModelAnimations_ai } from '../../hooks/useModelAnimations_ai';
import { useModelAnimations } from '../../hooks/useModelAnimations'; // Fallback
import { AIStatusIndicator } from '../AIStatusIndicator/AIStatusIndicator';
import { AssemblyConstraintResolver } from '../../utils/assemblyConstraintResolver';

interface ModelGroupProps {
  machinery: Machinery;
  explodeFactor: number;
  onPartClick?: (partId: string) => void;
  selectedPart?: string | null;
}

const MachinePart = ({
  partName,
  filePath,
  position,
  isSelected,
  onClick,
  onLoaded,
  globalScale,
  rotation
}: {
  partName: string;
  filePath: string;
  position: THREE.Vector3;
  isSelected: boolean;
  onClick: (e: any) => void;
  onLoaded?: (partName: string, object: THREE.Object3D) => void;
  globalScale: number;
  rotation?: [number, number, number];
}) => {
  const { scene } = useGLTF(filePath);
  const clone = useMemo(() => scene.clone(), [scene]);

  // Apply rotation if provided
  useEffect(() => {
    if (clone && rotation) {
      clone.rotation.set(...rotation);
    }
  }, [clone, rotation]);

  // Notify parent when mesh is loaded
  useEffect(() => {
    if (clone && onLoaded) {
      onLoaded(partName, clone);
    }
  }, [clone, partName, onLoaded]);

  return (
    <primitive
      object={clone}
      position={[position.x, position.y, position.z]}
      onClick={onClick}
      scale={isSelected ? globalScale * 1.1 : globalScale}
    >
      {isSelected && (
        <meshStandardMaterial
          color="#ffff00"
          emissive="#ffff00"
          emissiveIntensity={0.3}
          transparent
          opacity={0.8}
        />
      )}
    </primitive>
  );
};

export const ModelGroup_ai: React.FC<ModelGroupProps> = ({
  machinery,
  explodeFactor,
  onPartClick,
  selectedPart
}) => {
  // AI Hook
  const {
    positions: aiExplodedPositions, // Default exploded positions from hook (fallback for resolver failure)
    loading: aiLoading,
    error: aiError,
    useFallback,
    forceFallback,
    retryAI,
    confidence,
    aiResult // Get full AI result including constraints
  } = useModelAnimations_ai(
    machinery.parts,
    explodeFactor,
    // If this is Suspension model, use the specific assembly diagram for better AI analysis
    machinery.id === 'Suspension' ? '/models/Suspension/서스펜션 조립도.png' : machinery.thumbnail
  );

  // Fallback Hook
  const { calculateExplodePosition } = useModelAnimations(
    explodeFactor,
    selectedPart || null
  );

  // Resolver State
  const resolver = useMemo(() => new AssemblyConstraintResolver(machinery.parts), [machinery.parts]);
  const [meshCount, setMeshCount] = useState(0);
  const [resolvedPositions, setResolvedPositions] = useState<Map<string, THREE.Vector3>>(new Map());
  const [globalScale, setGlobalScale] = useState(1.0);

  // Mesh Loading Callback
  const handleMeshLoaded = useCallback((partName: string, object: THREE.Object3D) => {
    // 1. Register mesh (temporarily with current global scale, but we will update it)
    resolver.registerMesh(partName, object, 1.0); // Register with 1.0, we handle sizing via global scale later

    // 2. If this is the BASE part, calculate global scale
    // Logic: If Base is < 5 units, scale up to 20 units.
    const isBase = partName.toLowerCase() === 'base' || machinery.parts.find(p => p.name === partName)?.isGround;

    if (isBase) {
      const box = new THREE.Box3().setFromObject(object);
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);

      let newScale = 1.0;
      if (maxDim < 5) newScale = 20 / maxDim; // Scale up tiny models
      else if (maxDim > 1000) newScale = 100 / maxDim; // Scale down huge models

      console.log(`[ModelGroup] Base Part (${partName}) Size: ${maxDim.toFixed(3)}. Setting Global Scale: ${newScale}`);
      setGlobalScale(newScale);
      resolver.setGlobalScale(newScale); // Update resolver
    }

    setMeshCount(c => c + 1);
  }, [resolver, machinery.parts]);

  // Calculate Positions using Resolver (if AI constraints available)
  useEffect(() => {
    if (aiResult && aiResult.parts && meshCount > 0) {
      console.log('[ModelGroup] Resolving positions with AI constraints...', aiResult.parts);

      // 1. Update Resolver with AI Constraints
      aiResult.parts.forEach(aiPart => {
        if (aiPart.constraint) {
          // Try to find matching part (Case-insensitive & Partial Match)
          const normalize = (s: string) => s.toLowerCase().replace(/[\s\-_]/g, '');
          const aiIdNorm = normalize(aiPart.id);

          const originalPart = machinery.parts.find(p => {
            const pNorm = normalize(p.name);
            return pNorm === aiIdNorm || pNorm.includes(aiIdNorm) || aiIdNorm.includes(pNorm);
          });

          if (originalPart) {
            console.log(`[ModelGroup] Applying AI constraint to ${originalPart.name} (AI ID: ${aiPart.id}):`, aiPart.constraint);
            resolver.updatePartConstraint(originalPart.name, aiPart.constraint);
          } else {
            console.warn(`[ModelGroup] Failed to find matching part for AI ID: ${aiPart.id}`);
          }
        }
      });

      // 2. Resolve
      const resolved = resolver.resolveAll(); // Returns Assembled Positions (0,0,0 relative)

      // 3. Apply Explosion
      const exploded = new Map<string, THREE.Vector3>();

      // Helper for matching AI explode direction (also needs normalization)
      const getExplodeDir = (partId: string) => {
        // [User Request] Force Up (+Y) for Suspension to fix -Z drift issues
        const isSuspension = machinery.id === 'Suspension' || machinery.name === '서스펜션';
        if (isSuspension) {
          console.log(`[DEBUG] Forcing +Y Explode Direction for Suspension (${machinery.id})`);
          return new THREE.Vector3(0, 1, 0);
        }

        const normalize = (s: string) => s.toLowerCase().replace(/[\s\-_]/g, '');
        const pNorm = normalize(partId);
        const aiPart = aiResult.parts.find(ap => {
          const apNorm = normalize(ap.id);
          return apNorm === pNorm || apNorm.includes(pNorm) || pNorm.includes(apNorm);
        });
        return aiPart ? new THREE.Vector3(...aiPart.explodeDirection) : new THREE.Vector3(0, 1, 0);
      };

      resolved.forEach((pos, id) => {
        const dir = getExplodeDir(id);

        // Find part index in assembly order (default to 0 if not found)
        // Normalize for robust finding
        const normalize = (s: string) => s.toLowerCase().replace(/[\s\-_]/g, '');
        const idNorm = normalize(id);
        const orderIndex = aiResult.assemblyOrder.findIndex(o => {
          const oNorm = normalize(o);
          return oNorm === idNorm || oNorm.includes(idNorm) || idNorm.includes(oNorm);
        });

        // Sequential Explosion Multiplier (0 for Base, 1 for next, etc.)
        // Ensure distinct movement for each part in the chain
        let sequenceMultiplier = orderIndex >= 0 ? orderIndex : 1;

        const isSuspension = machinery.id === 'Suspension' || machinery.name === '서스펜션';
        const distance = isSuspension ? 6 : 20; // [User Request] Calibrate Suspension speed (Match 12%->40%)

        // [User Request] Explosion Animation: 0% = Assembled (Fixed Polarity)
        const animFactor = explodeFactor;

        if (isSuspension) {
          if (idNorm.includes('spring')) sequenceMultiplier = 2; // Move least
          if (idNorm.includes('nut')) sequenceMultiplier = 4; // Move middle
          if (idNorm.includes('rod')) sequenceMultiplier = 6; // Move most (Seperated well at 0%)
        }

        let initialOffset_or_pos = pos.clone();
        if (isSuspension && (idNorm.includes('rod') || idNorm === 'rod')) {
          initialOffset_or_pos = new THREE.Vector3(0, 21.0, 0);
        } else if (isSuspension && idNorm.includes('spring')) {
          initialOffset_or_pos = new THREE.Vector3(0, 0, 0);
        } else if (isSuspension && idNorm.includes('nut')) {
          initialOffset_or_pos = new THREE.Vector3(0, 19.8, 0);
        }

        const finalPos = initialOffset_or_pos
          .add(dir.multiplyScalar(animFactor * distance * sequenceMultiplier)); // Apply animation (Reverse for Suspension)

        exploded.set(id, finalPos);
      });
      setResolvedPositions(exploded);
    }
  }, [aiResult, meshCount, explodeFactor, machinery.parts, resolver]); // Dependencies

  // Fallback Logic
  const fallbackPositions = useMemo(() => {
    const map = new Map<string, THREE.Vector3>();
    const center = new THREE.Vector3(0, 0, 0);

    machinery.parts.forEach(part => {
      const originalPos = new THREE.Vector3(...(part.position || [0, 0, 0]));

      // [User Request] Ensure fallback also follows forced Y-Axis logic for Suspension
      let direction = part.explodeDirection;
      const isSuspension = machinery.id === 'Suspension' || machinery.name === '서스펜션';
      if (isSuspension) {
        direction = [0, 1, 0];
      }

      const pos = calculateExplodePosition(
        originalPos,
        center,
        explodeFactor,
        direction,
        part.isGround,
        part.assemblyOffset
      );

      // [User Request] Force Rod Offset in Fallback too
      const normalize = (s: string) => s.toLowerCase().replace(/[\s\-_]/g, '');
      const idNorm = normalize(part.name);

      const isSuspensionFallback = machinery.id === 'Suspension' || machinery.name === '서스펜션';
      const animFactorFallback = explodeFactor;

      if (isSuspensionFallback && (idNorm.includes('rod') || idNorm === 'rod')) {
        const fallbackDistance = 6 * animFactorFallback * 6; // Use calibrated 6
        pos.set(0, 21.0 + fallbackDistance, 0);
      } else if (isSuspensionFallback && idNorm.includes('spring')) {
        const fallbackDistance = 6 * animFactorFallback * 2;
        pos.set(0, 0 + fallbackDistance, 0);
      } else if (isSuspensionFallback && idNorm.includes('nut')) {
        const fallbackDistance = 6 * animFactorFallback * 4;
        pos.set(0, 19.8 + fallbackDistance, 0);
      }

      map.set(part.name, pos);
    });
    return map;
  }, [machinery.parts, explodeFactor, calculateExplodePosition, machinery.id, machinery.name]);

  // Final Merge
  const finalPositions = useMemo(() => {
    if (useFallback || aiError) return fallbackPositions;

    // Prefer Resolved (Stacked) Positions > AI Exploded Positions > Fallback
    if (resolvedPositions.size > 0) return resolvedPositions;
    if (aiExplodedPositions.size > 0) return aiExplodedPositions;

    return fallbackPositions;
  }, [resolvedPositions, aiExplodedPositions, fallbackPositions, useFallback, aiError]);

  return (
    <group>
      <AIStatusIndicator
        loading={aiLoading}
        error={aiError}
        useFallback={useFallback}
        confidence={confidence}
        onRetry={retryAI}
        onForceFallback={forceFallback}
      />

      {machinery.parts.map(part => {
        const position = finalPositions.get(part.name) || new THREE.Vector3(0, 0, 0);
        const isSelected = selectedPart === part.name;

        // [User Request] Rotational Animation for NUT
        const normalize = (s: string) => s.toLowerCase().replace(/[\s\-_]/g, '');
        const idNorm = normalize(part.name);
        let rotation: [number, number, number] = [0, 0, 0];

        if (machinery.id === 'Suspension' && idNorm.includes('nut')) {
          // Rotate 5 full turns (10*PI) over the first 40% of explosion
          const rotationFactor = Math.min(explodeFactor / 0.4, 1.0);
          rotation = [0, rotationFactor * Math.PI * 10, 0];
        }
        // Check if part was matched in AI result
        // const pNorm = normalize(part.name);
        // const aiPart = aiResult?.parts.find(ap => {
        //   const apNorm = normalize(ap.id);
        //   return apNorm === pNorm || apNorm.includes(pNorm) || pNorm.includes(apNorm);
        // });
        // const hasConstraint = !!aiPart?.constraint;

        // DEBUG: Render Axes to show position even if model is invisible
        // <axesHelper args={[10]} position={[position.x, position.y, position.z]} />

        return (
          <group key={part.name}>
            <MachinePart
              partName={part.name}
              filePath={part.file}
              position={position}
              rotation={rotation}
              isSelected={isSelected}
              onClick={(e) => {
                e.stopPropagation();
                onPartClick?.(part.name);
              }}
              onLoaded={handleMeshLoaded}
              globalScale={globalScale}
            />
            {/* DEBUG OVERLAY REMOVED - User verified parts exist */}
          </group>
        );
      })}
    </group>
  );
};
