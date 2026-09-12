'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Plus, Trash2, Copy, TableProperties } from 'lucide-react';
import { toast } from 'sonner';
import { useSqlWorkbench } from '@/contexts/SqlWorkbenchContext';
import { useCloseCreatorTab } from './useCloseCreatorTab';
import type { DatabaseSchema } from '@/types/sql-workbench';

interface Column {
  id: string;
  name: string;
  type: string;
  length: string;
  primaryKey: boolean;
  notNull: boolean;
  unique: boolean;
  autoIncrement: boolean;
  defaultValue: string;
  comment: string;
}

interface Index {
  id: string;
  name: string;
  columns: string[];
  unique: boolean;
  type: 'BTREE' | 'HASH' | 'FULLTEXT' | 'SPATIAL';
}

interface ForeignKey {
  id: string;
  name: string;
  columns: string[];
  refTable: string;
  refColumns: string[];
  onDelete: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
}

const MYSQL_TYPES = [
  'TINYINT', 'SMALLINT', 'MEDIUMINT', 'INT', 'BIGINT',
  'DECIMAL', 'FLOAT', 'DOUBLE', 'BIT',
  'CHAR', 'VARCHAR', 'TINYTEXT', 'TEXT', 'MEDIUMTEXT', 'LONGTEXT',
  'BINARY', 'VARBINARY', 'TINYBLOB', 'BLOB', 'MEDIUMBLOB', 'LONGBLOB',
  'DATE', 'DATETIME', 'TIMESTAMP', 'TIME', 'YEAR',
  'ENUM', 'SET', 'JSON',
];

const INDEX_TYPES = ['BTREE', 'HASH', 'FULLTEXT', 'SPATIAL'] as const;

const FK_ACTIONS = ['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION'] as const;

/**
 * Painel de criação de tabela — renderiza no MESMO lugar e tamanho onde o
 * editor SQL normalmente fica (não é mais um dialog flutuante). Igual ao
 * MySQL Workbench: "Create Table" abre como uma aba própria, com o
 * espaço inteiro da área de edição disponível.
 */
export function TableCreatorPanel({ tabId }: { tabId: string }) {
  const { executeQuery, state } = useSqlWorkbench();
  const closeCreatorTab = useCloseCreatorTab();

  // Schema da conexão/banco desta aba, usado só pra montar o dropdown de
  // "tabela referenciada" na foreign key com as tabelas reais em vez de
  // texto livre (evita erro de digitação só descoberto quando o MySQL
  // recusa o CREATE TABLE).
  const tab = state.tabs.find((t) => t.id === tabId);
  const [schema, setSchema] = useState<DatabaseSchema | null>(null);

  useEffect(() => {
    if (!tab?.connectionId || !state.activeDatabase) return;
    const params = new URLSearchParams({ connectionId: tab.connectionId, database: state.activeDatabase });
    fetch(`/api/sql/schema?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.schema) setSchema(data.schema);
      })
      .catch(() => {});
  }, [tab?.connectionId, state.activeDatabase]);

  const getTableColumns = useCallback(
    (tableName: string) => schema?.tables.find((t) => t.name === tableName)?.columns || [],
    [schema]
  );
  const [tableName, setTableName] = useState('');
  const [columns, setColumns] = useState<Column[]>([
    { id: '1', name: 'id', type: 'INT', length: '', primaryKey: true, notNull: true, unique: false, autoIncrement: true, defaultValue: '', comment: '' },
  ]);
  const [indexes, setIndexes] = useState<Index[]>([]);
  const [foreignKeys, setForeignKeys] = useState<ForeignKey[]>([]);
  const [activeTab, setActiveTab] = useState<'columns' | 'indexes' | 'foreignKeys' | 'sql'>('columns');
  const [creating, setCreating] = useState(false);

  const generateSQL = useCallback(() => {
    if (!tableName.trim()) return '';

    const colDefs = columns.map((col) => {
      let def = `\`${col.name}\` ${col.type}`;
      
      if (['CHAR', 'VARCHAR', 'DECIMAL', 'FLOAT', 'DOUBLE', 'ENUM', 'SET'].includes(col.type) && col.length) {
        def += `(${col.length})`;
      }
      
      if (col.notNull) def += ' NOT NULL';
      if (col.autoIncrement) def += ' AUTO_INCREMENT';
      if (col.defaultValue) def += ` DEFAULT ${col.defaultValue}`;
      if (col.comment) def += ` COMMENT '${col.comment}'`;
      
      return def;
    });

    const pkCols = columns.filter(c => c.primaryKey).map(c => `\`${c.name}\``);
    if (pkCols.length > 0) {
      colDefs.push(`PRIMARY KEY (${pkCols.join(', ')})`);
    }

    const uniqueCols = columns.filter(c => c.unique && !c.primaryKey).map(c => `\`${c.name}\``);
    uniqueCols.forEach(col => {
      colDefs.push(`UNIQUE KEY ${col.replace(/`/g, '')} (${col})`);
    });

    indexes.forEach(idx => {
      const cols = idx.columns.map(c => `\`${c}\``).join(', ');
      const unique = idx.unique ? 'UNIQUE ' : '';
      const type = idx.type ? ` USING ${idx.type}` : '';
      colDefs.push(`${unique}KEY \`${idx.name}\` (${cols})${type}`);
    });

    foreignKeys.forEach(fk => {
      const cols = fk.columns.map(c => `\`${c}\``).join(', ');
      const refCols = fk.refColumns.map(c => `\`${c}\``).join(', ');
      colDefs.push(
        `CONSTRAINT \`${fk.name}\` FOREIGN KEY (${cols}) REFERENCES \`${fk.refTable}\` (${refCols})` +
        ` ON DELETE ${fk.onDelete} ON UPDATE ${fk.onUpdate}`
      );
    });

    return `CREATE TABLE \`${tableName}\` (\n  ${colDefs.join(',\n  ')}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;
  }, [tableName, columns, indexes, foreignKeys]);

  const handleCreate = async () => {
    const sql = generateSQL();
    if (!sql) {
      toast.error('Nome da tabela é obrigatório');
      return;
    }

    setCreating(true);
    try {
      const success = await executeQuery(sql);
      if (success) {
        toast.success('Tabela criada com sucesso!');
        // Fecha esta aba e volta pra uma aba de query normal — igual ao
        // que acontece no MySQL Workbench depois de aplicar a criação.
        closeCreatorTab(tabId);
      } else {
        toast.error('Erro ao criar tabela — veja a aba de Mensagens da query ativa para detalhes');
      }
    } catch (err) {
      toast.error('Erro ao criar tabela');
    } finally {
      setCreating(false);
    }
  };

  const addColumn = () => {
    const newId = String(Date.now());
    setColumns([...columns, { id: newId, name: '', type: 'VARCHAR', length: '255', primaryKey: false, notNull: false, unique: false, autoIncrement: false, defaultValue: '', comment: '' }]);
  };

  const removeColumn = (id: string) => {
    if (columns.length <= 1) return;
    setColumns(columns.filter(c => c.id !== id));
  };

  const updateColumn = (id: string, field: keyof Column, value: any) => {
    setColumns(columns.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const addIndex = () => {
    const newId = String(Date.now());
    setIndexes([...indexes, { id: newId, name: `idx_${newId}`, columns: [], unique: false, type: 'BTREE' }]);
  };

  const removeIndex = (id: string) => {
    setIndexes(indexes.filter(i => i.id !== id));
  };

  const updateIndex = (id: string, field: keyof Index, value: any) => {
    setIndexes(indexes.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const addForeignKey = () => {
    const newId = String(Date.now());
    setForeignKeys([...foreignKeys, { id: newId, name: `fk_${newId}`, columns: [], refTable: '', refColumns: [], onDelete: 'RESTRICT', onUpdate: 'RESTRICT' }]);
  };

  const removeForeignKey = (id: string) => {
    setForeignKeys(foreignKeys.filter(fk => fk.id !== id));
  };

  const updateForeignKey = (id: string, field: keyof ForeignKey, value: any) => {
    setForeignKeys(foreignKeys.map(fk => {
      if (fk.id !== id) return fk;
      // Trocar a tabela referenciada invalida as colunas já escolhidas
      // (eram colunas da tabela antiga).
      if (field === 'refTable') return { ...fk, refTable: value, refColumns: [] };
      return { ...fk, [field]: value };
    }));
  };

  const copySQL = () => {
    const sql = generateSQL();
    navigator.clipboard.writeText(sql);
    toast.success('SQL copiado para a área de transferência');
  };

  return (
    <div className="h-full w-full flex flex-col bg-background">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <TableProperties className="h-5 w-5 text-primary" />
        <div>
          <div className="font-semibold text-sm">Criar Nova Tabela</div>
          <div className="text-xs text-muted-foreground">Defina a estrutura da tabela visualmente</div>
        </div>
      </div>

        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-border">
            {(['columns', 'indexes', 'foreignKeys', 'sql'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'columns' && 'Colunas'}
                {tab === 'indexes' && 'Índices'}
                {tab === 'foreignKeys' && 'Foreign Keys'}
                {tab === 'sql' && 'SQL Preview'}
              </button>
            ))}
          </div>

          {/* Table Name */}
          <div className="p-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <Label htmlFor="tableName" className="font-medium">Nome da Tabela:</Label>
              <Input
                id="tableName"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="minha_tabela"
                className="w-64"
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 overflow-auto">
            {activeTab === 'columns' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Colunas</h3>
                  <Button variant="outline" size="sm" onClick={addColumn}>
                    <Plus className="h-4 w-4 mr-1" /> Adicionar Coluna
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">#</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="w-24">Tamanho</TableHead>
                      <TableHead className="w-20 text-center">PK</TableHead>
                      <TableHead className="w-20 text-center">NN</TableHead>
                      <TableHead className="w-20 text-center">UQ</TableHead>
                      <TableHead className="w-24 text-center">AI</TableHead>
                      <TableHead>Default</TableHead>
                      <TableHead>Comentário</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {columns.map((col, idx) => (
                      <TableRow key={col.id}>
                        <TableCell className="text-center text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell>
                          <Input
                            value={col.name}
                            onChange={(e) => updateColumn(col.id, 'name', e.target.value)}
                            placeholder="nome"
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Select value={col.type} onValueChange={(v) => updateColumn(col.id, 'type', v)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              {MYSQL_TYPES.map((t) => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={col.length}
                            onChange={(e) => updateColumn(col.id, 'length', e.target.value)}
                            placeholder="255"
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={col.primaryKey}
                            onCheckedChange={(c) => updateColumn(col.id, 'primaryKey', c)}
                            className="mx-auto"
                          />
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={col.notNull}
                            onCheckedChange={(c) => updateColumn(col.id, 'notNull', c)}
                            className="mx-auto"
                          />
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={col.unique}
                            onCheckedChange={(c) => updateColumn(col.id, 'unique', c)}
                            className="mx-auto"
                          />
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={col.autoIncrement}
                            onCheckedChange={(c) => {
                              if (c) {
                                setColumns(columns.map(cc => cc.id === col.id ? { ...cc, autoIncrement: true, type: 'INT', primaryKey: true, notNull: true } : { ...cc, autoIncrement: false }));
                              } else {
                                updateColumn(col.id, 'autoIncrement', false);
                              }
                            }}
                            className="mx-auto"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={col.defaultValue}
                            onChange={(e) => updateColumn(col.id, 'defaultValue', e.target.value)}
                            placeholder="default"
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={col.comment}
                            onChange={(e) => updateColumn(col.id, 'comment', e.target.value)}
                            placeholder="comentário"
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => removeColumn(col.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {activeTab === 'indexes' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Índices</h3>
                  <Button variant="outline" size="sm" onClick={addIndex}>
                    <Plus className="h-4 w-4 mr-1" /> Adicionar Índice
                  </Button>
                </div>

                {indexes.map((idx) => (
                  <div key={idx.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-4">
                      <Input
                        value={idx.name}
                        onChange={(e) => updateIndex(idx.id, 'name', e.target.value)}
                        placeholder="Nome do índice"
                        className="w-48"
                      />
                      <Select value={idx.type} onValueChange={(v) => updateIndex(idx.id, 'type', v as any)}>
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {INDEX_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Label className="flex items-center gap-2">
                        <Checkbox
                          checked={idx.unique}
                          onCheckedChange={(c) => updateIndex(idx.id, 'unique', c)}
                        />
                        Único
                      </Label>
                      <Button variant="ghost" size="icon" onClick={() => removeIndex(idx.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>Colunas do Índice</Label>
                      {idx.columns.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhuma coluna selecionada</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {idx.columns.map((col, ci) => (
                            <span key={ci} className="px-2 py-1 bg-accent rounded text-sm">
                              {col}
                              <Button variant="ghost" size="icon" className="h-5 w-5 p-0 ml-1" onClick={() => {
                                const newCols = [...idx.columns];
                                newCols.splice(ci, 1);
                                updateIndex(idx.id, 'columns', newCols);
                              }}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </span>
                          ))}
                        </div>
                      )}
                      <Select onValueChange={(v) => {
                        if (v && !idx.columns.includes(v)) {
                          updateIndex(idx.id, 'columns', [...idx.columns, v]);
                        }
                      }}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Adicionar coluna..." />
                        </SelectTrigger>
                        <SelectContent>
                          {columns.map((c) => (
                            <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}

                {indexes.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Nenhum índice definido</p>
                )}
              </div>
            )}

            {activeTab === 'foreignKeys' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Foreign Keys</h3>
                  <Button variant="outline" size="sm" onClick={addForeignKey}>
                    <Plus className="h-4 w-4 mr-1" /> Adicionar FK
                  </Button>
                </div>

                {foreignKeys.map((fk) => (
                  <div key={fk.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Input
                        value={fk.name}
                        onChange={(e) => updateForeignKey(fk.id, 'name', e.target.value)}
                        placeholder="Nome da FK (ex: fk_users_company)"
                        className="w-64"
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeForeignKey(fk.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Coluna(s) desta tabela</Label>
                        <Select onValueChange={(v) => {
                          if (v && !fk.columns.includes(v)) {
                            updateForeignKey(fk.id, 'columns', [...fk.columns, v]);
                          }
                        }}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecionar coluna..." />
                          </SelectTrigger>
                          <SelectContent>
                            {columns.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        {fk.columns.map((col, ci) => (
                          <span key={ci} className="inline-flex items-center gap-1 px-2 py-1 bg-accent rounded text-sm mt-1">
                            {col}
                            <Button variant="ghost" size="icon" className="h-5 w-5 p-0" onClick={() => {
                              updateForeignKey(fk.id, 'columns', fk.columns.filter(c => c !== col));
                            }}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </span>
                        ))}
                      </div>

                      <div>
                        <Label>Tabela Referenciada</Label>
                        <Select
                          value={fk.refTable}
                          onValueChange={(v) => updateForeignKey(fk.id, 'refTable', v)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecionar tabela..." />
                          </SelectTrigger>
                          <SelectContent>
                            {(schema?.tables || []).map((t) => (
                              <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Coluna(s) Referenciada(s)</Label>
                        <Select onValueChange={(v) => {
                          if (v && !fk.refColumns.includes(v)) {
                            updateForeignKey(fk.id, 'refColumns', [...fk.refColumns, v]);
                          }
                        }}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={fk.refTable ? 'Selecionar coluna...' : 'Escolha a tabela primeiro'} />
                          </SelectTrigger>
                          <SelectContent>
                            {getTableColumns(fk.refTable).map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        {fk.refColumns.map((col, ci) => (
                          <span key={ci} className="inline-flex items-center gap-1 px-2 py-1 bg-accent rounded text-sm mt-1">
                            {col}
                            <Button variant="ghost" size="icon" className="h-5 w-5 p-0" onClick={() => {
                              updateForeignKey(fk.id, 'refColumns', fk.refColumns.filter(c => c !== col));
                            }}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </span>
                        ))}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label>ON DELETE</Label>
                        <Select value={fk.onDelete} onValueChange={(v) => updateForeignKey(fk.id, 'onDelete', v as any)}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FK_ACTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label>ON UPDATE</Label>
                        <Select value={fk.onUpdate} onValueChange={(v) => updateForeignKey(fk.id, 'onUpdate', v as any)}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FK_ACTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}

                {foreignKeys.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Nenhuma Foreign Key definida</p>
                )}
              </div>
            )}

            {activeTab === 'sql' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">SQL Preview</h3>
                  <Button variant="outline" size="sm" onClick={copySQL}>
                    <Copy className="h-4 w-4 mr-1" /> Copiar SQL
                  </Button>
                </div>
                <pre className="bg-muted p-4 rounded font-mono text-sm overflow-x-auto max-h-96">
{generateSQL() || '-- Defina o nome da tabela e colunas para gerar o SQL'}
                </pre>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
        <Button variant="outline" onClick={() => closeCreatorTab(tabId)}>
          Cancelar
        </Button>
        <Button onClick={handleCreate} disabled={creating || !tableName.trim()}>
          {creating ? 'Criando...' : 'Criar Tabela'}
        </Button>
      </div>
    </div>
  );
}