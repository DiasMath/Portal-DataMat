'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useStudio } from '../../store/StudioContext';
import { buildSqlQuery } from '../../lib/sql-builder';
import { MOCK_DATA_MODEL } from '../../lib/mock-data';
import { QueryResultsGrid } from './QueryResultsGrid';
import { Code, Play, Copy, Check, RotateCcw, Wand2 } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { format } from 'sql-formatter';
import { registerSqlCompletionProvider } from '../../lib/sql-completion';

export function SqlRunner() {
  const { state } = useStudio();
  const dataModel = state.dataModel || MOCK_DATA_MODEL;

  useEffect(() => {
    registerSqlCompletionProvider(() => state.dataModel || MOCK_DATA_MODEL);
  }, [state.dataModel]);

  const selectedVisual = state.pages
    .find(p => p.id === state.activePageId)
    ?.visuals.find(v => v.id === state.selectedVisualId);

  const [manualSql, setManualSql] = useState('');
  const [isManualMode, setIsManualMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [queryResult, setQueryResult] = useState<{
    columns: string[];
    rows: Record<string, unknown>[];
    executionTime: number;
  } | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const generatedSql = useMemo(() => {
    if (!selectedVisual) return '';
    const result = buildSqlQuery(selectedVisual.buckets, selectedVisual.filters, dataModel);
    return result.sql;
  }, [selectedVisual, dataModel]);

  const currentSql = isManualMode ? manualSql : generatedSql;

  const handleRun = useCallback(() => {
    if (!currentSql.trim()) return;
    setIsRunning(true);
    setTimeout(() => {
      setQueryResult({
        columns: ['resultado'],
        rows: [{ resultado: 'Query executada com sucesso (mock)' }],
        executionTime: Math.floor(Math.random() * 50) + 5,
      });
      setIsRunning(false);
    }, 500);
  }, [currentSql]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(currentSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [currentSql]);

  const handleFormat = useCallback(() => {
    try {
      const formatted = format(currentSql, { language: 'mysql' });
      if (isManualMode) {
        setManualSql(formatted);
      }
    } catch {
      // ignore format errors
    }
  }, [currentSql, isManualMode]);

  const handleEditorChange = useCallback((value: string | undefined) => {
    setIsManualMode(true);
    setManualSql(value || '');
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-neutral-900 overflow-hidden">
      <div className="h-10 flex items-center gap-2 px-3 border-b border-neutral-700 bg-neutral-900 shrink-0">
        <Code size={14} className="text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">SQL RUNNER</span>
        <div className="flex-1" />
        <div className="flex items-center gap-1 text-[10px]">
          <button
            onClick={() => setIsManualMode(false)}
            className={`px-2 py-1 rounded transition-colors ${!isManualMode ? 'bg-amber-600/20 text-amber-400' : 'text-muted-foreground hover:bg-neutral-800'}`}
          >
            Auto
          </button>
          <button
            onClick={() => setIsManualMode(true)}
            className={`px-2 py-1 rounded transition-colors ${isManualMode ? 'bg-amber-600/20 text-amber-400' : 'text-muted-foreground hover:bg-neutral-800'}`}
          >
            Manual
          </button>
        </div>
      </div>

      {selectedVisual && !isManualMode && (
        <div className="px-3 py-1.5 border-b border-neutral-800 bg-neutral-800/30 text-[10px] text-muted-foreground">
          Visual: <span className="text-neutral-300">{selectedVisual.title}</span> · Tipo: <span className="text-neutral-300">{selectedVisual.type}</span>
        </div>
      )}

      <div className="relative flex-1 min-h-[200px]">
        <Editor
          language="sql"
          theme="vs-dark"
          value={currentSql}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 12,
            readOnly: !isManualMode,
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            padding: { top: 16 },
            lineNumbers: 'on',
            roundedSelection: true,
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false,
          }}
          loading={
            <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
              Carregando editor...
            </div>
          }
        />
      </div>

      <div className="flex items-center gap-2 px-3 py-2 border-t border-neutral-700 bg-neutral-900">
        <button
          onClick={handleRun}
          disabled={!currentSql.trim() || isRunning}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play size={12} />
          {isRunning ? 'Executando...' : 'Executar'}
        </button>

        <button
          onClick={handleFormat}
          disabled={!isManualMode || !currentSql.trim()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-neutral-800 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Formatar SQL"
        >
          <Wand2 size={12} />
          Formatar
        </button>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-neutral-800 rounded transition-colors"
        >
          {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
          {copied ? 'Copiado!' : 'Copiar'}
        </button>

        {isManualMode && (
          <button
            onClick={() => { setManualSql(''); setIsManualMode(false); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-neutral-800 rounded transition-colors"
          >
            <RotateCcw size={12} />
            Limpar
          </button>
        )}

        <div className="flex-1" />

        {!isManualMode && !selectedVisual && (
          <span className="text-[10px] text-amber-500">Selecione um visual no canvas para gerar SQL</span>
        )}
      </div>

      {queryResult && (
        <div className="border-t border-neutral-700">
          <div className="px-3 py-1 bg-neutral-800/50 text-[10px] text-muted-foreground flex items-center gap-2">
            <span>{queryResult.rows.length} linha(s)</span>
            <span>·</span>
            <span>{queryResult.executionTime}ms</span>
          </div>
          <QueryResultsGrid data={queryResult} />
        </div>
      )}
    </div>
  );
}
