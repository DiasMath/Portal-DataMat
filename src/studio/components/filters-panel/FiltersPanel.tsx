'use client';

import React, { useState } from 'react';
import { useStudio } from '../../store/StudioContext';
import { MOCK_DATA_MODEL } from '../../lib/mock-data';
import { Filter, X, Plus, ChevronDown, ChevronRight, PanelRightClose } from 'lucide-react';
import type { FilterCondition } from '../../types/visuals';

function FilterSection({
  title,
  defaultOpen = true,
  filters,
  onAdd,
  onRemove,
  canAdd = true,
}: {
  title: string;
  defaultOpen?: boolean;
  filters: FilterCondition[];
  onAdd: (filter: FilterCondition) => void;
  onRemove: (index: number) => void;
  canAdd?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isAdding, setIsAdding] = useState(false);
  const dataModel = MOCK_DATA_MODEL;
  const [newFilter, setNewFilter] = useState({
    tableName: '',
    columnName: '',
    operator: '=' as FilterCondition['operator'],
    value: '',
  });

  const selectedTable = dataModel.tables.find(t => t.name === newFilter.tableName);
  const selectedColumns = selectedTable?.fields || [];

  const handleAdd = () => {
    if (!newFilter.tableName || !newFilter.columnName) return;
    onAdd({
      tableName: newFilter.tableName,
      columnName: newFilter.columnName,
      operator: newFilter.operator,
      value: newFilter.value,
    });
    setNewFilter({ tableName: '', columnName: '', operator: '=', value: '' });
    setIsAdding(false);
  };

  return (
    <div className="border-b border-neutral-200 dark:border-neutral-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-1.5 px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
      >
        {isOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        <span className="flex-1 text-left">{title}</span>
        {canAdd && (
          <span
            onClick={(e) => { e.stopPropagation(); setIsAdding(!isAdding); }}
            className="text-muted-foreground hover:text-foreground p-0.5"
          >
            <Plus size={10} />
          </span>
        )}
      </button>

      {isOpen && (
        <div className="px-3 pb-2 space-y-1">
          {isAdding && canAdd && (
            <div className="p-2 bg-neutral-50 dark:bg-neutral-800/50 rounded space-y-1.5 mb-1">
              <select
                value={newFilter.tableName}
                onChange={(e) => setNewFilter(f => ({ ...f, tableName: e.target.value, columnName: '' }))}
                className="w-full px-2 py-1 text-[10px] bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-700"
              >
                <option value="">Tabela...</option>
                {dataModel.tables.map(t => (
                  <option key={t.name} value={t.name}>{t.label}</option>
                ))}
              </select>

              <select
                value={newFilter.columnName}
                onChange={(e) => setNewFilter(f => ({ ...f, columnName: e.target.value }))}
                disabled={!newFilter.tableName}
                className="w-full px-2 py-1 text-[10px] bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-700 disabled:opacity-50"
              >
                <option value="">Campo...</option>
                {selectedColumns.map(f => (
                  <option key={f.name} value={f.name}>{f.label || f.name}</option>
                ))}
              </select>

              <div className="flex gap-1">
                <select
                  value={newFilter.operator}
                  onChange={(e) => setNewFilter(f => ({ ...f, operator: e.target.value as FilterCondition['operator'] }))}
                  className="w-16 px-1 py-1 text-[10px] bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-700"
                >
                  <option value="=">=</option>
                  <option value="!=">≠</option>
                  <option value=">">{'>'}</option>
                  <option value="<">{'<'}</option>
                  <option value="LIKE">Contém</option>
                  <option value="IS NULL">É nulo</option>
                </select>
                <input
                  type="text"
                  value={newFilter.value}
                  onChange={(e) => setNewFilter(f => ({ ...f, value: e.target.value }))}
                  placeholder="Valor"
                  className="flex-1 px-1.5 py-1 text-[10px] bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-700"
                />
              </div>

              <div className="flex gap-1">
                <button
                  onClick={handleAdd}
                  disabled={!newFilter.tableName || !newFilter.columnName}
                  className="flex-1 px-2 py-1 text-[10px] bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-50"
                >
                  Adicionar
                </button>
                <button
                  onClick={() => setIsAdding(false)}
                  className="px-2 py-1 text-[10px] text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {filters.length === 0 && !isAdding && (
            <div className="text-[10px] text-muted-foreground py-1">
              Adicione campos de dados aqui
            </div>
          )}

          {filters.map((filter, index) => (
            <div
              key={index}
              className="flex items-center gap-1 px-2 py-1 bg-neutral-50 dark:bg-neutral-800 rounded text-[10px]"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-neutral-700 dark:text-neutral-300 truncate">
                  {filter.columnName}
                </div>
                <div className="text-muted-foreground truncate">
                  {filter.operator} · {String(filter.value)}
                </div>
              </div>
              <button
                onClick={() => onRemove(index)}
                className="text-muted-foreground hover:text-red-400 transition-colors shrink-0"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function FiltersPanel() {
  const { state, dispatch } = useStudio();

  const currentPageId = state.activePageId || '';
  const selectedVisualId = state.selectedVisualId || '';

  const globalFilters = state.globalFilters;
  const currentPageFilters = state.pageFilters[currentPageId] || [];
  const currentVisualFilters = selectedVisualId ? (state.visualFilters[selectedVisualId] || []) : [];

  const handleAddGlobal = (filter: FilterCondition) => {
    dispatch({ type: 'SET_GLOBAL_FILTERS', payload: [...globalFilters, filter] });
  };

  const handleRemoveGlobal = (index: number) => {
    const newFilters = [...globalFilters];
    newFilters.splice(index, 1);
    dispatch({ type: 'SET_GLOBAL_FILTERS', payload: newFilters });
  };

  const handleAddPage = (filter: FilterCondition) => {
    dispatch({ type: 'SET_PAGE_FILTERS', payload: { pageId: currentPageId, filters: [...currentPageFilters, filter] } });
  };

  const handleRemovePage = (index: number) => {
    const newFilters = [...currentPageFilters];
    newFilters.splice(index, 1);
    dispatch({ type: 'SET_PAGE_FILTERS', payload: { pageId: currentPageId, filters: newFilters } });
  };

  const handleAddVisual = (filter: FilterCondition) => {
    if (!selectedVisualId) return;
    dispatch({ type: 'SET_VISUAL_FILTERS', payload: { visualId: selectedVisualId, filters: [...currentVisualFilters, filter] } });
  };

  const handleRemoveVisual = (index: number) => {
    if (!selectedVisualId) return;
    const newFilters = [...currentVisualFilters];
    newFilters.splice(index, 1);
    dispatch({ type: 'SET_VISUAL_FILTERS', payload: { visualId: selectedVisualId, filters: newFilters } });
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-700">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Filtros</span>
        </div>
        <button
          onClick={() => dispatch({ type: 'COLLAPSE_FILTERS_PANEL' })}
          className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Recolher painel"
        >
          <PanelRightClose size={14} className="text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto studio-scrollbar">
        {selectedVisualId && (
          <FilterSection
            title="Filtros neste visual"
            defaultOpen={true}
            filters={currentVisualFilters}
            onAdd={handleAddVisual}
            onRemove={handleRemoveVisual}
          />
        )}

        <FilterSection
          title="Filtros nesta página"
          defaultOpen={true}
          filters={currentPageFilters}
          onAdd={handleAddPage}
          onRemove={handleRemovePage}
        />

        <FilterSection
          title="Filtros em todas as páginas"
          defaultOpen={false}
          filters={globalFilters}
          onAdd={handleAddGlobal}
          onRemove={handleRemoveGlobal}
        />
      </div>
    </div>
  );
}
