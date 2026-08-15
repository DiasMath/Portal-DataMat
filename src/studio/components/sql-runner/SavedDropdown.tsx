import React from 'react';
import { X } from 'lucide-react';
import type { SavedQuery } from './useSavedQueries';

export function SavedDropdown({ queries, onLoad, onDelete }: { queries: SavedQuery[]; onLoad: (q: SavedQuery) => void; onDelete: (id: string) => void }) {
  if (queries.length === 0) {
    return (
      <div className="absolute right-0 top-full mt-1 w-80 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl z-50 p-3 text-xs text-neutral-500">
        Nenhuma query salva
      </div>
    );
  }

  return (
    <div className="absolute right-0 top-full mt-1 w-80 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl z-50 max-h-[300px] overflow-auto scrollbar-minimal">
      {queries.map(query => (
        <div
          key={query.id}
          className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-neutral-800 transition-colors border-b border-[#333] last:border-b-0"
        >
          <button
            onClick={() => onLoad(query)}
            className="flex-1 text-left"
          >
            <div className="text-neutral-300">{query.name}</div>
            <div className="text-[10px] text-neutral-500 truncate font-mono mt-0.5">{query.sql.slice(0, 60)}</div>
          </button>
          <button
            onClick={() => onDelete(query.id)}
            className="text-neutral-600 hover:text-red-400 transition-colors p-1"
          >
            <X size={10} />
          </button>
        </div>
      ))}
    </div>
  );
}
