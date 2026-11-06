'use client';

import { useState, useCallback, useRef } from 'react';
import { useSqlWorkbench } from '@/contexts/SqlWorkbenchContext';
import { X, Plus, SplitSquareHorizontal, SplitSquareVertical, TableProperties, Eye, FileCode, FunctionSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const TAB_KIND_ICONS: Record<string, typeof TableProperties> = {
  'table-editor': TableProperties,
  'view-editor': Eye,
  'procedure-editor': FileCode,
  'function-editor': FunctionSquare,
};

export function QueryTabs() {
  const { state, dispatch, newTab, closeTab, enableSplitHorizontal, enableSplitVertical, disableSplit } = useSqlWorkbench();
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const dragIdxRef = useRef<number | null>(null);
  const [closingTabId, setClosingTabId] = useState<string | null>(null);

  const doCloseTab = useCallback((tabId: string) => {
    closeTab(tabId);
    if (state.tabs.length === 1) newTab(undefined, undefined, state.tabs[0].connectionId);
    setClosingTabId(null);
  }, [state.tabs, closeTab, newTab]);

  const confirmCloseTab = useCallback((tabId: string) => {
    const tab = state.tabs.find(t => t.id === tabId);
    if (tab && tab.sql.trim() && tab.sql !== tab.savedSql) {
      setClosingTabId(tabId);
    } else {
      doCloseTab(tabId);
    }
  }, [state.tabs, doCloseTab]);

  const handleTabClick = useCallback((tabId: string) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tabId });
  }, [dispatch]);

  const handleDragStart = useCallback((e: React.DragEvent, idx: number) => {
    dragIdxRef.current = idx;
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    const dragIdx = dragIdxRef.current;
    if (dragIdx === null || dragIdx === dropIdx) {
      setDragOverIdx(null);
      return;
    }

    const newTabs = [...state.tabs];
    const [moved] = newTabs.splice(dragIdx, 1);
    newTabs.splice(dropIdx, 0, moved);
    dispatch({ type: 'SET_TABS', payload: newTabs });
    setDragOverIdx(null);
    dragIdxRef.current = null;
  }, [state.tabs, dispatch]);

  const handleDragEnd = useCallback(() => {
    setDragOverIdx(null);
    dragIdxRef.current = null;
  }, []);

  const handleSplitHorizontal = () => {
    if (state.splitMode === 'horizontal') {
      disableSplit();
    } else {
      enableSplitHorizontal();
    }
  };

  const handleSplitVertical = () => {
    if (state.splitMode === 'vertical') {
      disableSplit();
    } else {
      enableSplitVertical();
    }
  };

  return (
    <div className="flex items-center gap-1">
      <div role="tablist" aria-label="Consultas abertas" className="flex items-center gap-0.5 overflow-x-auto">
        {state.tabs.map((tab, idx) => (
          <div
            key={tab.id}
            role="tab"
            tabIndex={0}
            aria-selected={state.activeTabId === tab.id}
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={(e) => handleDrop(e, idx)}
            onDragEnd={handleDragEnd}
            onClick={() => handleTabClick(tab.id)}
            onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); handleTabClick(tab.id); } }}
            onContextMenu={(event) => { event.preventDefault(); confirmCloseTab(tab.id); }}
            className={`flex items-center gap-1.5 px-3 py-1 text-sm rounded-t-md transition-colors max-w-[200px] ${
              state.activeTabId === tab.id
                ? 'bg-background text-foreground border-b-2 border-primary'
                : 'bg-card text-muted-foreground hover:bg-accent hover:text-foreground'
            } ${dragOverIdx === idx ? 'border-l-2 border-primary' : ''}`}
          >
            <span className="truncate max-w-[150px] flex items-center gap-1">
              {tab.kind && TAB_KIND_ICONS[tab.kind] && (
                (() => { const Icon = TAB_KIND_ICONS[tab.kind!]; return <Icon className="h-3 w-3 shrink-0" />; })()
              )}
              {tab.title}
              {tab.isDirty && <span className="text-primary ml-1">•</span>}
            </span>
            <button
                type="button"
                aria-label={`Fechar ${tab.title}`}
                onClick={(e) => {
                  e.stopPropagation();
                  confirmCloseTab(tab.id);
                }}
                className="p-0.5 hover:bg-accent rounded transition-colors flex-shrink-0 cursor-pointer"
              >
                <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1 ml-auto flex-shrink-0">
        <button
          onClick={handleSplitHorizontal}
          className={`p-1 rounded transition-colors ${state.splitMode === 'horizontal' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
          title="Dividir horizontalmente (Ctrl+Shift+H)"
        >
          <SplitSquareHorizontal className="h-4 w-4" />
        </button>
        <button
          onClick={handleSplitVertical}
          className={`p-1 rounded transition-colors ${state.splitMode === 'vertical' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
          title="Dividir verticalmente (Ctrl+Shift+V)"
        >
          <SplitSquareVertical className="h-4 w-4" />
        </button>
        <button
          onClick={() => newTab()}
          className="p-1 hover:bg-accent rounded transition-colors"
          title="Nova aba (Ctrl+Alt+Shift+N)"
        >
          <Plus className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <Dialog open={!!closingTabId} onOpenChange={(open) => { if (!open) setClosingTabId(null); }}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Descartar consulta não salva?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">A consulta desta aba ainda não foi salva. Deseja descartá-la e fechar a aba?</p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setClosingTabId(null)}
              className="px-3 py-1.5 text-sm rounded hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => closingTabId && doCloseTab(closingTabId)}
              className="px-3 py-1.5 text-sm rounded bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
            >
              Descartar e fechar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
