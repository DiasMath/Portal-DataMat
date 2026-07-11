'use client';

import { useState, useEffect } from 'react';
import { Keyboard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ShortcutSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_SHORTCUTS: Record<string, string> = {
  'executeQuery': 'Ctrl+Enter',
  'newTab': 'Ctrl+N',
  'closeTab': 'Ctrl+W',
  'toggleSidebar': 'Ctrl+B',
  'toggleResults': 'Ctrl+E',
  'formatSql': 'Ctrl+Shift+F',
  'toggleHistory': 'Ctrl+H',
  'saveQuery': 'Ctrl+S',
  'splitHorizontal': 'Ctrl+Shift+H',
  'splitVertical': 'Ctrl+Shift+V',
};

const SHORTCUT_LABELS: Record<string, string> = {
  'executeQuery': 'Execute Query',
  'newTab': 'New Tab',
  'closeTab': 'Close Tab',
  'toggleSidebar': 'Toggle Sidebar',
  'toggleResults': 'Toggle Results',
  'formatSql': 'Format SQL',
  'toggleHistory': 'Toggle History',
  'saveQuery': 'Save Query',
  'splitHorizontal': 'Split Horizontal',
  'splitVertical': 'Split Vertical',
};

const STORAGE_KEY = 'sql_workbench_shortcuts';

export function ShortcutSettings({ open, onOpenChange }: ShortcutSettingsProps) {
  const [shortcuts, setShortcuts] = useState<Record<string, string>>(DEFAULT_SHORTCUTS);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setShortcuts({ ...DEFAULT_SHORTCUTS, ...parsed });
      } catch {
        // ignore
      }
    }
  }, []);

  const saveShortcuts = (updated: Record<string, string>) => {
    setShortcuts(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleKeyDown = (e: KeyboardEvent, key: string) => {
    e.preventDefault();
    e.stopPropagation();

    const parts: string[] = [];
    if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
    if (e.shiftKey) parts.push('Shift');
    if (e.altKey) parts.push('Alt');

    const keyName = e.key;
    if (!['Control', 'Shift', 'Alt', 'Meta'].includes(keyName)) {
      parts.push(keyName.length === 1 ? keyName.toUpperCase() : keyName);
    }

    if (parts.length > 1) {
      const newShortcut = parts.join('+');
      const updated = { ...shortcuts, [key]: newShortcut };
      saveShortcuts(updated);
    }
    setEditingKey(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {Object.entries(SHORTCUT_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between py-2 px-3 rounded hover:bg-accent">
              <span className="text-sm text-foreground">{label}</span>
              {editingKey === key ? (
                <div className="text-xs text-muted-foreground animate-pulse">
                  Press keys...
                </div>
              ) : (
                <button
                  onClick={() => setEditingKey(key)}
                  className="text-xs font-mono bg-background border border-border rounded px-2 py-1 hover:bg-accent transition-colors"
                  onKeyDown={(e) => handleKeyDown(e as unknown as KeyboardEvent, key)}
                >
                  {shortcuts[key]}
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-2">
          <button
            onClick={() => {
              saveShortcuts(DEFAULT_SHORTCUTS);
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Reset to defaults
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
