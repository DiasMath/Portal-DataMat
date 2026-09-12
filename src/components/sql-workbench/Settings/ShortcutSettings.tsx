'use client';

import { useState, useEffect } from 'react';
import { Keyboard } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DEFAULT_SHORTCUTS,
  SHORTCUT_LABELS,
  loadShortcuts,
  saveShortcuts,
  eventToShortcutString,
  type ShortcutAction,
} from '../shortcuts';

interface ShortcutSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShortcutSettings({ open, onOpenChange }: ShortcutSettingsProps) {
  const [shortcuts, setShortcuts] = useState<Record<ShortcutAction, string>>(DEFAULT_SHORTCUTS);
  const [editingKey, setEditingKey] = useState<ShortcutAction | null>(null);

  useEffect(() => {
    if (open) setShortcuts(loadShortcuts());
  }, [open]);

  // Escuta o teclado no window (não num elemento específico) enquanto
  // `editingKey` estiver setado. A versão anterior colocava o `onKeyDown`
  // no botão que só existe quando NÃO se está editando — ou seja, nunca
  // chegava a capturar a tecla pressionada. Isso resolve os dois problemas
  // de uma vez: captura de verdade, e sem depender de foco de elemento.
  useEffect(() => {
    if (!editingKey) return;

    const handleWindowKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        setEditingKey(null);
        return;
      }

      const shortcutString = eventToShortcutString(e);
      if (shortcutString) {
        const alreadyUsedBy = (Object.keys(shortcuts) as ShortcutAction[]).find(
          (k) => k !== editingKey && shortcuts[k] === shortcutString
        );
        const updated = { ...shortcuts, [editingKey]: shortcutString };
        setShortcuts(updated);
        saveShortcuts(updated);
        setEditingKey(null);
        toast.success(`Atalho salvo: ${shortcutString}`, {
          description: alreadyUsedBy
            ? `Atenção: essa combinação também estava em "${SHORTCUT_LABELS[alreadyUsedBy]}" — os dois vão disparar juntos.`
            : undefined,
        });
      }
    };

    window.addEventListener('keydown', handleWindowKeyDown, true);
    return () => window.removeEventListener('keydown', handleWindowKeyDown, true);
  }, [editingKey, shortcuts]);

  const handleReset = () => {
    setShortcuts(DEFAULT_SHORTCUTS);
    saveShortcuts(DEFAULT_SHORTCUTS);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Atalhos de teclado
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {(Object.keys(SHORTCUT_LABELS) as ShortcutAction[]).map((key) => (
            <div key={key} className="flex items-center justify-between py-2 px-3 rounded hover:bg-accent">
              <span className="text-sm text-foreground">{SHORTCUT_LABELS[key]}</span>
              {editingKey === key ? (
                <div className="text-xs text-muted-foreground animate-pulse px-2 py-1">
                  Pressione as teclas... (Esc para cancelar)
                </div>
              ) : (
                <button
                  onClick={() => setEditingKey(key)}
                  className="text-xs font-mono bg-background border border-border rounded px-2 py-1 hover:bg-accent transition-colors"
                >
                  {shortcuts[key]}
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-2">
          <button
            onClick={handleReset}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Restaurar padrões
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
