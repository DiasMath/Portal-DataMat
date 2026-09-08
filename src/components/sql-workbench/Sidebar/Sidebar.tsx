'use client';

import { useState, useEffect } from 'react';
import { useSqlWorkbench } from '@/contexts/SqlWorkbenchContext';
import { AddConnectionDialog } from './AddConnectionDialog';
import { TableCreatorDialog } from '@/components/sql-workbench/TableCreatorDialog';
import { ViewCreatorDialog } from '@/components/sql-workbench/ViewCreatorDialog';
import { RoutineCreatorDialog } from '@/components/sql-workbench/RoutineCreatorDialog';
import type { Connection, DatabaseSchema, TableInfo } from '@/types/sql-workbench';
import {
  Database,
  Table,
  Eye,
  FileCode,
  FunctionSquare,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Wifi,
  WifiOff,
  Loader2,
  Search,
  Edit3,
  Trash,
  PlusCircle,
  FilePlus,
  Pencil,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';

export function Sidebar() {
  const { state, dispatch, newTab, executeQuery, setActiveDatabase } = useSqlWorkbench();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
  const [showCreateTable, setShowCreateTable] = useState(false);
  const [showCreateView, setShowCreateView] = useState(false);
  const [showCreateProcedure, setShowCreateProcedure] = useState(false);
  const [showCreateFunction, setShowCreateFunction] = useState(false);

  const refreshActiveDatabaseSchema = () => {
    if (state.activeConnectionId && state.activeDatabase) {
      loadDatabaseSchema(state.activeConnectionId, state.activeDatabase, true);
    }
  };
  const [expandedConnections, setExpandedConnections] = useState<Set<string>>(new Set());
  const [expandedDatabases, setExpandedDatabases] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [tableContextMenu, setTableContextMenu] = useState<{ table: TableInfo; connectionId: string; x: number; y: number } | null>(null);
  const [dbContextMenu, setDbContextMenu] = useState<{ dbName: string; connectionId: string; x: number; y: number } | null>(null);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [databaseSchemas, setDatabaseSchemas] = useState<Record<string, DatabaseSchema>>({});
  const activeDatabase = state.activeDatabase;

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    setLoadingConnections(true);
    try {
      const res = await fetch('/api/sql/connections');
      const data = await res.json();
      if (data.connections && data.connections.length > 0) {
        dispatch({ type: 'SET_CONNECTIONS', payload: data.connections });
      }
    } catch (err) {
      console.error('Failed to fetch connections:', err);
    } finally {
      setLoadingConnections(false);
    }
  };

  const connectToDatabase = async (conn: Connection) => {
    setConnectingId(conn.id);
    try {
      // Não mandamos host/user/password aqui: a API já busca e descriptografa
      // a config salva a partir do connectionId. `conn` vem de
      // GET /api/sql/connections, que nunca inclui a senha (ver stripPassword),
      // então reenviar esses campos quebraria a reconexão depois de um reload.
      const res = await fetch('/api/sql/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId: conn.id }),
      });

      const data = await res.json();

      if (data.success) {
        dispatch({ type: 'UPDATE_CONNECTION', payload: { ...conn, status: 'connected' } });
        dispatch({ type: 'SET_ACTIVE_CONNECTION', payload: conn.id });

        const schemaRes = await fetch(`/api/sql/schema?connectionId=${conn.id}`);
        const schemaData = await schemaRes.json();
        if (schemaData.success && schemaData.schema) {
          dispatch({ type: 'SET_SCHEMA', payload: { connectionId: conn.id, schema: schemaData.schema } });
        }
      } else {
        dispatch({ type: 'UPDATE_CONNECTION', payload: { ...conn, status: 'error' } });
      }
    } catch (err) {
      console.error('Connection error:', err);
      dispatch({ type: 'UPDATE_CONNECTION', payload: { ...conn, status: 'error' } });
    } finally {
      setConnectingId(null);
    }
  };

  const deleteConnection = async (conn: Connection) => {
    if (!confirm(`Excluir conexão "${conn.name}"?`)) return;
    try {
      await fetch(`/api/sql/connections/${conn.id}`, { method: 'DELETE' });
      dispatch({ type: 'REMOVE_CONNECTION', payload: conn.id });
      toast.success('Conexão excluída');
    } catch (err) {
      console.error('Failed to delete connection:', err);
      toast.error('Erro ao excluir conexão');
    }
  };

  const duplicateConnection = async (conn: Connection) => {
    try {
      const res = await fetch('/api/sql/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${conn.name} (cópia)`,
          host: conn.host,
          port: conn.port,
          user: conn.user,
          // A senha não vem no objeto `conn` (nunca é enviada pelo GET), então
          // a cópia fica sem senha até o usuário editá-la e preenchê-la.
          password: '',
          database: conn.database,
          color: conn.color,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erro ao duplicar conexão');
        return;
      }
      dispatch({
        type: 'ADD_CONNECTION',
        payload: { ...conn, id: data.id, name: `${conn.name} (cópia)`, password: '', status: 'disconnected' },
      });
      toast.success('Conexão duplicada — defina a senha antes de conectar');
    } catch (err) {
      console.error('Failed to duplicate connection:', err);
      toast.error('Erro ao duplicar conexão');
    }
  };

  const toggleConnection = (id: string) => {
    const newSet = new Set(expandedConnections);
    if (newSet.has(id)) { newSet.delete(id); } else { newSet.add(id); }
    setExpandedConnections(newSet);
  };

  const toggleTable = (tableName: string) => {
    const newSet = new Set(expandedTables);
    if (newSet.has(tableName)) { newSet.delete(tableName); } else { newSet.add(tableName); }
    setExpandedTables(newSet);
  };

  const loadDatabaseSchema = async (connectionId: string, dbName: string, force = false) => {
    const key = `${connectionId}:${dbName}`;
    if (!force && databaseSchemas[key]) return;
    try {
      const schemaRes = await fetch(`/api/sql/schema?connectionId=${connectionId}&database=${encodeURIComponent(dbName)}`);
      const schemaData = await schemaRes.json();
      if (schemaData.success && schemaData.schema) {
        setDatabaseSchemas(prev => ({ ...prev, [key]: schemaData.schema }));
      }
    } catch (err) {
      console.error('Failed to load schema:', err);
    }
  };

  const toggleDatabase = async (dbName: string, connectionId: string) => {
    const newSet = new Set(expandedDatabases);
    const isExpanding = !newSet.has(dbName);
    if (isExpanding) {
      newSet.add(dbName);
    } else {
      newSet.delete(dbName);
    }
    setExpandedDatabases(newSet);

    if (isExpanding) {
      await loadDatabaseSchema(connectionId, dbName);
    }
  };

  const toggleSection = (sectionKey: string) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(sectionKey)) { newSet.delete(sectionKey); } else { newSet.add(sectionKey); }
    setExpandedSections(newSet);
  };

  const handleDbContextMenu = (e: React.MouseEvent, dbName: string, connectionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDbContextMenu({ dbName, connectionId, x: e.clientX, y: e.clientY });
  };

  const handleDbContextMenuAction = (action: string) => {
    if (!dbContextMenu) return;
    const { dbName, connectionId } = dbContextMenu;

    if (action === 'use') {
      setActiveDatabase(dbName);
    } else if (action === 'select') {
      if (state.activeTabId) {
        dispatch({
          type: 'UPDATE_TAB',
          payload: {
            id: state.activeTabId,
            updates: {
              sql: `USE \`${dbName}\`;`,
              connectionId,
              isDirty: true,
            },
          },
        });
      }
    }
    setDbContextMenu(null);
  };

  const handleTableContextMenu = (e: React.MouseEvent, table: TableInfo, connectionId: string) => {
    e.preventDefault();
    setTableContextMenu({ table, connectionId, x: e.clientX, y: e.clientY });
  };

  const handleTableContextMenuAction = (action: string) => {
    if (!tableContextMenu) return;
    const { table, connectionId } = tableContextMenu;
    let sql = '';

    switch (action) {
      case 'select':
        sql = `SELECT\n    *\nFROM ${table.name}\nLIMIT 100;`;
        break;
      case 'selectWhere': {
        const pk = table.columns.find(c => c.key === 'PRI');
        sql = pk
          ? `SELECT\n    *\nFROM ${table.name}\nWHERE ${pk.name} = ?\nLIMIT 100;`
          : `SELECT\n    *\nFROM ${table.name}\nLIMIT 100;`;
        break;
      }
      case 'insert': {
        const cols = table.columns.filter(c => c.extra !== 'auto_increment');
        const colNames = cols.map(c => c.name).join(', ');
        const placeholders = cols.map(() => '?').join(', ');
        sql = `INSERT INTO ${table.name}\n    (${colNames})\nVALUES\n    (${placeholders});`;
        break;
      }
      case 'update': {
        const pkCol = table.columns.find(c => c.key === 'PRI');
        sql = pkCol
          ? `UPDATE ${table.name}\nSET ...\nWHERE ${pkCol.name} = ?;`
          : `UPDATE ${table.name}\nSET ...\nWHERE ...;`;
        break;
      }
      case 'delete': {
        const pkDelete = table.columns.find(c => c.key === 'PRI');
        sql = pkDelete
          ? `DELETE FROM ${table.name}\nWHERE ${pkDelete.name} = ?;`
          : `DELETE FROM ${table.name}\nWHERE ...;`;
        break;
      }
      case 'count':
        sql = `SELECT\n    COUNT(*) AS total\nFROM ${table.name};`;
        break;
      case 'create': {
        const colDefs = table.columns.map(c => {
          let def = `    ${c.name} ${c.type}`;
          if (!c.nullable) def += ' NOT NULL';
          if (c.default) def += ` DEFAULT ${c.default}`;
          if (c.extra === 'auto_increment') def += ' AUTO_INCREMENT';
          return def;
        }).join(',\n');
        sql = `CREATE TABLE ${table.name}_backup\n(\n${colDefs}\n);`;
        break;
      }
    }

    if (sql) {
      if (action === 'select' || action === 'selectWhere') {
        newTab(table.name, sql, connectionId);
        setTimeout(() => executeQuery(sql), 100);
      } else {
        newTab(table.name, sql, connectionId);
      }
    }
    setTableContextMenu(null);
  };

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="p-2 border-b border-border flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">SQL Workbench</span>
        <button
          onClick={() => setShowAddDialog(true)}
          className="p-1 hover:bg-accent rounded transition-colors"
          title="Nova conexão"
        >
          <Plus className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {state.connections.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Nenhuma conexão.{' '}
            <button onClick={() => setShowAddDialog(true)} className="text-primary hover:underline">
              Adicionar
            </button>
          </div>
        ) : (
          <div className="py-1">
            {state.connections.map((conn) => {
              const schema = state.schemas[conn.id];
              const isExpanded = expandedConnections.has(conn.id);
              const isConnected = conn.status === 'connected';
              const isConnecting = connectingId === conn.id;

              return (
                <div key={conn.id}>
                  <div
                    className={`group flex items-center gap-1 px-2 py-1 hover:bg-accent cursor-pointer ${
                      state.activeConnectionId === conn.id ? 'bg-accent' : ''
                    }`}
                  >
                    <button
                      onClick={() => {
                        toggleConnection(conn.id);
                        if (!isConnected && !isConnecting) connectToDatabase(conn);
                      }}
                      className="p-0.5 hover:bg-accent/50 rounded"
                    >
                      {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                    </button>

                    <button
                      onClick={() => !isConnected && !isConnecting && connectToDatabase(conn)}
                      className="p-0.5 hover:bg-accent/50 rounded"
                      disabled={isConnected || isConnecting}
                    >
                      {isConnecting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                      ) : isConnected ? (
                        <Wifi className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </button>

                    <span
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: conn.color || '#6366f1' }}
                      title="Cor da conexão"
                    />
                    <Database className="h-4 w-4 text-primary" />

                    <span className="flex-1 text-sm truncate text-foreground">{conn.name}</span>

                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingConnection(conn); setShowAddDialog(true); }}
                        className="p-0.5 hover:bg-accent rounded"
                        title="Editar conexão"
                      >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); duplicateConnection(conn); }}
                        className="p-0.5 hover:bg-accent rounded"
                        title="Duplicar conexão"
                      >
                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteConnection(conn); }}
                        className="p-0.5 hover:bg-destructive/20 rounded"
                        title="Excluir conexão"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </button>
                    </div>
                  </div>

                  {isExpanded && schema && schema.databases && schema.databases.length > 0 && (
                    <div className="ml-4">
                      <div className="flex items-center gap-1 px-2 py-0.5 text-xs text-muted-foreground uppercase tracking-wider">
                        <Database className="h-3 w-3" />
                        Bancos ({schema.databases.length})
                      </div>
                      {schema.databases.map((dbName) => {
                        const isDbExpanded = expandedDatabases.has(dbName);
                        const dbKey = `${conn.id}:${dbName}`;
                        const dbSchema = databaseSchemas[dbKey];
                        const sectionTables = `${dbKey}:tables`;
                        const sectionViews = `${dbKey}:views`;
                        const sectionProcedures = `${dbKey}:procedures`;
                        const sectionFunctions = `${dbKey}:functions`;
                        const isTablesExpanded = expandedSections.has(sectionTables);
                        const isViewsExpanded = expandedSections.has(sectionViews);
                        const isProceduresExpanded = expandedSections.has(sectionProcedures);
                        const isFunctionsExpanded = expandedSections.has(sectionFunctions);

                        return (
                          <div key={dbName}>
                            <div
                              onContextMenu={(e) => handleDbContextMenu(e, dbName, conn.id)}
                              className={`flex items-center gap-1 px-2 py-0.5 hover:bg-accent cursor-pointer ${
                                activeDatabase === dbName ? 'bg-accent/50' : ''
                              }`}
                            >
                              <span
                                onClick={(e) => { e.stopPropagation(); toggleDatabase(dbName, conn.id); }}
                                className="flex items-center"
                              >
                                {isDbExpanded ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                              </span>
                              <Database className="h-3.5 w-3.5 text-primary" />
                              <span
                                onClick={(e) => { e.stopPropagation(); toggleDatabase(dbName, conn.id); }}
                                onDoubleClick={(e) => { e.stopPropagation(); setActiveDatabase(dbName); }}
                                title="Clique duplo para tornar este o banco ativo"
                                className={`text-sm truncate select-none ${activeDatabase === dbName ? 'text-yellow-text font-medium' : 'text-foreground'}`}
                              >
                                {dbName}
                              </span>
                            </div>
                            {isDbExpanded && dbSchema && (
                              <div className="ml-4">
                                <div>
                                  <div
                                    onClick={() => toggleSection(sectionTables)}
                                    className="flex items-center gap-1 px-2 py-0.5 text-xs text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-accent/50"
                                  >
                                    {isTablesExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                    <Table className="h-3 w-3" />
                                    Tables ({dbSchema.tables.length})
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setShowCreateTable(true); }}
                                      className="ml-auto p-0.5 hover:bg-accent rounded transition-colors"
                                      title="Criar nova tabela"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </button>
                                  </div>
                                    {isTablesExpanded && dbSchema.tables.map((table) => (
                                      <div key={table.name}>
                                        <div
                                          className="flex items-center gap-1 px-2 py-0.5 hover:bg-accent cursor-pointer"
                                          onClick={() => toggleTable(table.name)}
                                          onContextMenu={(e) => handleTableContextMenu(e, table, conn.id)}
                                        >
                                          {expandedTables.has(table.name) ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                                          <Table className="h-3.5 w-3.5 text-foreground" />
                                          <span className="text-sm text-foreground truncate">{table.name}</span>
                                        </div>
                                        {expandedTables.has(table.name) && (
                                          <div className="ml-6">
                                            {table.columns.map((col) => (
                                              <div
                                                key={col.name}
                                                className="flex items-center gap-1 px-2 py-0.5 text-xs hover:bg-accent/50"
                                                title={`${col.type}${col.nullable ? '' : ' NOT NULL'}${col.key === 'PRI' ? ' PRIMARY KEY' : ''}${col.extra === 'auto_increment' ? ' AUTO_INCREMENT' : ''}`}
                                              >
                                                <span className="w-2 h-2 rounded-full bg-primary/50" />
                                                <span className="text-foreground truncate">{col.name}</span>
                                                <span className="text-muted-foreground truncate">{col.type}</span>
                                                {col.key === 'PRI' && <span className="text-xs text-yellow-500">PK</span>}
                                                {col.extra === 'auto_increment' && <span className="text-xs text-blue-500">AI</span>}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                <div>
                                  <div
                                    onClick={() => toggleSection(sectionViews)}
                                    className="flex items-center gap-1 px-2 py-0.5 text-xs text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-accent/50"
                                  >
                                    {isViewsExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                    <Eye className="h-3 w-3" />
                                    Views ({dbSchema.views.length})
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setShowCreateView(true); }}
                                      className="ml-auto p-0.5 hover:bg-accent rounded transition-colors"
                                      title="Criar nova view"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </button>
                                  </div>
                                  {isViewsExpanded && dbSchema.views.map((view) => (
                                    <div key={view.name} className="flex items-center gap-1 px-2 py-0.5 ml-4 hover:bg-accent cursor-pointer">
                                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                      <span className="text-sm text-foreground">{view.name}</span>
                                    </div>
                                  ))}
                                </div>
                                <div>
                                  <div
                                    onClick={() => toggleSection(sectionProcedures)}
                                    className="flex items-center gap-1 px-2 py-0.5 text-xs text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-accent/50"
                                  >
                                    {isProceduresExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                    <FileCode className="h-3 w-3" />
                                    Procedures ({dbSchema.procedures.length})
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setShowCreateProcedure(true); }}
                                      className="ml-auto p-0.5 hover:bg-accent rounded transition-colors"
                                      title="Criar nova procedure"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </button>
                                  </div>
                                  {isProceduresExpanded && dbSchema.procedures.map((proc) => (
                                    <div key={proc.name} className="flex items-center gap-1 px-2 py-0.5 ml-4 hover:bg-accent cursor-pointer">
                                      <FileCode className="h-3.5 w-3.5 text-yellow-500" />
                                      <span className="text-sm text-foreground">{proc.name}</span>
                                    </div>
                                  ))}
                                </div>
                                <div>
                                  <div
                                    onClick={() => toggleSection(sectionFunctions)}
                                    className="flex items-center gap-1 px-2 py-0.5 text-xs text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-accent/50"
                                  >
                                    {isFunctionsExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                    <FunctionSquare className="h-3 w-3" />
                                    Functions ({dbSchema.functions.length})
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setShowCreateFunction(true); }}
                                      className="ml-auto p-0.5 hover:bg-accent rounded transition-colors"
                                      title="Criar nova function"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </button>
                                  </div>
                                  {isFunctionsExpanded && dbSchema.functions.map((func) => (
                                    <div key={func.name} className="flex items-center gap-1 px-2 py-0.5 ml-4 hover:bg-accent cursor-pointer">
                                      <FunctionSquare className="h-3.5 w-3.5 text-green-500" />
                                      <span className="text-sm text-foreground">{func.name}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddConnectionDialog
        open={showAddDialog}
        editingConnection={editingConnection}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) setEditingConnection(null);
        }}
        onSave={(conn) => {
          if (editingConnection) {
            dispatch({ type: 'UPDATE_CONNECTION', payload: conn });
          } else {
            dispatch({ type: 'ADD_CONNECTION', payload: { ...conn, status: 'disconnected' } });
          }
          setShowAddDialog(false);
          setEditingConnection(null);
        }}
      />

      <TableCreatorDialog
        open={showCreateTable}
        onOpenChange={setShowCreateTable}
        onSave={refreshActiveDatabaseSchema}
      />

      <ViewCreatorDialog
        open={showCreateView}
        onOpenChange={setShowCreateView}
        onCreated={refreshActiveDatabaseSchema}
      />

      <RoutineCreatorDialog
        open={showCreateProcedure}
        onOpenChange={setShowCreateProcedure}
        kind="PROCEDURE"
        onCreated={refreshActiveDatabaseSchema}
      />

      <RoutineCreatorDialog
        open={showCreateFunction}
        onOpenChange={setShowCreateFunction}
        kind="FUNCTION"
        onCreated={refreshActiveDatabaseSchema}
      />

      {dbContextMenu && (
        <div className="fixed inset-0 z-50" onClick={() => setDbContextMenu(null)}>
          <div
            className="fixed bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[180px] animate-in fade-in zoom-in-95"
            style={{ left: dbContextMenu.x, top: dbContextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent flex items-center gap-2"
              onClick={() => handleDbContextMenuAction('use')}
            >
              <Database className="h-4 w-4 text-yellow-text" /> Usar schema
            </button>
            <button
              className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent flex items-center gap-2"
              onClick={() => handleDbContextMenuAction('select')}
            >
              <FileCode className="h-4 w-4" /> Gerar USE {dbContextMenu.dbName}
            </button>
          </div>
        </div>
      )}

      {tableContextMenu && (
        <div className="fixed inset-0 z-50" onClick={() => setTableContextMenu(null)}>
          <div
            className="fixed bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[180px] animate-in fade-in zoom-in-95"
            style={{ left: tableContextMenu.x, top: tableContextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent flex items-center gap-2" onClick={() => handleTableContextMenuAction('select')}>
              <Search className="h-4 w-4" /> SELECT * FROM
            </button>
            <button className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent flex items-center gap-2" onClick={() => handleTableContextMenuAction('selectWhere')}>
              <Search className="h-4 w-4" /> SELECT WHERE
            </button>
            <div className="h-px bg-border my-1" />
            <button className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent flex items-center gap-2" onClick={() => handleTableContextMenuAction('insert')}>
              <PlusCircle className="h-4 w-4" /> INSERT INTO
            </button>
            <button className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent flex items-center gap-2" onClick={() => handleTableContextMenuAction('update')}>
              <Edit3 className="h-4 w-4" /> UPDATE
            </button>
            <button className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent flex items-center gap-2" onClick={() => handleTableContextMenuAction('delete')}>
              <Trash className="h-4 w-4" /> DELETE FROM
            </button>
            <div className="h-px bg-border my-1" />
            <button className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent flex items-center gap-2" onClick={() => handleTableContextMenuAction('count')}>
              <FileCode className="h-4 w-4" /> COUNT(*)
            </button>
            <button className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent flex items-center gap-2" onClick={() => handleTableContextMenuAction('create')}>
              <FilePlus className="h-4 w-4" /> Generate CREATE
            </button>
            <div className="h-px bg-border my-1" />
            <button className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent flex items-center gap-2" onClick={() => { setTableContextMenu(null); setShowCreateTable(true); }}>
              <Plus className="h-4 w-4" /> Criar nova tabela
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
