// src/components/Viewer/ModelGroup_ai.tsx
// AI-powered ModelGroup with Constraint Resolver for tight assembly

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { Machinery } from '../../types';
import { useModelAnimations_ai } from '../../hooks/useModelAnimations_ai';
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

      resolved.forEach((resPos, id) => {
        const dir = getExplodeDir(id);

        const partIndex = machinery.parts.findIndex(p => p.name === id);
        const sequenceMultiplier = partIndex >= 0 ? partIndex : 0;

        const partData = machinery.parts.find(p => p.name === id);

        // [Manual Priority] 
        const pos = (partData?.position) ? new THREE.Vector3(...partData.position) : resPos;

        // [Synchronous Differential Velocity - v0.5.0 Reversion]
        // Every part moves simultaneously over 0-1, but with unique target distances
        // If custom distance missing, we use (Index * 40) as the technical gap
        const defaultTargetDistance = sequenceMultiplier * 40;
        const customDistance = partData?.explodeDistance;
        const targetDistance = customDistance !== undefined ? customDistance : defaultTargetDistance;

        const customSpeed = partData?.explodeSpeed ?? 1.0;
        const animFactor = Math.min(1.0, explodeFactor * customSpeed);

        // Target: Assembled position + (Direction * Distance)
        const targetPos = pos.clone().add(
          dir.clone().multiplyScalar(targetDistance)
        );

        // Movement: Synchronous but distinct due to VELOCITY DIFFERENCE
        const finalPos = pos.clone().lerp(targetPos, animFactor);

        exploded.set(id, finalPos);
      });
      setResolvedPositions(exploded);
    }
  }, [aiResult, meshCount, explodeFactor, machinery.parts, resolver, machinery.id]);

  // [Gauranteed Technical Animation]
  // This logic is independent of AI and ensures perfect technical fidelity for "Tuned" models.
  const manualSequentialPositions = useMemo(() => {
    const map = new Map<string, THREE.Vector3>();

    machinery.parts.forEach((part, index) => {
      const id = part.name;
      const assembledPos = new THREE.Vector3(...(part.position || [0, 0, 0]));

      // Determine explode direction (Manual > AI metadata > Default Up)
      let dir = new THREE.Vector3(0, 1, 0);
      if (part.explodeDirection) {
        dir = new THREE.Vector3(...part.explodeDirection);
      } else if (aiResult) {
        // Fallback to AI's direction if manual is missing
        const aiPart = aiResult.parts.find(p => p.id === id);
        if (aiPart) dir = new THREE.Vector3(...aiPart.explodeDirection);
      }

      // [Synchronous Differential Velocity - v0.5.0 Reversion]
      const defaultTargetDistance = index * 40;
      const customDistance = part.explodeDistance;
      const targetDistance = customDistance !== undefined ? customDistance : defaultTargetDistance;
      const customSpeed = part.explodeSpeed ?? 1.0;

      const animFactor = Math.min(1.0, explodeFactor * customSpeed);

      const finalPos = assembledPos.clone().add(
        dir.clone().multiplyScalar(targetDistance * animFactor)
      );

      map.set(id, finalPos);
    });
    return map;
  }, [machinery.parts, explodeFactor, aiResult]);

  // Final Merge
  const finalPositions = useMemo(() => {
    // [User Priority] If it's a tuned model like Suspension, ALWAYS use manual sequential logic
    // or if we have high-confidence manual positions, use them as 'Base Truth'
    const isTunedModel = ['Suspension', 'V4_Engine', 'Drone'].includes(machinery.id);

    if (isTunedModel) return manualSequentialPositions;
    if (useFallback || aiError) return manualSequentialPositions;

    // For experimental AI-first models, prioritize resolver result
    if (resolvedPositions.size > 0) return resolvedPositions;

    return manualSequentialPositions;
  }, [manualSequentialPositions, resolvedPositions, useFallback, aiError, machinery.id]);

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
          // Synchronous rotation 5 full turns over global factor
          rotation = [0, explodeFactor * Math.PI * 10, 0];
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
