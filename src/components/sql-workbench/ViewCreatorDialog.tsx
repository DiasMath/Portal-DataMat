'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useSqlWorkbench } from '@/contexts/SqlWorkbenchContext';

interface ViewCreatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pré-preenche a definição — útil pro botão de "criar view a partir do resultado atual". */
  initialDefinition?: string;
  /** Chamado após criar com sucesso, pra quem estiver ouvindo atualizar a árvore da sidebar. */
  onCreated?: () => void;
}

export function ViewCreatorDialog({ open, onOpenChange, initialDefinition, onCreated }: ViewCreatorDialogProps) {
  const { executeQuery } = useSqlWorkbench();
  const [viewName, setViewName] = useState('');
  const [definition, setDefinition] = useState(initialDefinition || 'SELECT\n    *\nFROM ');
  const [creating, setCreating] = useState(false);

  const generateSQL = () => {
    if (!viewName.trim() || !definition.trim()) return '';
    return `CREATE VIEW \`${viewName.trim()}\` AS\n${definition.trim()};`;
  };

  const handleCreate = async () => {
    const sql = generateSQL();
    if (!sql) {
      toast.error('Nome da view e definição são obrigatórios');
      return;
    }

    setCreating(true);
    try {
      const success = await executeQuery(sql);
      if (success) {
        toast.success('View criada com sucesso!');
        onOpenChange(false);
        setViewName('');
        setDefinition('SELECT\n    *\nFROM ');
        onCreated?.();
      } else {
        toast.error('Erro ao criar view — veja a aba de Mensagens da query ativa para detalhes');
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar Nova View</DialogTitle>
          <DialogDescription>
            Uma view é uma consulta SELECT salva com um nome — ela não guarda dados, só a definição.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="view-name">Nome da view</Label>
            <Input
              id="view-name"
              value={viewName}
              onChange={(e) => setViewName(e.target.value)}
              placeholder="vw_minha_view"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="view-definition">Definição (SELECT)</Label>
            <textarea
              id="view-definition"
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm h-40 resize-y focus:outline-none focus:ring-1 focus:ring-ring"
              spellCheck={false}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={creating || !viewName.trim() || !definition.trim()}>
            Criar view
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
