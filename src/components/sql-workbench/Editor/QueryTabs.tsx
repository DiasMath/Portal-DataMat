'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSqlWorkbench } from '@/contexts/SqlWorkbenchContext';
import { X, Plus, SplitSquareHorizontal, SplitSquareVertical, TableProperties, Eye, FileCode, FunctionSquare, Pin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { v4 as uuidv4 } from 'uuid';

const TAB_KIND_ICONS: Record<string, typeof TableProperties> = {
  'table-editor': TableProperties,
  'view-editor': Eye,
  'procedure-editor': FileCode,
  'function-editor': FunctionSquare,
};

export function QueryTabs() {
  const { state, dispatch, newTab, enableSplitHorizontal, enableSplitVertical, disableSplit } = useSqlWorkbench();
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const dragIdxRef = useRef<number | null>(null);
  const [closingTabIds, setClosingTabIds] = useState<string[]>([]);
  const [tabMenu, setTabMenu] = useState<{ tabId: string; x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const doCloseTabs = useCallback((ids: string[]) => {
    const closing = new Set(ids);
    const remaining = state.tabs.filter((tab) => !closing.has(tab.id));
    if (remaining.length === state.tabs.length) return;
    dispatch({ type: 'SET_TABS', payload: remaining });
    if (!remaining.some((tab) => tab.id === state.activeTabId)) dispatch({ type: 'SET_ACTIVE_TAB', payload: remaining[0]?.id || null });
    if (!remaining.some((tab) => tab.id === state.secondaryTabId)) dispatch({ type: 'SET_SECONDARY_TAB', payload: null });
    if (remaining.length === 0) newTab(undefined, undefined, state.tabs.find((tab) => closing.has(tab.id))?.connectionId);
    setClosingTabIds([]);
  }, [state.tabs, state.activeTabId, state.secondaryTabId, dispatch, newTab]);

  const requestCloseTabs = useCallback((ids: string[]) => {
    setTabMenu(null);
    const pending = state.tabs.filter((tab) => ids.includes(tab.id) && tab.sql.trim() && tab.sql !== tab.savedSql);
    if (pending.length) setClosingTabIds(ids);
    else doCloseTabs(ids);
  }, [state.tabs, doCloseTabs]);

  useEffect(() => { if (tabMenu) menuRef.current?.focus(); }, [tabMenu]);

  const togglePinned = (tabId: string) => {
    const tabs = state.tabs.map((tab) => tab.id === tabId ? { ...tab, pinned: !tab.pinned } : tab);
    dispatch({ type: 'SET_TABS', payload: [...tabs.filter((tab) => tab.pinned), ...tabs.filter((tab) => !tab.pinned)] });
    setTabMenu(null);
  };

  const splitTab = (tabId: string, mode: 'horizontal' | 'vertical') => {
    const other = state.tabs.find((tab) => tab.id === state.activeTabId && tab.id !== tabId) || state.tabs.find((tab) => tab.id !== tabId);
    let otherId = other?.id;
    if (!otherId) {
      const target = state.tabs.find((tab) => tab.id === tabId);
      if (!target) return;
      otherId = uuidv4();
      dispatch({ type: 'ADD_TAB', payload: { id: otherId, connectionId: target.connectionId } });
    }
    dispatch({ type: 'SET_ACTIVE_TAB', payload: mode === 'horizontal' ? otherId : tabId });
    dispatch({ type: 'SET_SECONDARY_TAB', payload: mode === 'horizontal' ? tabId : otherId });
    dispatch({ type: 'SET_SPLIT_MODE', payload: mode });
    setTabMenu(null);
  };

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
            onMouseDown={(event) => { if (event.button === 1) event.preventDefault(); }}
            onAuxClick={(event) => { if (event.button === 1) { event.preventDefault(); requestCloseTabs([tab.id]); } }}
            onContextMenu={(event) => { event.preventDefault(); setTabMenu({ tabId: tab.id, x: Math.min(event.clientX, window.innerWidth - 240), y: Math.min(event.clientY, window.innerHeight - 310) }); }}
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
              {tab.pinned && <Pin className="h-3 w-3 shrink-0" aria-label="Aba fixada" />}
              {tab.title}
              {tab.isDirty && <span className="text-primary ml-1">•</span>}
            </span>
            <button
                type="button"
                aria-label={`Fechar ${tab.title}`}
                onClick={(e) => {
                  e.stopPropagation();
                  requestCloseTabs([tab.id]);
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

      {tabMenu && <div className="fixed inset-0 z-50" onClick={() => setTabMenu(null)} onContextMenu={(event) => { event.preventDefault(); setTabMenu(null); }}>
        <div ref={menuRef} role="menu" tabIndex={-1} aria-label="Opções da aba" onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); setTabMenu(null); } }} onClick={(event) => event.stopPropagation()} className="fixed z-[51] w-56 rounded-md border bg-popover p-1 text-popover-foreground shadow-md" style={{ left: Math.max(8, tabMenu.x), top: Math.max(8, tabMenu.y) }}>
          {(() => {
            const target = state.tabs.find((tab) => tab.id === tabMenu.tabId);
            if (!target) return null;
            const itemClass = 'block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent focus:bg-accent disabled:opacity-50';
            return <>
              <button role="menuitem" className={itemClass} onClick={() => requestCloseTabs([target.id])}>Fechar esta aba</button>
              <button role="menuitem" className={itemClass} onClick={() => requestCloseTabs(state.tabs.filter((tab) => tab.id !== target.id && !tab.pinned).map((tab) => tab.id))}>Fechar todas menos esta</button>
              <button role="menuitem" className={itemClass} onClick={() => requestCloseTabs(state.tabs.filter((tab) => !tab.pinned).map((tab) => tab.id))}>Fechar todas as abas <span className="text-xs text-muted-foreground">(exceto fixadas)</span></button>
              <div className="my-1 border-t" />
              <button role="menuitem" className={itemClass} onClick={() => splitTab(target.id, 'horizontal')}>Dividir para a direita</button>
              <button role="menuitem" className={itemClass} onClick={() => splitTab(target.id, 'vertical')}>Dividir para cima</button>
              <div className="my-1 border-t" />
              <button role="menuitem" className={itemClass} onClick={() => togglePinned(target.id)}>{target.pinned ? 'Desafixar aba' : 'Fixar aba'}</button>
              <button role="menuitem" className={itemClass} onClick={() => { newTab(`${target.title} cópia`, target.sql, target.connectionId, target.kind, target.liveParameters); setTabMenu(null); }}>Duplicar aba</button>
            </>;
          })()}
        </div>
      </div>}

      <Dialog open={closingTabIds.length > 0} onOpenChange={(open) => { if (!open) setClosingTabIds([]); }}>
        <DialogContent className="bg-card border-border max-w-sm" onOpenAutoFocus={(event) => { event.preventDefault(); confirmButtonRef.current?.focus(); }}>
          <DialogHeader>
            <DialogTitle className="text-sm">Descartar {closingTabIds.length > 1 ? 'consultas não salvas' : 'consulta não salva'}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{closingTabIds.length > 1 ? 'Há consultas não salvas nessas abas.' : 'A consulta desta aba ainda não foi salva.'} Pressione Enter para descartar e fechar.</p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setClosingTabIds([])}
              className="px-3 py-1.5 text-sm rounded hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              ref={confirmButtonRef}
              onClick={() => doCloseTabs(closingTabIds)}
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
