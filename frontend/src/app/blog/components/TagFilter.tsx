'use client';

import { PERSONAS } from '@/types/blog';

interface TagFilterProps {
  allTags: string[];
  allPersonas: string[];
  currentTag?: string | null;
  currentPersona?: string | null;
  onTagChange: (tag: string | null) => void;
  onPersonaChange: (persona: string | null) => void;
}

export function TagFilter({ 
  allTags, 
  allPersonas, 
  currentTag, 
  currentPersona,
  onTagChange,
  onPersonaChange
}: TagFilterProps) {
  const handleTagChange = (tag: string | null) => {
    onTagChange(tag);
  };

  const handlePersonaChange = (persona: string | null) => {
    onPersonaChange(persona);
  };

  const clearFilters = () => {
    onTagChange(null);
    onPersonaChange(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">記事を絞り込む</h2>
        {(currentTag || currentPersona) && (
          <button
            onClick={clearFilters}
            className="text-blue-600 hover:text-blue-800 text-sm underline"
          >
            フィルタをクリア
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* タグフィルタ */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">タグで絞り込み</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleTagChange(null)}
              className={`px-3 py-2 text-sm rounded-full border transition-colors ${
                !currentTag
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
              }`}
            >
              すべて
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagChange(tag)}
                className={`px-3 py-2 text-sm rounded-full border transition-colors ${
                  currentTag === tag
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* ペルソナフィルタ */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">対象読者で絞り込み</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handlePersonaChange(null)}
              className={`px-3 py-2 text-sm rounded-full border transition-colors ${
                !currentPersona
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
              }`}
            >
              すべて
            </button>
            {allPersonas.map((persona) => {
              const personaName = PERSONAS[persona as keyof typeof PERSONAS] || persona;
              return (
                <button
                  key={persona}
                  onClick={() => handlePersonaChange(persona)}
                  className={`px-3 py-2 text-sm rounded-full border transition-colors ${
                    currentPersona === persona
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {personaName}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}