'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useSqlWorkbench } from '@/contexts/SqlWorkbenchContext';
import { useCloseCreatorTab } from './useCloseCreatorTab';

/**
 * Painel de criação de view — mesmo lugar e tamanho da aba de query,
 * igual ao MySQL Workbench, em vez de um dialog flutuante.
 */
export function ViewCreatorPanel({ tabId }: { tabId: string }) {
  const { executeQuery } = useSqlWorkbench();
  const closeCreatorTab = useCloseCreatorTab();
  const [viewName, setViewName] = useState('');
  const [definition, setDefinition] = useState('SELECT\n    *\nFROM ');
  const [creating, setCreating] = useState(false);
  const [showSql, setShowSql] = useState(false);

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
        closeCreatorTab(tabId);
      } else {
        toast.error('Erro ao criar view — veja a aba de Mensagens da query ativa para detalhes');
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-background">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Eye className="h-5 w-5 text-primary" />
        <div>
          <div className="font-semibold text-sm">Criar Nova View</div>
          <div className="text-xs text-muted-foreground">
            Uma view é uma consulta SELECT salva com um nome — ela não guarda dados, só a definição.
          </div>
        </div>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden p-4 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="view-name">Nome da view</Label>
          <Input
            id="view-name"
            value={viewName}
            onChange={(e) => setViewName(e.target.value)}
            placeholder="vw_minha_view"
            className="max-w-md"
          />
        </div>

        <div className="flex flex-col flex-1 gap-2 min-h-0">
          <Label htmlFor="view-definition">Definição (SELECT)</Label>
          <textarea
            id="view-definition"
            value={definition}
            onChange={(e) => setDefinition(e.target.value)}
            className="w-full flex-1 rounded-md border border-border bg-background px-3 py-2 font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            spellCheck={false}
          />
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowSql((v) => !v)}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            {showSql ? 'Ocultar SQL' : 'Ver SQL'}
          </button>
          {showSql && (
            <pre className="mt-2 w-full rounded-md border border-border bg-muted px-3 py-2 font-mono text-xs whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
              {generateSQL() || '-- Defina o nome da view e a definição para gerar o SQL'}
            </pre>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
        <Button variant="outline" onClick={() => closeCreatorTab(tabId)}>
          Cancelar
        </Button>
        <Button onClick={handleCreate} disabled={creating || !viewName.trim() || !definition.trim()}>
          {creating ? 'Criando...' : 'Criar view'}
        </Button>
      </div>
    </div>
  );
}
