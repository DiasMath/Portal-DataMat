'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useStudio } from '../../store/StudioContext';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { BASE_MONACO_OPTIONS } from '../../lib/monaco-options';
import { getDataModel } from '../../lib/data-model-utils';
import type { SqlTemplate } from '../../lib/sql-templates';
import { QueryResultsGrid } from './grid';
import type { GridData } from './grid';
import { Code, Play, Copy, Check, RotateCcw, Wand2, History, Bookmark, FileText, ChevronDown, X, Plus, GripHorizontal, Maximize2, Minimize2 } from 'lucide-react';
import { format } from 'sql-formatter';
import { registerSqlCompletionProvider } from '../../lib/sql-completion';
import dynamic from 'next/dynamic';
import { useSqlHistory, type HistoryEntry } from './useSqlHistory';
import { useSavedQueries, type SavedQuery } from './useSavedQueries';
import { useEditorTabs } from './useEditorTabs';
import { TemplatesDropdown } from './TemplatesDropdown';
import { HistoryDropdown } from './HistoryDropdown';
import { SavedDropdown } from './SavedDropdown';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const DEFAULT_GRID_HEIGHT = 300;
const MIN_GRID_HEIGHT = 80;

const MONACO_OPTIONS = {
  ...BASE_MONACO_OPTIONS,
  roundedSelection: true,
  scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  overviewRulerBorder: false,
};

interface ResultTab {
  id: string;
  name: string;
  sql: string;
  result: GridData;
  createdAt: number;
}

export function SqlRunner() {
  const { state, dispatch } = useStudio();
  const dataModel = getDataModel(state.dataModel);
  const handleRunRef = useRef<() => void>(() => {});
  const handleToggleGridRef = useRef<() => void>(() => {});
  const abortControllerRef = useRef<AbortController | null>(null);

  const [gridHeight, setGridHeight] = useState(DEFAULT_GRID_HEIGHT);
  const [isResizingGrid, setIsResizingGrid] = useState(false);
  const [isGridCollapsed, setIsGridCollapsed] = useState(false);
  const resizeStartY = useRef(0);
  const resizeStartHeight = useRef(0);

  const connectionId = dataModel?.connectionId || '';

  const [executionError, setExecutionError] = useState<string | null>(null);

  const [manualSql, setManualSql] = useState(state.sqlRunnerManualSql || '');
  const { copied, copy } = useCopyToClipboard();

  const [isRunning, setIsRunning] = useState(false);
  const [resultTabs, setResultTabs] = useState<ResultTab[]>(() => state.sqlRunnerResultTabs as ResultTab[]);
  const [activeResultTab, setActiveResultTab] = useState<string | null>(state.sqlRunnerActiveResultTab);

  const { history, addHistory } = useSqlHistory();
  const { savedQueries, saveQuery, deleteQuery } = useSavedQueries();

  const {
    editorTabs,
    setEditorTabs,
    activeEditorTab,
    setActiveEditorTab,
    renamingTab,
    setRenamingTab,
    renameValue,
    setRenameValue,
    renameInputRef,
    handleNewEditorTab,
    handleCloseEditorTab,
    handleEditorTabClick,
    handleStartRename,
    handleFinishRename,
    updateActiveTabSql,
  } = useEditorTabs({
    initialTabs: state.sqlRunnerEditorTabs,
    initialActiveTab: state.sqlRunnerActiveEditorTab || 'tab-1',
  });

  const [showHistory, setShowHistory] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const historyRef = useRef<HTMLDivElement>(null);
  const savedRef = useRef<HTMLDivElement>(null);
  const templatesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch({
      type: 'SET_SQL_RUNNER_STATE',
      payload: {
        editorTabs,
        activeEditorTab,
        manualSql,
        resultTabs,
        activeResultTab,
      },
    });
  }, [editorTabs, activeEditorTab, manualSql, resultTabs, activeResultTab, dispatch]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) setShowHistory(false);
      if (savedRef.current && !savedRef.current.contains(e.target as Node)) setShowSaved(false);
      if (templatesRef.current && !templatesRef.current.contains(e.target as Node)) setShowTemplates(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const activeResult = resultTabs.find(t => t.id === activeResultTab);

  const handleRun = useCallback(async () => {
    if (!manualSql.trim()) return;
    if (!connectionId) {
      setExecutionError('Nenhuma conexão selecionada. Importe um modelo de dados primeiro.');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsRunning(true);
    setExecutionError(null);

    try {
      const response = await fetch('/api/sql/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId,
          sql: manualSql.trim(),
        }),
        signal: abortControllerRef.current.signal,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao executar query');
      }

      const result: GridData = {
        columns: data.columns || [],
        rows: data.rows || [],
        executionTime: data.executionTime || 0,
      };

      const tabId = `result-${Date.now()}`;

      setResultTabs(prev => {
        const newTab: ResultTab = {
          id: tabId,
          name: `Query ${prev.length + 1}`,
          sql: manualSql,
          result,
          createdAt: Date.now(),
        };
        return [...prev, newTab];
      });
      setActiveResultTab(tabId);

      addHistory({
        id: `hist-${Date.now()}`,
        sql: manualSql,
        timestamp: Date.now(),
        executionTime: result.executionTime,
        rowCount: result.rows.length,
      });
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setExecutionError(message);
    } finally {
      setIsRunning(false);
      abortControllerRef.current = null;
    }
  }, [manualSql, connectionId, resultTabs.length, addHistory]);

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsRunning(false);
    }
  }, []);

  handleRunRef.current = handleRun;

  const handleToggleGrid = useCallback(() => {
    if (resultTabs.length === 0) return;
    if (isGridCollapsed) {
      setIsGridCollapsed(false);
      setGridHeight(DEFAULT_GRID_HEIGHT);
    } else {
      setIsGridCollapsed(true);
    }
  }, [isGridCollapsed, resultTabs.length]);

  handleToggleGridRef.current = handleToggleGrid;

  const handleCopy = useCallback(() => {
    copy(manualSql);
  }, [manualSql, copy]);

  const handleFormat = useCallback(() => {
    try {
      const formatted = format(manualSql, { language: 'mysql' });
      setManualSql(formatted);
      updateActiveTabSql(formatted);
    } catch { /* ignore */ }
  }, [manualSql, updateActiveTabSql]);

  const handleEditorChange = useCallback((value: string | undefined) => {
    const newSql = value || '';
    setManualSql(newSql);
    updateActiveTabSql(newSql);
  }, [updateActiveTabSql]);

  const handleLoadHistory = useCallback((entry: HistoryEntry) => {
    setManualSql(entry.sql);
    updateActiveTabSql(entry.sql);
    setShowHistory(false);
  }, [updateActiveTabSql]);

  const handleLoadSaved = useCallback((query: SavedQuery) => {
    setManualSql(query.sql);
    updateActiveTabSql(query.sql);
    setShowSaved(false);
  }, [updateActiveTabSql]);

  const handleLoadTemplate = useCallback((template: SqlTemplate) => {
    setManualSql(template.sql);
    updateActiveTabSql(template.sql);
    setShowTemplates(false);
  }, [updateActiveTabSql]);

  const handleSaveQuery = useCallback(() => {
    if (!saveName.trim() || !manualSql.trim()) return;
    saveQuery({
      id: `saved-${Date.now()}`,
      name: saveName.trim(),
      sql: manualSql,
      createdAt: Date.now(),
    });
    setSaveDialogOpen(false);
    setSaveName('');
  }, [saveName, manualSql, saveQuery]);

  const handleCloseResultTab = useCallback((tabId: string) => {
    setResultTabs(prev => {
      const next = prev.filter(t => t.id !== tabId);
      if (activeResultTab === tabId) {
        setActiveResultTab(next.length > 0 ? next[next.length - 1].id : null);
      }
      return next;
    });
  }, [activeResultTab]);

  const handleEditorMount = useCallback((_editor: unknown, monaco: { languages: { registerCompletionItemProvider: (lang: string, provider: unknown) => void }; KeyMod: { CmdCmd: number }; KeyCode: { Enter: number; KeyR: number; KeyE: number }; editor: { defineTheme: (name: string, theme: unknown) => void } }) => {
    monaco.editor.defineTheme('datamat-sql', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'FFB03F', fontStyle: 'bold' },
        { token: 'keyword.sql', foreground: 'FFB03F', fontStyle: 'bold' },
        { token: 'predefined.sql', foreground: 'FFB03F', fontStyle: 'bold' },
        { token: 'string', foreground: '4EC9B0' },
        { token: 'string.sql', foreground: '4EC9B0' },
        { token: 'string.single', foreground: '4EC9B0' },
        { token: 'string.double', foreground: '4EC9B0' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'number.sql', foreground: 'B5CEA8' },
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'operator.sql', foreground: 'D4D4D4' },
        { token: 'identifier.sql', foreground: 'D4D4D4' },
      ],
      colors: {
        'editor.lineHighlightBackground': '#ffffff0a',
        'editor.selectionBackground': '#264f78',
        'editorCursor.foreground': '#FFB03F',
        'editorLineNumber.foreground': '#5a5a6e',
        'editorLineNumber.activeForeground': '#FFB03F',
      },
    });

    registerSqlCompletionProvider(monaco, () => getDataModel(state.dataModel));

    const editor = _editor as { addCommand: (keybinding: number, handler: () => void) => void; updateOptions: (opts: unknown) => void; focus: () => void; getDomNode: () => HTMLElement | null; getOption: (option: number) => unknown; onDidChangeModelContent: (handler: () => void) => void };
    editor.updateOptions({ theme: 'datamat-sql' });
    editor.focus();

    editor.addCommand(monaco.KeyMod.CmdCmd | monaco.KeyCode.Enter, () => {
      handleRunRef.current();
    });
    editor.addCommand(monaco.KeyMod.CmdCmd | monaco.KeyCode.KeyR, () => {
      handleToggleGridRef.current();
    });
    editor.addCommand(monaco.KeyMod.CmdCmd | monaco.KeyCode.KeyE, () => {
      handleRunRef.current();
    });

    const editorDom = editor.getDomNode();
    if (editorDom) {
      editorDom.addEventListener('wheel', (e: WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
        }
      }, { passive: false });
    }
  }, [state.dataModel]);

  return (
    <div className="flex-1 flex flex-col bg-neutral-900 overflow-hidden">
      {/* Header */}
      <div className="h-10 flex items-center gap-1 px-3 border-b border-neutral-700 bg-neutral-900 shrink-0">
        <Code size={14} className="text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground mr-2">SQL RUNNER</span>

        {isRunning ? (
          <button
            onClick={handleCancel}
            className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 text-[10px] font-medium rounded hover:bg-red-500/30 transition-colors"
          >
            <X size={10} />
            Cancelar
          </button>
        ) : (
          <button
            onClick={handleRun}
            disabled={!manualSql.trim() || !connectionId}
            className="flex items-center gap-1 px-2 py-1 bg-amber-500 text-white text-[10px] font-medium rounded hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play size={10} />
            Executar
          </button>
        )}

        <button
          onClick={handleFormat}
          disabled={!manualSql.trim()}
          className="flex items-center gap-1 px-2 py-1 text-[10px] text-muted-foreground hover:bg-neutral-800 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Formatar SQL (Ctrl+Shift+F)"
        >
          <Wand2 size={10} />
          Formatar
        </button>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 text-[10px] text-muted-foreground hover:bg-neutral-800 rounded transition-colors"
          title="Copiar SQL"
        >
          {copied ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
          {copied ? 'Copiado!' : 'Copiar'}
        </button>

        <button
          onClick={() => setSaveDialogOpen(true)}
          disabled={!manualSql.trim()}
          className="flex items-center gap-1 px-2 py-1 text-[10px] text-muted-foreground hover:bg-neutral-800 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Salvar query"
        >
          <Bookmark size={10} />
          Salvar
        </button>

        <button
          onClick={() => {
            setManualSql('');
            updateActiveTabSql('');
          }}
          className="flex items-center gap-1 px-2 py-1 text-[10px] text-muted-foreground hover:bg-neutral-800 rounded transition-colors"
          title="Limpar editor"
        >
          <RotateCcw size={10} />
          Limpar
        </button>

        <div className="flex-1" />

        <div ref={templatesRef} className="relative">
          <button
            onClick={() => { setShowTemplates(!showTemplates); setShowHistory(false); setShowSaved(false); }}
            className="flex items-center gap-1 px-2 py-1 text-[10px] text-muted-foreground hover:bg-neutral-800 rounded transition-colors"
          >
            <FileText size={10} />
            Templates
            <ChevronDown size={8} />
          </button>
          {showTemplates && (
            <TemplatesDropdown onSelect={handleLoadTemplate} />
          )}
        </div>

        <div ref={historyRef} className="relative">
          <button
            onClick={() => { setShowHistory(!showHistory); setShowSaved(false); setShowTemplates(false); }}
            className="flex items-center gap-1 px-2 py-1 text-[10px] text-muted-foreground hover:bg-neutral-800 rounded transition-colors"
          >
            <History size={10} />
            Historico
            <ChevronDown size={8} />
          </button>
          {showHistory && (
            <HistoryDropdown history={history} onLoad={handleLoadHistory} />
          )}
        </div>

        <div ref={savedRef} className="relative">
          <button
            onClick={() => { setShowSaved(!showSaved); setShowHistory(false); setShowTemplates(false); }}
            className="flex items-center gap-1 px-2 py-1 text-[10px] text-muted-foreground hover:bg-neutral-800 rounded transition-colors"
          >
            <Bookmark size={10} />
            Salvas
            <ChevronDown size={8} />
          </button>
          {showSaved && (
            <SavedDropdown queries={savedQueries} onLoad={handleLoadSaved} onDelete={deleteQuery} />
          )}
        </div>
      </div>

      {/* Editor tabs */}
      <div className="flex items-center gap-0 bg-neutral-800/50 border-b border-neutral-700 overflow-x-auto shrink-0">
        {editorTabs.map(tab => (
          <div
            key={tab.id}
            className={`flex items-center gap-1 px-3 py-1.5 text-[10px] border-r border-neutral-700 cursor-pointer transition-colors whitespace-nowrap group ${
              activeEditorTab === tab.id
                ? 'bg-neutral-900 text-amber-400'
                : 'text-muted-foreground hover:bg-neutral-800'
            }`}
            onClick={() => handleEditorTabClick(tab.id, manualSql)}
            onDoubleClick={() => handleStartRename(tab.id)}
          >
            {renamingTab === tab.id ? (
              <input
                ref={renameInputRef}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleFinishRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleFinishRename();
                  if (e.key === 'Escape') { setRenameValue(''); setRenamingTab(null); }
                }}
                className="w-20 bg-neutral-800 text-amber-400 text-[10px] px-1 py-0.5 rounded border border-amber-500 outline-none"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                <span>{tab.name}</span>
                {editorTabs.length > 1 && (
                  <X
                    size={9}
                    className="ml-1 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                    onClick={(e) => { e.stopPropagation(); handleCloseEditorTab(tab.id); }}
                  />
                )}
              </>
            )}
          </div>
        ))}
        <button
          onClick={handleNewEditorTab}
          className="flex items-center gap-1 px-2 py-1.5 text-[10px] text-muted-foreground hover:bg-neutral-800 transition-colors"
          title="Nova query"
        >
          <Plus size={10} />
        </button>
      </div>

      {/* Error display */}
      {executionError && (
        <div className="px-3 py-2 bg-red-500/10 border-b border-red-500/30 text-xs text-red-400 flex items-center gap-2 shrink-0">
          <span className="font-mono">{executionError}</span>
          <button
            onClick={() => setExecutionError(null)}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Editor */}
      <div className="relative flex-1 min-h-[200px]">
        <MonacoEditor
          height="100%"
          language="sql"
          theme="datamat-sql"
          value={manualSql}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          options={MONACO_OPTIONS}
          loading={
            <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
              Carregando editor...
            </div>
          }
        />
      </div>

      {/* Result tabs */}
      {resultTabs.length > 0 && (
        <div className="border-t border-neutral-700">
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizingGrid(true);
              resizeStartY.current = e.clientY;
              resizeStartHeight.current = gridHeight;
              let rafId = 0;

              const handleMouseMove = (ev: MouseEvent) => {
                if (rafId) cancelAnimationFrame(rafId);
                rafId = requestAnimationFrame(() => {
                  const dy = resizeStartY.current - ev.clientY;
                  const newHeight = Math.max(MIN_GRID_HEIGHT, resizeStartHeight.current + dy);
                  setGridHeight(newHeight);
                  setIsGridCollapsed(false);
                });
              };

              const handleMouseUp = () => {
                if (rafId) cancelAnimationFrame(rafId);
                setIsResizingGrid(false);
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };

              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
            className={`flex items-center justify-center h-1.5 cursor-row-resize bg-neutral-800 hover:bg-amber-500/30 transition-colors ${
              isResizingGrid ? 'bg-amber-500/30' : ''
            }`}
          >
            <GripHorizontal size={10} className="text-neutral-600" />
          </div>

          <div className="flex items-center gap-0 bg-neutral-800/50 overflow-x-auto" role="tablist" aria-label="Resultados da consulta">
            {resultTabs.map(tab => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeResultTab === tab.id}
                aria-controls={`sql-result-panel-${tab.id}`}
                onClick={() => setActiveResultTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] border-r border-neutral-700 transition-colors whitespace-nowrap ${
                  activeResultTab === tab.id
                    ? 'bg-neutral-900 text-amber-400'
                    : 'text-muted-foreground hover:bg-neutral-800'
                }`}
              >
                <span>{tab.name}</span>
                <span className="text-neutral-600">({tab.result.rows.length})</span>
                <X
                  size={10}
                  className="ml-1 hover:text-red-400 transition-colors"
                  onClick={(e) => { e.stopPropagation(); handleCloseResultTab(tab.id); }}
                  aria-label={`Fechar aba ${tab.name}`}
                />
              </button>
            ))}
            <div className="flex-1" />
            <button
              onClick={() => {
                if (isGridCollapsed) {
                  setIsGridCollapsed(false);
                  setGridHeight(DEFAULT_GRID_HEIGHT);
                } else {
                  setIsGridCollapsed(true);
                }
              }}
              className="flex items-center gap-1 px-2 py-1.5 text-[10px] text-muted-foreground hover:bg-neutral-800 transition-colors"
              title={isGridCollapsed ? 'Expandir grid' : 'Minimizar grid'}
            >
              {isGridCollapsed ? <Maximize2 size={10} /> : <Minimize2 size={10} />}
            </button>
          </div>

          {activeResult && !isGridCollapsed && (
            <div id={`sql-result-panel-${activeResultTab}`} role="tabpanel" aria-labelledby={`sql-result-tab-${activeResultTab}`} style={{ height: gridHeight, minHeight: MIN_GRID_HEIGHT }} className="overflow-hidden">
              <QueryResultsGrid
                data={activeResult.result}
                onRerun={handleRun}
              />
            </div>
          )}
        </div>
      )}

      {/* Save dialog */}
      {saveDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-sm font-medium text-white mb-4">Salvar Query</h3>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Nome da query"
              className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded text-sm text-white focus:outline-none focus:border-amber-500 mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveQuery();
                if (e.key === 'Escape') { setSaveDialogOpen(false); setSaveName(''); }
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setSaveDialogOpen(false); setSaveName(''); }}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white rounded hover:bg-[#333]"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveQuery}
                disabled={!saveName.trim()}
                className="px-3 py-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-white rounded disabled:opacity-40"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
