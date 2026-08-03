'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useStudio } from '../../store/StudioContext';
import { Eye, EyeOff, Lock, Unlock, GripVertical, Layers } from 'lucide-react';

export function SelectionPane() {
  const { state, dispatch } = useStudio();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const activePage = state.pages.find(p => p.id === state.activePageId);
  const visuals = activePage?.visuals || [];
  const sorted = [...visuals].sort((a, b) => b.zIndex - a.zIndex);

  const handleRename = (id: string) => {
    if (editValue.trim()) {
      dispatch({ type: 'UPDATE_VISUAL', payload: { id, updates: { name: editValue.trim() } } });
    }
    setEditingId(null);
  };

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = dragIndex;
    if (fromIndex === null || fromIndex === toIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    dispatch({ type: 'REORDER_VISUALS', payload: { fromIndex, toIndex } });
    setDragIndex(null);
    setDragOverIndex(null);
  }, [dragIndex, dispatch]);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-neutral-900">
      <div className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-700">
        <span className="text-xs font-semibold text-foreground">Camadas</span>
      </div>

      <div className="flex-1 overflow-y-auto studio-scrollbar">
        {sorted.length === 0 && (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">
            Nenhum visual na página
          </div>
        )}

        {sorted.map((visual, index) => (
          <div
            key={visual.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-1.5 px-2 py-1.5 border-b border-neutral-100 dark:border-neutral-800 cursor-pointer group
              ${(state.selectedVisualId === visual.id || state.selectedVisualIds.includes(visual.id))
                ? 'bg-amber-50 dark:bg-amber-900/20'
                : dragOverIndex === index
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-t-2 border-t-blue-400'
                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
              }
              ${dragIndex === index ? 'opacity-50' : ''}
            `}
            onClick={(e) => {
              if (e.ctrlKey || e.metaKey) {
                dispatch({ type: 'SELECT_VISUAL_MULTI', payload: visual.id });
              } else {
                dispatch({ type: 'SELECT_VISUAL', payload: visual.id });
              }
            }}
          >
            <GripVertical size={12} className="text-neutral-300 dark:text-neutral-600 shrink-0 cursor-grab" />

            <div className="flex-1 min-w-0">
              {editingId === visual.id ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleRename(visual.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename(visual.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="w-full bg-transparent text-xs text-foreground outline-none border-b border-amber-500"
                  autoFocus
                />
              ) : (
                <div className="flex items-center gap-1">
                  <span
                    className="text-xs text-foreground truncate"
                    onDoubleClick={() => {
                      setEditingId(visual.id);
                      setEditValue(visual.name);
                    }}
                  >
                    {visual.name}
                  </span>
                  {visual.groupId && (
                    <span title="Agrupado"><Layers size={10} className="text-blue-400 shrink-0" /></span>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                dispatch({ type: 'TOGGLE_VISUAL_HIDDEN', payload: visual.id });
              }}
              className="p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              title={visual.hidden ? 'Mostrar' : 'Ocultar'}
            >
              {visual.hidden ? (
                <EyeOff size={12} className="text-muted-foreground" />
              ) : (
                <Eye size={12} className="text-muted-foreground" />
              )}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                dispatch({ type: 'TOGGLE_VISUAL_LOCK', payload: visual.id });
              }}
              className="p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              title={visual.locked ? 'Desbloquear' : 'Bloquear'}
            >
              {visual.locked ? (
                <Lock size={12} className="text-amber-500" />
              ) : (
                <Unlock size={12} className="text-muted-foreground" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
