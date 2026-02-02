import { Machinery } from '../../types';
import { Cog, ChevronRight } from 'lucide-react';

interface MachineryCardProps {
  machinery: Machinery;
  onSelect: () => void;
}

export default function MachineryCard({ machinery, onSelect }: MachineryCardProps) {
  return (
    <div
      onClick={() => {
        console.log('🖱️ Card Clicked:', machinery.name);
        onSelect();
      }}
      className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl group"
    >
      <div className="relative h-48 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center overflow-hidden">
        <img
          src={machinery.thumbnail}
          alt={machinery.name}
          className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <div className="hidden absolute inset-0 flex items-center justify-center">
          <Cog className="w-20 h-20 text-blue-300 animate-spin-slow" />
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-primary transition-colors">
          {machinery.name}
        </h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {machinery.description}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {machinery.parts.length}개 부품
          </span>
          <ChevronRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
}
