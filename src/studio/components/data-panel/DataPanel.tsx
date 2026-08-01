'use client';

import React, { useState } from 'react';
import { useStudio } from '../../store/StudioContext';
import { MOCK_DATA_MODEL } from '../../lib/mock-data';
import { TableNode } from './TableNode';
import { Database, Search, PanelRightClose } from 'lucide-react';

export function DataPanel() {
  const { state, dispatch } = useStudio();
  const [searchTerm, setSearchTerm] = useState('');

  const dataModel = state.dataModel || MOCK_DATA_MODEL;

  const filteredTables = dataModel.tables.filter(table =>
    table.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    table.fields.some(f =>
      f.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-700">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center gap-2">
          <Database size={14} className="text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dados</span>
        </div>
        <button
          onClick={() => dispatch({ type: 'COLLAPSE_DATA_PANEL' })}
          className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Recolher painel"
        >
          <PanelRightClose size={14} className="text-muted-foreground" />
        </button>
      </div>

      <div className="px-3 py-2">
        <div className="relative">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Pesquisar tabelas e campos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-7 pr-2 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-1 studio-scrollbar">
        {filteredTables.map(table => (
          <TableNode
            key={table.name}
            table={table}
            searchTerm={searchTerm}
          />
        ))}

        {filteredTables.length === 0 && (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">
            Nenhuma tabela encontrada
          </div>
        )}
      </div>
    </div>
  );
}
