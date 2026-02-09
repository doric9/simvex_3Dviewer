// src/components/UI/ControlsHint.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, Mouse, HelpCircle, X } from 'lucide-react';

export const ControlsHint: React.FC = () => {
    const [isVisible, setIsVisible] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    if (!isVisible) {
        return (
            <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsVisible(true)}
                className="fixed bottom-6 left-6 w-12 h-12 bg-gray-900/80 backdrop-blur-md text-white rounded-2xl flex items-center justify-center shadow-xl z-50 border border-white/10"
                title="조작 안내 보기"
            >
                <HelpCircle className="w-6 h-6" />
            </motion.button>
        );
    }

    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-6 left-6 z-50 flex flex-col gap-3 pointer-events-none"
        >
            <div className="bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-[1.5rem] shadow-2xl p-5 pointer-events-auto min-w-[200px] max-w-[280px]">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-primary/20 rounded-lg flex items-center justify-center">
                            <Mouse className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm font-black text-white tracking-tight">조작 안내</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-1 px-2 text-[10px] font-bold text-gray-400 hover:text-white transition-colors"
                        >
                            {isExpanded ? '간소하게' : '더보기'}
                        </button>
                        <button
                            onClick={() => setIsVisible(false)}
                            className="p-1 text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Mouse Controls */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span className="text-[11px] font-bold text-gray-300">카메라 회전</span>
                        </div>
                        <span className="text-[10px] font-black text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded-md border border-rose-400/20">좌클릭 드래그</span>
                    </div>

                    <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span className="text-[11px] font-bold text-gray-300">화면 이동</span>
                        </div>
                        <span className="text-[10px] font-black text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-md border border-blue-400/20">우클릭 드래그</span>
                    </div>

                    <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[11px] font-bold text-gray-300">확대 / 축소</span>
                        </div>
                        <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-400/20">마우스 휠</span>
                    </div>
                </div>

                {/* Expanded Sections */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-4 mt-4 border-t border-white/5 space-y-4">
                                {/* Keyboard */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Keyboard className="w-3.5 h-3.5 text-orange-400" />
                                        <span className="text-[10px] font-bold text-gray-500 tracking-wider">KEYBOARD</span>
                                    </div>
                                    <div className="space-y-2 pl-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-gray-400">이동</span>
                                            <span className="text-[10px] font-black text-orange-400">W A S D</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-gray-400">높이</span>
                                            <span className="text-[10px] font-black text-orange-400">Q / E</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-gray-400">리셋</span>
                                            <span className="text-[10px] font-black text-orange-400">R</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Touch */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                        <span className="text-[10px] font-bold text-gray-500 tracking-wider">TOUCH (MOBILE)</span>
                                    </div>
                                    <div className="space-y-2 pl-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-gray-400">회전</span>
                                            <span className="text-[10px] font-black text-indigo-400">한 손가락</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-gray-400">이동</span>
                                            <span className="text-[10px] font-black text-indigo-400">두 손가락</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default ControlsHint;
