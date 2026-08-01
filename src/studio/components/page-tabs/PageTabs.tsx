'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useStudio } from '../../store/StudioContext';
import { PageContextMenu } from './PageContextMenu';
import { Plus, X } from 'lucide-react';

export function PageTabs() {
  const { state, dispatch } = useStudio();
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [contextMenu, setContextMenu] = useState<{ pageId: string; x: number; y: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
    dispatch({ type: 'REMOVE_PAGE', payload: pageId });
    setContextMenu(null);
  }, [state.pages.length, dispatch]);

  const handleDuplicate = useCallback((pageId: string) => {
    const page = state.pages.find(p => p.id === pageId);
    if (!page) return;
    dispatch({ type: 'ADD_PAGE', payload: { name: `${page.name} (Cópia)` } });
    setContextMenu(null);
  }, [state.pages, dispatch]);

  return (
    <>
      <div
        ref={containerRef}
        className="h-8 flex items-center bg-neutral-900 border-t border-neutral-700 px-2 gap-0.5 overflow-x-auto"
      >
        {state.pages.map(page => (
          <div
            key={page.id}
            className={`group flex items-center gap-1 px-3 py-1 text-xs rounded-t cursor-pointer transition-colors select-none
              ${state.activePageId === page.id
                ? 'bg-neutral-800 text-white border-t-2 border-amber-500'
                : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-300'
              }
            `}
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
                className="bg-transparent border-b border-amber-500 text-white text-xs w-20 outline-none px-0.5"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span>{page.name}</span>
            )}

            {state.pages.length > 1 && state.activePageId === page.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(page.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 transition-opacity ml-1"
              >
                <X size={10} />
              </button>
            )}
          </div>
        ))}

        <button
          onClick={() => dispatch({ type: 'ADD_PAGE' })}
          className="w-6 h-6 flex items-center justify-center rounded text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors ml-1"
          title="Adicionar página"
        >
          <Plus size={14} />
        </button>
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
    </>
  );
}
