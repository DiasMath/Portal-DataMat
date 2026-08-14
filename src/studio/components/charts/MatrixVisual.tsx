'use client';

import React, { useMemo, useState } from 'react';
import type { VisualFormatting, QueryResultData } from '../../types/visuals';

interface MatrixVisualProps {
  data: QueryResultData;
  formatting: VisualFormatting;
  width?: number;
  height?: number;
}

export function MatrixVisual({ data, formatting, width, height }: MatrixVisualProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (key: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const columns = data.columns;
  const rows = data.rows;

  const totals = useMemo(() => {
    if (!formatting.showTotals) return null;
    return columns.map(col => {
      const values = rows.map(r => Number(r[col] ?? 0));
      return values.reduce((a, b) => a + b, 0);
    });
  }, [columns, rows, formatting.showTotals]);

  return (
    <div className="overflow-auto" style={{ width: width || '100%', height: height || '100%' }}>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col}
                className="px-2 py-1.5 text-left font-medium border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
                style={{ textAlign: formatting.headerAlign || 'left' }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={idx}
              className={`${idx % 2 === 0 ? 'bg-white dark:bg-neutral-900' : 'bg-neutral-50 dark:bg-neutral-800/50'} hover:bg-amber-50 dark:hover:bg-amber-900/10`}
              style={{ padding: `${formatting.rowPadding || 8}px` }}
            >
              {columns.map(col => (
                <td key={col} className="px-2 py-1.5 border-b border-neutral-100 dark:border-neutral-800">
                  {String(row[col] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {totals && (
          <tfoot>
            <tr className="font-bold bg-neutral-100 dark:bg-neutral-800 border-t-2 border-neutral-300 dark:border-neutral-600">
              {totals.map((total, idx) => (
                <td key={idx} className="px-2 py-1.5">
                  {typeof total === 'number' ? total.toLocaleString() : String(total)}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
