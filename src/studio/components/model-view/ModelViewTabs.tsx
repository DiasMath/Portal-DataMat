'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useStudio } from '../../store/StudioContext';
import { Plus, X, GripVertical, Copy, Trash2, Pencil } from 'lucide-react';

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  tabId: string;
  tabName: string;
}

export function ModelViewTabs() {
  const { state, dispatch } = useStudio();
  const { modelViewTabs, activeModelViewTab } = state;
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [dragOverTabId, setDragOverTabId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, tabId: '', tabName: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<{ tabId: string; tabName: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(prev => ({ ...prev, visible: false }));
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddTab = useCallback(() => {
    const newName = `Modelo ${modelViewTabs.length + 1}`;
    dispatch({ type: 'ADD_MODEL_VIEW_TAB', payload: { name: newName } });
  }, [modelViewTabs.length, dispatch]);

  const handleSelectTab = useCallback((tabId: string) => {
    dispatch({ type: 'SET_ACTIVE_MODEL_VIEW_TAB', payload: tabId });
  }, [dispatch]);

  const handleCloseTab = useCallback((e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    if (modelViewTabs.length <= 1) return;
    const tab = modelViewTabs.find(t => t.id === tabId);
    if (tab) {
      setDeleteConfirm({ tabId, tabName: tab.name });
    }
  }, [modelViewTabs]);

  const confirmDelete = useCallback(() => {
    if (deleteConfirm) {
      dispatch({ type: 'REMOVE_MODEL_VIEW_TAB', payload: deleteConfirm.tabId });
      setDeleteConfirm(null);
    }
  }, [deleteConfirm, dispatch]);

  const handleDoubleClick = useCallback((tabId: string, currentName: string) => {
    setEditingTabId(tabId);
    setEditingName(currentName);
    setTimeout(() => inputRef.current?.select(), 0);
  }, []);

  const handleRenameSubmit = useCallback(() => {
    if (editingTabId && editingName.trim()) {
      dispatch({
        type: 'RENAME_MODEL_VIEW_TAB',
        payload: { id: editingTabId, name: editingName.trim() },
      });
    }
    setEditingTabId(null);
    setEditingName('');
  }, [editingTabId, editingName, dispatch]);

  const handleContextMenu = useCallback((e: React.MouseEvent, tabId: string, tabName: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, tabId, tabName });
  }, []);

  const handleDuplicateTab = useCallback(() => {
    if (contextMenu.tabId) {
      const tab = modelViewTabs.find(t => t.id === contextMenu.tabId);
      if (tab) {
        dispatch({ type: 'ADD_MODEL_VIEW_TAB', payload: { name: `${tab.name} (Cópia)` } });
      }
    }
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, [contextMenu, modelViewTabs, dispatch]);

  const handleRenameFromMenu = useCallback(() => {
    if (contextMenu.tabId) {
      handleDoubleClick(contextMenu.tabId, contextMenu.tabName);
    }
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, [contextMenu, handleDoubleClick]);

  const handleDeleteFromMenu = useCallback(() => {
    if (contextMenu.tabId && modelViewTabs.length > 1) {
      setDeleteConfirm({ tabId: contextMenu.tabId, tabName: contextMenu.tabName });
    }
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, [contextMenu, modelViewTabs.length]);

  const handleDragStart = useCallback((e: React.DragEvent, tabId: string) => {
    setDraggedTabId(tabId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, tabId: string) => {
    e.preventDefault();
    if (draggedTabId && draggedTabId !== tabId) {
      setDragOverTabId(tabId);
    }
  }, [draggedTabId]);

  const handleDrop = useCallback((e: React.DragEvent, targetTabId: string) => {
    e.preventDefault();
    if (!draggedTabId || draggedTabId === targetTabId) {
      setDraggedTabId(null);
      setDragOverTabId(null);
      return;
    }

    const fromIndex = modelViewTabs.findIndex(t => t.id === draggedTabId);
    const toIndex = modelViewTabs.findIndex(t => t.id === targetTabId);

    if (fromIndex !== -1 && toIndex !== -1) {
      const newOrder = [...modelViewTabs.map(t => t.id)];
      newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, draggedTabId);
      dispatch({ type: 'SET_MODEL_VIEW_TABS', payload: [] });
      newOrder.forEach(id => {
        const tab = modelViewTabs.find(t => t.id === id);
        if (tab) {
          dispatch({ type: 'ADD_MODEL_VIEW_TAB', payload: { name: tab.name } });
        }
      });
    }

    setDraggedTabId(null);
    setDragOverTabId(null);
  }, [draggedTabId, modelViewTabs, dispatch]);

  const handleDragEnd = useCallback(() => {
    setDraggedTabId(null);
    setDragOverTabId(null);
  }, []);

  return (
    <>
      <div className="h-7 flex items-center bg-neutral-900 border-t border-neutral-700 px-2 shrink-0">
        <div className="flex items-center gap-0.5 overflow-x-auto">
          {modelViewTabs.map(tab => {
            const isActive = tab.id === activeModelViewTab;
            const isEditing = tab.id === editingTabId;
            const isDragOver = tab.id === dragOverTabId;

            return (
              <div
                key={tab.id}
                draggable
                onDragStart={(e) => handleDragStart(e, tab.id)}
                onDragOver={(e) => handleDragOver(e, tab.id)}
                onDrop={(e) => handleDrop(e, tab.id)}
                onDragEnd={handleDragEnd}
                onClick={() => handleSelectTab(tab.id)}
                onDoubleClick={() => handleDoubleClick(tab.id, tab.name)}
                onContextMenu={(e) => handleContextMenu(e, tab.id, tab.name)}
                className={`
                  flex items-center gap-1 px-2 py-0.5 text-[11px] cursor-pointer select-none
                  transition-colors rounded-t
                  ${isActive
                    ? 'bg-neutral-800 text-amber-400 border-b-2 border-amber-500'
                    : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50'
                  }
                  ${isDragOver ? 'border-l-2 border-amber-500' : ''}
                  ${draggedTabId === tab.id ? 'opacity-50' : ''}
                `}
              >
                <GripVertical size={10} className="text-neutral-600 cursor-grab" />
                {isEditing ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={handleRenameSubmit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameSubmit();
                      if (e.key === 'Escape') setEditingTabId(null);
                    }}
                    className="w-24 px-1 py-0 text-[11px] bg-neutral-700 border border-amber-500 rounded text-white focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <span className="truncate max-w-[120px]">{tab.name}</span>
                )}
                {modelViewTabs.length > 1 && !isEditing && (
                  <button
                    onClick={(e) => handleCloseTab(e, tab.id)}
                    className="ml-0.5 p-0.5 rounded hover:bg-neutral-700 text-neutral-600 hover:text-neutral-300"
                    title="Fechar aba"
                    aria-label="Fechar aba"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={handleAddTab}
          className="ml-1 p-0.5 rounded hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300"
          title="Adicionar aba"
          aria-label="Adicionar aba"
        >
          <Plus size={14} />
        </button>
      </div>

      {contextMenu.visible && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-[#2a2a2a] border border-[#444] rounded-lg shadow-xl py-1 w-40"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={handleRenameFromMenu}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-700"
          >
            <Pencil size={12} /> Renomear
          </button>
          <button
            onClick={handleDuplicateTab}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-700"
          >
            <Copy size={12} /> Duplicar
          </button>
          {modelViewTabs.length > 1 && (
            <>
              <div className="border-t border-[#444] my-1" />
              <button
                onClick={handleDeleteFromMenu}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-neutral-700"
              >
                <Trash2 size={12} /> Excluir
              </button>
            </>
          )}
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl p-6 max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Trash2 size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Excluir aba?</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  A aba &quot;{deleteConfirm.tabName}&quot; será excluída permanentemente.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white rounded hover:bg-[#333]"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-3 py-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
