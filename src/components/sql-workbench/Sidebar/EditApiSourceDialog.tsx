'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { suggestDatasetName, type ApiDataset, type ApiOperation, type ApiSource } from './ImportApiDialog';

export function EditApiSourceDialog({ source, onOpenChange, onSaved }: {
  source: ApiSource | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (source: ApiSource) => void;
}) {
  const [name, setName] = useState('');
  const [tenantId, setTenantId] = useState('default');
  const [baseUrl, setBaseUrl] = useState('');
  const [authKind, setAuthKind] = useState('none');
  const [keyValue, setKeyValue] = useState('');
  const [keyEnv, setKeyEnv] = useState('');
  const [headerName, setHeaderName] = useState('X-API-Key');
  const [keyPrefix, setKeyPrefix] = useState('');
  const [usernameEnv, setUsernameEnv] = useState('');
  const [passwordEnv, setPasswordEnv] = useState('');
  const [datasets, setDatasets] = useState<ApiDataset[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!source) return;
    setName(source.name); setTenantId(source.tenant_id); setBaseUrl(source.base_url);
    setAuthKind(source.auth?.kind || 'none'); setKeyValue(''); setKeyEnv(source.auth?.key_env || '');
    setHeaderName(source.auth?.header_name || 'X-API-Key'); setKeyPrefix(source.auth?.key_prefix || '');
    setUsernameEnv(source.auth?.username_env || ''); setPasswordEnv(source.auth?.password_env || '');
    setDatasets(source.datasets.map((item) => ({ ...item, pagination: { ...item.pagination } })));
    setExpanded(null); setError('');
  }, [source]);

  const change = (operationId: string, patch: Partial<ApiDataset>) => {
    setDatasets((old) => old.map((item) => item.operation_id === operationId ? { ...item, ...patch } : item));
  };

  const configure = (operation: ApiOperation) => {
    setDatasets((old) => {
      if (old.some((item) => item.operation_id === operation.operation_id)) return old;
      const base = suggestDatasetName(operation);
      let name = base;
      let suffix = 2;
      while (old.some((item) => item.name.toLowerCase() === name.toLowerCase())) name = `${base}_${suffix++}`;
      return [...old, { name, operation_id: operation.operation_id, data_path: null,
        pagination: { mode: 'none', page_param: 'page', size_param: 'limit', size: 100, start_page: 1 } }];
    });
    setExpanded(operation.operation_id);
  };

  const save = async () => {
    if (!source) return;
    setBusy(true); setError('');
    try {
      const auth = authKind === 'api_key'
        ? { kind: 'api_key', ...(keyValue ? { key_value: keyValue } : keyEnv ? { key_env: keyEnv } : {}), header_name: headerName, key_prefix: keyPrefix, send_as: 'header' }
        : authKind === 'basic_auth' ? { kind: 'basic_auth', username_env: usernameEnv, password_env: passwordEnv } : { kind: 'none' };
      const response = await fetch(`/api/sql/live/sources/${source.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim(), tenant_id: tenantId.trim(), base_url: baseUrl.trim(), auth, datasets }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || data.error || 'Não foi possível salvar a conexão');
      onSaved(data);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar a conexão'); }
    finally { setBusy(false); }
  };

  return <Dialog open={!!source} onOpenChange={(open) => { if (!busy) onOpenChange(open); }}>
    <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
      <DialogHeader><DialogTitle>Editar conexão de API</DialogTitle><DialogDescription>Altere a conexão e os nomes das tabelas SQL. As alterações ficam salvas para as próximas sessões.</DialogDescription></DialogHeader>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <label>Nome<Input value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label>Tenant ID<Input value={tenantId} onChange={(e) => setTenantId(e.target.value)} /></label>
        <label className="col-span-2">URL base HTTPS<Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} /></label>
        <label className="col-span-2">Autenticação<select className="block w-full rounded border bg-background p-2" value={authKind} onChange={(e) => setAuthKind(e.target.value)}><option value="none">Nenhuma</option><option value="api_key">API Key em header</option><option value="basic_auth">Basic Auth</option></select></label>
        {authKind === 'api_key' && <>
          <label>API Key<Input type="password" autoComplete="off" value={keyValue} onChange={(e) => setKeyValue(e.target.value)} placeholder={source?.auth?.has_key ? 'Chave salva; deixe vazio para manter' : 'Cole a chave aqui'} /></label>
          <label>Ou variável de ambiente<Input value={keyEnv} onChange={(e) => setKeyEnv(e.target.value)} disabled={!!keyValue} /></label>
          <label>Header<Input value={headerName} onChange={(e) => setHeaderName(e.target.value)} /></label>
          <label>Prefixo<Input value={keyPrefix} onChange={(e) => setKeyPrefix(e.target.value)} placeholder="Bearer " /></label>
        </>}
        {authKind === 'basic_auth' && <><label>Variável de usuário<Input value={usernameEnv} onChange={(e) => setUsernameEnv(e.target.value)} /></label><label>Variável de senha<Input value={passwordEnv} onChange={(e) => setPasswordEnv(e.target.value)} /></label></>}
      </div>
      <div className="space-y-2"><h3 className="text-sm font-medium">Endpoints GET ({source?.operations.filter((item) => item.method === 'GET').length || 0}) · tabelas SQL ({datasets.length})</h3>
        {source?.operations.filter((item) => item.method === 'GET').map((operation) => {
          const dataset = datasets.find((item) => item.operation_id === operation.operation_id);
          return <div key={operation.operation_id} className="rounded border p-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate" title={operation.path}><span className="text-primary">GET</span> {operation.path} {dataset ? `→ ${dataset.name}` : '· sem tabela SQL'}</span>
              {dataset ? <button type="button" className="shrink-0 text-primary hover:underline" aria-expanded={expanded === operation.operation_id} onClick={() => setExpanded(expanded === operation.operation_id ? null : operation.operation_id)}>{expanded === operation.operation_id ? 'Recolher' : 'Editar'}</button>
                : <button type="button" className="shrink-0 text-primary hover:underline" onClick={() => configure(operation)}>Configurar</button>}
            </div>
            {dataset && expanded === operation.operation_id && <div className="mt-2 grid grid-cols-2 gap-2">
              <label>Nome SQL<Input value={dataset.name} onChange={(e) => change(dataset.operation_id, { name: e.target.value })} /></label>
              <label>Caminho dos registros<Input value={dataset.data_path || ''} onChange={(e) => change(dataset.operation_id, { data_path: e.target.value || null })} placeholder="data.items" /></label>
              <label>Paginação<select className="block w-full rounded border bg-background p-2" value={dataset.pagination.mode} onChange={(e) => change(dataset.operation_id, { pagination: { ...dataset.pagination, mode: e.target.value as 'none' | 'page' } })}><option value="none">Sem paginação</option><option value="page">Por página</option></select></label>
              {dataset.pagination.mode === 'page' && <>
                <label>Parâmetro da página<Input value={dataset.pagination.page_param} onChange={(e) => change(dataset.operation_id, { pagination: { ...dataset.pagination, page_param: e.target.value } })} /></label>
                <label>Parâmetro do tamanho<Input value={dataset.pagination.size_param} onChange={(e) => change(dataset.operation_id, { pagination: { ...dataset.pagination, size_param: e.target.value } })} /></label>
                <label>Tamanho da página<Input type="number" min={1} max={1000} value={dataset.pagination.size} onChange={(e) => change(dataset.operation_id, { pagination: { ...dataset.pagination, size: Number(e.target.value) } })} /></label>
                <label>Total na resposta<Input value={dataset.pagination.total_path || ''} onChange={(e) => change(dataset.operation_id, { pagination: { ...dataset.pagination, total_path: e.target.value || null } })} /></label>
                <label>Há mais páginas<Input value={dataset.pagination.has_more_path || ''} onChange={(e) => change(dataset.operation_id, { pagination: { ...dataset.pagination, has_more_path: e.target.value || null } })} /></label>
              </>}
            </div>}
          </div>;
        })}
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancelar</Button><Button onClick={save} disabled={busy || !name.trim() || !baseUrl.trim()} className="gap-2">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Salvar alterações</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
