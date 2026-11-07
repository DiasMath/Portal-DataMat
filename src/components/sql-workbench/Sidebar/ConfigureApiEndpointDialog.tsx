'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { suggestDatasetName, type ApiDataset, type ApiOperation, type ApiSource } from './ImportApiDialog';
import scrollbarStyles from '../WorkbenchScrollbars.module.css';

export function ConfigureApiEndpointDialog({ source, operation, onOpenChange, onSaved }: {
  source: ApiSource | null;
  operation: ApiOperation | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (source: ApiSource, operation: ApiOperation) => void;
}) {
  const [name, setName] = useState('');
  const [dataPath, setDataPath] = useState('');
  const [mode, setMode] = useState<'none' | 'page'>('none');
  const [pageParam, setPageParam] = useState('page');
  const [sizeParam, setSizeParam] = useState('limit');
  const [size, setSize] = useState(100);
  const [totalPath, setTotalPath] = useState('');
  const [hasMorePath, setHasMorePath] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!operation) return;
    setName(suggestDatasetName(operation));
    setDataPath('');
    setMode('none');
    setPageParam('page');
    setSizeParam('limit');
    setSize(100);
    setTotalPath('');
    setHasMorePath('');
    setError('');
  }, [operation]);

  const save = async () => {
    if (!source || !operation) return;
    setBusy(true); setError('');
    const dataset: ApiDataset = {
      name: name.trim(), operation_id: operation.operation_id, data_path: dataPath.trim() || null,
      pagination: { mode, page_param: pageParam.trim(), size_param: sizeParam.trim(), size, start_page: 1, total_path: totalPath.trim() || null, has_more_path: hasMorePath.trim() || null },
    };
    try {
      const res = await fetch(`/api/sql/live/sources/${source.id}/datasets`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dataset),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || 'Não foi possível configurar o endpoint');
      onSaved(data, operation);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível configurar o endpoint');
    } finally { setBusy(false); }
  };

  return <Dialog open={!!source && !!operation} onOpenChange={onOpenChange}>
    <DialogContent className={`${scrollbarStyles.scrollArea} sm:max-w-xl max-h-[85vh] overflow-y-auto`}>
      <DialogHeader>
        <DialogTitle>Configurar endpoint GET</DialogTitle>
        <DialogDescription>{operation?.path} será consultado como um dataset SQL. Confira o formato da resposta e a paginação antes de salvar.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <label className="col-span-2">Nome SQL<Input value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label className="col-span-2">Caminho dos registros<Input value={dataPath} onChange={(event) => setDataPath(event.target.value)} placeholder="data.items (vazio = resposta inteira)" /></label>
        <label className="col-span-2">Paginação<select className="block w-full rounded border bg-background p-2" value={mode} onChange={(event) => setMode(event.target.value as 'none' | 'page')}><option value="none">Sem paginação documentada</option><option value="page">Por página</option></select></label>
        {mode === 'page' && <>
          <label>Parâmetro da página<Input value={pageParam} onChange={(event) => setPageParam(event.target.value)} /></label>
          <label>Parâmetro do tamanho<Input value={sizeParam} onChange={(event) => setSizeParam(event.target.value)} /></label>
          <label>Tamanho da página<Input type="number" min={1} max={1000} value={size} onChange={(event) => setSize(Number(event.target.value))} /></label>
          <label>Total na resposta<Input value={totalPath} onChange={(event) => setTotalPath(event.target.value)} placeholder="meta.total" /></label>
          <label className="col-span-2">Há mais páginas<Input value={hasMorePath} onChange={(event) => setHasMorePath(event.target.value)} placeholder="meta.has_more" /></label>
        </>}
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancelar</Button>
        <Button onClick={save} disabled={busy || !name.trim()} className="gap-2">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Salvar e abrir consulta</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
