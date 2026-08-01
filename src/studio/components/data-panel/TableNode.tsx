'use client';

import React, { useState } from 'react';
import type { TableSchema } from '../../types/dashboard';
import { FieldNode } from './FieldNode';
import { ChevronRight, Table, Hash, Type, Calendar, ToggleLeft } from 'lucide-react';

interface TableNodeProps {
  table: TableSchema;
  searchTerm?: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  number: <Hash size={8} className="text-amber-500" />,
  string: <Type size={8} className="text-green-500" />,
  date: <Calendar size={8} className="text-purple-500" />,
  boolean: <ToggleLeft size={8} className="text-orange-500" />,
};

export function TableNode({ table, searchTerm }: TableNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const filteredFields = searchTerm
    ? table.fields.filter(f =>
        f.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : table.fields;

  return (
    <div className="mb-0.5">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-1 px-2 py-1 text-[10px] rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
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
      </button>

      {isExpanded && (
        <div className="ml-2">
          {filteredFields.map(field => (
            <FieldNode
              key={field.name}
              tableName={table.name}
              tableLabel={table.label}
              field={field}
              icon={TYPE_ICONS[field.type]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
