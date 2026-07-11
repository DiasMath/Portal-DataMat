'use client';

import { useState } from 'react';
import { useSqlWorkbench } from '@/contexts/SqlWorkbenchContext';
import type { Connection } from '@/types/sql-workbench';
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
import { Loader2, TestTube } from 'lucide-react';
import { toast } from 'sonner';

interface AddConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (connection: Connection) => void;
}

export function AddConnectionDialog({ open, onOpenChange, onSave }: AddConnectionDialogProps) {
  const { dispatch } = useSqlWorkbench();
  const [form, setForm] = useState({
    name: '',
    host: 'localhost',
    port: '3010',
    user: '',
    password: '',
    database: '',
    color: '#6366f1',
  });
  const [testing, setTesting] = useState(false);
  const [testingResult, setTestingResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    setTestingResult(null);

    try {
      const tempId = `temp-${Date.now()}`;
      const res = await fetch('/api/sql/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId: tempId,
          host: form.host,
          port: parseInt(form.port),
          user: form.user,
          password: form.password,
          database: form.database || undefined,
        }),
      });

      const data = await res.json();
      setTestingResult({
        success: data.success,
        message: data.success ? 'Conexão bem-sucedida!' : data.error || 'Falha na conexão',
      });
    } catch (err) {
      setTestingResult({
        success: false,
        message: err instanceof Error ? err.message : 'Erro ao testar conexão',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/sql/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Erro ao salvar conexão');
        return;
      }

      if (data.id) {
        const newConnection: Connection = {
          id: data.id,
          name: form.name,
          host: form.host,
          port: parseInt(form.port, 10),
          user: form.user,
          password: form.password,
          database: form.database,
          color: form.color,
          status: 'disconnected',
        };
        onSave(newConnection);
        toast.success('Conexão salva com sucesso!');
        setForm({
          name: '',
          host: 'localhost',
          port: '3010',
          user: '',
          password: '',
          database: '',
          color: '#6366f1',
        });
        setTestingResult(null);
      }
    } catch (err) {
      toast.error('Erro ao salvar conexão');
      console.error('Failed to save connection:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTestingResult(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Conexão</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome da conexão</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="localhost"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 grid gap-2">
              <Label htmlFor="host">Host</Label>
              <Input
                id="host"
                value={form.host}
                onChange={(e) => setForm({ ...form, host: e.target.value })}
                placeholder="localhost ou IP"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="port">Porta</Label>
              <Input
                id="port"
                type="number"
                value={form.port}
                onChange={(e) => setForm({ ...form, port: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="user">Usuário</Label>
              <Input
                id="user"
                value={form.user}
                onChange={(e) => setForm({ ...form, user: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="database">Banco de dados (opcional)</Label>
            <Input
              id="database"
              value={form.database}
              onChange={(e) => setForm({ ...form, database: e.target.value })}
              placeholder="Deixe em branco para conectar sem banco específico"
            />
          </div>

          {testingResult && (
            <div
              className={`p-3 rounded-md text-sm ${
                testingResult.success
                  ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                  : 'bg-red-500/10 text-red-500 border border-red-500/20'
              }`}
            >
              {testingResult.message}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleTest}
            disabled={testing || !form.host || !form.user}
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <TestTube className="h-4 w-4" />
            )}
            Testar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !form.name || !form.host || !form.user}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}