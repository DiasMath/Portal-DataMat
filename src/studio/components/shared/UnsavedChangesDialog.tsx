'use client';

import React, { useEffect } from 'react';

interface UnsavedChangesDialogProps {
  open: boolean;
  title?: string;
  message?: string;
  onCancel: () => void;
  onDiscard: () => void;
  onSave: () => void;
}

export function UnsavedChangesDialog({
  open,
  title = 'Alterações não salvas',
  message = 'Você tem alterações não salvas. Deseja salvar antes de fechar?',
  onCancel,
  onDiscard,
  onSave,
}: UnsavedChangesDialogProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true" aria-labelledby="unsaved-dialog-title">
      <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 shadow-xl max-w-sm">
        <h3 id="unsaved-dialog-title" className="text-sm font-medium text-white mb-2">{title}</h3>
        <p className="text-xs text-neutral-400 mb-4">{message}</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white hover:bg-neutral-700 rounded transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onDiscard}
            className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
          >
            Não salvar
          </button>
          <button
            onClick={onSave}
            className="px-3 py-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-white rounded transition-colors"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
