'use client';

import { useState, useEffect } from 'react';
import { useStudio } from '../../store/StudioContext';
import { toggleSet } from '../../lib/set-utils';
import type { StudioConnection } from '../../types/connection';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Database, Link2, AlertCircle, CheckCircle2, Table, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

interface TableInfo {
  name: string;
  columns: { name: string; type: string; key: string; nullable: boolean }[];
}

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const { state, dispatch } = useStudio();
  const [connections, setConnections] = useState<StudioConnection[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
  const [previewTable, setPreviewTable] = useState<{ name: string; columns: { COLUMN_NAME: string }[]; rows: Record<string, unknown>[] } | null>(null);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      loadConnections();
      if (state.dataModel?.connectionId) {
        setSelectedConnectionId(state.dataModel.connectionId);
      }
      setTables([]);
      setSelectedTables(new Set());
    }
  }, [open, state.dataModel?.connectionId]);

  useEffect(() => {
    if (selectedConnectionId) {
      loadTables();
    }
  }, [selectedConnectionId]);

  const loadConnections = async () => {
    setLoadingConnections(true);
    try {
      const res = await fetch('/api/studio/connections');
      const data = await res.json();
      if (data.success) {
        setConnections(data.connections);
      }
    } catch {
      toast.error('Erro ao carregar conexões');
    } finally {
      setLoadingConnections(false);
    }
  };

  const loadTables = async () => {
    setLoadingTables(true);
    try {
      if (!selectedConnectionId) return;

      const res = await fetch('/api/studio/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId: selectedConnectionId }),
      });
      const data = await res.json();

      if (data.success && data.tables) {
        setTables(data.tables);
        setSelectedTables(new Set(data.tables.map((t: TableInfo) => t.name)));
      } else {
        toast.error(data.error || 'Erro ao carregar tabelas');
      }
    } catch {
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setLoadingTables(false);
    }
  };

  const handleTablePreview = async (tableName: string) => {
    try {
      const res = await fetch('/api/studio/preview-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId: selectedConnectionId, tableName, limit: 10 }),
      });
      const data = await res.json();
      if (data.success) {
        setPreviewTable({ name: tableName, columns: data.columns, rows: data.rows });
      }
    } catch {
      toast.error('Erro ao carregar preview');
    }
  };

  const handleImport = async () => {
    if (!selectedConnectionId || selectedTables.size === 0) return;

    setLoading(true);
    try {
      const res = await fetch('/api/studio/import-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          connectionId: selectedConnectionId,
          tables: Array.from(selectedTables)
        }),
      });

      const data = await res.json();
      if (data.success) {
        dispatch({ type: 'SET_DATA_MODEL', payload: data.dataModel });
        toast.success(`Modelo importado: ${data.dataModel.tables.length} tabelas, ${data.dataModel.relationships.length} relacionamentos`);
        onOpenChange(false);
      } else {
        toast.error(data.error || 'Erro ao importar modelo');
      }
    } catch {
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const toggleTableSelection = (tableName: string) => {
    setSelectedTables(prev => toggleSet(prev, tableName));
  };

  const toggleAllTables = () => {
    if (selectedTables.size === tables.length) {
      setSelectedTables(new Set());
    } else {
      setSelectedTables(new Set(tables.map(t => t.name)));
    }
  };

  const toggleExpandTable = (tableName: string) => {
    setExpandedTables(prev => toggleSet(prev, tableName));
  };

  const selectedConnection = connections.find(c => c.id === selectedConnectionId);

  const renderTableRow = (table: TableInfo) => {
    const isSelected = selectedTables.has(table.name);
    const isExpanded = expandedTables.has(table.name);
    
    return (
      <div key={table.name} className="bg-[#1a1a1a] border border-[#333] rounded">
        <div className="flex items-center gap-2 p-2 hover:bg-[#2a2a2a]">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleTableSelection(table.name)}
            className="accent-amber-500"
          />
          <Table size={14} className="text-amber-500" />
          <span className="font-medium text-sm flex-1">{table.name}</span>
          <span className="text-[10px] text-neutral-500">{table.columns.length} colunas</span>
          <button
            onClick={() => {
              handleTablePreview(table.name);
              toggleExpandTable(table.name);
            }}
            className="p-1 text-neutral-500 hover:text-white"
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={() => handleTablePreview(table.name)}
            className="p-1 text-neutral-500 hover:text-white ml-1"
            title="Visualizar dados"
          >
            <Eye size={14} />
          </button>
        </div>
        
        {isExpanded && (
          <div className="border-t border-[#333] p-2 bg-[#151515]">
             <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-minimal">
              {table.columns.map(col => (
                <div key={col.name} className="flex items-center gap-2 text-xs text-neutral-400 px-2 py-0.5">
                  <span className="w-4" />
                  <span className="text-neutral-300">{col.name}</span>
                  <span className="text-neutral-500 text-[10px]">{col.type}</span>
                  {col.key && (
                    <span className="ml-auto text-amber-500 text-[9px]">PK</span>
                  )}
                </div>
              ))}
            </div>
            
            {previewTable?.name === table.name && (
               <div className="mt-3 p-2 bg-[#0a0a0a] border border-[#333] rounded max-h-48 overflow-auto scrollbar-minimal">
                <div className="text-xs text-neutral-500 mb-1">Preview (10 linhas):</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="text-neutral-400 border-b border-[#333]">
                        {previewTable.columns.map(c => (
                          <th key={c.COLUMN_NAME} className="p-1 text-left">{c.COLUMN_NAME}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewTable.rows.map((row: Record<string, unknown>, i: number) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-[#151515]' : ''}>
                          {previewTable.columns.map(c => (
                            <td key={c.COLUMN_NAME} className="p-1 text-neutral-300 border-b border-[#333]/50">
                              {String(row[c.COLUMN_NAME] ?? 'NULL')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
)}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a1a] border-[#333] text-white max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database size={18} className="text-amber-500" />
            Importar Modelo de Dados
          </DialogTitle>
        </DialogHeader>

         <div className="space-y-4 py-4 overflow-y-auto scrollbar-minimal">
          <div>
            <label className="text-xs text-neutral-400 mb-1.5 block">Conexão</label>
            {loadingConnections ? (
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <Loader2 size={14} className="animate-spin" />
                Carregando conexões...
              </div>
            ) : connections.length === 0 ? (
              <div className="text-sm text-neutral-400">
                Nenhuma conexão encontrada. Crie uma conexão no painel de configurações.
              </div>
            ) : (
              <select
                value={selectedConnectionId}
                onChange={(e) => setSelectedConnectionId(e.target.value)}
                className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">Selecione uma conexão...</option>
                {connections.map(conn => (
                  <option key={conn.id} value={conn.id}>
                    {conn.name} ({conn.host}:{conn.port})
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedConnection && (
            <div className="flex items-center gap-2 p-3 bg-[#2a2a2a] rounded border border-[#333]">
              <Link2 size={14} className="text-green-500" />
              <span className="text-sm text-neutral-300">
                {selectedConnection.database || 'Database não especificado'}
              </span>
            </div>
          )}

          {state.dataModel && (
            <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded border border-amber-500/20">
              <AlertCircle size={14} className="text-amber-500" />
              <span className="text-sm text-amber-400">
                Um modelo já existe. Importar irá substituir o modelo atual.
              </span>
            </div>
          )}

          {tables.length > 0 && (
            <div className="border-t border-[#333] pt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-medium text-muted-foreground">TABELAS</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleAllTables}
                    className="text-xs text-neutral-400 hover:text-white"
                  >
                    {selectedTables.size === tables.length ? 'Desmarcar todas' : 'Selecionar todas'}
                  </button>
                  <span className="text-xs text-neutral-500">
                    {selectedTables.size} de {tables.length} selecionadas
                  </span>
                </div>
              </div>
              
              <div className="max-h-64 overflow-y-auto space-y-1 scrollbar-minimal">
                {tables.map(renderTableRow)}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-neutral-400 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={!selectedConnectionId || loading || selectedTables.size === 0}
            className="bg-amber-500 hover:bg-amber-600 text-black"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <CheckCircle2 size={14} className="mr-2" />
                Importar {selectedTables.size} tabela{selectedTables.size > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}