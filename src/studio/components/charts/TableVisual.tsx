'use client';

import React from 'react';
import type { QueryResultData, VisualFormatting } from '../../types/visuals';

interface TableVisualProps {
  data: QueryResultData;
  formatting: VisualFormatting;
  width: number;
  height: number;
}

export function TableVisual({ data, formatting, width, height }: TableVisualProps) {
  if (!data || data.columns.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        Arraste campos para Detalhes
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <table className="w-full text-xs border-collapse">
        <thead className="sticky top-0 bg-neutral-100 dark:bg-neutral-700">
          <tr>
            {data.columns.map(col => (
              <th
                key={col}
                className="px-2 py-1.5 text-left font-medium text-neutral-700 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-600 whitespace-nowrap"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
            >
              {data.columns.map(col => (
                <td
                  key={col}
                  className="px-2 py-1 text-neutral-600 dark:text-neutral-400 border-b border-neutral-100 dark:border-neutral-700 whitespace-nowrap"
                >
                  {formatCellValue(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') {
    return value.toLocaleString('pt-BR');
  }
  if (value instanceof Date) {
    return value.toLocaleDateString('pt-BR');
  }
  return String(value);
}
