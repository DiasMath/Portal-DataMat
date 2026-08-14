'use client';

import React, { useState } from 'react';
import type { TableSchema, FieldSchema, Relationship, Measure } from '../../types/dashboard';
import { SearchInput } from '../shared/SearchInput';
import { TablesPanel } from './sidebar/TablesPanel';
import { RelationshipsPanel } from './sidebar/RelationshipsPanel';
import { MeasuresPanel } from './sidebar/MeasuresPanel';

type ExplorerTab = 'tables' | 'relationships' | 'measures';

interface ModelViewSidebarProps {
  tables: TableSchema[];
  relationships: Relationship[];
  measures?: Measure[];
  filteredTables: TableSchema[];
  selectedTable: string | null;
  selectedRelationship: string | null;
  expandedTables: Set<string>;
  sidebarSearch: string;
  onSidebarSearchChange: (value: string) => void;
  onSelectTable: (tableName: string) => void;
  onSelectRelationship: (relId: string) => void;
  onToggleExpand: (tableName: string) => void;
  getSortedFields: (table: TableSchema) => FieldSchema[];
}

export function ModelViewSidebar({
  tables,
  relationships,
  measures,
  filteredTables,
  selectedTable,
  selectedRelationship,
  expandedTables,
  sidebarSearch,
  onSidebarSearchChange,
  onSelectTable,
  onSelectRelationship,
  onToggleExpand,
  getSortedFields,
}: ModelViewSidebarProps) {
  const [explorerTab, setExplorerTab] = useState<ExplorerTab>('tables');

  return (
    <div className="w-64 shrink-0 border-r border-neutral-700 bg-neutral-900 flex flex-col">
      {/* Explorer tabs */}
      <div className="flex border-b border-neutral-700" role="tablist" aria-label="Explorador do modelo">
        <button
          id="model-view-tab-tables"
          role="tab"
          aria-selected={explorerTab === 'tables'}
          aria-controls="model-view-tables-panel"
          onClick={() => setExplorerTab('tables')}
          className={`flex-1 px-2 py-1.5 text-[10px] font-medium transition-colors ${
            explorerTab === 'tables' ? 'text-amber-400 border-b-2 border-amber-500' : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          Tabelas
        </button>
        <button
          id="model-view-tab-relationships"
          role="tab"
          aria-selected={explorerTab === 'relationships'}
          aria-controls="model-view-relationships-panel"
          onClick={() => setExplorerTab('relationships')}
          className={`flex-1 px-2 py-1.5 text-[10px] font-medium transition-colors ${
            explorerTab === 'relationships' ? 'text-amber-400 border-b-2 border-amber-500' : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          Relacionamentos
        </button>
        <button
          id="model-view-tab-measures"
          role="tab"
          aria-selected={explorerTab === 'measures'}
          aria-controls="model-view-measures-panel"
          onClick={() => setExplorerTab('measures')}
          className={`flex-1 px-2 py-1.5 text-[10px] font-medium transition-colors ${
            explorerTab === 'measures' ? 'text-amber-400 border-b-2 border-amber-500' : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          Medidas
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-neutral-700">
        <SearchInput value={sidebarSearch} onChange={onSidebarSearchChange} placeholder="Buscar..." />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto py-1 scrollbar-minimal">
        {explorerTab === 'tables' && (
          <TablesPanel
            filteredTables={filteredTables}
            selectedTable={selectedTable}
            expandedTables={expandedTables}
            onSelectTable={onSelectTable}
            onToggleExpand={onToggleExpand}
            getSortedFields={getSortedFields}
          />
        )}

        {explorerTab === 'relationships' && (
          <RelationshipsPanel
            relationships={relationships}
            selectedRelationship={selectedRelationship}
            onSelectRelationship={onSelectRelationship}
          />
        )}

        {explorerTab === 'measures' && (
          <MeasuresPanel measures={measures} />
        )}
      </div>
    </div>
  );
}
