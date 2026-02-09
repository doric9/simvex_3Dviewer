import { motion } from 'framer-motion';
import { Machinery } from '../../types';
import { Cog, ChevronRight, StickyNote, MessageCircle, Box } from 'lucide-react';
import { useMachineryProgress, useHasLearningActivity } from '../../hooks/useMachineryProgress';

interface MachineryCardProps {
  machinery: Machinery;
  onSelect: () => void;
}

export default function MachineryCard({ machinery, onSelect }: MachineryCardProps) {
  const progress = useMachineryProgress(machinery.id);
  const hasAnyActivity = useHasLearningActivity();

  const barColor =
    progress.progressPercent >= 80
      ? 'bg-green-500'
      : progress.progressPercent >= 40
        ? 'bg-blue-500'
        : 'bg-indigo-400';

  return (
    <motion.div
      whileHover={{ y: -8 }}
      onClick={() => {
        console.log('🖱️ Card Clicked:', machinery.name);
        onSelect();
      }}
      className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 overflow-hidden cursor-pointer flex flex-col h-full border border-gray-100/50 hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-300 group"
    >
      <div className="relative h-56 bg-gradient-to-br from-gray-50 to-blue-50/50 flex items-center justify-center overflow-hidden">
        <motion.img
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.6, ease: 'circOut' }}
          src={machinery.thumbnail}
          alt={machinery.name}
          className="w-full h-full object-contain p-8 drop-shadow-2xl"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <div className="hidden absolute inset-0 flex items-center justify-center bg-blue-50/50 backdrop-blur-sm">
          <Cog className="w-20 h-20 text-blue-200 animate-spin-slow" />
        </div>

        {hasAnyActivity && progress.progressPercent > 0 && (
          <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full border border-white shadow-sm flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black text-gray-800">{progress.progressPercent}%</span>
          </div>
        )}
      </div>

      <div className="p-8 flex-1 flex flex-col">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors tracking-tight line-clamp-1">
            {machinery.name}
          </h3>
          <p className="text-sm text-gray-500 mb-6 line-clamp-2 leading-relaxed font-medium min-h-[2.5rem]">
            {machinery.description}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-gray-50 pt-6 mt-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg">
              <Box className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[11px] font-bold text-gray-600">
                {machinery.parts.length} 부품
              </span>
            </div>
            {(progress.noteCount > 0 || progress.aiInteractionCount > 0) && (
              <div className="flex -space-x-1.5">
                {progress.noteCount > 0 && (
                  <div className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center border-2 border-white" title={`노트 ${progress.noteCount}개`}>
                    <StickyNote className="w-3 h-3 text-blue-500" />
                  </div>
                )}
                {progress.aiInteractionCount > 0 && (
                  <div className="w-6 h-6 bg-purple-50 rounded-full flex items-center justify-center border-2 border-white" title={`질문 ${progress.aiInteractionCount}개`}>
                    <MessageCircle className="w-3 h-3 text-purple-500" />
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white transition-all duration-300">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {hasAnyActivity && progress.progressPercent > 0 && (
          <div className="mt-4 h-1.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100/50">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${progress.progressPercent}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full ${barColor} rounded-full`}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
