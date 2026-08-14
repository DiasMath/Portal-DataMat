'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useStudio } from '../../store/StudioContext';
import { ChevronLeft, ChevronRight, Palette } from 'lucide-react';

interface PageContextMenuProps {
  pageId: string;
  x: number;
  y: number;
  canDelete: boolean;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function PageContextMenu({
  pageId,
  x,
  y,
  canDelete,
  onRename,
  onDuplicate,
  onDelete,
  onClose,
}: PageContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { state, dispatch } = useStudio();
  const [bgColor, setBgColor] = useState('#ffffff');

  const pageIndex = state.pages.findIndex(p => p.id === pageId);
  const canMoveLeft = pageIndex > 0;
  const canMoveRight = pageIndex < state.pages.length - 1;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleMoveLeft = () => {
    if (!canMoveLeft) return;
    const ids = state.pages.map(p => p.id);
    const temp = ids[pageIndex];
    ids[pageIndex] = ids[pageIndex - 1];
    ids[pageIndex - 1] = temp;
    dispatch({ type: 'REORDER_PAGES', payload: ids });
    onClose();
  };

  const handleMoveRight = () => {
    if (!canMoveRight) return;
    const ids = state.pages.map(p => p.id);
    const temp = ids[pageIndex];
    ids[pageIndex] = ids[pageIndex + 1];
    ids[pageIndex + 1] = temp;
    dispatch({ type: 'REORDER_PAGES', payload: ids });
    onClose();
  };

  const handleBackgroundChange = (color: string) => {
    setBgColor(color);
    dispatch({ type: 'SET_PAGE_BACKGROUND', payload: { pageId, background: color } });
  };

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-white dark:bg-neutral-900 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 py-1 min-w-[180px]"
      style={{ left: x, bottom: 40 }}
    >
      <button
        onClick={onRename}
        className="w-full px-3 py-1.5 text-xs text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      >
        Renomear
      </button>
      <button
        onClick={onDuplicate}
        className="w-full px-3 py-1.5 text-xs text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      >
        Duplicar
      </button>
      <div className="my-1 border-t border-neutral-200 dark:border-neutral-700" />
      <button
        onClick={handleMoveLeft}
        disabled={!canMoveLeft}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={12} />
        Mover para esquerda
      </button>
      <button
        onClick={handleMoveRight}
        disabled={!canMoveRight}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight size={12} />
        Mover para direita
      </button>
      <div className="my-1 border-t border-neutral-200 dark:border-neutral-700" />
      <div className="px-3 py-1.5 flex items-center gap-2">
        <Palette size={12} className="text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Cor de fundo</span>
        <input
          type="color"
          value={bgColor}
          onChange={(e) => handleBackgroundChange(e.target.value)}
          className="w-5 h-5 rounded border border-neutral-200 dark:border-neutral-700 cursor-pointer ml-auto"
        />
      </div>
      <div className="my-1 border-t border-neutral-200 dark:border-neutral-700" />
      <button
        onClick={onDelete}
        disabled={!canDelete}
        className="w-full px-3 py-1.5 text-xs text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Excluir
      </button>
    </div>
  );
}
