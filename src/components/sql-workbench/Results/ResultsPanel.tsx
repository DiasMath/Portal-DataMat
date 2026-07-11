'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useSqlWorkbench } from '@/contexts/SqlWorkbenchContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, AlertCircle, CheckCircle2, Info, Play, Trash2, FileCode, Highlighter, Check } from 'lucide-react';
import { SnippetsToolbar } from '../History/SnippetsToolbar';

type TabType = 'grid' | 'messages' | 'history' | 'snippets';

const HIGHLIGHT_COLORS = [
  'rgba(255,176,63,0.18)',
  'rgba(78,201,176,0.18)',
  'rgba(181,206,168,0.18)',
  'rgba(86,156,214,0.18)',
  'rgba(197,134,192,0.18)',
  'rgba(220,120,100,0.18)',
  'rgba(100,180,100,0.18)',
  'rgba(200,160,80,0.18)',
];

export function ResultsPanel() {
  const { state, activeTab, runFromHistory, clearHistory, executeQuery, dispatch } = useSqlWorkbench();
  const [activeResultsTab, setActiveResultsTab] = useState<TabType>('grid');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const highlightEnabled = state.highlightEnabled;
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);

  useEffect(() => {
    const msgs = activeTab?.messages;
    if (msgs && msgs.length > 0) {
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg.type === 'error') {
        setActiveResultsTab('messages');
      }
    }
  }, [activeTab?.messages]);
  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  const resizingRef = useRef<{ col: string; startX: number; startW: number } | null>(null);

  const results = activeTab?.results;

  const sortedRows = useMemo(() => {
    if (!results?.rows || !sortColumn) return results?.rows || [];
    return [...results.rows].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [results?.rows, sortColumn, sortDirection]);

  const duplicateMap = useMemo(() => {
    if (!highlightEnabled || !results?.rows || !results?.columns) return null;
    const map: Record<string, Record<string, number>> = {};
    for (const col of results.columns) {
      const counts: Record<string, number> = {};
      for (const row of results.rows) {
        const val = row[col] === null || row[col] === undefined ? '__NULL__' : String(row[col]);
        counts[val] = (counts[val] || 0) + 1;
      }
      map[col] = counts;
    }
    return map;
  }, [highlightEnabled, results?.rows, results?.columns]);

  const getHighlightColor = (col: string, value: unknown): string | undefined => {
    if (!duplicateMap || !highlightEnabled) return undefined;
    const key = value === null || value === undefined ? '__NULL__' : String(value);
    const count = duplicateMap[col]?.[key] ?? 0;
    if (count <= 1) return undefined;
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
    }
    return HIGHLIGHT_COLORS[Math.abs(hash) % HIGHLIGHT_COLORS.length];
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const toggleRowSelection = (rowIdx: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowIdx)) next.delete(rowIdx); else next.add(rowIdx);
      return next;
    });
  };

  const toggleAllRows = () => {
    if (!results?.rows) return;
    if (selectedRows.size === results.rows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(results.rows.map((_, i) => i)));
    }
  };

  const startResize = useCallback((e: React.MouseEvent, col: string) => {
    e.preventDefault();
    e.stopPropagation();
    const th = (e.target as HTMLElement).closest('th');
    const startW = th?.offsetWidth ?? 120;
    const startX = e.clientX;
    resizingRef.current = { col, startX, startW };

    const onMove = (ev: MouseEvent) => {
      const data = resizingRef.current;
      if (!data) return;
      const delta = ev.clientX - data.startX;
      const newW = Math.max(50, data.startW + delta);
      setColWidths((prev) => ({ ...prev, [data.col]: newW }));
    };

    const onUp = () => {
      resizingRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  const resetResize = useCallback((col: string) => {
    setColWidths((prev) => {
      const next = { ...prev };
      delete next[col];
      return next;
    });
  }, []);

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAs = (format: 'csv' | 'json' | 'sql') => {
    if (!results?.rows || results.rows.length === 0) return;
    const rows = selectedRows.size > 0
      ? results.rows.filter((_, i) => selectedRows.has(i))
      : results.rows;

    if (format === 'csv') {
      const headers = results.columns.join(',');
      const lines = rows.map((row) =>
        results.columns.map((col) => {
          const val = row[col];
          if (val === null || val === undefined) return '';
          const str = String(val);
          return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str;
        }).join(',')
      );
      downloadFile([headers, ...lines].join('\n'), 'query_result.csv', 'text/csv');
    } else if (format === 'json') {
      downloadFile(JSON.stringify(rows, null, 2), 'query_result.json', 'application/json');
    } else if (format === 'sql') {
      const inserts = rows.map((row) => {
        const vals = results.columns.map((col) => {
          const v = row[col];
          if (v === null || v === undefined) return 'NULL';
          if (typeof v === 'number') return String(v);
          return `'${String(v).replace(/'/g, "\\'")}'`;
        }).join(', ');
        return `INSERT INTO table_name (${results.columns.map(c => `\`${c}\``).join(', ')}) VALUES (${vals});`;
      });
      downloadFile(inserts.join('\n'), 'query_result.sql', 'text/sql');
    }
    setShowDownloadDialog(false);
  };

  const formatCellValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const renderGrid = () => {
    if (!results) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Execute uma query para ver os resultados
        </div>
      );
    }

    if (results.type !== 'select' || results.rows.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center">
            <p className="text-lg font-medium">{results.message}</p>
            {results.executionTime > 0 && (
              <p className="text-sm mt-1">{results.executionTime.toFixed(2)}ms</p>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="overflow-auto h-full">
        <table className="border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-card border-b border-border">
              <th
                className="px-2 py-2 text-center text-xs font-semibold text-white border-r border-border w-10 cursor-pointer select-none"
                onClick={toggleAllRows}
              >
                <div className="flex items-center justify-center">
                  {selectedRows.size === results.rows.length && results.rows.length > 0 ? (
                    <Check className="h-3 w-3" />
                  ) : selectedRows.size > 0 ? (
                    <span className="text-[10px]">{selectedRows.size}</span>
                  ) : null}
                </div>
              </th>
              {results.columns.map((col) => (
                <th
                  key={col}
                  className="px-3 py-2 text-center text-xs font-semibold text-white whitespace-nowrap border-r border-border last:border-r-0 cursor-pointer hover:bg-accent/50 select-none relative"
                  style={colWidths[col] ? { width: colWidths[col], minWidth: 50 } : { minWidth: 50 }}
                  onClick={() => handleSort(col)}
                >
                  {col}
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/50 z-10"
                    onMouseDown={(e) => startResize(e, col)}
                    onDoubleClick={(e) => { e.stopPropagation(); resetResize(col); }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, i) => (
              <tr
                key={i}
                className={`border-b border-border/50 hover:bg-accent/30 ${
                  selectedRows.has(i) ? 'bg-yellow-text/15 outline outline-1 outline-yellow-text/30' : i % 2 === 0 ? 'bg-background' : 'bg-card/30'
                }`}
              >
                <td
                  className="px-2 py-1.5 text-center border-r border-border/30 cursor-pointer"
                  onClick={() => toggleRowSelection(i)}
                >
                  {selectedRows.has(i) && <Check className="h-3 w-3 text-primary inline" />}
                </td>
                {results.columns.map((col) => {
                  const isNull = row[col] === null || row[col] === undefined;
                  const hlBg = getHighlightColor(col, row[col]);
                  return (
                    <td
                      key={col}
                      className="px-3 py-1.5 font-mono text-xs border-r border-border/30 last:border-r-0 whitespace-nowrap overflow-hidden text-ellipsis"
                      style={hlBg ? { backgroundColor: hlBg } : isNull ? { backgroundColor: 'rgba(255,176,63,0.08)' } : undefined}
                    >
                      <span className={isNull ? 'text-muted-foreground italic' : ''}>
                        {formatCellValue(row[col])}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderMessages = () => {
    const messages = activeTab?.messages || [];
    if (messages.length === 0) {
      return <div className="flex items-center justify-center h-full text-muted-foreground">Sem mensagens</div>;
    }
    return (
      <div className="p-2 space-y-1 overflow-auto h-full">
        {messages.map((msg, i) => (
          <div key={i} className={`flex items-start gap-2 p-2 rounded text-sm ${msg.type === 'error' ? 'bg-red-500/10 text-red-500' : msg.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
            {msg.type === 'error' ? <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" /> : msg.type === 'success' ? <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" /> : <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />}
            <div className="flex-1">
              <p>{msg.text}</p>
              {msg.executionTime && <p className="text-xs opacity-70">{msg.executionTime.toFixed(2)}ms</p>}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderHistory = () => {
    const history = state.queryHistory;
    if (history.length === 0) {
      return <div className="flex items-center justify-center h-full text-muted-foreground">Nenhum histórico. Execute uma query para começar.</div>;
    }
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-2 py-1 border-b border-border">
          <span className="text-xs text-muted-foreground">{history.length} query(s) no histórico</span>
          <Button size="sm" variant="ghost" onClick={clearHistory} className="h-7 text-xs">
            <Trash2 className="h-3 w-3 mr-1" /> Limpar
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-2">
          {history.map((entry) => (
            <div key={entry.id} className={`p-2 mb-2 rounded border text-sm font-mono ${entry.success ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {entry.success ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <AlertCircle className="h-3 w-3 text-red-500" />}
                  <span className="text-xs text-muted-foreground">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  {entry.executionTime !== undefined && <span className="text-xs text-muted-foreground">({entry.executionTime.toFixed(0)}ms)</span>}
                  {entry.rowCount !== undefined && <span className="text-xs text-muted-foreground">{entry.rowCount} row(s)</span>}
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => runFromHistory(entry)} className="h-6 px-2 text-xs" title="Carregar no editor">
                    <Play className="h-3 w-3 mr-1" /> Carregar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { runFromHistory(entry); executeQuery(entry.sql); }} className="h-6 px-2 text-xs" title="Executar diretamente">
                    <Play className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <pre className="text-xs whitespace-pre-wrap truncate max-h-16 overflow-hidden">{entry.sql}</pre>
              {!entry.success && entry.error && <p className="text-xs text-red-500 mt-1 truncate">{entry.error}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="flex items-center justify-between px-2 py-1 border-b border-border">
        <div className="flex items-center gap-1">
          {([
            { key: 'grid', label: 'Grid' },
            { key: 'messages', label: 'Messages' },
            { key: 'history', label: 'Histórico' },
            { key: 'snippets', label: 'Snippets' },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveResultsTab(tab.key)}
              className={`px-3 py-1 text-sm rounded transition-colors ${activeResultsTab === tab.key ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/50'}`}
            >
              {tab.key === 'snippets' && <FileCode className="h-3 w-3 mr-1 inline" />}
              {tab.label}
            </button>
          ))}
        </div>

        {results && results.type === 'select' && results.rows.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-1">{results.rows.length} row(s)</span>
            {results.executionTime > 0 && (
              <span className="text-xs text-muted-foreground mr-2">{results.executionTime.toFixed(0)}ms</span>
            )}
            <button
              onClick={() => dispatch({ type: 'TOGGLE_HIGHLIGHT' })}
              className={`p-1.5 rounded transition-colors ${highlightEnabled ? 'bg-primary/20 text-primary' : 'hover:bg-accent text-muted-foreground'}`}
              title="Destacar valores iguais (Ctrl+Shift+G)"
            >
              <Highlighter className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setShowDownloadDialog(true)}
              className="p-1.5 rounded hover:bg-accent text-muted-foreground transition-colors"
              title="Exportar resultados"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        {activeResultsTab === 'grid' ? renderGrid() : activeResultsTab === 'messages' ? renderMessages() : activeResultsTab === 'history' ? renderHistory() : <SnippetsToolbar />}
      </div>

      <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
        <DialogContent className="bg-card border-border max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm">Exportar como</DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            {([
              { format: 'csv' as const, label: 'CSV (.csv)', desc: 'Valores separados por vírgula' },
              { format: 'json' as const, label: 'JSON (.json)', desc: 'Formato JSON estruturado' },
              { format: 'sql' as const, label: 'SQL INSERT (.sql)', desc: 'Gerar scripts INSERT' },
            ]).map((opt) => (
              <button
                key={opt.format}
                onClick={() => exportAs(opt.format)}
                className="w-full px-3 py-2 text-left rounded hover:bg-accent transition-colors"
              >
                <p className="text-sm text-foreground">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </button>
            ))}
          </div>
          {selectedRows.size > 0 && (
            <p className="text-xs text-muted-foreground text-center">{selectedRows.size} linha(s) selecionada(s)</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
