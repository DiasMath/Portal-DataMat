'use client';

import { useState, useCallback } from 'react';
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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSqlWorkbench } from '@/contexts/SqlWorkbenchContext';

const MYSQL_PARAM_TYPES = [
  'INT', 'BIGINT', 'DECIMAL(10,2)', 'FLOAT', 'DOUBLE',
  'VARCHAR(255)', 'TEXT', 'DATE', 'DATETIME', 'TIMESTAMP', 'BOOLEAN', 'JSON',
];

interface RoutineParam {
  id: string;
  name: string;
  direction: 'IN' | 'OUT' | 'INOUT';
  type: string;
}

interface RoutineCreatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: 'PROCEDURE' | 'FUNCTION';
  onCreated?: () => void;
}

export function RoutineCreatorDialog({ open, onOpenChange, kind, onCreated }: RoutineCreatorDialogProps) {
  const { executeQuery } = useSqlWorkbench();
  const [name, setName] = useState('');
  const [params, setParams] = useState<RoutineParam[]>([]);
  const [returnType, setReturnType] = useState('INT');
  const [deterministic, setDeterministic] = useState(true);
  const [body, setBody] = useState('');
  const [creating, setCreating] = useState(false);

  const isFunction = kind === 'FUNCTION';
  const label = isFunction ? 'Function' : 'Procedure';

  const addParam = useCallback(() => {
    const id = Date.now().toString();
    setParams((prev) => [...prev, { id, name: `p${prev.length + 1}`, direction: 'IN', type: 'INT' }]);
  }, []);

  const updateParam = useCallback((id: string, field: keyof RoutineParam, value: string) => {
    setParams((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  }, []);

  const removeParam = useCallback((id: string) => {
    setParams((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const reset = () => {
    setName('');
    setParams([]);
    setReturnType('INT');
    setDeterministic(true);
    setBody('');
  };

  const generateSQL = (): string => {
    if (!name.trim() || !body.trim()) return '';

    const paramsSql = params
      .map((p) => {
        const dir = isFunction ? '' : `${p.direction} `;
        return `${dir}\`${p.name}\` ${p.type}`;
      })
      .join(', ');

    const characteristic = deterministic ? 'DETERMINISTIC' : 'NOT DETERMINISTIC';

    if (isFunction) {
      return `CREATE FUNCTION \`${name.trim()}\`(${paramsSql})\nRETURNS ${returnType}\n${characteristic}\nBEGIN\n${body.trim()}\nEND`;
    }
    return `CREATE PROCEDURE \`${name.trim()}\`(${paramsSql})\n${characteristic}\nBEGIN\n${body.trim()}\nEND`;
  };

  const handleCreate = async () => {
    const sql = generateSQL();
    if (!sql) {
      toast.error('Nome e corpo da rotina são obrigatórios');
      return;
    }

    setCreating(true);
    try {
      const success = await executeQuery(sql);
      if (success) {
        toast.success(`${label} criada com sucesso!`);
        onOpenChange(false);
        reset();
        onCreated?.();
      } else {
        toast.error(`Erro ao criar ${label.toLowerCase()} — veja a aba de Mensagens da query ativa para detalhes`);
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova {label}</DialogTitle>
          <DialogDescription>
            {isFunction
              ? 'Funções retornam um único valor e podem ser usadas dentro de outras queries.'
              : 'Procedures executam um bloco de comandos e são chamadas com CALL.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="routine-name">Nome</Label>
              <Input id="routine-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={isFunction ? 'fn_calcular' : 'sp_processar'} />
            </div>
            {isFunction && (
              <div className="grid gap-2">
                <Label>Tipo de retorno</Label>
                <Select value={returnType} onValueChange={setReturnType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MYSQL_PARAM_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="deterministic"
              checked={deterministic}
              onChange={(e) => setDeterministic(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="deterministic" className="cursor-pointer font-normal">
              DETERMINISTIC (mesma entrada sempre gera a mesma saída — evita erro comum de binary logging)
            </Label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Parâmetros</Label>
              <Button size="sm" variant="outline" onClick={addParam}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar parâmetro
              </Button>
            </div>
            {params.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">Nenhum parâmetro — clique em "Adicionar parâmetro" se precisar de entrada.</p>
            ) : (
              <div className="space-y-2">
                {params.map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    {!isFunction && (
                      <Select value={p.direction} onValueChange={(v) => updateParam(p.id, 'direction', v)}>
                        <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IN">IN</SelectItem>
                          <SelectItem value="OUT">OUT</SelectItem>
                          <SelectItem value="INOUT">INOUT</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <Input
                      value={p.name}
                      onChange={(e) => updateParam(p.id, 'name', e.target.value)}
                      placeholder="nome"
                      className="flex-1"
                    />
                    <Select value={p.type} onValueChange={(v) => updateParam(p.id, 'type', v)}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MYSQL_PARAM_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button size="icon" variant="ghost" onClick={() => removeParam(p.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="routine-body">
              Corpo {isFunction && '(use RETURN para devolver o valor)'}
            </Label>
            <textarea
              id="routine-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={isFunction ? '  RETURN 0;' : '  SELECT 1;'}
              className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm h-40 resize-y focus:outline-none focus:ring-1 focus:ring-ring"
              spellCheck={false}
            />
            <p className="text-xs text-muted-foreground">
              O <code>BEGIN</code>/<code>END</code> é adicionado automaticamente — escreva só os comandos de dentro.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={creating || !name.trim() || !body.trim()}>
            Criar {label.toLowerCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
