'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export interface ApiOperation {
  operation_id: string;
  method: string;
  path: string;
  summary: string;
  tags: string[];
  parameters: { name: string; in: string; required: boolean; type?: string; items_type?: string | null; description?: string; enum?: unknown[]; example?: unknown; default?: unknown; style?: string | null; explode?: boolean | null }[];
  security?: Record<string, string[]>[];
  response_schema?: Record<string, unknown>;
}

export interface ApiDataset {
  name: string;
  operation_id: string;
  data_path?: string | null;
  pagination: { mode: 'none' | 'page' | 'cursor'; page_param: string; size_param: string; cursor_param?: string; cursor_path?: string; size: number; start_page: number; total_path?: string | null; has_more_path?: string | null };
}

export interface ApiChildTable {
  name: string;
  parent_dataset: string;
  field: string;
  columns: { name: string; type: string }[];
}

export interface ApiSource {
  id: string;
  name: string;
  tenant_id: string;
  base_url: string;
  spec_url?: string | null;
  operations: ApiOperation[];
  datasets: ApiDataset[];
  child_tables?: ApiChildTable[];
  auth?: { kind: string; key_env?: string; header_name?: string; key_prefix?: string; username_env?: string; password_env?: string; client_id_env?: string; client_secret_env?: string; token_url_env?: string; scope_env?: string; has_key?: boolean };
}

export function suggestDatasetName(op: ApiOperation): string {
  return op.path.split('/').filter(Boolean).map((segment) => {
    const parameter = segment.startsWith('{') && segment.endsWith('}');
    const name = parameter ? `by_${segment.slice(1, -1)}` : segment;
    return name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/[^A-Za-z0-9_]/g, '_').toLowerCase();
  }).join('_').replace(/^[^A-Za-z_]/, '_') || 'api_result';
}

export function ImportApiForm({ onSaved }: { onSaved: (source: ApiSource) => void }) {
  const [name, setName] = useState('');
  const [tenantId, setTenantId] = useState('default');
  const [baseUrl, setBaseUrl] = useState('');
  const [specUrl, setSpecUrl] = useState('');
  const [specText, setSpecText] = useState('');
  const [spec, setSpec] = useState<Record<string, unknown> | null>(null);
  const [operations, setOperations] = useState<ApiOperation[]>([]);
  const [datasets, setDatasets] = useState<Record<string, ApiDataset>>({});
  const [skipped, setSkipped] = useState<Record<string, string>>({});
  const [expandedOperationId, setExpandedOperationId] = useState<string | null>(null);
  const [authKind, setAuthKind] = useState<'none' | 'api_key' | 'basic_auth' | 'oauth2_client_credentials'>('none');
  const [keyEnv, setKeyEnv] = useState('');
  const [keyValue, setKeyValue] = useState('');
  const [headerName, setHeaderName] = useState('X-API-Key');
  const [keyPrefix, setKeyPrefix] = useState('');
  const [userEnv, setUserEnv] = useState('');
  const [passwordEnv, setPasswordEnv] = useState('');
  const [clientIdEnv, setClientIdEnv] = useState('');
  const [clientSecretEnv, setClientSecretEnv] = useState('');
  const [tokenUrlEnv, setTokenUrlEnv] = useState('');
  const [scopeEnv, setScopeEnv] = useState('');
  const [busy, setBusy] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState('');

  const preview = async () => {
    setPreviewing(true); setError('');
    try {
      const res = await fetch('/api/sql/live/openapi/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(specText ? { spec_text: specText } : { spec_url: specUrl }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || 'Falha ao importar');
      if (!Array.isArray(data.suggested_datasets)) throw new Error('O serviço Live API está desatualizado. Reinicie o FastAPI e o Portal.');
      setSpec(data.spec);
      setOperations(data.operations.filter((op: ApiOperation) => op.method === 'GET'));
      setDatasets(Object.fromEntries((data.suggested_datasets as ApiDataset[]).map((dataset) => [dataset.operation_id, dataset])));
      setSkipped(Object.fromEntries((data.skipped as { operation_id: string; reason: string }[]).map((item) => [item.operation_id, item.reason])));
      setExpandedOperationId(null);
    } catch (e) { setError(e instanceof Error ? e.message : 'Falha ao importar'); }
    finally { setPreviewing(false); }
  };

  const configure = (op: ApiOperation) => {
    setDatasets((old) => {
      if (old[op.operation_id]) return old;
      const next = { ...old };
      next[op.operation_id] = { name: suggestDatasetName(op), operation_id: op.operation_id, data_path: null, pagination: { mode: 'none', page_param: 'page', size_param: 'limit', size: 100, start_page: 1 } };
      return next;
    });
    setExpandedOperationId(op.operation_id);
  };

  const save = async () => {
    if (!spec) return;
    setBusy(true); setError('');
    try {
      const auth = authKind === 'api_key' ? { kind: 'api_key', ...(keyValue ? { key_value: keyValue } : { key_env: keyEnv }), header_name: headerName, key_prefix: keyPrefix, send_as: 'header' } : authKind === 'basic_auth' ? { kind: 'basic_auth', username_env: userEnv, password_env: passwordEnv } : authKind === 'oauth2_client_credentials' ? { kind: authKind, client_id_env: clientIdEnv, client_secret_env: clientSecretEnv, token_url_env: tokenUrlEnv, ...(scopeEnv ? { scope_env: scopeEnv } : {}) } : { kind: 'none' };
      const res = await fetch('/api/sql/live/sources', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, tenant_id: tenantId, base_url: baseUrl, spec, spec_url: specText ? null : specUrl, auth, datasets: Object.values(datasets) }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || 'Falha ao cadastrar fonte');
      onSaved(data);
    } catch (e) { setError(e instanceof Error ? e.message : 'Falha ao cadastrar'); }
    finally { setBusy(false); }
  };

  return <div className="space-y-4">
    <div className="grid grid-cols-2 gap-2 text-sm">
      <label>Nome<Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Minha API" /></label>
      <label>Tenant ID<Input value={tenantId} onChange={(e) => setTenantId(e.target.value)} /></label>
      <label>URL base HTTPS<Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://api.exemplo.com" /></label>
      <label className="col-span-2">Autenticação<select className="block w-full bg-background border rounded p-2" value={authKind} onChange={(e) => setAuthKind(e.target.value as typeof authKind)}><option value="none">Nenhuma</option><option value="api_key">API Key em header</option><option value="basic_auth">Basic Auth</option><option value="oauth2_client_credentials">OAuth2 · Client Credentials</option></select></label>
      {authKind === 'api_key' && <><label>API Key<Input type="password" autoComplete="off" value={keyValue} onChange={(e) => setKeyValue(e.target.value)} placeholder="Chave da API" /></label><label>Ou nome da variável de ambiente<Input value={keyEnv} onChange={(e) => setKeyEnv(e.target.value)} disabled={!!keyValue} /></label><label>Nome do header<Input value={headerName} onChange={(e) => setHeaderName(e.target.value)} /></label><label>Prefixo (opcional)<Input value={keyPrefix} onChange={(e) => setKeyPrefix(e.target.value)} placeholder="Bearer " /></label></>}
      {authKind === 'basic_auth' && <><label>Variável de usuário<Input value={userEnv} onChange={(e) => setUserEnv(e.target.value)} /></label><label>Variável de senha<Input value={passwordEnv} onChange={(e) => setPasswordEnv(e.target.value)} /></label></>}
      {authKind === 'oauth2_client_credentials' && <><label>Variável Client ID<Input value={clientIdEnv} onChange={(e) => setClientIdEnv(e.target.value)} /></label><label>Variável Client Secret<Input value={clientSecretEnv} onChange={(e) => setClientSecretEnv(e.target.value)} /></label><label>Variável Token URL<Input value={tokenUrlEnv} onChange={(e) => setTokenUrlEnv(e.target.value)} /></label><label>Variável Scope (opcional)<Input value={scopeEnv} onChange={(e) => setScopeEnv(e.target.value)} /></label></>}
      {authKind !== 'none' && <p className="col-span-2 text-xs text-muted-foreground">Variáveis de ambiente devem estar autorizadas em LIVE_API_ALLOWED_SECRET_ENVS no serviço FastAPI.</p>}
      <label className="col-span-2">OpenAPI por URL<Input value={specUrl} onChange={(e) => setSpecUrl(e.target.value)} placeholder="https://api.exemplo.com/openapi.json" /></label>
      <label className="col-span-2">Ou arquivo JSON/YAML<Input type="file" accept=".json,.yaml,.yml" onChange={async (e) => { const file = e.target.files?.[0]; if (file) { setSpecText(await file.text()); setSpecUrl(''); } }} /></label>
    </div>
    <Button onClick={preview} disabled={previewing || busy || (!specText && !specUrl)} aria-busy={previewing} className="gap-2">
      {previewing ? 'Analisando documentação' : 'Analisar documentação'}
      {previewing && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
    </Button>
    {spec && <>
      <p className="text-sm text-muted-foreground">{operations.length} GET(s) encontrado(s); {Object.keys(datasets).length} consultável(is) configurado(s) automaticamente. Os demais aparecem na árvore com a limitação identificada.</p>
      <p className="text-xs text-muted-foreground">Os GETs compatíveis estarão prontos assim que a API for cadastrada. Abra “Ajustar” apenas se precisar corrigir os metadados da OpenAPI.</p>
      <div className="space-y-2 max-h-72 overflow-y-auto">
        {operations.map((op) => <div key={op.operation_id} className="border border-border rounded p-2 text-xs">
          <div className="flex items-center gap-2"><b>{op.method}</b> <span className="truncate" title={op.summary}>{op.path}</span><span className={`ml-auto shrink-0 ${datasets[op.operation_id] ? 'text-emerald-600' : 'text-amber-600'}`}>{datasets[op.operation_id] ? 'Pronto' : 'Requer detalhes'}</span><button type="button" className="text-primary hover:underline" onClick={() => datasets[op.operation_id] ? setExpandedOperationId(expandedOperationId === op.operation_id ? null : op.operation_id) : configure(op)}>{datasets[op.operation_id] ? 'Ajustar' : 'Configurar'}</button></div>
          {skipped[op.operation_id] && <p className="mt-1 text-amber-600">{skipped[op.operation_id]}</p>}
          {expandedOperationId === op.operation_id && datasets[op.operation_id] && <div className="grid grid-cols-3 gap-2 mt-2">
            <label>Nome SQL<Input value={datasets[op.operation_id].name} onChange={(e) => setDatasets((old) => ({ ...old, [op.operation_id]: { ...old[op.operation_id], name: e.target.value } }))} /></label>
            <label>Caminho dos registros<Input placeholder="data.items (vazio = raiz)" value={datasets[op.operation_id].data_path || ''} onChange={(e) => setDatasets((old) => ({ ...old, [op.operation_id]: { ...old[op.operation_id], data_path: e.target.value || null } }))} /></label>
            <label>Paginação<select className="block w-full bg-background border rounded p-2" value={datasets[op.operation_id].pagination.mode} onChange={(e) => setDatasets((old) => ({ ...old, [op.operation_id]: { ...old[op.operation_id], pagination: { ...old[op.operation_id].pagination, mode: e.target.value as 'none' | 'page' | 'cursor' } } }))}><option value="none">Sem paginação</option><option value="page">Por página</option><option value="cursor">Por cursor</option></select></label>
            {datasets[op.operation_id].pagination.mode === 'page' && <><label>Parâmetro página<Input value={datasets[op.operation_id].pagination.page_param} onChange={(e) => setDatasets((old) => ({ ...old, [op.operation_id]: { ...old[op.operation_id], pagination: { ...old[op.operation_id].pagination, page_param: e.target.value } } }))} /></label><label>Parâmetro tamanho<Input value={datasets[op.operation_id].pagination.size_param} onChange={(e) => setDatasets((old) => ({ ...old, [op.operation_id]: { ...old[op.operation_id], pagination: { ...old[op.operation_id].pagination, size_param: e.target.value } } }))} /></label><label>Tamanho<Input type="number" value={datasets[op.operation_id].pagination.size} onChange={(e) => setDatasets((old) => ({ ...old, [op.operation_id]: { ...old[op.operation_id], pagination: { ...old[op.operation_id].pagination, size: Number(e.target.value) } } }))} /></label><label>Total na resposta<Input placeholder="meta.total" value={datasets[op.operation_id].pagination.total_path || ''} onChange={(e) => setDatasets((old) => ({ ...old, [op.operation_id]: { ...old[op.operation_id], pagination: { ...old[op.operation_id].pagination, total_path: e.target.value || null } } }))} /></label><label>Há mais páginas<Input placeholder="meta.has_more" value={datasets[op.operation_id].pagination.has_more_path || ''} onChange={(e) => setDatasets((old) => ({ ...old, [op.operation_id]: { ...old[op.operation_id], pagination: { ...old[op.operation_id].pagination, has_more_path: e.target.value || null } } }))} /></label></>}
            {datasets[op.operation_id].pagination.mode === 'cursor' && <><label>Parâmetro cursor<Input value={datasets[op.operation_id].pagination.cursor_param || 'after'} onChange={(e) => setDatasets((old) => ({ ...old, [op.operation_id]: { ...old[op.operation_id], pagination: { ...old[op.operation_id].pagination, cursor_param: e.target.value } } }))} /></label><label>Caminho do próximo cursor<Input value={datasets[op.operation_id].pagination.cursor_path || 'paging.cursors.after'} onChange={(e) => setDatasets((old) => ({ ...old, [op.operation_id]: { ...old[op.operation_id], pagination: { ...old[op.operation_id].pagination, cursor_path: e.target.value } } }))} /></label><label>Parâmetro tamanho<Input value={datasets[op.operation_id].pagination.size_param} onChange={(e) => setDatasets((old) => ({ ...old, [op.operation_id]: { ...old[op.operation_id], pagination: { ...old[op.operation_id].pagination, size_param: e.target.value } } }))} /></label><label>Tamanho<Input type="number" min={1} max={1000} value={datasets[op.operation_id].pagination.size} onChange={(e) => setDatasets((old) => ({ ...old, [op.operation_id]: { ...old[op.operation_id], pagination: { ...old[op.operation_id].pagination, size: Number(e.target.value) } } }))} /></label></>}
          </div>}
        </div>)}
      </div>
      <Button onClick={save} disabled={busy || !name || !baseUrl || Object.keys(datasets).length === 0}>Cadastrar fonte</Button>
    </>}
    {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
  </div>;
}
