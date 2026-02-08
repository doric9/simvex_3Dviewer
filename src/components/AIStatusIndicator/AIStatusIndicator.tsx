// src/components/AIStatusIndicator/AIStatusIndicator.tsx
// AI 상태 표시 UI 컴포넌트

import React from 'react';
import { Html } from '@react-three/drei';

interface AIStatusIndicatorProps {
  loading: boolean;
  error: string | null;
  useFallback: boolean;
  confidence: number;
  onRetry: () => void;
  onForceFallback: () => void;
}

export const AIStatusIndicator: React.FC<AIStatusIndicatorProps> = ({
  loading,
  error,
  useFallback,
  confidence,
  onRetry,
  onForceFallback
}) => {
  // Auto-dismiss success message
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    if (!loading && !error && !useFallback && confidence > 0) {
      const timer = setTimeout(() => setVisible(false), 1000); // 3s -> 1s
      return () => clearTimeout(timer);
    } else {
      setVisible(true);
    }
  }, [loading, error, useFallback, confidence]);

  if (!visible) return null;

  if (!loading && !error && !useFallback && confidence === 0) {
    return null; // 아무것도 표시 안 함
  }

  return (
    <Html
      position={[0, 15, 0]}
      center
      style={{
        pointerEvents: 'auto',
        userSelect: 'none'
      }}
    >
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        border: loading ? '2px solid #3b82f6' : error ? '2px solid #ef4444' : useFallback ? '2px solid #f59e0b' : '2px solid #10b981',
        borderRadius: '12px',
        padding: '12px 20px',
        color: 'white',
        fontFamily: 'monospace',
        fontSize: '13px',
        minWidth: '250px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {/* 로딩 중 */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '16px',
              height: '16px',
              border: '3px solid #3b82f6',
              borderTop: '3px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <span>🤖 AI 분석 중...</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* 에러 */}
        {error && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>⚠️</span>
              <span style={{ color: '#ef4444' }}>AI 실패: {error}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                onClick={onRetry}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#3b82f6',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontFamily: 'monospace'
                }}
              >
                🔄 재시도
              </button>
              <button
                onClick={onForceFallback}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#64748b',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontFamily: 'monospace'
                }}
              >
                ⚙️ 기본 방식 사용
              </button>
            </div>
          </>
        )}

        {/* Fallback 사용 중 */}
        {useFallback && !loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>⚙️</span>
            <span style={{ color: '#f59e0b' }}>기본 방식 사용 중</span>
            <button
              onClick={onRetry}
              style={{
                padding: '4px 8px',
                backgroundColor: '#3b82f6',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '11px',
                fontFamily: 'monospace',
                marginLeft: 'auto'
              }}
            >
              AI 재시도
            </button>
          </div>
        )}

        {/* AI 성공 (신뢰도 표시) */}
        {!loading && !error && !useFallback && confidence > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>✨</span>
            <span style={{ color: '#10b981' }}>AI 분석 완료 (v0.5.0 Final Release)</span>
            <span style={{
              marginLeft: 'auto',
              padding: '2px 8px',
              backgroundColor: confidence >= 0.9 ? '#10b981' : confidence >= 0.7 ? '#f59e0b' : '#ef4444',
              borderRadius: '4px',
              fontSize: '11px'
            }}>
              {(confidence * 100).toFixed(0)}%
            </span>
          </div>
        )}
      </div>
    </Html>
  );
};
