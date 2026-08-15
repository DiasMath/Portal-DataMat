'use client';

import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useStudio } from '../../store/StudioContext';
import { Filter, X, Plus, ChevronDown, ChevronRight, PanelRightClose, Link2, Trash2 } from 'lucide-react';
import type { FilterCondition } from '../../types/visuals';
import type { DataModel } from '../../types/dashboard';

function FilterSection({
  title,
  sectionId,
  defaultOpen = true,
  filters,
  onAdd,
  onRemove,
  onClearAll,
  canAdd = true,
  dataModel,
  pendingDrop,
  onClearPendingDrop,
  syncedFilters = [],
  onToggleSync,
}: {
  title: string;
  sectionId: string;
  defaultOpen?: boolean;
  filters: FilterCondition[];
  onAdd: (filter: FilterCondition) => void;
  onRemove: (index: number) => void;
  onClearAll: () => void;
  canAdd?: boolean;
  dataModel: DataModel | null;
  pendingDrop: { sectionId: string; tableName: string; columnName: string } | null;
  onClearPendingDrop: () => void;
  syncedFilters?: { tableName: string; columnName: string }[];
  onToggleSync?: (tableName: string, columnName: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isAdding, setIsAdding] = useState(false);
  const [newFilter, setNewFilter] = useState<{
    tableName: string;
    columnName: string;
    operator: FilterCondition['operator'];
    value: string;
    value2: string;
    multiValues: string[];
  }>({
    tableName: '',
    columnName: '',
    operator: '=',
    value: '',
    value2: '',
    multiValues: [],
  });

  const { isOver, setNodeRef } = useDroppable({
    id: `filter-section-${sectionId}`,
    data: {
      type: 'filter-section',
      sectionId,
    },
  });

  const selectedTable = dataModel?.tables?.find(t => t.name === newFilter.tableName);
  const selectedColumns = selectedTable?.fields || [];
  const selectedField = selectedColumns.find(f => f.name === newFilter.columnName);
  const isDateField = selectedField?.type === 'date';

  const handleAdd = () => {
    if (!newFilter.tableName || !newFilter.columnName) return;

    let value: unknown = newFilter.value;
    if (newFilter.operator === 'IN' || newFilter.operator === 'NOT IN') {
      value = newFilter.multiValues.filter(v => v.trim() !== '');
    } else if (newFilter.operator === 'BETWEEN') {
      value = newFilter.value;
    }

    onAdd({
      tableName: newFilter.tableName,
      columnName: newFilter.columnName,
      operator: newFilter.operator,
      value,
      ...(newFilter.operator === 'BETWEEN' ? { value2: newFilter.value2 } : {}),
    });
    setNewFilter({ tableName: '', columnName: '', operator: '=', value: '', value2: '', multiValues: [] });
    setIsAdding(false);
  };

  const handleAddMultiValue = () => {
    setNewFilter(f => ({ ...f, multiValues: [...f.multiValues, ''] }));
  };

  const handleUpdateMultiValue = (index: number, value: string) => {
    setNewFilter(f => ({
      ...f,
      multiValues: f.multiValues.map((v, i) => i === index ? value : v),
    }));
  };

  const handleRemoveMultiValue = (index: number) => {
    setNewFilter(f => ({
      ...f,
      multiValues: f.multiValues.filter((_, i) => i !== index),
    }));
  };

  React.useEffect(() => {
    if (pendingDrop) {
      setNewFilter({ tableName: pendingDrop.tableName, columnName: pendingDrop.columnName, operator: '=', value: '', value2: '', multiValues: [] });
      setIsAdding(true);
      setIsOpen(true);
      onClearPendingDrop();
    }
  }, [pendingDrop, onClearPendingDrop]);

  return (
    <div
      ref={setNodeRef}
      className={`border-b border-neutral-200 dark:border-neutral-700 transition-colors ${isOver ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-1.5 px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
      >
        {isOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        <span className="flex-1 text-left">{title}</span>
        {filters.length > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); onClearAll(); }}
            className="text-muted-foreground hover:text-red-500 p-0.5 mr-1"
            title="Limpar todos"
          >
            <Trash2 size={10} />
          </button>
        )}
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
                {dataModel?.tables?.map(t => (
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
                  onChange={(e) => setNewFilter(f => ({ ...f, operator: e.target.value as FilterCondition['operator'], value: '', value2: '', multiValues: [] }))}
                  className="w-20 px-1 py-1 text-[10px] bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-700"
                >
                  <option value="=">=</option>
                  <option value="!=">≠</option>
                  <option value=">">{'>'}</option>
                  <option value=">=">{'≥'}</option>
                  <option value="<">{'<'}</option>
                  <option value="<=">{'≤'}</option>
                  <option value="LIKE">Contém</option>
                  <option value="IN">Em lista</option>
                  <option value="NOT IN">Não está em</option>
                  <option value="IS NULL">É nulo</option>
                  <option value="IS NOT NULL">Não é nulo</option>
                  <option value="BETWEEN">Entre</option>
                </select>

                {(newFilter.operator === 'IN' || newFilter.operator === 'NOT IN') ? (
                  <div className="flex-1 space-y-1">
                    {newFilter.multiValues.map((val, idx) => (
                      <div key={idx} className="flex gap-1">
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => handleUpdateMultiValue(idx, e.target.value)}
                          placeholder={`Valor ${idx + 1}`}
                          className="flex-1 px-1.5 py-1 text-[10px] bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-700"
                        />
                        <button
                          onClick={() => handleRemoveMultiValue(idx)}
                          className="text-muted-foreground hover:text-red-500 px-1"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={handleAddMultiValue}
                      className="text-[10px] text-amber-500 hover:text-amber-600"
                    >
                      + Adicionar valor
                    </button>
                  </div>
                ) : newFilter.operator === 'BETWEEN' ? (
                  <div className="flex-1 flex gap-1 items-center">
                    <input
                      type={isDateField ? 'date' : 'text'}
                      value={newFilter.value}
                      onChange={(e) => setNewFilter(f => ({ ...f, value: e.target.value }))}
                      placeholder="De"
                      className="flex-1 px-1.5 py-1 text-[10px] bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-700"
                    />
                    <span className="text-muted-foreground text-[10px]">e</span>
                    <input
                      type={isDateField ? 'date' : 'text'}
                      value={newFilter.value2}
                      onChange={(e) => setNewFilter(f => ({ ...f, value2: e.target.value }))}
                      placeholder="Até"
                      className="flex-1 px-1.5 py-1 text-[10px] bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-700"
                    />
                  </div>
                ) : newFilter.operator !== 'IS NULL' && newFilter.operator !== 'IS NOT NULL' ? (
                  <input
                    type={isDateField ? 'date' : 'text'}
                    value={newFilter.value}
                    onChange={(e) => setNewFilter(f => ({ ...f, value: e.target.value }))}
                    placeholder="Valor"
                    className="flex-1 px-1.5 py-1 text-[10px] bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-700"
                  />
                ) : null}
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
            <div className={`text-[10px] py-1 ${isOver ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-muted-foreground'}`}>
              {isOver ? 'Solte para adicionar filtro' : 'Arraste um campo ou clique +'}
            </div>
          )}

          {filters.map((filter, index) => {
            const isSynced = syncedFilters.some(
              f => f.tableName === filter.tableName && f.columnName === filter.columnName
            );
            
            return (
              <div
                key={index}
                className="flex items-center gap-1 px-2 py-1 bg-neutral-50 dark:bg-neutral-800 rounded text-[10px]"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-neutral-700 dark:text-neutral-300 truncate">
                    {filter.columnName}
                    {isSynced && (
                      <Link2 size={8} className="inline ml-1 text-amber-500" />
                    )}
                  </div>
                  <div className="text-muted-foreground truncate">
                    {filter.operator} · {filter.operator === 'BETWEEN' ? `${String(filter.value)} e ${String(filter.value2)}` : Array.isArray(filter.value) ? filter.value.join(', ') : String(filter.value)}
                  </div>
                </div>
                {onToggleSync && (
                  <button
                    onClick={() => onToggleSync(filter.tableName, filter.columnName)}
                    className={`text-muted-foreground transition-colors shrink-0 ${isSynced ? 'text-amber-500 hover:text-amber-600' : 'hover:text-amber-500'}`}
                    title={isSynced ? 'Desmarcar como sincronizado' : 'Marcar como sincronizado'}
                  >
                    <Link2 size={10} />
                  </button>
                )}
                <button
                  onClick={() => onRemove(index)}
                  className="text-muted-foreground hover:text-red-400 transition-colors shrink-0"
                >
                  <X size={10} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function FiltersPanel() {
  const { state, dispatch } = useStudio();

  const currentPageId = state.activePageId || '';
  const selectedVisualId = state.selectedVisualId || '';
  const dataModel = state.dataModel;

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

  const handleClearGlobal = () => {
    dispatch({ type: 'SET_GLOBAL_FILTERS', payload: [] });
  };

  const handleAddPage = (filter: FilterCondition) => {
    dispatch({ type: 'SET_PAGE_FILTERS', payload: { pageId: currentPageId, filters: [...currentPageFilters, filter] } });
  };

  const handleRemovePage = (index: number) => {
    const newFilters = [...currentPageFilters];
    newFilters.splice(index, 1);
    dispatch({ type: 'SET_PAGE_FILTERS', payload: { pageId: currentPageId, filters: newFilters } });
  };

  const handleClearPage = () => {
    dispatch({ type: 'SET_PAGE_FILTERS', payload: { pageId: currentPageId, filters: [] } });
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

  const handleClearVisual = () => {
    if (!selectedVisualId) return;
    dispatch({ type: 'SET_VISUAL_FILTERS', payload: { visualId: selectedVisualId, filters: [] } });
  };

  const handleToggleSync = (tableName: string, columnName: string) => {
    dispatch({ type: 'TOGGLE_SYNCED_FILTER', payload: { tableName, columnName } });
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
            sectionId={`visual-${selectedVisualId}`}
            defaultOpen={true}
            filters={currentVisualFilters}
            onAdd={handleAddVisual}
            onRemove={handleRemoveVisual}
            onClearAll={handleClearVisual}
            dataModel={dataModel}
            pendingDrop={state.pendingFilterDrop?.sectionId === `visual-${selectedVisualId}` ? state.pendingFilterDrop : null}
            onClearPendingDrop={() => dispatch({ type: 'SET_PENDING_FILTER_DROP', payload: null })}
          />
        )}

        <FilterSection
          title="Filtros nesta página"
          sectionId={`page-${currentPageId}`}
          defaultOpen={true}
          filters={currentPageFilters}
          onAdd={handleAddPage}
          onRemove={handleRemovePage}
          onClearAll={handleClearPage}
          dataModel={dataModel}
          pendingDrop={state.pendingFilterDrop?.sectionId === `page-${currentPageId}` ? state.pendingFilterDrop : null}
          onClearPendingDrop={() => dispatch({ type: 'SET_PENDING_FILTER_DROP', payload: null })}
          syncedFilters={state.syncedFilters}
          onToggleSync={handleToggleSync}
        />

        <FilterSection
          title="Filtros em todas as páginas"
          sectionId="global"
          defaultOpen={false}
          filters={globalFilters}
          onAdd={handleAddGlobal}
          onRemove={handleRemoveGlobal}
          onClearAll={handleClearGlobal}
          dataModel={dataModel}
          pendingDrop={state.pendingFilterDrop?.sectionId === 'global' ? state.pendingFilterDrop : null}
          onClearPendingDrop={() => dispatch({ type: 'SET_PENDING_FILTER_DROP', payload: null })}
          syncedFilters={state.syncedFilters}
          onToggleSync={handleToggleSync}
        />
      </div>
    </div>
  );
}
