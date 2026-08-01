'use client';

import React, { useEffect, useRef } from 'react';

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
  x,
  y,
  canDelete,
  onRename,
  onDuplicate,
  onDelete,
  onClose,
}: PageContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

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

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-white dark:bg-neutral-900 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 py-1 min-w-[160px]"
      style={{ left: x, top: y }}
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
        onClick={onDelete}
        disabled={!canDelete}
        className="w-full px-3 py-1.5 text-xs text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Excluir
      </button>
    </div>
  );
}
