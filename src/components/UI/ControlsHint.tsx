// src/components/UI/ControlsHint.tsx
// 카메라 컨트롤 안내 UI (v0.3.3)

import React, { useState } from 'react';

export const ControlsHint: React.FC = () => {
    const [isVisible, setIsVisible] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    if (!isVisible) {
        return (
            <button
                onClick={() => setIsVisible(true)}
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    left: '20px',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    cursor: 'pointer',
                    fontSize: '18px',
                    zIndex: 900
                }}
                title="컨트롤 안내 보기"
            >
                ?
            </button>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '12px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            zIndex: 900,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            maxWidth: isExpanded ? '280px' : '200px',
            transition: 'all 0.3s ease'
        }}>
            {/* 헤더 */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
            }}>
                <span style={{ fontWeight: 'bold', fontSize: '13px' }}>
                    🎮 조작 안내
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#aaa',
                            cursor: 'pointer',
                            fontSize: '10px',
                            padding: '2px 6px'
                        }}
                    >
                        {isExpanded ? '접기' : '더보기'}
                    </button>
                    <button
                        onClick={() => setIsVisible(false)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#aaa',
                            cursor: 'pointer',
                            fontSize: '14px',
                            padding: '0 4px'
                        }}
                    >
                        ×
                    </button>
                </div>
            </div>

            {/* 마우스 컨트롤 */}
            <div style={{ marginBottom: isExpanded ? '12px' : '0' }}>
                <div style={{ color: '#888', fontSize: '10px', marginBottom: '4px' }}>🖱️ 마우스</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '8px' }}>
                    <div><span style={{ color: '#66b3ff' }}>좌클릭 드래그</span>: 화면 이동</div>
                    <div><span style={{ color: '#ff6666' }}>우클릭 드래그</span>: 회전</div>
                    <div><span style={{ color: '#66ff66' }}>휠 스크롤</span>: 줌 인/아웃</div>
                </div>
            </div>

            {/* 확장 시 추가 정보 */}
            {isExpanded && (
                <>
                    {/* 키보드 컨트롤 */}
                    <div style={{ marginBottom: '12px' }}>
                        <div style={{ color: '#888', fontSize: '10px', marginBottom: '4px' }}>⌨️ 키보드</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '8px' }}>
                            <div><span style={{ color: '#ffcc66' }}>W/A/S/D</span>: 카메라 이동</div>
                            <div><span style={{ color: '#ffcc66' }}>Q/E</span>: 높이 조절</div>
                            <div><span style={{ color: '#ffcc66' }}>R</span>: 카메라 리셋</div>
                        </div>
                    </div>

                    {/* 터치 컨트롤 */}
                    <div>
                        <div style={{ color: '#888', fontSize: '10px', marginBottom: '4px' }}>👆 터치 (모바일)</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '8px' }}>
                            <div><span style={{ color: '#cc99ff' }}>한 손가락</span>: 회전</div>
                            <div><span style={{ color: '#cc99ff' }}>두 손가락 드래그</span>: 이동</div>
                            <div><span style={{ color: '#cc99ff' }}>두 손가락 핀치</span>: 줌</div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ControlsHint;
