'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface ApiOperation {
  operation_id: string;
  method: string;
  path: string;
  summary: string;
  tags: string[];
  parameters: { name: string; in: string; required: boolean; type?: string }[];
  security?: Record<string, string[]>[];
  response_schema?: Record<string, unknown>;
}

export interface ApiDataset {
  name: string;
  operation_id: string;
  data_path?: string | null;
  pagination: { mode: 'none' | 'page'; page_param: string; size_param: string; size: number; start_page: number; total_path?: string | null; has_more_path?: string | null };
}

export interface ApiSource {
  id: string;
  name: string;
  tenant_id: string;
  base_url: string;
  operations: ApiOperation[];
  datasets: ApiDataset[];
}

export function ImportApiDialog({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (open: boolean) => void; onSaved: (source: ApiSource) => void }) {
  const [name, setName] = useState('');
  const [tenantId, setTenantId] = useState('default');
  const [baseUrl, setBaseUrl] = useState('');
  const [specUrl, setSpecUrl] = useState('');
  const [specText, setSpecText] = useState('');
  const [spec, setSpec] = useState<Record<string, unknown> | null>(null);
  const [operations, setOperations] = useState<ApiOperation[]>([]);
  const [datasets, setDatasets] = useState<Record<string, ApiDataset>>({});
  const [authKind, setAuthKind] = useState<'none' | 'api_key' | 'basic_auth'>('none');
  const [keyEnv, setKeyEnv] = useState('');
  const [headerName, setHeaderName] = useState('X-API-Key');
  const [keyPrefix, setKeyPrefix] = useState('');
  const [userEnv, setUserEnv] = useState('');
  const [passwordEnv, setPasswordEnv] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const preview = async () => {
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/sql/live/openapi/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(specText ? { spec_text: specText } : { spec_url: specUrl }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || 'Falha ao importar');
      setSpec(data.spec); setOperations(data.operations); setDatasets({});
    } catch (e) { setError(e instanceof Error ? e.message : 'Falha ao importar'); }
    finally { setBusy(false); }
  };

  const choose = (op: ApiOperation, selected: boolean) => {
    setDatasets((old) => {
      const next = { ...old };
      if (!selected) delete next[op.operation_id];
      else next[op.operation_id] = { name: op.operation_id.replace(/[^A-Za-z0-9_]/g, '_').replace(/^[^A-Za-z_]/, '_'), operation_id: op.operation_id, data_path: null, pagination: { mode: 'none', page_param: 'page', size_param: 'limit', size: 100, start_page: 1 } };
      return next;
    });
  };

  const save = async () => {
    if (!spec) return;
    setBusy(true); setError('');
    try {
      const auth = authKind === 'api_key' ? { kind: 'api_key', key_env: keyEnv, header_name: headerName, key_prefix: keyPrefix, send_as: 'header' } : authKind === 'basic_auth' ? { kind: 'basic_auth', username_env: userEnv, password_env: passwordEnv } : { kind: 'none' };
      const res = await fetch('/api/sql/live/sources', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, tenant_id: tenantId, base_url: baseUrl, spec, auth, datasets: Object.values(datasets) }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || 'Falha ao cadastrar fonte');
      onSaved(data); onOpenChange(false);
    } catch (e) { setError(e instanceof Error ? e.message : 'Falha ao cadastrar'); }
    finally { setBusy(false); }
  };

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-card border-border">
    <DialogHeader><DialogTitle>Importar API REST</DialogTitle></DialogHeader>
    <div className="grid grid-cols-2 gap-2 text-sm">
      <label>Nome<Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Minha API" /></label>
      <label>Tenant ID<Input value={tenantId} onChange={(e) => setTenantId(e.target.value)} /></label>
      <label>URL base HTTPS<Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://api.exemplo.com" /></label>
      <label className="col-span-2">OpenAPI por URL<Input value={specUrl} onChange={(e) => setSpecUrl(e.target.value)} placeholder="https://api.exemplo.com/openapi.json" /></label>
      <label className="col-span-2">Ou arquivo JSON/YAML<Input type="file" accept=".json,.yaml,.yml" onChange={async (e) => { const file = e.target.files?.[0]; if (file) { setSpecText(await file.text()); setSpecUrl(''); } }} /></label>
    </div>
    <Button onClick={preview} disabled={busy || (!specText && !specUrl)}>Analisar documentação</Button>
    {spec && <>
      <div className="text-sm">Autenticação
        <select className="ml-2 bg-background border rounded p-1" value={authKind} onChange={(e) => setAuthKind(e.target.value as typeof authKind)}><option value="none">Nenhuma</option><option value="api_key">API Key em header</option><option value="basic_auth">Basic Auth</option></select>
      </div>
      {authKind === 'api_key' && <div className="grid grid-cols-3 gap-2"><label>Variável de ambiente da chave<Input value={keyEnv} onChange={(e) => setKeyEnv(e.target.value)} /></label><label>Nome do header<Input value={headerName} onChange={(e) => setHeaderName(e.target.value)} /></label><label>Prefixo (opcional)<Input value={keyPrefix} onChange={(e) => setKeyPrefix(e.target.value)} placeholder="Bearer " /></label></div>}
      {authKind === 'basic_auth' && <div className="grid grid-cols-2 gap-2"><label>Variável de usuário<Input value={userEnv} onChange={(e) => setUserEnv(e.target.value)} /></label><label>Variável de senha<Input value={passwordEnv} onChange={(e) => setPasswordEnv(e.target.value)} /></label></div>}
      <p className="text-xs text-muted-foreground">Selecione explicitamente as operações GET consultáveis. Configure o caminho dos registros e a paginação conforme o contrato da API.</p>
      <div className="space-y-2 max-h-72 overflow-y-auto">
        {operations.map((op) => <div key={op.operation_id} className="border border-border rounded p-2 text-xs">
          <label className="flex gap-2 items-center"><input type="checkbox" disabled={op.method !== 'GET'} checked={!!datasets[op.operation_id]} onChange={(e) => choose(op, e.target.checked)} /><b>{op.method}</b> {op.path} <span className="text-muted-foreground">{op.summary}</span></label>
          {datasets[op.operation_id] && <div className="grid grid-cols-3 gap-2 mt-2">
            <label>Nome SQL<Input value={datasets[op.operation_id].name} onChange={(e) => setDatasets((old) => ({ ...old, [op.operation_id]: { ...old[op.operation_id], name: e.target.value } }))} /></label>
            <label>Caminho dos registros<Input placeholder="data.items (vazio = raiz)" value={datasets[op.operation_id].data_path || ''} onChange={(e) => setDatasets((old) => ({ ...old, [op.operation_id]: { ...old[op.operation_id], data_path: e.target.value || null } }))} /></label>
            <label>Paginação<select className="block w-full bg-background border rounded p-2" value={datasets[op.operation_id].pagination.mode} onChange={(e) => setDatasets((old) => ({ ...old, [op.operation_id]: { ...old[op.operation_id], pagination: { ...old[op.operation_id].pagination, mode: e.target.value as 'none' | 'page' } } }))}><option value="none">Sem paginação</option><option value="page">Por página</option></select></label>
            {datasets[op.operation_id].pagination.mode === 'page' && <><label>Parâmetro página<Input value={datasets[op.operation_id].pagination.page_param} onChange={(e) => setDatasets((old) => ({ ...old, [op.operation_id]: { ...old[op.operation_id], pagination: { ...old[op.operation_id].pagination, page_param: e.target.value } } }))} /></label><label>Parâmetro tamanho<Input value={datasets[op.operation_id].pagination.size_param} onChange={(e) => setDatasets((old) => ({ ...old, [op.operation_id]: { ...old[op.operation_id], pagination: { ...old[op.operation_id].pagination, size_param: e.target.value } } }))} /></label><label>Tamanho<Input type="number" value={datasets[op.operation_id].pagination.size} onChange={(e) => setDatasets((old) => ({ ...old, [op.operation_id]: { ...old[op.operation_id], pagination: { ...old[op.operation_id].pagination, size: Number(e.target.value) } } }))} /></label><label>Total na resposta<Input placeholder="meta.total" value={datasets[op.operation_id].pagination.total_path || ''} onChange={(e) => setDatasets((old) => ({ ...old, [op.operation_id]: { ...old[op.operation_id], pagination: { ...old[op.operation_id].pagination, total_path: e.target.value || null } } }))} /></label><label>Há mais páginas<Input placeholder="meta.has_more" value={datasets[op.operation_id].pagination.has_more_path || ''} onChange={(e) => setDatasets((old) => ({ ...old, [op.operation_id]: { ...old[op.operation_id], pagination: { ...old[op.operation_id].pagination, has_more_path: e.target.value || null } } }))} /></label></>}
          </div>}
        </div>)}
      </div>
      <Button onClick={save} disabled={busy || !name || !baseUrl || Object.keys(datasets).length === 0}>Cadastrar fonte</Button>
    </>}
    {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
  </DialogContent></Dialog>;
}
