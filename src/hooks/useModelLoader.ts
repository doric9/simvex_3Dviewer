import { useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
// @ts-ignore
import { Machinery } from '../../types';

export function useModelLoader(machinery: Machinery) {
    const [models, setModels] = useState<Map<string, THREE.Group>>(new Map());
    const [originalPositions, setOriginalPositions] = useState<Map<string, THREE.Vector3>>(new Map());
    const [error, setError] = useState<string | null>(null);

    // Prepare URLs
    const modelPaths = useMemo(() => {
        return machinery.parts.map((part: any) => {
            // Encode URL to handle spaces in filenames
            // encodeURI encodes spaces to %20 but leaves slashes alone.
            return encodeURI(part.file);
        });
    }, [machinery]);

    // Load models using Drei's useGLTF
    // This hook will suspend the component until loaded
    const gltfs = useGLTF(modelPaths);

    useEffect(() => {
        if (!gltfs) return;

        const loadedModels = new Map<string, THREE.Group>();
        const positions = new Map<string, THREE.Vector3>();

        try {
            // gltfs is an array of GLTF results corresponding to modelPaths
            // If only one model, useGLTF might return single object, but we passed array so valid.
            const results = Array.isArray(gltfs) ? gltfs : [gltfs];

            results.forEach((gltf, index) => {
                const part = machinery.parts[index];
                const model = gltf.scene.clone(); // Clone to allow re-use if needed

                // Enable shadows
                model.traverse((child: any) => {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        if (child.material) {
                            child.material.envMapIntensity = 1;
                            child.material.needsUpdate = true;
                        }
                    }
                });

                model.userData = { partName: part.name };

                // Scale up the model
                const scale = 100;
                model.scale.set(scale, scale, scale);

                // Calculate Bounding Box to find the center offset (logical position)
                // We must update the matrix world for the scales to apply before box calculation
                // However, since the model is not in the scene graph yet, we update local matrix and use it.
                model.updateMatrix();

                const box = new THREE.Box3().setFromObject(model);
                const center = new THREE.Vector3(0, 0, 0);
                if (!box.isEmpty()) {
                    box.getCenter(center);
                }

                // Use explicit position from data if available, otherwise use calculated center
                const explicitPos = part.position;
                const x = explicitPos ? explicitPos[0] : center.x;
                const y = explicitPos ? explicitPos[1] : center.y;
                const z = explicitPos ? explicitPos[2] : center.z;

                // Apply assembly offset for visual positioning
                const assemblyOffset = part.assemblyOffset || [0, 0, 0];
                model.position.set(assemblyOffset[0], assemblyOffset[1], assemblyOffset[2]);

                // We wrap in a group to handle positioning cleanly if needed, 
                // but here 'model' is the scene which is a Group usually.
                // To be safe and consistent with previous logic:
                const group = new THREE.Group();
                group.add(model);

                loadedModels.set(part.name, group);
                positions.set(part.name, new THREE.Vector3(x, y, z));
            });

            setModels(loadedModels);
            setOriginalPositions(positions);
        } catch (err: any) {
            console.error('❌ Error processing loaded models:', err);
            setError(err.message);
        }

    }, [gltfs, machinery]);

    return {
        models,
        originalPositions,
        isLoading: false, // Suspense handles loading state
        error
    };
}
