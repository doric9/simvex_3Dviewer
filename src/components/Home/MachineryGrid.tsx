import { motion } from 'framer-motion';
import { machineryList, machineryData } from '../../data/machineryData';
import MachineryCard from './MachineryCard';
import {
  useLastStudiedMachinery,
  useHasLearningActivity,
  useMachineryProgress,
  getTimeAgo,
} from '../../hooks/useMachineryProgress';
import { Box, MessageCircle, HelpCircle, StickyNote, Search, ArrowRight } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
};

interface MachineryGridProps {
  onSelect: (id: string) => void;
}

function ContinueLearningHero({ onSelect }: { onSelect: (id: string) => void }) {
  const lastStudied = useLastStudiedMachinery();
  if (!lastStudied) return null;

  const machinery = machineryData[lastStudied.machineryId];
  if (!machinery) return null;

  return <ContinueLearningCard machinery={machinery} timestamp={lastStudied.timestamp} onSelect={() => onSelect(machinery.id)} />;
}

function ContinueLearningCard({
  machinery,
  timestamp,
  onSelect,
}: {
  machinery: (typeof machineryList)[number];
  timestamp: number;
  onSelect: () => void;
}) {
  const progress = useMachineryProgress(machinery.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="mb-14"
    >
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
        <span className="w-8 h-[1px] bg-gray-200"></span>
        이어서 학습하기
      </h3>
      <div
        onClick={onSelect}
        className="group relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 rounded-[2rem] p-8 sm:p-10 cursor-pointer shadow-2xl shadow-indigo-200 hover:shadow-indigo-300 transition-all duration-500 hover:-translate-y-1"
      >
        {/* Animated Background Orbs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-32 -mt-32 blur-[80px] group-hover:bg-white/20 transition-colors duration-700" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-400/20 rounded-full -ml-20 -mb-20 blur-[60px]" />

        <div className="relative flex flex-col sm:flex-row items-center gap-8 sm:gap-10">
          <div className="relative p-1 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl group-hover:scale-105 transition-transform duration-500">
            <img
              src={machinery.thumbnail}
              alt={machinery.name}
              className="w-32 h-32 object-contain p-4"
            />
          </div>

          <div className="flex-1 w-full text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-3">
              <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider border border-white/10">
                AI 추천 학습
              </span>
              <span className="text-white/60 text-xs font-medium">{getTimeAgo(timestamp)}</span>
            </div>

            <h4 className="text-3xl sm:text-4xl font-black text-white mb-4 tracking-tight">
              {machinery.name}
            </h4>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-white/80 mb-8">
              {progress.noteCount > 0 && (
                <span className="flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full border border-white/5">
                  <StickyNote className="w-4 h-4" />
                  노트 <span className="font-bold">{progress.noteCount}개</span>
                </span>
              )}
              {progress.aiInteractionCount > 0 && (
                <span className="flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full border border-white/5">
                  <MessageCircle className="w-4 h-4" />
                  AI 질문 <span className="font-bold">{progress.aiInteractionCount}개</span>
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-white/90 text-sm font-bold px-1">
                <span>학습 진행률</span>
                <span>{progress.progressPercent}%</span>
              </div>
              <div className="h-3 bg-black/20 rounded-full overflow-hidden p-0.5 border border-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.progressPercent}%` }}
                  transition={{ duration: 1.5, delay: 0.5, ease: 'circOut' }}
                  className="h-full bg-gradient-to-r from-blue-300 to-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                />
              </div>
            </div>
          </div>

          <div className="hidden lg:flex w-14 h-14 bg-white rounded-2xl items-center justify-center text-indigo-600 shadow-xl group-hover:translate-x-2 transition-transform duration-300">
            <ArrowRight className="w-7 h-7" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const features = [
  { icon: Box, label: '3D 뷰어', desc: '기계 구조를 입체적으로 탐색', color: 'text-blue-500', bg: 'bg-blue-50' },
  { icon: MessageCircle, label: 'AI 도우미', desc: '궁금한 점을 즉시 질문', color: 'text-purple-500', bg: 'bg-purple-50' },
  { icon: HelpCircle, label: '퀴즈', desc: '학습 내용을 문제로 확인', color: 'text-orange-500', bg: 'bg-orange-50' },
  { icon: StickyNote, label: '노트', desc: '부품별 메모를 자유롭게 작성', color: 'text-green-500', bg: 'bg-green-50' },
  { icon: Search, label: '지식 검색', desc: '기계 관련 지식을 빠르게 탐색', color: 'text-rose-500', bg: 'bg-rose-50' },
];

function FeatureOverview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mb-14"
    >
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
        <span className="w-8 h-[1px] bg-gray-200"></span>
        SimVex로 학습하는 방법
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {features.map((f) => (
          <motion.div
            key={f.label}
            whileHover={{ y: -5 }}
            className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-gray-100 transition-all duration-300 group"
          >
            <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
              <f.icon className={`w-6 h-6 ${f.color}`} />
            </div>
            <p className="text-sm font-bold text-gray-800 mb-1">{f.label}</p>
            <p className="text-[11px] text-gray-500 leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default function MachineryGrid({ onSelect }: MachineryGridProps) {
  const hasActivity = useHasLearningActivity();

  return (
    <div className="w-full h-full p-8 overflow-auto bg-[#fafafa]">
      <div className="max-w-7xl mx-auto py-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-6 tracking-tight">
            어떤 장비를 <span className="text-primary italic">탐구</span>해볼까요?
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto font-medium">
            정교하게 모델링된 3D 장비를 통해 기계 공학의 원리를 생생하게 학습하세요.
          </p>
        </motion.div>

        {hasActivity ? (
          <ContinueLearningHero onSelect={onSelect} />
        ) : (
          <FeatureOverview />
        )}

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
        >
          {machineryList.map((machinery) => (
            <motion.div key={machinery.id} variants={itemVariants}>
              <MachineryCard
                machinery={machinery}
                onSelect={() => onSelect(machinery.id)}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
