'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useStudio } from '../../store/StudioContext';
import { PageContextMenu } from '../page-tabs/PageContextMenu';
import { ZoomBar } from './ZoomBar';
import { Plus, X, GripVertical, AlertTriangle } from 'lucide-react';

export function BottomBar() {
  const { state, dispatch } = useStudio();
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [contextMenu, setContextMenu] = useState<{ pageId: string; x: number; y: number } | null>(null);
  const [draggingPageId, setDraggingPageId] = useState<string | null>(null);
  const [dragOverPageId, setDragOverPageId] = useState<string | null>(null);
  const [pageToDelete, setPageToDelete] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingPageId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingPageId]);

  const handleDoubleClick = useCallback((pageId: string, currentName: string) => {
    setEditingPageId(pageId);
    setEditValue(currentName);
  }, []);

  const handleRenameSubmit = useCallback(() => {
    if (editingPageId && editValue.trim()) {
      dispatch({ type: 'RENAME_PAGE', payload: { id: editingPageId, name: editValue.trim() } });
    }
    setEditingPageId(null);
  }, [editingPageId, editValue, dispatch]);

  const handleContextMenu = useCallback((e: React.MouseEvent, pageId: string) => {
    e.preventDefault();
    setContextMenu({ pageId, x: e.clientX, y: e.clientY });
  }, []);

  const handleDelete = useCallback((pageId: string) => {
    if (state.pages.length <= 1) return;
    setPageToDelete(pageId);
    setContextMenu(null);
  }, [state.pages.length]);

  const confirmDelete = useCallback(() => {
    if (pageToDelete) {
      dispatch({ type: 'REMOVE_PAGE', payload: pageToDelete });
      setPageToDelete(null);
    }
  }, [pageToDelete, dispatch]);

  const cancelDelete = useCallback(() => {
    setPageToDelete(null);
  }, []);

  const handleDuplicate = useCallback((pageId: string) => {
    dispatch({ type: 'DUPLICATE_PAGE', payload: pageId });
    setContextMenu(null);
  }, [dispatch]);

  const handleDragStart = useCallback((e: React.DragEvent, pageId: string) => {
    setDraggingPageId(pageId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', pageId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, pageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (pageId !== draggingPageId) {
      setDragOverPageId(pageId);
    }
  }, [draggingPageId]);

  const handleDragLeave = useCallback(() => {
    setDragOverPageId(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetPageId: string) => {
    e.preventDefault();
    const sourcePageId = draggingPageId;
    if (!sourcePageId || sourcePageId === targetPageId) {
      setDraggingPageId(null);
      setDragOverPageId(null);
      return;
    }

    const pages = [...state.pages];
    const sourceIndex = pages.findIndex(p => p.id === sourcePageId);
    const targetIndex = pages.findIndex(p => p.id === targetPageId);

    if (sourceIndex !== -1 && targetIndex !== -1) {
      const [removed] = pages.splice(sourceIndex, 1);
      pages.splice(targetIndex, 0, removed);
      dispatch({ type: 'REORDER_PAGES', payload: pages.map(p => p.id) });
    }

    setDraggingPageId(null);
    setDragOverPageId(null);
  }, [draggingPageId, state.pages, dispatch]);

  const handleDragEnd = useCallback(() => {
    setDraggingPageId(null);
    setDragOverPageId(null);
  }, []);

  const activePage = state.pages.find(p => p.id === state.activePageId);
  const pageWidth = activePage?.pageWidth || 1920;
  const pageHeight = activePage?.pageHeight || 1080;
  const visualCount = activePage?.visuals.length || 0;

  return (
    <>
      <div className="h-7 flex items-center bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 px-2 shrink-0">
        <div className="flex items-center gap-0.5 overflow-x-auto flex-1">
          {state.pages.map((page, index) => (
            <div
              key={page.id}
              className={`group flex items-center gap-1 px-2.5 py-0.5 text-[11px] rounded cursor-pointer transition-colors select-none
                ${state.activePageId === page.id
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-foreground font-medium border-b-2 border-amber-500'
                  : 'text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800/50 hover:text-foreground'
                }
                ${draggingPageId === page.id ? 'opacity-50' : ''}
                ${dragOverPageId === page.id && draggingPageId !== page.id ? 'border-l-2 border-amber-500 pl-[calc(2.5px-2px)]' : ''}
              `}
              draggable
              onDragStart={(e) => handleDragStart(e, page.id)}
              onDragOver={(e) => handleDragOver(e, page.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, page.id)}
              onDragEnd={handleDragEnd}
              onClick={() => dispatch({ type: 'SET_ACTIVE_PAGE', payload: page.id })}
              onDoubleClick={() => handleDoubleClick(page.id, page.name)}
              onContextMenu={(e) => handleContextMenu(e, page.id)}
            >
              {editingPageId === page.id ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={handleRenameSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSubmit();
                    if (e.key === 'Escape') setEditingPageId(null);
                  }}
                  className="bg-transparent border-b border-amber-500 text-foreground text-[11px] w-20 outline-none px-0.5"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <>
                  <GripVertical size={12} className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing mr-0.5" />
                  <span>{page.name}</span>
                </>
              )}

              {state.pages.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(page.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-opacity ml-0.5 p-0.5"
                  title="Excluir página"
                  aria-label="Excluir página"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}

          <button
            onClick={() => dispatch({ type: 'ADD_PAGE' })}
            className="w-8 h-8 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ml-0.5"
            title="Adicionar página"
            aria-label="Adicionar página"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700 mx-2" />

        <div className="flex items-center gap-3 text-[10px] text-muted-foreground mr-2">
          <span>Página {state.pages.findIndex(p => p.id === state.activePageId) + 1} de {state.pages.length}</span>
          <span>{pageWidth} × {pageHeight}</span>
          <span>{visualCount} visual{visualCount !== 1 ? 's' : ''}</span>
          <span>{Math.round(state.canvasZoom * 100)}%</span>
        </div>

        <ZoomBar />
      </div>

      {contextMenu && (
        <PageContextMenu
          pageId={contextMenu.pageId}
          x={contextMenu.x}
          y={contextMenu.y}
          canDelete={state.pages.length > 1}
          onRename={() => {
            const page = state.pages.find(p => p.id === contextMenu.pageId);
            if (page) handleDoubleClick(contextMenu.pageId, page.name);
            setContextMenu(null);
          }}
          onDuplicate={() => handleDuplicate(contextMenu.pageId)}
          onDelete={() => handleDelete(contextMenu.pageId)}
          onClose={() => setContextMenu(null)}
        />
      )}

      {pageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={cancelDelete}>
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Excluir página?</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Tem certeza que deseja excluir esta página? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
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