import { useState, useRef, useEffect } from 'react';
import { Search, BookOpen, Loader2, FileUp, CheckCircle, AlertCircle } from 'lucide-react';
import { searchKnowledge, uploadPDF, KnowledgeSearchResult } from '../../utils/aiService';

interface KnowledgeSearchProps {
  machineryId?: string;
}

const SOURCE_TYPE_LABELS: Record<string, string> = {
  machinery_description: '기계 설명',
  machinery_theory: '이론',
  part_info: '부품 정보',
  quiz_knowledge: '퀴즈 지식',
  wikipedia: '위키피디아',
  pdf_document: 'PDF 문서',
  user_document: '사용자 문서',
};

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export default function KnowledgeSearch({ machineryId }: KnowledgeSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<KnowledgeSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (uploadStatus === 'success' || uploadStatus === 'error') {
      const timer = setTimeout(() => {
        setUploadStatus('idle');
        setUploadMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [uploadStatus]);

  const handleSearch = async () => {
    const q = query.trim();
    if (!q || isSearching) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const response = await searchKnowledge(q, machineryId);
      setResults(response.results);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus('uploading');
    setUploadMessage('');
    try {
      const result = await uploadPDF(file, machineryId);
      setUploadStatus('success');
      setUploadMessage(`${result.source_name} — ${result.chunks_created}개 청크 생성`);
    } catch (error: any) {
      setUploadStatus('error');
      setUploadMessage(error?.message || 'PDF 업로드에 실패했습니다');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="w-5 h-5 text-purple-600" />
        <h3 className="text-sm font-semibold text-gray-700">지식 검색</h3>
      </div>

      {/* Search input */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch();
          }}
          placeholder="키워드로 학습 자료 검색..."
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          disabled={isSearching}
        />
        <button
          onClick={handleSearch}
          disabled={!query.trim() || isSearching}
          className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isSearching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* PDF Upload */}
      <div className="mb-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
          id="pdf-upload"
          disabled={uploadStatus === 'uploading'}
        />
        {uploadStatus === 'idle' && (
          <label
            htmlFor="pdf-upload"
            className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <FileUp className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-purple-600">PDF 파일 업로드</span>
          </label>
        )}
        {uploadStatus === 'uploading' && (
          <div className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-purple-300 rounded-lg bg-purple-50">
            <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
            <span className="text-sm text-purple-600">업로드 중...</span>
          </div>
        )}
        {uploadStatus === 'success' && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span className="text-sm text-green-700">{uploadMessage}</span>
          </div>
        )}
        {uploadStatus === 'error' && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span className="text-sm text-red-700">{uploadMessage}</span>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {isSearching && (
          <div className="text-center text-gray-500 mt-8">
            <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin opacity-50" />
            <p className="text-sm">검색 중...</p>
          </div>
        )}

        {!isSearching && hasSearched && results.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">검색 결과가 없습니다</p>
          </div>
        )}

        {!isSearching && !hasSearched && (
          <div className="text-center text-gray-400 mt-8">
            <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">학습 자료에서 원하는 내용을 찾아보세요</p>
            <p className="text-xs mt-1">예: "피스톤 작동 원리", "드론 비행"</p>
          </div>
        )}

        {results.map((result, idx) => (
          <div
            key={idx}
            className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-200 transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                {SOURCE_TYPE_LABELS[result.source_type] || result.source_type}
              </span>
              <span className="text-xs text-gray-400">
                {Math.round(result.relevance_score * 100)}% 관련
              </span>
              {result.language === 'en' && (
                <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded">EN</span>
              )}
            </div>
            <p className="text-sm text-gray-700 line-clamp-3">{result.content}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs text-gray-400">{result.source_name}</span>
              {result.section && (
                <span className="text-xs text-gray-400">· {result.section}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
