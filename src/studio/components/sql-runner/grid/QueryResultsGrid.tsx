'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { GridColumnHeader } from './GridColumnHeader';
import { GridRow } from './GridRow';
import { GridToolbar } from './GridToolbar';
import { exportGridData, downloadFile } from './grid-export';
import { GRID_COLORS, type GridData, type SortConfig, type ColumnWidths, type ExportFormat } from './types';
import { TableVirtuoso } from 'react-virtuoso';

const DEFAULT_COLUMN_WIDTH = 150;

interface QueryResultsGridProps {
  data: GridData;
  onRerun?: () => void;
}

/**
 * Workbench-style result grid with sorting, resizing, copy, and export.
 *
 * Features:
 * - Zebra striping (alternating row colors)
 * - Sortable columns (click header)
 * - Resizable columns (drag header edge)
 * - NULL values in italic gray
 * - Row selection with blue highlight
 * - Toolbar: copy all, export CSV/JSON, rerun
 * - Sticky header
 */
export function QueryResultsGrid({ data, onRerun }: QueryResultsGridProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(() => {
    const widths: ColumnWidths = {};
    data.columns.forEach(col => {
      widths[col] = DEFAULT_COLUMN_WIDTH;
    });
    return widths;
  });

  // Sort rows based on current sort config
  const sortedRows = useMemo(() => {
    if (!sortConfig) return data.rows;

    return [...data.rows].sort((a, b) => {
      const aVal = a[sortConfig.column];
      const bVal = b[sortConfig.column];

      // Handle NULLs (sort to end)
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      // Numeric comparison
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // String comparison
      const comparison = String(aVal).localeCompare(String(bVal), 'pt-BR');
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [data.rows, sortConfig]);

  const handleSort = useCallback((column: string) => {
    setSortConfig(prev => {
      if (prev?.column === column) {
        if (prev.direction === 'asc') return { column, direction: 'desc' };
        return null; // Toggle off
      }
      return { column, direction: 'asc' };
    });
  }, []);

  const handleColumnResize = useCallback((column: string, width: number) => {
    setColumnWidths(prev => ({ ...prev, [column]: width }));
  }, []);

  const handleCopyCell = useCallback((value: string) => {
    navigator.clipboard.writeText(value);
  }, []);

  const handleExport = useCallback((format: ExportFormat) => {
    const content = exportGridData(data, format);
    const ext = format === 'csv' ? 'csv' : 'json';
    const mime = format === 'csv' ? 'text/csv' : 'application/json';
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
    downloadFile(content, `query-result-${timestamp}.${ext}`, mime);
  }, [data]);

  if (!data || data.columns.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
        Nenhum resultado
      </div>
    );
  }

  // Total width including row number column
  const totalWidth = data.columns.reduce((sum, col) => sum + (columnWidths[col] || DEFAULT_COLUMN_WIDTH), 0) + 40;

  return (
    <div className="flex flex-col">
      {/* Toolbar */}
      <GridToolbar data={data} onExport={handleExport} onRerun={onRerun} />

      {/* Grid */}
      <div className="overflow-hidden h-full" style={{ scrollbarWidth: 'thin' }}>
        <TableVirtuoso
          style={{ height: '100%' }}
          data={sortedRows}
          fixedHeaderContent={() => (
            <tr>
              {/* Row number header */}
              <th
                style={{
                  backgroundColor: GRID_COLORS.headerBg,
                  borderBottom: `1px solid ${GRID_COLORS.headerBorder}`,
                  borderRight: `1px solid ${GRID_COLORS.gridLines}`,
                }}
                className="px-2 py-2 text-right text-[10px] font-medium w-10"
              >
                <span style={{ color: GRID_COLORS.rowNumber }}>#</span>
              </th>

              {/* Column headers */}
              {data.columns.map((col, i) => (
                <GridColumnHeader
                  key={col}
                  column={col}
                  index={i}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  onResize={handleColumnResize}
                  width={columnWidths[col] || DEFAULT_COLUMN_WIDTH}
                  defaultWidth={DEFAULT_COLUMN_WIDTH}
                />
              ))}
            </tr>
          )}
          itemContent={(index, row) => (
            <>
              {/* Row number */}
              <td
                className="px-2 py-1.5 text-right text-[10px]"
                style={{
                  backgroundColor: GRID_COLORS.rowBg,
                  borderBottom: `1px solid ${GRID_COLORS.gridLines}`,
                  borderRight: `1px solid ${GRID_COLORS.gridLines}`,
                  color: GRID_COLORS.rowNumber,
                }}
              >
                {index + 1}
              </td>

              {/* Data cells */}
              {data.columns.map((col) => {
                const value = row[col];
                const isNull = value === null || value === undefined;
                const cw = columnWidths[col] || DEFAULT_COLUMN_WIDTH;

                return (
                  <td
                    key={col}
                    className="px-3 py-1.5 text-[11px] whitespace-nowrap cursor-default"
                    style={{
                      width: cw, minWidth: cw,
                      backgroundColor: selectedRow === index ? GRID_COLORS.selectedRow : GRID_COLORS.rowBg,
                      borderBottom: `1px solid ${GRID_COLORS.gridLines}`,
                      borderRight: `1px solid ${GRID_COLORS.gridLines}`,
                      color: isNull ? GRID_COLORS.nullText : GRID_COLORS.rowText,
                      fontStyle: isNull ? 'italic' : 'normal',
                    }}
                    onClick={() => handleCopyCell(isNull ? 'NULL' : String(value))}
                    title="Clique para copiar"
                  >
                    {isNull ? 'NULL' : String(value)}
                  </td>
                );
              })}
            </>
          )}
          components={{
            Table: (props) => (
              <table {...props} className="border-collapse" style={{ ...props.style, minWidth: totalWidth }} />
            ),
            TableHead: React.forwardRef((props, ref) => (
              <thead {...props} ref={ref} className="sticky top-0 z-10" />
            )),
            TableBody: React.forwardRef((props, ref) => (
              <tbody {...props} ref={ref} />
            )),
          }}
        />
      </div>
    </div>
  );
}
