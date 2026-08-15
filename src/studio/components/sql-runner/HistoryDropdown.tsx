import React from 'react';
import type { HistoryEntry } from './useSqlHistory';

export function HistoryDropdown({ history, onLoad }: { history: HistoryEntry[]; onLoad: (entry: HistoryEntry) => void }) {
  if (history.length === 0) {
    return (
      <div className="absolute right-0 top-full mt-1 w-80 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl z-50 p-3 text-xs text-neutral-500">
        Nenhum historico
      </div>
    );
  }

  return (
    <div className="absolute right-0 top-full mt-1 w-80 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl z-50 max-h-[300px] overflow-auto scrollbar-minimal">
      {history.map(entry => (
        <button
          key={entry.id}
          onClick={() => onLoad(entry)}
          className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-800 transition-colors border-b border-[#333] last:border-b-0"
        >
          <div className="text-neutral-300 truncate font-mono">{entry.sql.slice(0, 80)}</div>
          <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-500">
            <span>{entry.rowCount} linhas</span>
            <span>·</span>
            <span>{entry.executionTime}ms</span>
            <span>·</span>
            <span>{new Date(entry.timestamp).toLocaleString('pt-BR')}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
