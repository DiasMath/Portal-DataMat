'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { GRID_COLORS, type SortConfig } from './types';

interface GridColumnHeaderProps {
  column: string;
  index: number;
  sortConfig: SortConfig | null;
  onSort: (column: string) => void;
  onResize: (column: string, width: number) => void;
  onDoubleClickResize?: (column: string) => void;
  width: number;
  defaultWidth: number;
}

/**
 * Sortable, resizable column header.
 * - Click to toggle sort (asc → desc → none)
 * - Drag right edge to resize column
 */
export function GridColumnHeader({
  column,
  index,
  sortConfig,
  onSort,
  onResize,
  onDoubleClickResize,
  width,
  defaultWidth,
}: GridColumnHeaderProps) {
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);

  const isSorted = sortConfig?.column === column;
  const sortDir = isSorted ? sortConfig.direction : null;

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = width;
    let rafId = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const dx = e.clientX - resizeStartX.current;
        const newWidth = Math.max(60, resizeStartWidth.current + dx);
        onResize(column, newWidth);
      });
    };

    const handleMouseUp = () => {
      if (rafId) cancelAnimationFrame(rafId);
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [column, width, onResize]);

  // Cleanup resize listeners on unmount
  useEffect(() => {
    return () => {
      setIsResizing(false);
    };
  }, []);

  return (
    <th
      className="relative select-none"
      style={{
        backgroundColor: GRID_COLORS.headerBg,
        color: GRID_COLORS.headerText,
        borderBottom: `1px solid ${GRID_COLORS.headerBorder}`,
        borderRight: `1px solid ${GRID_COLORS.gridLines}`,
        width,
        minWidth: width,
        maxWidth: width,
      }}
    >
      <button
        onClick={() => onSort(column)}
        className="w-full flex items-center gap-1 px-3 py-2 text-left text-xs font-medium hover:bg-neutral-800 transition-colors"
      >
        <span className="truncate">{column}</span>
        {isSorted && (
          sortDir === 'asc'
            ? <ArrowUp size={10} style={{ color: GRID_COLORS.sortArrow }} />
            : <ArrowDown size={10} style={{ color: GRID_COLORS.sortArrow }} />
        )}
      </button>

      {/* Resize handle */}
      <div
        onMouseDown={handleResizeStart}
        onDoubleClick={() => onDoubleClickResize ? onDoubleClickResize(column) : onResize(column, defaultWidth)}
        className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-amber-500/50 transition-colors ${
          isResizing ? 'bg-amber-500/50' : ''
        }`}
      />
    </th>
  );
}
