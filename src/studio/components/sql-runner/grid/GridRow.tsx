'use client';

import React, { useCallback } from 'react';
import { GRID_COLORS } from './types';

interface GridRowProps {
  row: Record<string, unknown>;
  columns: string[];
  rowIndex: number;
  isSelected: boolean;
  onSelect: (rowIndex: number) => void;
  onCopyCell: (value: string) => void;
  columnWidths: Record<string, number>;
}

/**
 * Single grid row with zebra striping and cell selection.
 * - Alternating background colors
 * - NULL values in italic gray
 * - Right-click to copy cell value
 */
export function GridRow({
  row,
  columns,
  rowIndex,
  isSelected,
  onSelect,
  onCopyCell,
  columnWidths,
}: GridRowProps) {
  const isEven = rowIndex % 2 === 0;

  const handleContextMenu = useCallback((e: React.MouseEvent, value: unknown) => {
    e.preventDefault();
    const text = formatCellValue(value);
    onCopyCell(text);
  }, [onCopyCell, row, columns]);

  return (
    <tr
      onClick={() => onSelect(rowIndex)}
      style={{
        backgroundColor: isSelected
          ? GRID_COLORS.rowSelected
          : isEven
            ? GRID_COLORS.rowOdd
            : GRID_COLORS.rowEven,
        color: isSelected ? '#ffffff' : GRID_COLORS.rowText,
      }}
      className="hover:brightness-125 transition-colors cursor-pointer"
    >
      {/* Row number column */}
      <td
        style={{
          backgroundColor: isSelected ? GRID_COLORS.rowSelected : GRID_COLORS.headerBg,
          color: GRID_COLORS.rowNumber,
          borderRight: `1px solid ${GRID_COLORS.gridLines}`,
          borderBottom: `1px solid ${GRID_COLORS.gridLines}`,
        }}
        className="px-2 py-1.5 text-right text-[10px] select-none w-10"
      >
        {rowIndex + 1}
      </td>

      {/* Data columns */}
      {columns.map(col => {
        const value = row[col];
        const isNull = value === null || value === undefined;
        const width = columnWidths[col] || 150;

        return (
          <td
            key={col}
            onContextMenu={(e) => handleContextMenu(e, value)}
            style={{
              width,
              minWidth: width,
              maxWidth: width,
              borderBottom: `1px solid ${GRID_COLORS.gridLines}`,
              borderRight: `1px solid ${GRID_COLORS.gridLines}`,
              color: isNull ? GRID_COLORS.nullText : undefined,
              fontStyle: isNull ? 'italic' : undefined,
            }}
            className="px-3 py-1.5 text-xs whitespace-nowrap overflow-hidden text-ellipsis"
            title={isNull ? 'NULL' : String(value)}
          >
            {isNull ? 'NULL' : formatCellValue(value)}
          </td>
        );
      })}
    </tr>
  );
}

/** Format a cell value for display */
function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return value.toLocaleString('pt-BR');
  if (value instanceof Date) return value.toLocaleDateString('pt-BR');
  return String(value);
}
