'use client';

import React, { useState, useCallback } from 'react';
import type { TableSchema } from '../../types/dashboard';
import { FieldNode } from './FieldNode';
import { ChevronRight, Table } from 'lucide-react';
import { getTypeIcon } from '../shared/type-icons';

interface TableNodeProps {
  table: TableSchema;
  searchTerm?: string;
}

export function TableNode({ table, searchTerm }: TableNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  React.useEffect(() => {
    if (searchTerm) setIsExpanded(true);
  }, [searchTerm]);

  const filteredFields = searchTerm
    ? table.fields.filter(f =>
        f.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : table.fields;

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(prev => !prev);
  }, []);

  return (
    <div className="mb-0.5">
      <div
        role="button"
        tabIndex={0}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(prev => !prev);
          }
        }}
        className="w-full flex items-center gap-1 px-2 py-1 text-[10px] rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer select-none"
      >
        <ChevronRight
          size={10}
          className={`text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`}
        />
        <Table size={10} className={table.type === 'fact' ? 'text-amber-500' : 'text-amber-300'} />
        <span className="font-medium text-neutral-700 dark:text-neutral-300 truncate">
          {table.label}
        </span>
        <span className="ml-auto text-[8px] text-muted-foreground">
          {table.fields.length}
        </span>
      </div>

      {isExpanded && (
        <div className="ml-3 border-l border-neutral-200 dark:border-neutral-700 pl-1">
          {filteredFields.map(field => (
            <FieldNode
              key={field.name}
              tableName={table.name}
              tableLabel={table.label}
              field={field}
              icon={getTypeIcon(field.type, 8)}
            />
          ))}
          {filteredFields.length === 0 && (
            <div className="px-2 py-1 text-[9px] text-muted-foreground">Nenhum campo</div>
          )}
        </div>
      )}
    </div>
  );
}
