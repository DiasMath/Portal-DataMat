'use client';

import React, { useState } from 'react';
import { useStudio } from '../../store/StudioContext';
import { Eye, EyeOff, Lock, Unlock, GripVertical } from 'lucide-react';

export function SelectionPane() {
  const { state, dispatch } = useStudio();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const activePage = state.pages.find(p => p.id === state.activePageId);
  const visuals = activePage?.visuals || [];
  const sorted = [...visuals].sort((a, b) => b.zIndex - a.zIndex);

  const handleRename = (id: string) => {
    if (editValue.trim()) {
      dispatch({ type: 'UPDATE_VISUAL', payload: { id, updates: { title: editValue.trim() } } });
    }
    setEditingId(null);
  };

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-700">
      <div className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-700">
        <span className="text-xs font-semibold text-foreground">Camadas</span>
      </div>

      <div className="flex-1 overflow-y-auto studio-scrollbar">
        {sorted.length === 0 && (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">
            Nenhum visual na página
          </div>
        )}

        {sorted.map(visual => (
          <div
            key={visual.id}
            className={`flex items-center gap-1.5 px-2 py-1.5 border-b border-neutral-100 dark:border-neutral-800 cursor-pointer group
              ${state.selectedVisualId === visual.id
                ? 'bg-amber-50 dark:bg-amber-900/20'
                : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
              }
            `}
            onClick={() => dispatch({ type: 'SELECT_VISUAL', payload: visual.id })}
          >
            <GripVertical size={12} className="text-neutral-300 dark:text-neutral-600 shrink-0" />

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
                <span
                  className="text-xs text-foreground truncate block"
                  onDoubleClick={() => {
                    setEditingId(visual.id);
                    setEditValue(visual.title);
                  }}
                >
                  {visual.title}
                </span>
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
