import { useState } from 'react';
import { Machinery } from '../../types';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ProductInfoProps {
  machinery: Machinery;
}

export default function ProductInfo({ machinery }: ProductInfoProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`bg-white/95 backdrop-blur-sm rounded-lg shadow-lg transition-all duration-300 overflow-hidden ${isOpen ? 'w-96' : 'w-auto'
      }`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-gray-800 whitespace-nowrap">{machinery.name}</h2>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
      </button>

      {isOpen && (
        <div className="p-4 pt-0 border-t border-gray-100 max-h-96 overflow-y-auto">
          <p className="text-gray-600 mb-4">{machinery.description}</p>
          <div className="prose prose-sm">
            <ReactMarkdown>{machinery.theory}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
