'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useSqlWorkbench } from '@/contexts/SqlWorkbenchContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { exportTabularData } from '@/lib/export/tabular-export';
import { Download, AlertCircle, CheckCircle2, Info, Play, Trash2, FileCode, Highlighter, Check, Minus, Copy, Filter, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown, Maximize2, Search, WrapText, X } from 'lucide-react';
import { SnippetsToolbar } from '../History/SnippetsToolbar';
import { TableVirtuoso, type TableComponents } from 'react-virtuoso';
import React from 'react';
import { guessSourceTable, findDrillTarget, buildWhereEqualsQuery, type DrillTarget } from '@/lib/sql/drill-down';
import type { DatabaseSchema } from '@/types/sql-workbench';

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
  const { state, activeTab, runFromHistory, clearHistory, executeQuery, dispatch, newTab } = useSqlWorkbench();
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

  const [cellContextMenu, setCellContextMenu] = useState<{ x: number; y: number; column: string; value: unknown; row: Record<string, unknown> } | null>(null);
  const [viewingCellValue, setViewingCellValue] = useState<{ column: string; value: unknown } | null>(null);
  const [drillSchemas, setDrillSchemas] = useState<Record<string, DatabaseSchema>>({});
  const drillSchemaKey = activeTab?.connectionId ? `${activeTab.connectionId}:${state.activeDatabase || ''}` : '';

  // Busca (uma vez, sob demanda) o schema da conexão/banco ativos pra
  // resolver drill-down por FK real. Feito lazy em vez de reusar
  // state.schemas porque aquele só reflete o banco carregado na conexão
  // inicial — se o usuário trocou de banco pela sidebar, ficaria
  // desatualizado.
  useEffect(() => {
    if (!cellContextMenu || !activeTab?.connectionId) return;
    if (drillSchemas[drillSchemaKey]) return;
    const params = new URLSearchParams({ connectionId: activeTab.connectionId });
    if (state.activeDatabase) params.set('database', state.activeDatabase);
    fetch(`/api/sql/schema?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.schema) {
          setDrillSchemas((prev) => ({ ...prev, [drillSchemaKey]: data.schema }));
        }
      })
      .catch(() => {});
  }, [cellContextMenu, activeTab?.connectionId, state.activeDatabase, drillSchemaKey, drillSchemas]);

  const results = activeTab?.results;

  const sourceTable = useMemo(
    () => guessSourceTable(results?.sourceSql ?? activeTab?.sql ?? ''),
    [results?.sourceSql, activeTab?.sql]
  );

  const drillTarget: DrillTarget | null = useMemo(() => {
    if (!cellContextMenu) return null;
    return findDrillTarget(drillSchemas[drillSchemaKey], sourceTable, cellContextMenu.column);
  }, [cellContextMenu, drillSchemas, drillSchemaKey, sourceTable]);

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

  // Busca rápida na grade: filtra por texto em qualquer coluna, sem
  // precisar escrever WHERE e reexecutar. Aplicada depois da ordenação.
  const [gridSearch, setGridSearch] = useState('');
  const filteredRows = useMemo(() => {
    if (!gridSearch.trim()) return sortedRows;
    const term = gridSearch.trim().toLowerCase();
    return sortedRows.filter((row) =>
      Object.values(row).some((v) => v !== null && v !== undefined && String(v).toLowerCase().includes(term))
    );
  }, [sortedRows, gridSearch]);

  const [wrapText, setWrapText] = useState(false);

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

  const toggleRowSelection = (rowIdx: number, e?: React.MouseEvent) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (e?.shiftKey && prev.size > 0) {
        // Seleciona um intervalo contínuo a partir da última linha marcada —
        // igual ao comportamento do DataView do Studio.
        const lastSelected = Array.from(prev).pop()!;
        const start = Math.min(lastSelected, rowIdx);
        const end = Math.max(lastSelected, rowIdx);
        for (let i = start; i <= end; i++) next.add(i);
      } else if (e?.ctrlKey || e?.metaKey) {
        if (next.has(rowIdx)) next.delete(rowIdx); else next.add(rowIdx);
      } else {
        if (next.has(rowIdx) && next.size === 1) next.clear();
        else { next.clear(); next.add(rowIdx); }
      }
      return next;
    });
  };

  const toggleAllRows = () => {
    if (selectedRows.size === filteredRows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredRows.map((_, i) => i)));
    }
  };

  // Limpa a seleção quando a busca muda — os índices selecionados se
  // referem à posição na lista filtrada; manter a seleção antiga com uma
  // lista filtrada diferente selecionaria linhas erradas.
  useEffect(() => {
    setSelectedRows(new Set());
  }, [gridSearch]);

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

  const exportAs = async (format: 'csv' | 'json' | 'sql' | 'xlsx') => {
    if (!results?.rows || filteredRows.length === 0) return;
    // Se houver seleção, exporta só ela; senão, exporta o que está visível
    // na grade agora (respeitando o filtro de busca, se houver um ativo)
    // — não necessariamente todas as linhas originais do resultado.
    const rows = selectedRows.size > 0
      ? filteredRows.filter((_, i) => selectedRows.has(i))
      : filteredRows;

    await exportTabularData(
      { columns: results.columns, rows },
      format,
      { baseFilename: 'query_result', tableName: guessSourceTable(results.sourceSql ?? activeTab?.sql ?? '') }
    );
    setShowDownloadDialog(false);
  };

  const copyAllAsTsv = () => {
    if (!results?.columns || filteredRows.length === 0) return;
    const header = results.columns.join('\t');
    const lines = filteredRows.map((row) => results.columns.map((c) => formatCellValue(row[c])).join('\t'));
    navigator.clipboard.writeText([header, ...lines].join('\n'));
    toast.success(`${filteredRows.length} linha(s) copiada(s)`);
  };

  const DEFAULT_GRID_COL_WIDTH = 150;
  const SELECTION_COL_WIDTH = 40;

  const gridTotalWidth = useMemo(() => {
    if (!results?.columns) return undefined;
    return results.columns.reduce((sum, col) => sum + (colWidths[col] || DEFAULT_GRID_COL_WIDTH), SELECTION_COL_WIDTH);
  }, [results?.columns, colWidths]);

  const virtuosoComponents: TableComponents<Record<string, unknown>> = useMemo(() => ({
    Table: (props) => (
      <table {...props} className="border-collapse text-sm" style={{ ...props.style, minWidth: gridTotalWidth }} />
    ),
    TableHead: React.forwardRef((props, ref) => <thead {...props} ref={ref} className="sticky top-0 z-10" />),
    TableBody: React.forwardRef((props, ref) => <tbody {...props} ref={ref} />),
    TableRow: (props) => {
      const rowIndex = (props as unknown as { 'data-index'?: number })['data-index'];
      const isSelected = rowIndex !== undefined && selectedRows.has(rowIndex);
      // O zebra striping anterior usava --background e --card, que no tema
      // escuro têm quase a mesma luminosidade e zero de matiz — ficava
      // difícil de acompanhar uma linha na horizontal, ao contrário do
      // branco/azul-claro clássico do MySQL Workbench. Aqui usamos um tom
      // azulado de verdade nas linhas pares (com matiz, não só cinza mais
      // claro/escuro) e um hover mais vivo, mantendo o dourado só pra
      // seleção de linha — assim as três coisas (par/ímpar, hover,
      // selecionado) ficam visualmente distintas entre si.
      return (
        <tr
          {...props}
          className={`border-b border-border/40 cursor-default transition-colors ${
            isSelected ? 'outline outline-1 outline-amber-400/40 outline-offset-[-1px]' : ''
          }`}
          style={{
            backgroundColor: isSelected
              ? 'rgba(255, 176, 63, 0.16)'
              : rowIndex !== undefined && rowIndex % 2 === 0
                ? 'transparent'
                : 'rgba(96, 165, 250, 0.055)',
          }}
          onMouseEnter={(e) => {
            if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(96, 165, 250, 0.16)';
          }}
          onMouseLeave={(e) => {
            if (!isSelected) {
              e.currentTarget.style.backgroundColor =
                rowIndex !== undefined && rowIndex % 2 === 0 ? 'transparent' : 'rgba(96, 165, 250, 0.055)';
            }
          }}
        />
      );
    },
  }), [selectedRows, gridTotalWidth]);

  const closeCellContextMenu = useCallback(() => setCellContextMenu(null), []);

  const handleCopyCell = () => {
    if (!cellContextMenu) return;
    const val = cellContextMenu.value;
    navigator.clipboard.writeText(val === null || val === undefined ? 'NULL' : String(val));
    closeCellContextMenu();
  };

  const handleViewFullValue = () => {
    if (!cellContextMenu) return;
    setViewingCellValue({ column: cellContextMenu.column, value: cellContextMenu.value });
    closeCellContextMenu();
  };

  const handleCopyRow = () => {
    if (!cellContextMenu || !results) return;
    const header = results.columns.join('\t');
    const line = results.columns.map((c) => formatCellValue(cellContextMenu.row[c])).join('\t');
    navigator.clipboard.writeText(`${header}\n${line}`);
    closeCellContextMenu();
  };

  const handleFilterByValue = () => {
    if (!cellContextMenu || !activeTab) return;
    const table = sourceTable || 'table_name';
    const sql = buildWhereEqualsQuery(table, cellContextMenu.column, cellContextMenu.value);
    newTab(`${table} filtrado`, sql, activeTab.connectionId);
    setTimeout(() => executeQuery(sql), 100);
    closeCellContextMenu();
  };

  const handleDrillDown = () => {
    if (!cellContextMenu || !activeTab || !drillTarget) return;
    const sql = buildWhereEqualsQuery(drillTarget.table, drillTarget.column, cellContextMenu.value);
    newTab(drillTarget.table, sql, activeTab.connectionId);
    setTimeout(() => executeQuery(sql), 100);
    closeCellContextMenu();
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
      <div className="h-full overflow-hidden" style={{ scrollbarWidth: 'thin' }}>
        <TableVirtuoso
          style={{ height: '100%' }}
          data={filteredRows}
          components={virtuosoComponents}
          fixedHeaderContent={() => (
            <tr className="bg-card border-b border-border">
              <th
                className="px-2 py-2 text-center text-xs font-semibold text-white border-r border-border w-10 cursor-pointer select-none"
                style={{ background: 'var(--card)' }}
                onClick={toggleAllRows}
              >
                <div className="flex items-center justify-center">
                  {selectedRows.size === filteredRows.length && filteredRows.length > 0 ? (
                    <Check className="h-3 w-3" />
                  ) : selectedRows.size > 0 ? (
                    <Minus className="h-3 w-3" />
                  ) : null}
                </div>
              </th>
              {results.columns.map((col) => (
                <th
                  key={col}
                  className="px-3 py-2 text-center text-xs font-semibold text-white whitespace-nowrap border-r border-border last:border-r-0 cursor-pointer hover:bg-accent/50 select-none relative"
                  style={{
                    background: 'var(--card)',
                    ...(colWidths[col] ? { width: colWidths[col], minWidth: 50 } : { minWidth: 50 }),
                  }}
                  onClick={() => handleSort(col)}
                >
                  {col}
                  {sortColumn === col ? (
                    sortDirection === 'asc' ? (
                      <ArrowUp className="ml-1 h-3 w-3 inline text-primary" />
                    ) : (
                      <ArrowDown className="ml-1 h-3 w-3 inline text-primary" />
                    )
                  ) : (
                    <ArrowUpDown className="ml-1 h-3 w-3 inline text-muted-foreground/50" />
                  )}
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/50 z-10"
                    onMouseDown={(e) => startResize(e, col)}
                    onDoubleClick={(e) => { e.stopPropagation(); resetResize(col); }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </th>
              ))}
            </tr>
          )}
          itemContent={(rowIdx, row) => (
            <>
              <td
                className="px-2 py-1.5 text-center border-r border-border/30 cursor-pointer"
                onClick={(e) => toggleRowSelection(rowIdx, e)}
              >
                {selectedRows.has(rowIdx) && <Check className="h-3 w-3 text-primary inline" />}
              </td>
              {results.columns.map((col) => {
                const isNull = row[col] === null || row[col] === undefined;
                const hlBg = getHighlightColor(col, row[col]);
                return (
                  <td
                    key={col}
                    className={`px-3 py-1.5 font-mono text-xs border-r border-border/30 last:border-r-0 ${wrapText ? 'whitespace-pre-wrap break-words' : 'whitespace-nowrap overflow-hidden text-ellipsis'}`}
                    style={{
                      ...(colWidths[col] ? { width: colWidths[col], minWidth: 50 } : { minWidth: 50 }),
                      ...(hlBg ? { backgroundColor: hlBg } : isNull ? { backgroundColor: 'rgba(255,176,63,0.08)' } : {}),
                    }}
                    onClick={(e) => toggleRowSelection(rowIdx, e)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCellContextMenu({ x: e.clientX, y: e.clientY, column: col, value: row[col], row });
                    }}
                  >
                    <span className={isNull ? 'text-muted-foreground italic' : ''}>
                      {formatCellValue(row[col])}
                    </span>
                  </td>
                );
              })}
            </>
          )}
        />
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
            <div className="relative mr-1">
              <Search className="h-3 w-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={gridSearch}
                onChange={(e) => setGridSearch(e.target.value)}
                placeholder="Buscar na grade..."
                className="h-6 w-36 pl-6 pr-5 text-xs bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-ring"
              />
              {gridSearch && (
                <button
                  onClick={() => setGridSearch('')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <span className="text-xs text-muted-foreground mr-1">
              {gridSearch ? `${filteredRows.length} / ${results.rows.length} row(s)` : `${results.rows.length} row(s)`}
            </span>
            {results.autoLimited && (
              <span
                className="text-xs text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded mr-1"
                title="A query não tinha LIMIT — foi aplicado um teto de segurança automaticamente. Adicione LIMIT na query para controlar isso."
              >
                limitado automaticamente
              </span>
            )}
            {results.executionTime > 0 && (
              <span className="text-xs text-muted-foreground mr-2">{results.executionTime.toFixed(0)}ms</span>
            )}
            <button
              onClick={() => setWrapText((w) => !w)}
              className={`p-1.5 rounded transition-colors ${wrapText ? 'bg-primary/20 text-primary' : 'hover:bg-accent text-muted-foreground'}`}
              title="Quebrar texto longo nas células (em vez de truncar)"
            >
              <WrapText className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={copyAllAsTsv}
              className="p-1.5 rounded hover:bg-accent text-muted-foreground transition-colors"
              title="Copiar tudo (TSV) — respeita a busca, se houver"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
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
              { format: 'xlsx' as const, label: 'Excel (.xlsx)', desc: 'Planilha do Excel' },
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

      {cellContextMenu && (
        <div className="fixed inset-0 z-50" onClick={closeCellContextMenu} onContextMenu={(e) => { e.preventDefault(); closeCellContextMenu(); }}>
          <div
            className="fixed bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[220px] animate-in fade-in zoom-in-95"
            style={{ left: cellContextMenu.x, top: cellContextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent flex items-center gap-2"
              onClick={handleCopyCell}
            >
              <Copy className="h-4 w-4" /> Copiar célula
            </button>
            <button
              className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent flex items-center gap-2"
              onClick={handleViewFullValue}
            >
              <Maximize2 className="h-4 w-4" /> Ver valor completo
            </button>
            <button
              className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent flex items-center gap-2"
              onClick={handleCopyRow}
            >
              <Copy className="h-4 w-4" /> Copiar linha
            </button>
            <div className="h-px bg-border my-1" />
            <button
              className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent flex items-center gap-2"
              onClick={handleFilterByValue}
              title={`SELECT * FROM ${sourceTable || '...'} WHERE ${cellContextMenu.column} = valor`}
            >
              <Filter className="h-4 w-4" /> Filtrar por este valor
            </button>
            {drillTarget && (
              <button
                className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent flex items-center gap-2"
                onClick={handleDrillDown}
              >
                <ExternalLink className="h-4 w-4 text-blue-400" />
                <span className="flex-1">
                  Drill down → {drillTarget.table}
                  {drillTarget.confidence === 'heuristic' && (
                    <span className="block text-[10px] text-muted-foreground">baseado no nome da coluna, não em FK declarada</span>
                  )}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      <Dialog open={!!viewingCellValue} onOpenChange={(open) => !open && setViewingCellValue(null)}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{viewingCellValue?.column}</span>
              {viewingCellValue && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const v = viewingCellValue.value;
                    navigator.clipboard.writeText(v === null || v === undefined ? 'NULL' : String(v));
                    toast.success('Copiado');
                  }}
                >
                  <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          <pre className="text-sm font-mono whitespace-pre-wrap break-all overflow-y-auto flex-1 bg-background rounded p-3 border border-border">
            {viewingCellValue ? formatCellValue(viewingCellValue.value) : ''}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}
