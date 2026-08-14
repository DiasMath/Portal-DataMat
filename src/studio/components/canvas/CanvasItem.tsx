'use client';

import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import type { Visual, VisualQueryState } from '../../types/dashboard';
import { CANVAS_DEFAULTS, clampSize, clampToCanvas, snapToGrid, type ResizeDirection } from '../../types/canvas';
import { VISUAL_TYPE_ICONS } from '../../types/visuals';
import { ChartRenderer } from '../charts/ChartRenderer';
import { VisualShell, buildShellStyle } from './VisualShell';
import { useStudio } from '../../store/StudioContext';
import { buildMeasureFormatMap } from '../../lib/format';

interface CanvasItemProps {
  visual: Visual;
  isSelected: boolean;
  isMultiSelected?: boolean;
  zoom: number;
  queryState?: VisualQueryState;
  mode: 'editor' | 'viewer';
  pageWidth: number;
  pageHeight: number;
  showGrid: boolean;
  onSelect: (e?: React.MouseEvent) => void;
  onMove: (x: number, y: number) => void;
  onResize: (width: number, height: number) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  crossFilterValue?: unknown;
  onCrossFilter?: (fieldName: string, value: unknown) => void;
  drillLevel?: number;
  onDrillDown?: (fieldName: string, value: unknown) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

const RESIZE_DIRECTIONS: ResizeDirection[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

export function CanvasItem({
  visual,
  isSelected,
  isMultiSelected,
  zoom,
  queryState,
  mode,
  pageWidth,
  pageHeight,
  showGrid,
  onSelect,
  onMove,
  onResize,
  onContextMenu,
  crossFilterValue,
  onCrossFilter,
  drillLevel,
  onDrillDown,
  onDragStart,
  onDragEnd,
}: CanvasItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [activeResizeDir, setActiveResizeDir] = useState<ResizeDirection | null>(null);
  const [resizeDimensions, setResizeDimensions] = useState<{ width: number; height: number } | null>(null);
  const { dispatch, state } = useStudio();

  const measureFormats = useMemo(
    () => buildMeasureFormatMap(state.dataModel?.measures),
    [state.dataModel]
  );

  const getChartTheme = (visual: Visual): 'dark' | 'light' | 'transparent' => {
    const chartTheme = visual.formatting?.chartTheme;
    if (chartTheme === 'dark' || chartTheme === 'light' || chartTheme === 'transparent') {
      return chartTheme;
    }
    return 'transparent';
  };

  const chartTheme = getChartTheme(visual);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (mode === 'viewer' || visual.locked) return;
    e.stopPropagation();
    if (!isSelected && !isMultiSelected) {
      onSelect(e);
    }

    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = { x: visual.x, y: visual.y };

    setIsDragging(true);
    onDragStart?.();

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startX) / zoom;
      const dy = (moveEvent.clientY - startY) / zoom;
      const clamped = clampToCanvas(
        startPos.x + dx,
        startPos.y + dy,
        visual.width,
        visual.height,
        pageWidth,
        pageHeight
      );
      const snappedX = showGrid ? snapToGrid(clamped.x) : clamped.x;
      const snappedY = showGrid ? snapToGrid(clamped.y) : clamped.y;
      onMove(snappedX, snappedY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onDragEnd?.();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [mode, visual.locked, isSelected, isMultiSelected, onSelect, onMove, visual.x, visual.y, zoom, visual.width, visual.height, pageWidth, pageHeight, showGrid]);

  const handleResizeStart = useCallback((e: React.MouseEvent, direction: ResizeDirection) => {
    if (mode === 'viewer' || visual.locked) return;
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = { x: visual.x, y: visual.y };
    const startSize = { width: visual.width, height: visual.height };
    const aspectRatio = startSize.width / startSize.height;

    setIsResizing(true);
    setActiveResizeDir(direction);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startX) / zoom;
      const dy = (moveEvent.clientY - startY) / zoom;

      let newX = startPos.x;
      let newY = startPos.y;
      let newWidth = startSize.width;
      let newHeight = startSize.height;

      if (direction.includes('e')) newWidth += dx;
      if (direction.includes('w')) { newWidth -= dx; newX += dx; }
      if (direction.includes('s')) newHeight += dy;
      if (direction.includes('n')) { newHeight -= dy; newY += dy; }

      if (moveEvent.shiftKey) {
        if (direction === 'e' || direction === 'w') {
          newHeight = newWidth / aspectRatio;
        } else if (direction === 'n' || direction === 's') {
          newWidth = newHeight * aspectRatio;
        } else {
          if (Math.abs(dx) > Math.abs(dy)) {
            newHeight = newWidth / aspectRatio;
          } else {
            newWidth = newHeight * aspectRatio;
          }
        }
      }

      newWidth = clampSize(newWidth, CANVAS_DEFAULTS.MIN_WIDGET_WIDTH);
      newHeight = clampSize(newHeight, CANVAS_DEFAULTS.MIN_WIDGET_HEIGHT);
      const clamped = clampToCanvas(newX, newY, newWidth, newHeight, pageWidth, pageHeight);
      const snappedX = showGrid ? snapToGrid(clamped.x) : clamped.x;
      const snappedY = showGrid ? snapToGrid(clamped.y) : clamped.y;
      newX = snappedX;
      newY = snappedY;

      onMove(newX, newY);
      onResize(newWidth, newHeight);
      setResizeDimensions({ width: Math.round(newWidth), height: Math.round(newHeight) });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setActiveResizeDir(null);
      setResizeDimensions(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [mode, visual.locked, onMove, onResize, visual, zoom, pageWidth, pageHeight, showGrid]);

  if (visual.hidden) return null;

  const cp = visual.canvasProperties || {};
  const showShell = cp.showShell !== false;

  const shellStyle: React.CSSProperties = {
    ...buildShellStyle(cp, visual, zoom),
  };

  return (
    <div
      ref={itemRef}
      className={`absolute ${isDragging ? 'opacity-80 cursor-grabbing' : visual.locked ? 'cursor-default' : 'cursor-grab'} ${isResizing ? 'opacity-90' : ''}`}
      style={{
        ...shellStyle,
        outline: isSelected ? `2px solid ${CANVAS_DEFAULTS.SELECTION_COLOR}` : isMultiSelected ? '2px solid #60a5fa' : 'none',
        outlineOffset: '2px',
      }}
      onMouseDown={handleMouseDown}
      onContextMenu={onContextMenu}
    >
      <VisualShell visual={visual}>
        <ChartRenderer
          visual={visual}
          queryState={queryState}
          crossFilterValue={crossFilterValue}
          onCrossFilter={onCrossFilter}
          drillLevel={drillLevel}
          onDrillDown={onDrillDown}
          measureFormats={measureFormats}
          theme={chartTheme}
        />
      </VisualShell>

      {isSelected && mode === 'editor' && !visual.locked && (
        <>
          <div className="absolute -top-3 right-0 flex items-center gap-1 z-20">
            <button
              onClick={(e) => { e.stopPropagation(); dispatch({ type: 'FOCUS_VISUAL', payload: visual.id }); }}
              className="w-5 h-5 bg-neutral-700 hover:bg-amber-500 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
              title="Maximizar (Focus mode)"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            </button>
            <div
              className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-[8px] font-bold shadow-md"
              title={VISUAL_TYPE_ICONS[visual.type]}
            >
              {visual.type.charAt(0).toUpperCase()}
            </div>
          </div>
          {RESIZE_DIRECTIONS.map(dir => (
            <div
              key={dir}
              className="absolute w-2 h-2 bg-amber-500 rounded-sm hover:bg-amber-400 z-10"
              style={{
                cursor: dir === 'n' || dir === 's' ? 'ns-resize' :
                  dir === 'e' || dir === 'w' ? 'ew-resize' :
                  dir === 'ne' || dir === 'sw' ? 'nesw-resize' : 'nwse-resize',
                ...getResizeHandlePosition(dir),
              }}
              onMouseDown={(e) => handleResizeStart(e, dir)}
            />
          ))}
        </>
      )}

      {isResizing && resizeDimensions && (
        <div
          className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-neutral-800 text-neutral-200 text-[10px] font-mono rounded shadow-lg pointer-events-none whitespace-nowrap z-50"
        >
          {resizeDimensions.width} × {resizeDimensions.height}
        </div>
      )}
    </div>
  );
}

function getResizeHandlePosition(dir: ResizeDirection): React.CSSProperties {
  const offset = -4;
  const center = '50%';
  const positions: Record<ResizeDirection, React.CSSProperties> = {
    n: { top: `${offset}px`, left: center, transform: 'translateX(-50%)' },
    s: { bottom: `${offset}px`, left: center, transform: 'translateX(-50%)' },
    e: { right: `${offset}px`, top: center, transform: 'translateY(-50%)' },
    w: { left: `${offset}px`, top: center, transform: 'translateY(-50%)' },
    ne: { top: `${offset}px`, right: `${offset}px` },
    nw: { top: `${offset}px`, left: `${offset}px` },
    se: { bottom: `${offset}px`, right: `${offset}px` },
    sw: { bottom: `${offset}px`, left: `${offset}px` },
  };
  return positions[dir];
}
