import { useState } from 'react';
import { Machinery } from '../../types';
import { Info, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ProductInfoProps {
  machinery: Machinery;
}

export default function ProductInfo({ machinery }: ProductInfoProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Collapsed state: minimal icon button
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg px-4 py-2 hover:bg-white transition-colors group"
        title={machinery.name}
      >
        <Info className="w-5 h-5 text-primary" />
        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
          {machinery.name}
        </span>
      </button>
    );
  }

  // Expanded state: full panel
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg w-80 max-h-[70vh] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-gray-800">{machinery.name}</h2>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="p-4 overflow-y-auto">
        <p className="text-gray-600 mb-4">{machinery.description}</p>
        <div className="prose prose-sm">
          <ReactMarkdown>{machinery.theory}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
