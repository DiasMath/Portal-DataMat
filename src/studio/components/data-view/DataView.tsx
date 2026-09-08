'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useStudio } from '../../store/StudioContext';
import { getDataModel } from '../../lib/data-model-utils';
import { MOCK_TABLE_ROWS, VENDAS_DEFAULT_LIMIT } from '../../lib/mocks/mock-data';
import { toggleSet } from '../../lib/set-utils';
import { getTypeIcon } from '../shared/type-icons';
import {
  Table, Search, ChevronDown, ChevronUp, ArrowUpDown, ArrowUp, ArrowDown,
  Loader2, Download, Check, Minus, FileText, EyeOff, Filter, X, Copy, ExternalLink,
} from 'lucide-react';
import { TableVirtuoso } from 'react-virtuoso';
import type { FieldSchema } from '../../types/dashboard';
import { exportTabularData } from '@/lib/export/tabular-export';

interface RowData {
  [key: string]: unknown;
}

interface ColumnWidths {
  [fieldName: number]: number;
}

interface ColumnFilter {
  values: Set<string>;
  searchTerm: string;
}

const DEFAULT_COL_WIDTH = 150;
const MIN_COL_WIDTH = 60;

function rowToTsv(row: RowData, fields: FieldSchema[]): string {
  return fields.map(f => String(row[f.name] ?? '')).join('\t');
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

export function DataView() {
  const { state } = useStudio();
  const dataModel = getDataModel(state.dataModel);
  const connectionId = dataModel?.connectionId || '';
  const [selectedTableName, setSelectedTableName] = useState<string | null>(null);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const [rows, setRows] = useState<RowData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('ASC');

  const [selectedRowIndices, setSelectedRowIndices] = useState<Set<number>>(new Set());
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [columnWidths, setColumnWidths] = useState<ColumnWidths>({});
  const resizingColRef = useRef<{ fieldIndex: number; startX: number; startWidth: number } | null>(null);

  const [columnFilters, setColumnFilters] = useState<Record<string, ColumnFilter>>({});
  const [openFilterField, setOpenFilterField] = useState<string | null>(null);
  const [filterPosition, setFilterPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const filterInputRef = useRef<HTMLInputElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; row: RowData; field: FieldSchema } | null>(null);

  const selectedTable = dataModel.tables.find(t => t.name === selectedTableName);

  const getColWidth = useCallback((fieldIndex: number) => {
    return columnWidths[fieldIndex] ?? DEFAULT_COL_WIDTH;
  }, [columnWidths]);

  const toggleExpand = useCallback((tableName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedTables(prev => toggleSet(prev, tableName));
  }, []);

  const filteredTables = dataModel.tables.filter(t =>
    t.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchRows = useCallback(async () => {
    if (!selectedTableName) {
      setRows([]);
      setTotalCount(0);
      return;
    }

    if (!connectionId) {
      let mockRows = MOCK_TABLE_ROWS[selectedTableName] || [];
      const isVendas = selectedTableName === 'fato_vendas';
      const defaultLimit = isVendas ? VENDAS_DEFAULT_LIMIT : undefined;

      if (sortField) {
        mockRows = [...mockRows].sort((a, b) => {
          const aVal = a[sortField];
          const bVal = b[sortField];
          if (aVal == null && bVal == null) return 0;
          if (aVal == null) return 1;
          if (bVal == null) return -1;
          if (typeof aVal === 'number' && typeof bVal === 'number') {
            return sortDirection === 'ASC' ? aVal - bVal : bVal - aVal;
          }
          const cmp = String(aVal).localeCompare(String(bVal), 'pt-BR');
          return sortDirection === 'ASC' ? cmp : -cmp;
        });
      }

      setTotalCount(mockRows.length);
      setRows(defaultLimit ? mockRows.slice(0, defaultLimit) : mockRows);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        connectionId,
        table: selectedTableName,
        offset: '0',
        limit: '500',
      });
      if (sortField) {
        params.set('sort', sortField);
        params.set('dir', sortDirection);
      }

      const response = await fetch(`/api/studio/rows?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao buscar dados');
      }

      setRows(data.rows || []);
      setTotalCount(data.totalCount || 0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTableName, connectionId, sortField, sortDirection]);

  useEffect(() => {
    fetchRows();
    setSelectedRowIndices(new Set());
    setColumnFilters({});
    setOpenFilterField(null);
  }, [fetchRows]);

  useEffect(() => {
    if (openFilterField && filterInputRef.current) {
      filterInputRef.current.focus();
    }
  }, [openFilterField]);

  useEffect(() => {
    if (!openFilterField) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node)) {
        setOpenFilterField(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openFilterField]);

  const filteredRows = useMemo(() => {
    const activeFilters = Object.entries(columnFilters).filter(([, f]) => f.values.size > 0);
    if (activeFilters.length === 0) return rows;
    return rows.filter(row => {
      return activeFilters.every(([fieldName, filter]) => {
        const val = String(row[fieldName] ?? '');
        return filter.values.has(val);
      });
    });
  }, [rows, columnFilters]);

  const handleSort = (fieldName: string) => {
    if (sortField === fieldName) {
      if (sortDirection === 'ASC') {
        setSortDirection('DESC');
      } else {
        setSortField(null);
        setSortDirection('ASC');
      }
    } else {
      setSortField(fieldName);
      setSortDirection('ASC');
    }
  };

  const handleFilterToggleValue = useCallback((fieldName: string, value: string) => {
    setColumnFilters(prev => {
      const existing = prev[fieldName] || { values: new Set<string>(), searchTerm: '' };
      const newValues = new Set(existing.values);
      if (newValues.has(value)) newValues.delete(value);
      else newValues.add(value);
      if (newValues.size === 0) {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      }
      return { ...prev, [fieldName]: { ...existing, values: newValues } };
    });
  }, []);

  const handleFilterClear = useCallback((fieldName?: string) => {
    if (fieldName) {
      setColumnFilters(prev => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    } else {
      setColumnFilters({});
    }
  }, []);

  const handleFilterDone = useCallback(() => {
    setOpenFilterField(null);
  }, []);

  const handleSelectRow = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRowIndices(prev => {
      const next = new Set(prev);
      if (e.shiftKey && prev.size > 0) {
        const lastSelected = Array.from(prev).pop()!;
        const start = Math.min(lastSelected, index);
        const end = Math.max(lastSelected, index);
        for (let i = start; i <= end; i++) next.add(i);
      } else if (e.ctrlKey || e.metaKey) {
        if (next.has(index)) next.delete(index);
        else next.add(index);
      } else {
        if (next.has(index) && next.size === 1) next.clear();
        else { next.clear(); next.add(index); }
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedRowIndices(prev => {
      if (prev.size === filteredRows.length) return new Set();
      return new Set(filteredRows.map((_, i) => i));
    });
  }, [filteredRows.length]);

  const handleCopySelectedRows = useCallback(() => {
    if (!selectedTable) return;
    const fields = selectedTable.fields;
    const header = fields.map(f => f.label || f.name).join('\t');
    const selectedRows = selectedRowIndices.size > 0
      ? filteredRows.filter((_, i) => selectedRowIndices.has(i))
      : filteredRows;
    const body = selectedRows.map(row => rowToTsv(row, fields)).join('\n');
    copyToClipboard(header + '\n' + body);
  }, [selectedTable, filteredRows, selectedRowIndices]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        const active = document.activeElement;
        const isInput = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
        if (isInput) return;
        if (selectedRowIndices.size > 0) {
          e.preventDefault();
          handleCopySelectedRows();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedRowIndices, handleCopySelectedRows]);

  const handleExport = useCallback((format: 'csv' | 'json' | 'xlsx') => {
    if (!selectedTable || filteredRows.length === 0) return;
    const fields = selectedTable.fields;
    const selectedRows = selectedRowIndices.size > 0
      ? filteredRows.filter((_, i) => selectedRowIndices.has(i))
      : filteredRows;

    // Usa o label amigável do campo (quando existir) como cabeçalho, igual
    // ao comportamento anterior — só remapeia as chaves antes de delegar
    // pro exportador compartilhado.
    const columns = fields.map(f => f.label || f.name);
    const rows = selectedRows.map(row => {
      const mapped: Record<string, unknown> = {};
      fields.forEach(f => { mapped[f.label || f.name] = row[f.name]; });
      return mapped;
    });

    void exportTabularData(
      { columns, rows },
      format,
      { baseFilename: selectedTable.name, tableName: selectedTable.name, csvDelimiter: ';' }
    );
    setShowExportMenu(false);
  }, [selectedTable, filteredRows, selectedRowIndices]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
      if (contextMenu && !(e.target as Element)?.closest('[data-context-menu]')) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenu]);

  const handleColResizeStart = useCallback((fieldIndex: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startWidth = getColWidth(fieldIndex);
    resizingColRef.current = { fieldIndex, startX: e.clientX, startWidth };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizingColRef.current) return;
      const dx = moveEvent.clientX - resizingColRef.current.startX;
      const newWidth = Math.max(MIN_COL_WIDTH, resizingColRef.current.startWidth + dx);
      setColumnWidths(prev => ({ ...prev, [resizingColRef.current!.fieldIndex]: newWidth }));
    };

    const handleMouseUp = () => {
      resizingColRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [getColWidth]);

  const handleColReset = useCallback((fieldIndex: number) => {
    setColumnWidths(prev => {
      const next = { ...prev };
      delete next[fieldIndex];
      return next;
    });
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent, row: RowData, field: FieldSchema) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, row, field });
  }, []);

  const handleDrillThrough = useCallback((row: RowData, field: FieldSchema) => {
    if (!selectedTable || !dataModel) return;
    const rel = dataModel.relationships?.find(
      r => r.fromTable === selectedTable.name && r.fromField === field.name && r.active
    );
    if (!rel) return;

    const targetTable = dataModel.tables.find(t => t.name === rel.toTable);
    if (!targetTable) return;

    const fkValue = row[field.name];
    setSelectedTableName(rel.toTable);
    setContextMenu(null);

    setTimeout(() => {
      const targetRows = MOCK_TABLE_ROWS[rel.toTable] || [];
      const matchIndex = targetRows.findIndex(r => r[rel.toField] === fkValue);
      if (matchIndex >= 0) {
        setSelectedRowIndices(new Set([matchIndex]));
      }
    }, 100);
  }, [selectedTable, dataModel]);

  const sortedFields = useMemo(() => selectedTable?.fields || [], [selectedTable]);

  const allSelected = filteredRows.length > 0 && selectedRowIndices.size === filteredRows.length;
  const someSelected = selectedRowIndices.size > 0 && selectedRowIndices.size < filteredRows.length;

  const hasActiveFilters = Object.keys(columnFilters).length > 0;

  const getDrillTarget = useMemo(() => {
    if (!contextMenu || !selectedTable || !dataModel) return null;
    const rel = dataModel.relationships?.find(
      r => r.fromTable === selectedTable.name && r.fromField === contextMenu.field.name && r.active
    );
    if (!rel) return null;
    const targetTable = dataModel.tables.find(t => t.name === rel.toTable);
    return { rel, targetTable };
  }, [contextMenu, selectedTable, dataModel]);

  const getFilterValues = useCallback((fieldName: string): string[] => {
    const values = new Set<string>();
    rows.forEach(r => {
      const val = r[fieldName];
      if (val !== null && val !== undefined && val !== '') {
        values.add(String(val));
      }
    });
    return Array.from(values).sort();
  }, [rows]);

  const getFilteredFilterValues = useCallback((fieldName: string): string[] => {
    const allValues = getFilterValues(fieldName);
    const search = columnFilters[fieldName]?.searchTerm || '';
    if (!search) return allValues;
    return allValues.filter(v => v.toLowerCase().includes(search.toLowerCase()));
  }, [getFilterValues, columnFilters]);

  return (
    <div className="flex-1 flex bg-neutral-900 overflow-hidden">
      <div className="w-56 shrink-0 border-r border-neutral-700 bg-neutral-900 flex flex-col">
        <div className="px-3 py-2 border-b border-neutral-700">
          <div className="flex items-center gap-2 mb-2">
            <Table size={14} className="text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">TABELAS</span>
          </div>
          <div className="relative">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar tabelas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-6 pr-2 py-1 text-xs bg-neutral-800 rounded border border-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-1 scrollbar-dark">
          {filteredTables.map(table => {
            const isExpanded = expandedTables.has(table.name);
            const isSelected = selectedTableName === table.name;
            const hasAnyHidden = table.fields.some(f => f.hidden);

            return (
              <div key={table.name}>
                <div className={`flex items-center ${isSelected ? 'bg-amber-600/20' : 'hover:bg-neutral-800'}`}>
                  <button
                    onClick={(e) => toggleExpand(table.name, e)}
                    className="p-1 rounded shrink-0"
                    title="Expandir/Recolher"
                  >
                    {isExpanded ? <ChevronUp size={12} className="text-neutral-500" /> : <ChevronDown size={12} className="text-neutral-500" />}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTableName(table.name);
                      setSortField(null);
                      setSortDirection('ASC');
                    }}
                    className={`flex-1 flex items-center gap-1.5 px-2 py-1.5 text-sm transition-colors text-left
                      ${isSelected ? 'text-amber-400' : 'text-neutral-400 hover:text-neutral-300'}`}
                  >
                    <Table size={12} className={table.type === 'fact' ? 'text-blue-400' : 'text-amber-300'} />
                    <span className="font-medium truncate">{table.label}</span>
                    {hasAnyHidden && <EyeOff size={10} className="text-neutral-600" />}
                    <span className="ml-auto text-[10px] text-muted-foreground">{table.fields.length}</span>
                  </button>
                </div>

                {isExpanded && (
                  <div className="ml-5 border-l border-neutral-700 pl-1 py-0.5">
                    {table.fields.map(field => (
                      <div
                        key={field.name}
                        className={`flex items-center gap-1.5 px-2 py-0.5 text-sm rounded ${
                          field.hidden ? 'text-neutral-600 italic' : 'text-neutral-400 hover:bg-neutral-800/50'
                        }`}
                      >
                        {field.hidden ? <EyeOff size={9} className="text-neutral-600" /> : getTypeIcon(field.type, 9)}
                        <span className="truncate">{field.label || field.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedTable ? (
          <>
            <div className="px-4 py-2 border-b border-neutral-700 flex items-center gap-2">
              <Table size={14} className={selectedTable.type === 'fact' ? 'text-blue-400' : 'text-amber-300'} />
              <span className="text-sm font-medium text-neutral-300">{selectedTable.label}</span>
              <span className="text-[10px] text-muted-foreground bg-neutral-800 px-1.5 py-0.5 rounded">
                {sortedFields.length} colunas
              </span>
              <span className="text-[10px] text-muted-foreground bg-neutral-800 px-1.5 py-0.5 rounded">
                {isLoading ? '...' : `${totalCount} linhas`}
              </span>
              {!connectionId && (
                <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                  Sem conexão
                </span>
              )}
              {hasActiveFilters && (
                <button
                  onClick={() => handleFilterClear()}
                  className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded hover:bg-amber-400/20 flex items-center gap-1"
                >
                  <X size={10} />
                  Limpar filtros
                </button>
              )}

              <div className="flex-1" />

              {selectedRowIndices.size > 0 && (
                <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                  {selectedRowIndices.size} selecionada{selectedRowIndices.size > 1 ? 's' : ''}
                </span>
              )}

              <div className="relative" ref={exportMenuRef}>
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="p-1.5 rounded hover:bg-neutral-700 text-muted-foreground hover:text-neutral-300 transition-colors"
                  title="Exportar dados"
                >
                  <Download size={14} />
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-neutral-800 border border-neutral-700 rounded shadow-lg z-50 py-1 min-w-[140px]">
                    <button
                      onClick={() => handleExport('csv')}
                      className="w-full px-3 py-1.5 text-xs text-left text-neutral-300 hover:bg-neutral-700 flex items-center gap-2"
                    >
                      <FileText size={12} className="text-green-400" />
                      CSV
                    </button>
                    <button
                      onClick={() => handleExport('json')}
                      className="w-full px-3 py-1.5 text-xs text-left text-neutral-300 hover:bg-neutral-700 flex items-center gap-2"
                    >
                      <FileText size={12} className="text-amber-400" />
                      JSON
                    </button>
                    <button
                      onClick={() => handleExport('xlsx')}
                      className="w-full px-3 py-1.5 text-xs text-left text-neutral-300 hover:bg-neutral-700 flex items-center gap-2"
                    >
                      <FileText size={12} className="text-blue-400" />
                      XLSX
                    </button>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/30 text-xs text-red-400">
                {error}
              </div>
            )}

            <div className="flex-1 overflow-auto scrollbar-dark">
              {isLoading ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <Loader2 size={20} className="animate-spin mr-2" />
                  <span className="text-sm">Carregando dados...</span>
                </div>
              ) : filteredRows.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Table size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">
                      {hasActiveFilters ? 'Nenhum resultado para os filtros aplicados' : connectionId ? 'Nenhum dado encontrado' : 'Conecte-se a um banco de dados para visualizar os dados'}
                    </p>
                  </div>
                </div>
              ) : (
                <TableVirtuoso
                  style={{ height: '100%' }}
                  data={filteredRows}
                  fixedHeaderContent={() => (
                    <tr>
                      <th
                        className="px-2 py-2 text-center font-medium text-white select-none relative border-r border-neutral-700"
                        style={{ background: '#262626', width: 36, minWidth: 36 }}
                      >
                        <button
                          onClick={handleSelectAll}
                          className="w-4 h-4 rounded border border-neutral-600 flex items-center justify-center hover:border-amber-500 transition-colors"
                          title="Selecionar todas"
                        >
                          {allSelected ? <Check size={10} className="text-amber-400" /> : someSelected ? <Minus size={10} className="text-amber-400" /> : null}
                        </button>
                      </th>
                      {sortedFields.map((field, fieldIndex) => {
                        const isSorted = sortField === field.name;
                        const hasFilter = (columnFilters[field.name]?.values.size ?? 0) > 0;
                        return (
                          <th
                            key={field.name}
                            className="px-3 py-2 text-center font-medium text-white whitespace-nowrap select-none relative border-r border-neutral-700 cursor-pointer hover:bg-neutral-700/30"
                            style={{ background: '#262626', width: getColWidth(fieldIndex), minWidth: MIN_COL_WIDTH }}
                            onClick={() => handleSort(field.name)}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-2 min-w-0 flex-1 justify-center">
                                {getTypeIcon(field.type)}
                                <span className="truncate">{field.label || field.name}</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {isSorted ? (
                                  sortDirection === 'ASC' ? (
                                    <ArrowUp size={10} className="text-amber-400" />
                                  ) : (
                                    <ArrowDown size={10} className="text-amber-400" />
                                  )
                                ) : (
                                  <ArrowUpDown size={10} className="text-neutral-500" />
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (openFilterField === field.name) {
                                      setOpenFilterField(null);
                                    } else {
                                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                      setFilterPosition({ x: rect.left, y: rect.bottom + 4 });
                                      setOpenFilterField(field.name);
                                    }
                                  }}
                                  className={`p-0.5 rounded transition-colors ${
                                    hasFilter
                                      ? 'text-amber-400'
                                      : 'text-neutral-500 hover:text-neutral-300'
                                  }`}
                                  title="Filtrar"
                                >
                                  <Filter size={10} />
                                </button>
                              </div>
                            </div>
                            <div
                              className="absolute right-0 top-0 bottom-0 w-[5px] cursor-col-resize hover:bg-amber-500/40"
                              onMouseDown={(e) => handleColResizeStart(fieldIndex, e)}
                              onDoubleClick={(e) => { e.stopPropagation(); handleColReset(fieldIndex); }}
                              title="Arrastar para redimensionar / Duplo-clique para restaurar"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </th>
                        );
                      })}
                    </tr>
                  )}
                  itemContent={(index, row) => (
                    <>
                      <td
                        className="px-2 py-1.5 border-r border-neutral-700"
                        style={{ width: 36, minWidth: 36, userSelect: 'text', cursor: 'text' as const }}
                      >
                        <button
                          onClick={(e) => handleSelectRow(index, e)}
                          className="w-4 h-4 rounded border border-neutral-600 flex items-center justify-center hover:border-amber-500 transition-colors"
                        >
                          {selectedRowIndices.has(index) && <Check size={10} className="text-amber-400" />}
                        </button>
                      </td>
                      {sortedFields.map((field, fieldIndex) => {
                        const raw = row[field.name];
                        const isEmpty = raw === null || raw === undefined || raw === '';
                        const isNull = raw === null || raw === undefined;
                        return (
                          <td
                            key={field.name}
                            className={`px-3 py-1.5 whitespace-nowrap text-sm text-center border-r border-neutral-700 ${
                              isEmpty
                                ? 'bg-amber-500/10 text-amber-400 italic'
                                : 'text-white'
                            }`}
                            style={{ width: getColWidth(fieldIndex), minWidth: MIN_COL_WIDTH, userSelect: 'text', cursor: 'text' as const }}
                            onContextMenu={(e) => handleContextMenu(e, row, field)}
                          >
                            {isNull ? 'null' : String(raw)}
                          </td>
                        );
                      })}
                    </>
                  )}
                  components={{
                    Table: (props) => <table {...props} className="text-sm" style={{ borderCollapse: 'collapse' }} />,
                    TableHead: React.forwardRef((props, ref) => <thead {...props} ref={ref} className="sticky top-0 bg-neutral-800 border-b border-neutral-700 z-10" />),
                    TableBody: React.forwardRef((props, ref) => <tbody {...props} ref={ref} />),
                    TableRow: (props) => {
                      const index = (props as any)['data-index'] as number | undefined;
                      const isSelected = index !== undefined && selectedRowIndices.has(index);
                      return <tr {...props} className={`border-b border-neutral-700 ${isSelected ? 'bg-amber-500/10' : 'hover:bg-neutral-800/50'}`} />;
                    },
                  }}
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Table size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Selecione uma tabela para visualizar os dados</p>
            </div>
          </div>
        )}
      </div>

      {openFilterField && (
        <div
          ref={filterPanelRef}
          className="fixed z-[100]"
          style={{ left: filterPosition.x, top: filterPosition.y }}
        >
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl p-0 w-[320px] max-h-[480px] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-700">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-amber-400" />
                <span className="text-sm font-medium text-neutral-200">
                  {selectedTable?.fields.find(f => f.name === openFilterField)?.label || openFilterField}
                </span>
                {columnFilters[openFilterField]?.values.size ? (
                  <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                    {columnFilters[openFilterField].values.size} filtro{columnFilters[openFilterField].values.size > 1 ? 's' : ''}
                  </span>
                ) : null}
              </div>
              <button
                onClick={() => setOpenFilterField(null)}
                className="p-1 rounded hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 transition-colors"
                title="Fechar"
              >
                <X size={14} />
              </button>
            </div>

            <div className="px-4 py-2 border-b border-neutral-700">
              <div className="relative">
                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  ref={filterInputRef}
                  type="text"
                  placeholder="Buscar valores..."
                  value={columnFilters[openFilterField]?.searchTerm || ''}
                  onChange={(e) => setColumnFilters(prev => ({
                    ...prev,
                    [openFilterField]: {
                      values: prev[openFilterField]?.values || new Set(),
                      searchTerm: e.target.value,
                    },
                  }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val && openFilterField) {
                        setColumnFilters(prev => {
                          const existing = prev[openFilterField] || { values: new Set<string>(), searchTerm: '' };
                          const newValues = new Set(existing.values);
                          newValues.add(val);
                          return { ...prev, [openFilterField]: { values: newValues, searchTerm: '' } };
                        });
                      }
                    }
                    if (e.key === 'Escape') {
                      setOpenFilterField(null);
                    }
                  }}
                  className="w-full pl-7 pr-3 py-1.5 text-xs bg-neutral-800 rounded border border-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-500 text-neutral-200 placeholder-neutral-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2 scrollbar-dark">
              {getFilteredFilterValues(openFilterField).map(val => {
                const isChecked = columnFilters[openFilterField]?.values.has(val) ?? false;
                return (
                  <label
                    key={val}
                    className="flex items-center gap-2 px-2 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800 rounded cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleFilterToggleValue(openFilterField, val)}
                      className="rounded border-neutral-600 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="truncate flex-1">{val || '(vazio)'}</span>
                  </label>
                );
              })}
              {getFilteredFilterValues(openFilterField).length === 0 && (
                <div className="text-xs text-neutral-500 text-center py-4">
                  Nenhum valor encontrado
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-700">
              <button
                onClick={() => handleFilterClear(openFilterField)}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors"
              >
                Limpar
              </button>
              <button
                onClick={handleFilterDone}
                className="px-4 py-1.5 text-xs bg-amber-500 text-neutral-900 font-medium rounded hover:bg-amber-400 transition-colors"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}

      {contextMenu && (
        <div
          data-context-menu
          className="fixed bg-neutral-800 border border-neutral-600 rounded shadow-xl z-50 py-1 min-w-[180px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {getDrillTarget?.targetTable && (
            <button
              onClick={() => handleDrillThrough(contextMenu.row, contextMenu.field)}
              className="w-full px-3 py-1.5 text-xs text-left text-neutral-300 hover:bg-neutral-700 flex items-center gap-2"
            >
              <ExternalLink size={12} className="text-blue-400" />
              Drill-through → {getDrillTarget.targetTable.label}
            </button>
          )}
          <button
            onClick={() => {
              if (!selectedTable) return;
              const tsv = rowToTsv(contextMenu.row, selectedTable.fields);
              const header = selectedTable.fields.map(f => f.label || f.name).join('\t');
              copyToClipboard(header + '\n' + tsv);
              setContextMenu(null);
            }}
            className="w-full px-3 py-1.5 text-xs text-left text-neutral-300 hover:bg-neutral-700 flex items-center gap-2"
          >
            <Copy size={12} className="text-amber-400" />
            Copiar linha
          </button>
        </div>
      )}
    </div>
  );
}
