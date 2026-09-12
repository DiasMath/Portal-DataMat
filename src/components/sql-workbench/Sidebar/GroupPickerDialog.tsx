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
import { Folder, FolderOpen, Check, Plus } from 'lucide-react';

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
}: GroupPickerDialogProps) {
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupParentId, setNewGroupParentId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const flatGroups = flattenWithDepth(groups);

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
          <button
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent text-sm text-left"
            onClick={() => { onSelect(null); onOpenChange(false); }}
          >
            {!currentGroupId && <Check className="h-3.5 w-3.5 text-primary" />}
            <span className={!currentGroupId ? '' : 'ml-[22px]'}>Sem grupo</span>
          </button>

          {flatGroups.map(({ group, depth }) => (
            <button
              key={group.id}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent text-sm text-left"
              style={{ paddingLeft: `${8 + depth * 16}px` }}
              onClick={() => { onSelect(group.id); onOpenChange(false); }}
            >
              {currentGroupId === group.id ? (
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
              ) : (
                <Folder className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
              <span className="truncate">{group.name}</span>
            </button>
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
