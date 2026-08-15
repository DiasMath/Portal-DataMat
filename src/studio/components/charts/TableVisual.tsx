'use client';

/**
 * TableVisual - Data table component for displaying query results.
 * Features:
 * - Column sorting (ASC/DESC)
 * - Row selection (single, multi with Shift/Ctrl)
 * - Context menu (copy, export CSV, select all)
 * - Auto-width columns based on content
 * - Vertical grid lines
 * - Dark theme with white text
 */

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Copy, Download, CheckSquare, Square, Check } from 'lucide-react';
import type { QueryResultData, VisualFormatting } from '../../types/visuals';
import { TABLE_COLORS } from '../../lib/colors';

interface TableVisualProps {
  data: QueryResultData;
  formatting: VisualFormatting;
  width?: number;
  height?: number;
}

interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
}

/** Estimate text width in pixels */
function estimateTextWidth(text: string, fontSize: number = 12): number {
  const avgCharWidth = fontSize * 0.6;
  return text.length * avgCharWidth + 24;
}

/** Calculate optimal column width based on content */
function calculateColumnWidth(
  column: string,
  rows: Record<string, unknown>[],
  min: number = 80,
  max: number = 300
): number {
  const headerWidth = estimateTextWidth(column, 13);
  const maxValueWidth = rows.slice(0, 50).reduce((max, row) => {
    const val = row[column];
    const text = val === null || val === undefined ? '—' : String(val);
    return Math.max(max, estimateTextWidth(text, 12));
  }, 0);
  return Math.min(Math.max(headerWidth, maxValueWidth, min), max);
}

/** Format cell value for display */
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

/** Export data to CSV and trigger download */
function exportToCSV(data: QueryResultData, filename: string = 'dados'): void {
  const headers = data.columns.join(',');
  const rows = data.rows.map(row =>
    data.columns.map(col => {
      const val = row[col];
      const text = val === null || val === undefined ? '' : String(val);
      // Escape commas and quotes
      if (text.includes(',') || text.includes('"') || text.includes('\n')) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    }).join(',')
  ).join('\n');

  const csv = '\uFEFF' + headers + '\n' + rows; // BOM for Excel compatibility
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

/** Copy selected rows to clipboard as TSV */
async function copyToClipboard(data: QueryResultData, selectedRows: Set<number>): Promise<void> {
  const rowsToCopy = selectedRows.size > 0
    ? data.rows.filter((_, i) => selectedRows.has(i))
    : data.rows;

  const headers = data.columns.join('\t');
  const rows = rowsToCopy.map(row =>
    data.columns.map(col => {
      const val = row[col];
      return val === null || val === undefined ? '' : String(val);
    }).join('\t')
  ).join('\n');

  const text = headers + '\n' + rows;
  await navigator.clipboard.writeText(text);
}

export function TableVisual({ data, formatting, width, height }: TableVisualProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0 });
  const tableRef = useRef<HTMLDivElement>(null);

  // Extract formatting with defaults
  const bgColor = formatting?.backgroundColor || '#1a1a1a';
  const headerBg = '#2a2a2a';
  const bdrColor = formatting?.borderColor || '#333333';
  const headerBdrColor = '#404040';
  const showGrid = formatting?.showGridLines !== false;
  const rowPad = formatting?.rowPadding ?? 6;
  const headerAlign = formatting?.headerAlign || 'left';
  const showTotals = formatting?.showTotals || false;

  // Calculate totals for numeric columns
  const totals = useMemo(() => {
    if (!showTotals) return null;
    const t: Record<string, string> = {};
    for (const col of data.columns) {
      const numericValues = data.rows.map(r => r[col]).filter(v => typeof v === 'number') as number[];
      if (numericValues.length > 0) {
        const sum = numericValues.reduce((a, b) => a + b, 0);
        t[col] = sum.toLocaleString('pt-BR');
      } else {
        t[col] = '—';
      }
    }
    return t;
  }, [data, showTotals]);

  /** Toggle sort direction for a column */
  const handleSort = useCallback((column: string) => {
    setSortConfig(prev => {
      if (prev?.field === column) {
        if (prev.direction === 'asc') return { field: column, direction: 'desc' };
        return null;
      }
      return { field: column, direction: 'asc' };
    });
  }, []);

  /** Handle row click with selection logic */
  const handleRowClick = useCallback((e: React.MouseEvent, rowIndex: number) => {
    e.preventDefault();

    setSelectedRows(prev => {
      const next = new Set(prev);

      if (e.shiftKey && lastSelectedIndex !== null) {
        // Shift+click: select range
        const start = Math.min(lastSelectedIndex, rowIndex);
        const end = Math.max(lastSelectedIndex, rowIndex);
        for (let i = start; i <= end; i++) {
          next.add(i);
        }
      } else if (e.ctrlKey || e.metaKey) {
        // Ctrl/Cmd+click: toggle single row
        if (next.has(rowIndex)) {
          next.delete(rowIndex);
        } else {
          next.add(rowIndex);
        }
      } else {
        // Regular click: select only this row
        next.clear();
        next.add(rowIndex);
      }

      return next;
    });

    setLastSelectedIndex(rowIndex);
  }, [lastSelectedIndex]);

  /** Select all rows */
  const selectAll = useCallback(() => {
    setSelectedRows(new Set(data.rows.map((_, i) => i)));
  }, [data.rows]);

  /** Clear selection */
  const clearSelection = useCallback(() => {
    setSelectedRows(new Set());
    setLastSelectedIndex(null);
  }, []);

  /** Handle context menu */
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY });
  }, []);

  /** Close context menu */
  const closeContextMenu = useCallback(() => {
    setContextMenu({ visible: false, x: 0, y: 0 });
  }, []);

  /** Copy selected rows to clipboard */
  const handleCopy = useCallback(async () => {
    await copyToClipboard(data, selectedRows);
    closeContextMenu();
  }, [data, selectedRows, closeContextMenu]);

  /** Export to CSV */
  const handleExportCSV = useCallback(() => {
    exportToCSV(data);
    closeContextMenu();
  }, [data, closeContextMenu]);

  /** Sort data based on current sort configuration */
  const sortedRows = useMemo(() => {
    if (!sortConfig) return data.rows;

    return [...data.rows].sort((a, b) => {
      const aVal = a[sortConfig.field];
      const bVal = b[sortConfig.field];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let comparison = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal), 'pt-BR');
      }

      return sortConfig.direction === 'desc' ? -comparison : comparison;
    });
  }, [data.rows, sortConfig]);

  /** Calculate column widths */
  const columnWidths = useMemo(() => {
    return data.columns.map(col => ({
      column: col,
      width: calculateColumnWidth(col, data.rows),
    }));
  }, [data.columns, data.rows]);

  /** Check if data is empty */
  if (!data || data.columns.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-neutral-400">
        Arraste campos para Detalhes
      </div>
    );
  }

  return (
    <div
      ref={tableRef}
      className="h-full overflow-auto"
      style={{ background: bgColor }}
      onContextMenu={handleContextMenu}
      onClick={closeContextMenu}
    >
      <table
        className="text-sm border-collapse"
        style={{ width: 'fit-content', minWidth: '100%' }}
      >
        {/* Header */}
        <thead className="sticky top-0" style={{ zIndex: 10 }}>
          <tr style={{ background: headerBg }}>
            {/* Selection column */}
            <th
              style={{
                width: 32,
                minWidth: 32,
                color: TABLE_COLORS.headerText,
                borderBottom: `2px solid ${headerBdrColor}`,
                borderRight: showGrid ? `1px solid ${headerBdrColor}` : 'none',
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (selectedRows.size === data.rows.length) {
                    clearSelection();
                  } else {
                    selectAll();
                  }
                }}
                className="p-1 hover:bg-neutral-600 rounded"
                title={selectedRows.size === data.rows.length ? 'Desmarcar tudo' : 'Selecionar tudo'}
              >
                {selectedRows.size === data.rows.length ? (
                  <CheckSquare size={12} style={{ color: TABLE_COLORS.accent }} />
                ) : selectedRows.size > 0 ? (
                  <div style={{ width: 12, height: 12, border: `1px solid ${TABLE_COLORS.accent}`, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 6, height: 6, background: TABLE_COLORS.accent, borderRadius: 1 }} />
                  </div>
                ) : (
                  <Square size={12} style={{ color: TABLE_COLORS.secondaryText }} />
                )}
              </button>
            </th>

            {data.columns.map((col, colIndex) => (
              <th
                key={col}
                onClick={() => handleSort(col)}
                className="px-3 py-2 font-semibold cursor-pointer hover:bg-neutral-600 transition-colors select-none"
                style={{
                  width: columnWidths[colIndex].width,
                  minWidth: columnWidths[colIndex].width,
                  color: TABLE_COLORS.headerText,
                  borderBottom: `2px solid ${headerBdrColor}`,
                  borderRight: showGrid ? `1px solid ${headerBdrColor}` : 'none',
                  fontSize: '13px',
                  textAlign: headerAlign,
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span>{col}</span>
                  <span className="text-neutral-500" style={{ fontSize: '10px' }}>
                    {sortConfig?.field === col ? (
                      sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                    ) : (
                      <ChevronsUpDown size={12} />
                    )}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {sortedRows.map((row, rowIndex) => {
            const isSelected = selectedRows.has(rowIndex);
            const py = `${rowPad / 4}px`;
            return (
              <tr
                key={rowIndex}
                onClick={(e) => handleRowClick(e, rowIndex)}
                className="transition-colors"
                style={{
                  background: isSelected ? TABLE_COLORS.rowSelected : rowIndex % 2 === 0 ? bgColor : TABLE_COLORS.rowOdd,
                  cursor: 'pointer',
                }}
              >
                {/* Selection cell */}
                <td
                  style={{
                    width: 32,
                    minWidth: 32,
                    borderBottom: `1px solid ${bdrColor}`,
                    borderRight: showGrid ? `1px solid ${bdrColor}` : 'none',
                    textAlign: 'center',
                  }}
                >
                  {isSelected && <Check size={12} style={{ color: TABLE_COLORS.accent }} />}
                </td>

                {data.columns.map(col => (
                  <td
                    key={col}
                    className="whitespace-nowrap"
                    style={{
                      padding: `${py} 12px`,
                      color: isSelected ? '#ffffff' : '#e0e0e0',
                      borderBottom: `1px solid ${bdrColor}`,
                      borderRight: showGrid ? `1px solid ${bdrColor}` : 'none',
                      fontSize: '12px',
                    }}
                  >
                    {formatCellValue(row[col])}
                  </td>
                ))}
              </tr>
            );
          })}

          {/* Totals row */}
          {totals && (
            <tr style={{ background: headerBg, fontWeight: 'bold' }}>
              <td
                style={{
                  width: 32,
                  minWidth: 32,
                  borderTop: `2px solid ${headerBdrColor}`,
                  borderRight: showGrid ? `1px solid ${headerBdrColor}` : 'none',
                }}
              />
              {data.columns.map(col => (
                <td
                  key={col}
                  className="whitespace-nowrap"
                  style={{
                    padding: `${rowPad / 4}px 12px`,
                    color: TABLE_COLORS.headerText,
                    borderTop: `2px solid ${headerBdrColor}`,
                    borderRight: showGrid ? `1px solid ${headerBdrColor}` : 'none',
                    fontSize: '12px',
                    textAlign: headerAlign,
                  }}
                >
                  {totals[col]}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className="fixed z-50 bg-neutral-800 border border-neutral-600 rounded shadow-lg py-1"
          style={{ left: contextMenu.x, top: contextMenu.y, minWidth: 180 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-700"
          >
            <Copy size={14} />
            <span>Copiar{selectedRows.size > 0 ? ` (${selectedRows.size} linhas)` : ''}</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-700"
          >
            <Download size={14} />
            <span>Exportar CSV</span>
          </button>
          <div className="border-t border-neutral-600 my-1" />
          <button
            onClick={() => { selectAll(); closeContextMenu(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-700"
          >
            <CheckSquare size={14} />
            <span>Selecionar tudo</span>
          </button>
          <button
            onClick={() => { clearSelection(); closeContextMenu(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-700"
          >
            <Square size={14} />
            <span>Limpar seleção</span>
          </button>
        </div>
      )}

      {/* Status bar */}
      <div
        className="sticky bottom-0 flex items-center justify-between px-3 py-1.5 text-xs"
        style={{ background: TABLE_COLORS.headerBg, borderTop: `1px solid ${TABLE_COLORS.headerBorder}`, color: TABLE_COLORS.mutedText }}
      >
        <span>{data.rows.length} linhas</span>
        {selectedRows.size > 0 && (
          <span style={{ color: TABLE_COLORS.accent }}>{selectedRows.size} selecionadas</span>
        )}
      </div>
    </div>
  );
}
