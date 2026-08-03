'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useStudio } from '../../store/StudioContext';
import {
  Copy, Trash2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  BringToFront, SendToBack, ArrowUpToLine, ArrowDownToLine,
  Edit3, Lock, Unlock, Group, Ungroup, Clipboard, Scissors, Settings,
} from 'lucide-react';

interface VisualContextMenuProps {
  visualId: string;
  x: number;
  y: number;
  onClose: () => void;
}

export function VisualContextMenu({ visualId, x, y, onClose }: VisualContextMenuProps) {
  const { state, dispatch } = useStudio();
  const menuRef = useRef<HTMLDivElement>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const activePage = state.pages.find(p => p.id === state.activePageId);
  const visual = activePage?.visuals.find(v => v.id === visualId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
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

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  if (!visual) return null;

  const handleRename = () => {
    setRenameValue(visual.name);
    setIsRenaming(true);
  };

  const handleRenameSubmit = () => {
    if (renameValue.trim()) {
      dispatch({ type: 'UPDATE_VISUAL', payload: { id: visualId, updates: { name: renameValue.trim() } } });
    }
    setIsRenaming(false);
    onClose();
  };

  const menuItems = [
    { icon: <Edit3 size={12} />, label: 'Renomear', action: handleRename },
    { icon: <Copy size={12} />, label: 'Duplicar', shortcut: 'Ctrl+D', action: () => dispatch({ type: 'DUPLICATE_VISUAL', payload: visualId }) },
    { divider: true },
    { icon: <Copy size={12} />, label: 'Copiar', shortcut: 'Ctrl+C', action: () => dispatch({ type: 'SET_CLIPBOARD', payload: visual }) },
    { icon: <Scissors size={12} />, label: 'Recortar', shortcut: 'Ctrl+X', action: () => { dispatch({ type: 'SET_CLIPBOARD', payload: visual }); dispatch({ type: 'REMOVE_VISUAL', payload: visualId }); } },
    { icon: <Clipboard size={12} />, label: 'Colar', shortcut: 'Ctrl+V', action: () => dispatch({ type: 'PASTE_VISUAL' }), disabled: !state.clipboard },
    { divider: true },
    { icon: <ArrowUp size={12} />, label: 'Mover para cima', shortcut: '↑', action: () => dispatch({ type: 'NUDGE_VISUAL', payload: { id: visualId, dx: 0, dy: -10 } }) },
    { icon: <ArrowDown size={12} />, label: 'Mover para baixo', shortcut: '↓', action: () => dispatch({ type: 'NUDGE_VISUAL', payload: { id: visualId, dx: 0, dy: 10 } }) },
    { icon: <ArrowLeft size={12} />, label: 'Mover para esquerda', shortcut: '←', action: () => dispatch({ type: 'NUDGE_VISUAL', payload: { id: visualId, dx: -10, dy: 0 } }) },
    { icon: <ArrowRight size={12} />, label: 'Mover para direita', shortcut: '→', action: () => dispatch({ type: 'NUDGE_VISUAL', payload: { id: visualId, dx: 10, dy: 0 } }) },
    { divider: true },
    { icon: <BringToFront size={12} />, label: 'Trazer para frente', action: () => dispatch({ type: 'BRING_TO_FRONT', payload: visualId }) },
    { icon: <SendToBack size={12} />, label: 'Enviar para trás', action: () => dispatch({ type: 'SEND_TO_BACK', payload: visualId }) },
    { icon: <ArrowUpToLine size={12} />, label: 'Trazer acima', action: () => dispatch({ type: 'BRING_FORWARD', payload: visualId }) },
    { icon: <ArrowDownToLine size={12} />, label: 'Enviar abaixo', action: () => dispatch({ type: 'SEND_BACKWARD', payload: visualId }) },
    { divider: true },
    {
      icon: visual.locked ? <Lock size={12} /> : <Unlock size={12} />,
      label: visual.locked ? 'Destravar posição' : 'Travar posição',
      action: () => dispatch({ type: 'TOGGLE_VISUAL_LOCK', payload: visualId }),
    },
    { divider: true },
    {
      icon: <Group size={12} />,
      label: 'Agrupar selecionados',
      shortcut: 'Ctrl+G',
      action: () => dispatch({ type: 'GROUP_SELECTED_VISUALS' }),
    },
    {
      icon: <Ungroup size={12} />,
      label: 'Desagrupar',
      shortcut: 'Ctrl+Shift+G',
      action: () => dispatch({ type: 'UNGROUP_SELECTED_VISUALS' }),
    },
    { divider: true },
    { icon: <Settings size={12} />, label: 'Formatar', action: () => dispatch({ type: 'TOGGLE_PROPERTIES_PANEL' }) },
    { divider: true },
    { icon: <Trash2 size={12} />, label: 'Excluir', shortcut: 'Del', action: () => dispatch({ type: 'REMOVE_VISUAL', payload: visualId }), danger: true },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[200px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl py-1 animate-in fade-in zoom-in-95"
      style={{ left: x, top: y }}
    >
      <div className="px-3 py-1.5 text-[10px] font-medium text-muted-foreground border-b border-neutral-200 dark:border-neutral-700">
        {isRenaming ? (
          <input
            ref={inputRef}
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit();
              if (e.key === 'Escape') { setIsRenaming(false); onClose(); }
            }}
            className="w-full bg-transparent text-foreground text-[10px] outline-none border-b border-amber-500"
          />
        ) : (
          visual.name
        )}
      </div>
      {menuItems.map((item, i) => {
        if ('divider' in item && item.divider) {
          return <div key={i} className="my-1 border-t border-neutral-200 dark:border-neutral-700" />;
        }
        const menuItem = item as { icon: React.ReactNode; label: string; shortcut?: string; action: () => void; danger?: boolean; disabled?: boolean };
        return (
          <button
            key={i}
            onClick={() => { if (!menuItem.disabled) { menuItem.action(); if (!isRenaming) onClose(); } }}
            disabled={menuItem.disabled}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors
              ${menuItem.disabled ? 'opacity-30 cursor-not-allowed' : ''}
              ${menuItem.danger
                ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }
            `}
          >
            {menuItem.icon}
            <span className="flex-1 text-left">{menuItem.label}</span>
            {menuItem.shortcut && (
              <span className="text-[9px] text-muted-foreground">{menuItem.shortcut}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
