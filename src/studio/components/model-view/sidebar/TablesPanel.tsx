'use client';

import React from 'react';
import type { TableSchema, FieldSchema } from '../../../types/dashboard';
import { getTypeIcon } from '../../shared/type-icons';
import { Table, ChevronUp, ChevronDown, EyeOff } from 'lucide-react';

interface TablesPanelProps {
  filteredTables: TableSchema[];
  selectedTable: string | null;
  expandedTables: Set<string>;
  onSelectTable: (tableName: string) => void;
  onToggleExpand: (tableName: string) => void;
  getSortedFields: (table: TableSchema) => FieldSchema[];
}

export function TablesPanel({
  filteredTables,
  selectedTable,
  expandedTables,
  onSelectTable,
  onToggleExpand,
  getSortedFields,
}: TablesPanelProps) {
  return (
    <div id="model-view-tables-panel" role="tabpanel" aria-labelledby="model-view-tab-tables">
      {filteredTables.map(table => {
        const isExpanded = expandedTables.has(table.name);
        const isSelected = selectedTable === table.name;
        const sortedFields = getSortedFields(table);
        const hasAnyHidden = table.fields.some(f => f.hidden);

        return (
          <div key={table.name}>
            <div className={`flex items-center ${isSelected ? 'bg-amber-600/20' : 'hover:bg-neutral-800'}`}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand(table.name);
                }}
                className="p-1 rounded shrink-0"
                title="Expandir/Recolher"
                aria-label="Expandir/Recolher"
              >
                {isExpanded ? <ChevronUp size={12} className="text-neutral-500" /> : <ChevronDown size={12} className="text-neutral-500" />}
              </button>
              <button
                onClick={() => onSelectTable(table.name)}
                onDragStart={(e) => {
                  e.dataTransfer.setData('modelview/table-name', table.name);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                draggable
                className={`flex-1 flex items-center gap-1.5 px-2 py-1.5 text-sm transition-colors text-left cursor-grab
                  ${isSelected ? 'text-amber-400' : 'text-neutral-200'}`}
              >
                <Table size={12} className={table.type === 'fact' ? 'text-blue-400' : 'text-amber-300'} />
                <span className="font-medium truncate">{table.label}</span>
                {hasAnyHidden && <EyeOff size={10} className="text-neutral-600" />}
                <span className="ml-auto text-[10px] text-muted-foreground">{table.fields.length}</span>
              </button>
            </div>

            {isExpanded && (
              <div className="ml-5 border-l border-neutral-700 pl-1 py-0.5">
                {sortedFields.map(field => (
                  <div
                    key={field.name}
                    className={`flex items-center gap-1.5 px-2 py-0.5 text-sm rounded ${
                      field.hidden ? 'text-neutral-600 italic' : 'text-neutral-400 hover:bg-neutral-800/50'
                    }`}
                  >
                    {field.hidden ? <EyeOff size={9} className="text-neutral-600" /> : getTypeIcon(field.type, 9)}
                    <span className="truncate">{field.label || field.name}</span>
                    {field.isAggregatable && (
                      <span className="ml-auto text-[9px] text-amber-400/60">#</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
