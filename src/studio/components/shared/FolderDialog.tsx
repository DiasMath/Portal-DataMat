'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, FolderPlus, ChevronDown, ChevronRight } from 'lucide-react';
import type { MeasureFolder } from '../../types/dashboard';

interface FolderDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, parentId?: string) => void;
  folders: MeasureFolder[];
  title?: string;
  initialParentId?: string;
}

function FolderTreeItem({
  folder,
  allFolders,
  selectedId,
  onSelect,
  level = 0,
}: {
  folder: MeasureFolder;
  allFolders: MeasureFolder[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  level?: number;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const subFolders = allFolders.filter(f => f.parentId === folder.id);
  const isSelected = selectedId === folder.id;

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer text-[11px] transition-colors ${
          isSelected
            ? 'bg-amber-500/20 text-amber-500'
            : 'hover:bg-neutral-700/50 text-neutral-300'
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onSelect(folder.id)}
      >
        {subFolders.length > 0 ? (
          <button
            onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
            className="text-muted-foreground shrink-0"
          >
            {isOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          </button>
        ) : (
          <span className="w-[10px] shrink-0" />
        )}
        <FolderPlus size={10} className="text-amber-500 shrink-0" />
        <span className="truncate">{folder.name}</span>
      </div>
      {isOpen && subFolders.map(sub => (
        <FolderTreeItem
          key={sub.id}
          folder={sub}
          allFolders={allFolders}
          selectedId={selectedId}
          onSelect={onSelect}
          level={level + 1}
        />
      ))}
    </div>
  );
}

export function FolderDialog({ open, onClose, onCreate, folders, title = 'Nova Pasta', initialParentId }: FolderDialogProps) {
  const [name, setName] = useState('');
  const [useParent, setUseParent] = useState(!!initialParentId);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(initialParentId || null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName('');
      setUseParent(!!initialParentId);
      setSelectedParentId(initialParentId || null);
      setTimeout(() => nameInputRef.current?.focus(), 50);
    }
  }, [open, initialParentId]);

  const rootFolders = folders.filter(f => !f.parentId);

  const handleCreate = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed, useParent && selectedParentId ? selectedParentId : undefined);
    onClose();
  }, [name, useParent, selectedParentId, onCreate, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreate();
    if (e.key === 'Escape') onClose();
  }, [handleCreate, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={inputRef}
        className="relative bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl w-[380px] max-h-[80vh] flex flex-col"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-700">
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="px-4 py-3 space-y-3">
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">
              Nome da pasta
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Medidas de Receita"
              className="w-full px-2.5 py-1.5 text-[12px] bg-neutral-800 border border-neutral-600 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-foreground placeholder:text-neutral-500"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useParent}
                onChange={(e) => {
                  setUseParent(e.target.checked);
                  if (!e.target.checked) setSelectedParentId(null);
                }}
                className="rounded border-neutral-600 bg-neutral-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
              />
              <span className="text-[11px] text-neutral-300">Criar dentro de outra pasta</span>
            </label>
          </div>

          {useParent && (
            <div className="border border-neutral-700 rounded-md max-h-[200px] overflow-y-auto studio-scrollbar">
              <div
                className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer text-[11px] transition-colors ${
                  selectedParentId === null
                    ? 'bg-amber-500/20 text-amber-500'
                    : 'hover:bg-neutral-700/50 text-neutral-300'
                }`}
                onClick={() => setSelectedParentId(null)}
              >
                <span className="w-[10px] shrink-0" />
                <FolderPlus size={10} className="text-neutral-500 shrink-0" />
                <span className="italic text-neutral-400">Pasta raíz</span>
              </div>
              {rootFolders.map(folder => (
                <FolderTreeItem
                  key={folder.id}
                  folder={folder}
                  allFolders={folders}
                  selectedId={selectedParentId}
                  onSelect={setSelectedParentId}
                  level={0}
                />
              ))}
              {rootFolders.length === 0 && (
                <div className="px-3 py-2 text-[10px] text-neutral-500 italic">
                  Nenhuma pasta existente
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-neutral-700">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-neutral-800 rounded transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="px-3 py-1.5 text-[11px] bg-amber-500 hover:bg-amber-600 text-white rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Criar
          </button>
        </div>
      </div>
    </div>
  );
}
