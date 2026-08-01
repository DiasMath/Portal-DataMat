'use client';

import React from 'react';

interface QueryResultsGridProps {
  data: {
    columns: string[];
    rows: Record<string, unknown>[];
    executionTime: number;
  };
}

export function QueryResultsGrid({ data }: QueryResultsGridProps) {
  if (!data || data.columns.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
        Nenhum resultado
      </div>
    );
  }

  return (
    <div className="max-h-[300px] overflow-auto">
      <table className="w-full text-xs border-collapse">
        <thead className="sticky top-0 bg-neutral-800">
          <tr>
            {data.columns.map(col => (
              <th
                key={col}
                className="px-3 py-2 text-left font-medium text-neutral-300 border-b border-neutral-700 whitespace-nowrap"
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
              className="hover:bg-neutral-800/50"
            >
              {data.columns.map(col => (
                <td
                  key={col}
                  className="px-3 py-1.5 text-neutral-400 border-b border-neutral-800/50 whitespace-nowrap"
                >
                  {formatValue(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') return value.toLocaleString('pt-BR');
  if (value instanceof Date) return value.toLocaleDateString('pt-BR');
  return String(value);
}
