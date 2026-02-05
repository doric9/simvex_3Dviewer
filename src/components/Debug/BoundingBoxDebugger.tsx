// src/components/Debug/BoundingBoxDebugger.tsx
// v0.3.3: 실시간 BoundingBox 시각화 디버그 UI

import React, { useEffect, useState } from 'react';
import type { AssemblyConstraintResolver } from '../../utils/assemblyConstraintResolver';
import * as THREE from 'three';

interface BBoxInfo {
    partName: string;
    box: THREE.Box3;
    size: THREE.Vector3;
    position?: THREE.Vector3;
}

interface BoundingBoxDebuggerProps {
    resolver: AssemblyConstraintResolver | null;
    machineryId: string;
}

export const BoundingBoxDebugger: React.FC<BoundingBoxDebuggerProps> = ({
    resolver,
    machineryId
}) => {
    const [bboxData, setBboxData] = useState<BBoxInfo[]>([]);
    const [isExpanded, setIsExpanded] = useState(true);

    useEffect(() => {
        if (!resolver) {
            setBboxData([]);
            return;
        }

        // BoundingBox 정보 가져오기
        const allBBoxes = resolver.getAllBoundingBoxes();
        const resolvedPositions = resolver.resolveAll();

        const data: BBoxInfo[] = [];
        allBBoxes.forEach((value, partName) => {
            data.push({
                partName,
                box: value.box,
                size: value.size,
                position: resolvedPositions.get(partName)
            });
        });

        setBboxData(data);
    }, [resolver, machineryId]);

    if (bboxData.length === 0) {
        return null;
    }

    return (
        <div style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            width: '400px',
            maxHeight: '80vh',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            border: '2px solid #00ff00',
            borderRadius: '8px',
            padding: '16px',
            color: '#00ff00',
            fontFamily: 'monospace',
            fontSize: '12px',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '0 4px 20px rgba(0, 255, 0, 0.3)'
        }}>
            {/* 헤더 */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
                borderBottom: '1px solid #00ff00',
                paddingBottom: '8px'
            }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    🔍 BoundingBox Debugger
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    style={{
                        backgroundColor: 'transparent',
                        border: '1px solid #00ff00',
                        color: '#00ff00',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        fontSize: '10px'
                    }}
                >
                    {isExpanded ? '▼ 최소화' : '▶ 펼치기'}
                </button>
            </div>

            {/* Machinery ID */}
            <div style={{ marginBottom: '12px', fontSize: '11px', color: '#ffff00' }}>
                <strong>Machinery:</strong> {machineryId}
            </div>

            {/* 부품 목록 */}
            {isExpanded && (
                <div>
                    {bboxData.map((item, index) => (
                        <div
                            key={item.partName}
                            style={{
                                marginBottom: '16px',
                                padding: '12px',
                                backgroundColor: 'rgba(0, 255, 0, 0.1)',
                                borderRadius: '6px',
                                border: '1px solid rgba(0, 255, 0, 0.3)'
                            }}
                        >
                            {/* 부품 이름 */}
                            <div style={{
                                fontSize: '13px',
                                fontWeight: 'bold',
                                marginBottom: '8px',
                                color: '#00ffff'
                            }}>
                                [{index + 1}] {item.partName}
                            </div>

                            {/* BoundingBox 크기 */}
                            <div style={{ marginBottom: '6px' }}>
                                <div style={{ color: '#888', fontSize: '10px', marginBottom: '2px' }}>
                                    📦 Size (W×H×D):
                                </div>
                                <div style={{ paddingLeft: '8px' }}>
                                    <span style={{ color: '#ff6666' }}>X: {item.size.x.toFixed(2)}</span>
                                    {' × '}
                                    <span style={{ color: '#66ff66' }}>Y: {item.size.y.toFixed(2)}</span>
                                    {' × '}
                                    <span style={{ color: '#6666ff' }}>Z: {item.size.z.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* BoundingBox Min/Max */}
                            <div style={{ marginBottom: '6px' }}>
                                <div style={{ color: '#888', fontSize: '10px', marginBottom: '2px' }}>
                                    📍 BBox Range:
                                </div>
                                <div style={{ paddingLeft: '8px', fontSize: '10px' }}>
                                    <div>
                                        Min: ({item.box.min.x.toFixed(1)}, {item.box.min.y.toFixed(1)}, {item.box.min.z.toFixed(1)})
                                    </div>
                                    <div>
                                        Max: ({item.box.max.x.toFixed(1)}, {item.box.max.y.toFixed(1)}, {item.box.max.z.toFixed(1)})
                                    </div>
                                </div>
                            </div>

                            {/* 조립 위치 */}
                            {item.position && (
                                <div>
                                    <div style={{ color: '#888', fontSize: '10px', marginBottom: '2px' }}>
                                        🎯 Assembly Position:
                                    </div>
                                    <div style={{ paddingLeft: '8px' }}>
                                        <span style={{ color: '#ff6666' }}>X: {item.position.x.toFixed(2)}</span>
                                        {', '}
                                        <span style={{ color: '#66ff66' }}>Y: {item.position.y.toFixed(2)}</span>
                                        {', '}
                                        <span style={{ color: '#6666ff' }}>Z: {item.position.z.toFixed(2)}</span>
                                    </div>
                                </div>
                            )}

                            {/* Y축 시각화 바 */}
                            {item.position && (
                                <div style={{ marginTop: '8px' }}>
                                    <div style={{ color: '#888', fontSize: '10px', marginBottom: '4px' }}>
                                        📊 Y-Axis Stack:
                                    </div>
                                    <div style={{
                                        position: 'relative',
                                        height: '20px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        borderRadius: '4px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            position: 'absolute',
                                            left: '0',
                                            top: '0',
                                            height: '100%',
                                            width: `${Math.min((item.position.y / 30) * 100, 100)}%`,
                                            backgroundColor: '#66ff66',
                                            transition: 'width 0.3s ease'
                                        }} />
                                        <div style={{
                                            position: 'absolute',
                                            left: '50%',
                                            top: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            fontSize: '10px',
                                            fontWeight: 'bold',
                                            color: '#000',
                                            mixBlendMode: 'difference'
                                        }}>
                                            Y: {item.position.y.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* 통계 요약 */}
                    <div style={{
                        marginTop: '16px',
                        padding: '12px',
                        backgroundColor: 'rgba(255, 255, 0, 0.1)',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 0, 0.3)'
                    }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#ffff00' }}>
                            📈 통계
                        </div>
                        <div style={{ fontSize: '11px' }}>
                            <div>총 부품 수: {bboxData.length}개</div>
                            <div>
                                최대 높이: {Math.max(...bboxData.map(d => d.position?.y || 0)).toFixed(2)}
                            </div>
                            <div>
                                평균 부품 크기: {(
                                    bboxData.reduce((sum, d) => sum + d.size.y, 0) / bboxData.length
                                ).toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
