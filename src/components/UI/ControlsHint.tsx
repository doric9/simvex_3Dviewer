import { useState } from 'react';

const ControlsHint = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="absolute top-4 right-4 z-10 font-sans transition-all duration-300">
            {/* 1. 항상 보이는 최소화 버튼 (아이콘만 표시) */}
            {!isExpanded && (
                <button
                    onClick={() => setIsExpanded(true)}
                    className="bg-black/40 hover:bg-black/60 text-white w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10 shadow-lg text-xs"
                    title="조작 가이드"
                >
                    ?
                </button>
            )}

            {/* 2. 확장된 상태 (깔끔한 텍스트 위주) */}
            {isExpanded && (
                <div className="bg-black/70 text-gray-200 p-3 rounded-lg backdrop-blur-md shadow-xl border border-white/10 text-xs w-[180px] animate-fadeIn">
                    <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-1">
                        <span className="font-semibold text-white">조작 방법</span>
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="text-gray-400 hover:text-white"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between">
                            <span>좌클릭</span>
                            <span className="text-white font-medium">회전</span>
                        </div>
                        <div className="flex justify-between">
                            <span>우클릭</span>
                            <span className="text-red-300 font-medium">이동</span>
                        </div>
                        <div className="flex justify-between">
                            <span>휠</span>
                            <span className="text-white font-medium">확대/축소</span>
                        </div>
                        <div className="flex justify-between mt-2 pt-2 border-t border-white/10 text-gray-400">
                            <span>더블클릭</span>
                            <span>초기화</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ControlsHint;
