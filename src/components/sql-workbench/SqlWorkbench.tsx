'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useSqlWorkbench } from '@/contexts/SqlWorkbenchContext';
import { Sidebar } from './Sidebar/Sidebar';
import { QueryEditor } from './Editor/QueryEditor';
import { ResultsPanel } from './Results/ResultsPanel';
import { QueryTabs } from './Editor/QueryTabs';
import { SplitPane } from './SplitPane';
import { ShortcutSettings } from './Settings/ShortcutSettings';
import { DEFAULT_SHORTCUTS, loadShortcuts, matchesShortcut, type ShortcutAction } from './shortcuts';
import { toast } from 'sonner';
import {
  Play,
  PlayCircle,
  CheckCircle,
  RotateCcw,
  HelpCircle,
  Wand2,
  Save,
  Trash2,
  Settings,
  Square,
  Loader2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

export function SqlWorkbench() {
  const {
    state,
    dispatch,
    newTab,
    toggleSidebar,
    executeQuery,
    activeTab,
    enableSplitHorizontal,
    enableSplitVertical,
    disableSplit,
    formatSql,
    saveQuery,
    getSelectedSql,
    cancelQuery,
  } = useSqlWorkbench();
  const containerRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);

  const FONT_SIZE_STORAGE_KEY = 'sql_workbench_font_size';
  const MIN_FONT_SIZE = 10;
  const MAX_FONT_SIZE = 24;
  const [fontSize, setFontSize] = useState(14);

  useEffect(() => {
    const saved = localStorage.getItem(FONT_SIZE_STORAGE_KEY);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed)) setFontSize(parsed);
    }
  }, []);

  const adjustFontSize = (delta: number) => {
    setFontSize((prev) => {
      const next = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, prev + delta));
      localStorage.setItem(FONT_SIZE_STORAGE_KEY, String(next));
      return next;
    });
  };
  const [shortcuts, setShortcuts] = useState<Record<ShortcutAction, string>>(DEFAULT_SHORTCUTS);

  useEffect(() => {
    setShortcuts(loadShortcuts());
  }, []);

  // Confirmação antes de recarregar/fechar a página — sempre, não só com
  // query não salva: fechar a aba derruba a conexão MySQL (o pool do
  // servidor não sabe que você "só" recarregou), então mesmo sem edição
  // pendente você teria que reconectar. O texto da mensagem é definido
  // pelo navegador (não é customizável por segurança), mas o diálogo
  // nativo "Sair do site?" já cobre o caso.
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const handleExecute = () => {
    if (!state.activeConnectionId) {
      toast.error('Selecione uma conexão na barra lateral');
      return;
    }
    if (!activeTab?.sql.trim()) {
      toast.error('Digite uma query para executar');
      return;
    }
    // Se houver texto selecionado no editor, roda só o trecho selecionado
    // — igual ao que o Ctrl+Enter já fazia, mas antes o botão "Executar"
    // ignorava a seleção e sempre rodava a aba inteira.
    const selected = getSelectedSql(activeTab.id);
    executeQuery(selected || activeTab.sql);
  };

  const executeTransaction = (command: 'BEGIN' | 'COMMIT' | 'ROLLBACK') => {
    if (!state.activeConnectionId) {
      toast.error('Selecione uma conexão');
      return;
    }
    executeQuery(command === 'BEGIN' ? 'START TRANSACTION' : command);
    toast.success(command === 'BEGIN' ? 'Transação iniciada' : command === 'COMMIT' ? 'Transação confirmada' : 'Transação revertida');
  };

  const handleExplain = () => {
    if (!state.activeConnectionId) {
      toast.error('Selecione uma conexão');
      return;
    }
    if (!activeTab?.sql.trim()) {
      toast.error('Digite uma query para explicar');
      return;
    }
    executeQuery(`EXPLAIN ${activeTab.sql}`);
  };

  const handleClear = () => {
    if (!state.activeTabId) return;
    dispatch({
      type: 'UPDATE_TAB',
      payload: {
        id: state.activeTabId,
        updates: { sql: '', isDirty: false },
      },
    });
  };

  const handleSave = async () => {
    const id = await saveQuery();
    if (id) toast.success('Query salva com sucesso!');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (matchesShortcut(e, shortcuts.newTab)) {
        e.preventDefault();
        newTab();
      }

      if (matchesShortcut(e, shortcuts.toggleSidebar)) {
        e.preventDefault();
        toggleSidebar();
      }

      if (matchesShortcut(e, shortcuts.toggleResults)) {
        e.preventDefault();
        dispatch({ type: 'SET_RESULTS_COLLAPSED', payload: !state.resultsCollapsed });
      }

      if (matchesShortcut(e, shortcuts.closeTab)) {
        e.preventDefault();
        e.stopPropagation();
        if (state.activeTabId) {
          dispatch({ type: 'REMOVE_TAB', payload: state.activeTabId });
        }
      }

      if (matchesShortcut(e, shortcuts.splitHorizontal)) {
        e.preventDefault();
        if (state.splitMode === 'horizontal') {
          disableSplit();
        } else {
          enableSplitHorizontal();
        }
      }

      if (matchesShortcut(e, shortcuts.splitVertical)) {
        e.preventDefault();
        if (state.splitMode === 'vertical') {
          disableSplit();
        } else {
          enableSplitVertical();
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'Tab') {
        e.preventDefault();
        if (state.splitMode !== 'none' && state.secondaryTabId && state.tabs.length > 1) {
          const currentIdx = state.tabs.findIndex(t => t.id === state.activeTabId);
          const nextIdx = e.shiftKey
            ? (currentIdx - 1 + state.tabs.length) % state.tabs.length
            : (currentIdx + 1) % state.tabs.length;
          dispatch({ type: 'SET_ACTIVE_TAB', payload: state.tabs[nextIdx].id });
        }
      }

      if (matchesShortcut(e, shortcuts.formatSql)) {
        e.preventDefault();
        formatSql();
      }

      if (matchesShortcut(e, shortcuts.toggleHighlight)) {
        e.preventDefault();
        dispatch({ type: 'TOGGLE_HIGHLIGHT' });
      }

      if (matchesShortcut(e, shortcuts.saveQuery)) {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [newTab, toggleSidebar, formatSql, state.activeTabId, state.activeConnectionId, state.resultsCollapsed, state.splitMode, state.secondaryTabId, state.tabs, dispatch, enableSplitHorizontal, enableSplitVertical, disableSplit, shortcuts]);

  const handleSidebarResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();

    const startX = e.clientX;
    const startWidth = state.sidebarWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX;
      dispatch({ type: 'SET_SIDEBAR_WIDTH', payload: startWidth + delta });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [state.sidebarWidth, dispatch]);

  const handleResultsResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();

    const startY = e.clientY;
    const startHeight = state.resultsHeight;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = startY - e.clientY;
      dispatch({ type: 'SET_RESULTS_HEIGHT', payload: startHeight + delta });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [state.resultsHeight, dispatch]);

  const editorHeight = state.resultsCollapsed
    ? 'calc(100vh - 64px)'
    : `calc(100vh - 64px - ${state.resultsHeight}px - 4px)`;

  const renderEditor = (tabId: string | null) => {
    if (!tabId) return null;
    const tab = state.tabs.find(t => t.id === tabId);
    if (!tab) return null;
    return <QueryEditor key={tab.id} tabId={tab.id} sql={tab.sql} connectionId={tab.connectionId} fontSize={fontSize} />;
  };

  const renderSplitEditors = () => {
    if (state.splitMode === 'none' || !state.activeTabId) {
      return (
        <div
          className="flex-1 overflow-hidden"
          style={{ height: editorHeight }}
        >
          {activeTab ? (
            <QueryEditor key={activeTab.id} tabId={activeTab.id} sql={activeTab.sql} connectionId={activeTab.connectionId} fontSize={fontSize} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Nenhuma aba aberta. Pressione Ctrl+Alt+N para criar uma nova.
            </div>
          )}
        </div>
      );
    }

    const primary = renderEditor(state.activeTabId);
    const secondary = state.secondaryTabId ? renderEditor(state.secondaryTabId) : null;

    const editorPaneStyle = { height: editorHeight, overflow: 'hidden' };

    if (state.splitMode === 'horizontal') {
      return (
        <SplitPane
          direction="horizontal"
          initialSize={state.splitSize}
          left={<div style={editorPaneStyle}>{primary}</div>}
          right={<div style={editorPaneStyle}>{secondary || <div className="flex items-center justify-center h-full text-muted-foreground">Selecione uma aba secundária</div>}</div>}
        />
      );
    } else {
      return (
        <SplitPane
          direction="vertical"
          initialSize={state.splitSize}
          left={<div style={editorPaneStyle}>{primary}</div>}
          right={<div style={editorPaneStyle}>{secondary || <div className="flex items-center justify-center h-full text-muted-foreground">Selecione uma aba secundária</div>}</div>}
        />
      );
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-42px)] mt-[42px] bg-background">
      <div className="flex flex-1 overflow-y-hidden">
          <>
            <div
              style={{ width: state.sidebarCollapsed ? 40 : state.sidebarWidth }}
              className="flex-shrink-0 border-r border-border overflow-hidden transition-all duration-200"
            >
              <Sidebar />
            </div>
            <div
              className="w-1 bg-border hover:bg-primary/50 cursor-col-resize flex-shrink-0 transition-colors"
              onMouseDown={handleSidebarResizeStart}
            />
          </>

        <div className="flex-1 flex flex-col overflow-y-hidden" ref={containerRef}>
          <div className="border-b border-border bg-card">
            <div className="px-2 py-1">
              <QueryTabs />
            </div>
            <div className="flex items-center gap-1 px-2 py-1 border-t border-border flex-wrap">
              {state.isExecuting ? (
                <button
                  onClick={cancelQuery}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors text-sm font-medium"
                  title="Cancelar execução (mata a query no servidor)"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                  Cancelar
                  <Loader2 className="h-3.5 w-3.5 animate-spin ml-0.5" />
                </button>
              ) : (
                <button
                  onClick={handleExecute}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors text-sm font-medium"
                  title="Executar (Ctrl+Enter) — roda só o trecho selecionado, se houver"
                >
                  <Play className="h-3.5 w-3.5" />
                  Executar
                </button>
              )}

              <button
                onClick={() => executeTransaction('BEGIN')}
                className="p-1.5 hover:bg-accent rounded transition-colors"
                title="Iniciar transação (BEGIN)"
              >
                <PlayCircle className="h-4 w-4 text-blue-500" />
              </button>
              <button
                onClick={() => executeTransaction('COMMIT')}
                className="p-1.5 hover:bg-accent rounded transition-colors"
                title="Confirmar transação (COMMIT)"
              >
                <CheckCircle className="h-4 w-4 text-green-500" />
              </button>
              <button
                onClick={() => executeTransaction('ROLLBACK')}
                className="p-1.5 hover:bg-accent rounded transition-colors"
                title="Reverter transação (ROLLBACK)"
              >
                <RotateCcw className="h-4 w-4 text-orange-500" />
              </button>
              <button
                onClick={handleExplain}
                className="p-1.5 hover:bg-accent rounded transition-colors"
                title="Explicar query (EXPLAIN)"
              >
                <HelpCircle className="h-4 w-4 text-purple-500" />
              </button>

              <div className="w-px h-5 bg-border mx-1" />

              <button
                onClick={formatSql}
                className="flex items-center gap-1 px-2 py-1 hover:bg-accent rounded text-sm text-muted-foreground hover:text-foreground transition-colors"
                title="Formatar SQL (Ctrl+Shift+F)"
              >
                <Wand2 className="h-4 w-4" />
                <span>Formatar</span>
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1 px-2 py-1 hover:bg-accent rounded text-sm text-muted-foreground hover:text-foreground transition-colors"
                title="Salvar query (Ctrl+S)"
              >
                <Save className="h-4 w-4" />
                <span>Salvar</span>
              </button>
              <button
                onClick={handleClear}
                className="flex items-center gap-1 px-2 py-1 hover:bg-accent rounded text-sm text-muted-foreground hover:text-foreground transition-colors"
                title="Limpar editor"
              >
                <Trash2 className="h-4 w-4" />
                <span>Limpar</span>
              </button>

              <div className="w-px h-5 bg-border mx-1" />

              <button
                onClick={() => adjustFontSize(-1)}
                disabled={fontSize <= MIN_FONT_SIZE}
                className="p-1.5 hover:bg-accent rounded transition-colors disabled:opacity-30 disabled:pointer-events-none"
                title="Diminuir fonte do editor"
              >
                <ZoomOut className="h-4 w-4 text-muted-foreground" />
              </button>
              <span className="text-xs text-muted-foreground w-6 text-center select-none">{fontSize}</span>
              <button
                onClick={() => adjustFontSize(1)}
                disabled={fontSize >= MAX_FONT_SIZE}
                className="p-1.5 hover:bg-accent rounded transition-colors disabled:opacity-30 disabled:pointer-events-none"
                title="Aumentar fonte do editor"
              >
                <ZoomIn className="h-4 w-4 text-muted-foreground" />
              </button>

              <div className="w-px h-5 bg-border mx-1" />

              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-1 px-2 py-1 hover:bg-accent rounded text-sm text-muted-foreground hover:text-foreground transition-colors"
                title="Configurações"
              >
                <Settings className="h-4 w-4" />
                <span>Config</span>
              </button>
            </div>
          </div>

          {renderSplitEditors()}

          <div
            className="h-1 bg-border hover:bg-primary/50 cursor-row-resize flex-shrink-0 transition-colors"
            onMouseDown={handleResultsResizeStart}
          />

          {state.resultsCollapsed ? null : (
            <div
              className="flex-shrink-0 border-t border-border overflow-hidden"
              style={{ height: state.resultsHeight }}
            >
              <ResultsPanel />
            </div>
          )}
        </div>
      </div>

      <ShortcutSettings
        open={showSettings}
        onOpenChange={(open) => {
          setShowSettings(open);
          if (!open) setShortcuts(loadShortcuts());
        }}
      />
    </div>
  );
}
