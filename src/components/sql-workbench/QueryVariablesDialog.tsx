'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface QueryVariablesDialogProps {
  open: boolean;
  variables: string[];
  defaults: Record<string, string>;
  onCancel: () => void;
  onSubmit: (values: Record<string, string>) => void;
}

/**
 * Formulário pra preencher variáveis `:nome` antes de executar. Os
 * valores digitados ficam salvos (via `defaults`, persistido no
 * localStorage pelo componente pai) pra não precisar redigitar a mesma
 * data/id toda vez que você roda a query de novo.
 */
export function QueryVariablesDialog({ open, variables, defaults, onCancel, onSubmit }: QueryVariablesDialogProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      const initial: Record<string, string> = {};
      variables.forEach((v) => { initial[v] = defaults[v] || ''; });
      setValues(initial);
    }
  }, [open, variables, defaults]);

  const handleSubmit = () => {
    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Preencher variáveis</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {variables.map((name) => (
            <div key={name} className="grid gap-2">
              <Label htmlFor={`var-${name}`}>:{name}</Label>
              <Input
                id={`var-${name}`}
                autoFocus={variables[0] === name}
                value={values[name] ?? ''}
                onChange={(e) => setValues((prev) => ({ ...prev, [name]: e.target.value }))}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                placeholder="Deixe em branco para NULL"
              />
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Valores puramente numéricos são inseridos como número; qualquer outra coisa vira texto entre aspas.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button onClick={handleSubmit}>Executar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
