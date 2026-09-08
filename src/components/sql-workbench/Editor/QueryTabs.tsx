'use client';

import { useState, useCallback, useRef } from 'react';
import { useSqlWorkbench } from '@/contexts/SqlWorkbenchContext';
import { X, Plus, SplitSquareHorizontal, SplitSquareVertical } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function QueryTabs() {
  const { state, dispatch, newTab, enableSplitHorizontal, enableSplitVertical, disableSplit } = useSqlWorkbench();
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const dragIdxRef = useRef<number | null>(null);
  const [closingTabId, setClosingTabId] = useState<string | null>(null);

  const confirmCloseTab = useCallback((tabId: string) => {
    const tab = state.tabs.find(t => t.id === tabId);
    if (tab && tab.sql.trim()) {
      setClosingTabId(tabId);
    } else {
      doCloseTab(tabId);
    }
  }, [state.tabs]);

  const doCloseTab = useCallback((tabId: string) => {
    if (state.tabs.length <= 1) return;
    const tabIndex = state.tabs.findIndex((t) => t.id === tabId);
    const newTabs = state.tabs.filter((t) => t.id !== tabId);
    let newActiveId = state.activeTabId;
    if (state.activeTabId === tabId) {
      newActiveId = newTabs[Math.min(tabIndex, newTabs.length - 1)]?.id || null;
    }
    dispatch({ type: 'SET_TABS', payload: newTabs });
    dispatch({ type: 'SET_ACTIVE_TAB', payload: newActiveId });
    setClosingTabId(null);
  }, [state.tabs, state.activeTabId, dispatch]);

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
      <div className="flex items-center gap-0.5 overflow-x-auto">
        {state.tabs.map((tab, idx) => (
          <button
            key={tab.id}
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={(e) => handleDrop(e, idx)}
            onDragEnd={handleDragEnd}
            onClick={() => handleTabClick(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1 text-sm rounded-t-md transition-colors max-w-[200px] ${
              state.activeTabId === tab.id
                ? 'bg-background text-foreground border-b-2 border-primary'
                : 'bg-card text-muted-foreground hover:bg-accent hover:text-foreground'
            } ${dragOverIdx === idx ? 'border-l-2 border-primary' : ''}`}
          >
            <span className="truncate max-w-[150px]">
              {tab.title}
              {tab.isDirty && <span className="text-primary ml-1">•</span>}
            </span>
            {state.tabs.length > 1 && (
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  confirmCloseTab(tab.id);
                }}
                className="p-0.5 hover:bg-accent rounded transition-colors flex-shrink-0 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </span>
            )}
          </button>
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
          title="Nova aba (Ctrl+Alt+N)"
        >
          <Plus className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <Dialog open={!!closingTabId} onOpenChange={(open) => { if (!open) setClosingTabId(null); }}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Fechar aba?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">A aba possui queries não salvas. Deseja fechar?</p>
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
              Fechar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
