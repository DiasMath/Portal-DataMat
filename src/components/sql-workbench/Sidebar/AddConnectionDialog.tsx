'use client';

import { useEffect, useState } from 'react';
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

const CONNECTION_COLORS = [
  '#6366f1', '#0ea5e9', '#10b981', '#f59e0b',
  '#ef4444', '#a855f7', '#ec4899', '#64748b',
];

interface ConnectionFormState {
  name: string;
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
  color: string;
}

const EMPTY_FORM: ConnectionFormState = {
  name: '',
  host: 'localhost',
  port: '3306',
  user: '',
  password: '',
  database: '',
  color: CONNECTION_COLORS[0],
};

interface AddConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (connection: Connection) => void;
  /** Quando presente, o dialog abre em modo de edição pré-preenchido. */
  editingConnection?: Connection | null;
}

export function AddConnectionDialog({ open, onOpenChange, onSave, editingConnection }: AddConnectionDialogProps) {
  const isEditing = !!editingConnection;
  const [form, setForm] = useState<ConnectionFormState>(EMPTY_FORM);
  const [testing, setTesting] = useState(false);
  const [testingResult, setTestingResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Sincroniza o formulário sempre que o dialog abre — tanto pra edição
  // (pré-preenche com os dados existentes, sem a senha, que nunca volta do
  // servidor) quanto pra criação (garante estado limpo mesmo se o dialog
  // for reaberto sem desmontar).
  useEffect(() => {
    if (!open) return;
    if (editingConnection) {
      setForm({
        name: editingConnection.name,
        host: editingConnection.host,
        port: String(editingConnection.port),
        user: editingConnection.user,
        password: '',
        database: editingConnection.database || '',
        color: editingConnection.color || CONNECTION_COLORS[0],
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setTestingResult(null);
  }, [open, editingConnection]);

  const handleTest = async () => {
    setTesting(true);
    setTestingResult(null);

    try {
      // Editando uma conexão existente e a senha não foi alterada: testamos
      // contra a conexão já salva (que descriptografa a senha no servidor)
      // em vez de mandar um campo vazio, que derrubaria a autenticação.
      const useSavedPassword = isEditing && !form.password;

      const res = useSavedPassword
        ? await fetch(`/api/sql/connect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ connectionId: editingConnection!.id }),
          })
        : await fetch('/api/sql/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              connectionId: `temp-${Date.now()}`,
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
      const payload: Record<string, unknown> = {
        name: form.name,
        host: form.host,
        port: parseInt(form.port, 10),
        user: form.user,
        database: form.database || undefined,
        color: form.color,
      };
      // Só manda `password` se o usuário digitou algo novo — em modo de
      // edição, campo vazio significa "manter a senha atual".
      if (!isEditing || form.password) {
        payload.password = form.password;
      }

      const url = isEditing ? `/api/sql/connections/${editingConnection!.id}` : '/api/sql/connections';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Erro ao salvar conexão');
        return;
      }

      const savedConnection: Connection = {
        id: isEditing ? editingConnection!.id : data.id,
        name: form.name,
        host: form.host,
        port: parseInt(form.port, 10),
        user: form.user,
        password: '',
        database: form.database,
        color: form.color,
        status: isEditing ? editingConnection!.status : 'disconnected',
      };

      onSave(savedConnection);
      toast.success(isEditing ? 'Conexão atualizada com sucesso!' : 'Conexão salva com sucesso!');
      setTestingResult(null);
    } catch (err) {
      toast.error('Erro ao salvar conexão');
      console.error('Failed to save connection:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setTestingResult(null);
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Conexão' : 'Adicionar Conexão'}</DialogTitle>
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
                placeholder={isEditing ? 'Deixe em branco para manter a atual' : ''}
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

          <div className="grid gap-2">
            <Label>Cor</Label>
            <div className="flex items-center gap-2">
              {CONNECTION_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm({ ...form, color })}
                  className={`h-6 w-6 rounded-full transition-transform ${
                    form.color === color ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
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
            {isEditing ? 'Salvar alterações' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
