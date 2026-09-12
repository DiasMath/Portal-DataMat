'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Folder, FolderOpen, Check, Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';

interface FlatGroup {
  id: string;
  name: string;
  parentId: string | null;
}

interface GroupPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  groups: FlatGroup[];
  currentGroupId: string | null | undefined;
  onSelect: (groupId: string | null) => void;
  onCreateGroup: (name: string, parentId: string | null) => Promise<void>;
  onRenameGroup: (groupId: string, newName: string) => Promise<void>;
  onDeleteGroup: (groupId: string) => Promise<void>;
  /** Modo "só gerenciar" — sem opção "Sem grupo" e clicar no nome não seleciona/fecha, só edita/exclui/cria. */
  manageOnly?: boolean;
}

/** Monta a lista com profundidade, pra indentar visualmente sem precisar de uma árvore de verdade. */
function flattenWithDepth(groups: FlatGroup[]): { group: FlatGroup; depth: number }[] {
  const byParent = new Map<string | null, FlatGroup[]>();
  groups.forEach((g) => {
    const key = g.parentId;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(g);
  });

  const result: { group: FlatGroup; depth: number }[] = [];
  const walk = (parentId: string | null, depth: number) => {
    (byParent.get(parentId) || []).forEach((g) => {
      result.push({ group: g, depth });
      walk(g.id, depth + 1);
    });
  };
  walk(null, 0);
  return result;
}

/**
 * Diálogo genérico pra escolher (ou criar) um grupo aninhado — usado tanto
 * pra "mover conexão pra grupo" quanto "mover banco pra grupo". Não é uma
 * árvore com arrastar-e-soltar; é uma lista indentada por profundidade,
 * que resolve o mesmo problema (organizar em pastas dentro de pastas) com
 * bem menos risco de UI do que reescrever a árvore inteira da sidebar.
 */
export function GroupPickerDialog({
  open,
  onOpenChange,
  title,
  groups,
  currentGroupId,
  onSelect,
  onCreateGroup,
  onRenameGroup,
  onDeleteGroup,
  manageOnly = false,
}: GroupPickerDialogProps) {
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupParentId, setNewGroupParentId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [savingRename, setSavingRename] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const flatGroups = flattenWithDepth(groups);

  const startEditing = (group: FlatGroup) => {
    setEditingGroupId(group.id);
    setEditingName(group.name);
    setConfirmDeleteId(null);
  };

  const saveRename = async () => {
    if (!editingGroupId || !editingName.trim()) { setEditingGroupId(null); return; }
    setSavingRename(true);
    try {
      await onRenameGroup(editingGroupId, editingName.trim());
      setEditingGroupId(null);
    } finally {
      setSavingRename(false);
    }
  };

  const handleDelete = async (groupId: string) => {
    if (confirmDeleteId !== groupId) {
      setConfirmDeleteId(groupId);
      return;
    }
    setDeletingId(groupId);
    try {
      await onDeleteGroup(groupId);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleCreate = async () => {
    if (!newGroupName.trim()) return;
    setCreating(true);
    try {
      await onCreateGroup(newGroupName.trim(), newGroupParentId);
      setNewGroupName('');
      setNewGroupParentId(null);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="max-h-64 overflow-y-auto space-y-0.5">
          {!manageOnly && (
            <button
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent text-sm text-left"
              onClick={() => { onSelect(null); onOpenChange(false); }}
            >
              {!currentGroupId && <Check className="h-3.5 w-3.5 text-primary" />}
              <span className={!currentGroupId ? '' : 'ml-[22px]'}>Sem grupo</span>
            </button>
          )}

          {flatGroups.map(({ group, depth }) => (
            <div
              key={group.id}
              className="group/row flex items-center gap-1 rounded hover:bg-accent"
              style={{ paddingLeft: `${8 + depth * 16}px` }}
            >
              {editingGroupId === group.id ? (
                <div className="flex-1 flex items-center gap-1 py-1 pr-2">
                  <Input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    disabled={savingRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveRename();
                      if (e.key === 'Escape') setEditingGroupId(null);
                    }}
                    className="h-7 text-sm"
                  />
                  <button onClick={saveRename} disabled={savingRename} className="p-1 hover:bg-accent rounded shrink-0" title="Salvar">
                    {savingRename ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" /> : <Check className="h-3.5 w-3.5 text-primary" />}
                  </button>
                  <button onClick={() => setEditingGroupId(null)} disabled={savingRename} className="p-1 hover:bg-accent rounded shrink-0" title="Cancelar">
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    className={`flex-1 flex items-center gap-2 px-2 py-1.5 text-sm text-left min-w-0 ${manageOnly ? 'cursor-default' : ''}`}
                    onClick={manageOnly ? undefined : () => { onSelect(group.id); onOpenChange(false); }}
                  >
                    {!manageOnly && currentGroupId === group.id ? (
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    ) : (
                      <Folder className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                    <span className="truncate">{group.name}</span>
                  </button>
                  <div className="flex items-center opacity-0 group-hover/row:opacity-100 transition-opacity pr-1 shrink-0">
                    <button
                      onClick={() => startEditing(group)}
                      disabled={deletingId === group.id}
                      className="p-1 hover:bg-accent rounded"
                      title="Renomear"
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    {deletingId === group.id ? (
                      <span className="p-1"><Loader2 className="h-3.5 w-3.5 animate-spin text-destructive" /></span>
                    ) : confirmDeleteId === group.id ? (
                      <button
                        onClick={() => handleDelete(group.id)}
                        className="text-xs text-destructive hover:underline px-1 whitespace-nowrap"
                      >
                        Confirmar?
                      </button>
                    ) : (
                      <button onClick={() => handleDelete(group.id)} className="p-1 hover:bg-destructive/20 rounded" title="Excluir grupo">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-3 space-y-2">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Nome do novo grupo"
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
              className="flex-1"
            />
          </div>
          {flatGroups.length > 0 && (
            <select
              value={newGroupParentId || ''}
              onChange={(e) => setNewGroupParentId(e.target.value || null)}
              className="w-full text-xs bg-background border border-border rounded px-2 py-1.5"
            >
              <option value="">Grupo raiz (sem pai)</option>
              {flatGroups.map(({ group, depth }) => (
                <option key={group.id} value={group.id}>
                  {'—'.repeat(depth)} {group.name}
                </option>
              ))}
            </select>
          )}
          <Button size="sm" onClick={handleCreate} disabled={creating || !newGroupName.trim()} className="w-full">
            <Plus className="h-3.5 w-3.5 mr-1" /> Criar grupo
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
