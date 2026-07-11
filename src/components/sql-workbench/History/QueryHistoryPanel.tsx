'use client';

import { useSqlWorkbench } from '@/contexts/SqlWorkbenchContext';
import { X, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';

export function QueryHistoryPanel() {
  const { state, dispatch, runFromHistory, clearHistory } = useSqlWorkbench();

  const formatTime = (ts: Date) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="border-t border-border bg-card flex flex-col" style={{ height: state.resultsHeight }}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Clock className="h-4 w-4" />
          Query History ({state.queryHistory.length})
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearHistory}
            className="p-1 hover:bg-destructive/20 rounded text-muted-foreground hover:text-destructive transition-colors"
            title="Clear History"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => dispatch({ type: 'SET_RESULTS_COLLAPSED', payload: true })}
            className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {state.queryHistory.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            No queries executed yet
          </div>
        ) : (
          state.queryHistory.map((entry) => (
            <div
              key={entry.id}
              onClick={() => runFromHistory(entry)}
              className="flex items-start gap-2 px-3 py-2 hover:bg-accent cursor-pointer border-b border-border/50 transition-colors"
            >
              {entry.success ? (
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-mono text-foreground truncate">
                  {entry.sql.length > 100 ? entry.sql.substring(0, 100) + '...' : entry.sql}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                  <span>{formatTime(entry.timestamp)}</span>
                  {entry.executionTime !== undefined && (
                    <span>{Math.round(entry.executionTime)}ms</span>
                  )}
                  {entry.error && (
                    <span className="text-red-400 truncate">{entry.error}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
