'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
import type { Visual, VisualQueryState } from '../../types/dashboard';
import { CANVAS_DEFAULTS, clampSize, snapToGrid, type ResizeDirection } from '../../types/canvas';
import { ChartRenderer } from '../charts/ChartRenderer';

interface CanvasItemProps {
  visual: Visual;
  isSelected: boolean;
  isMultiSelected?: boolean;
  zoom: number;
  queryState?: VisualQueryState;
  mode: 'editor' | 'viewer';
  onSelect: (e?: React.MouseEvent) => void;
  onMove: (x: number, y: number) => void;
  onResize: (width: number, height: number) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

const RESIZE_DIRECTIONS: ResizeDirection[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

export function CanvasItem({
  visual,
  isSelected,
  isMultiSelected,
  zoom,
  queryState,
  mode,
  onSelect,
  onMove,
  onResize,
  onContextMenu,
}: CanvasItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [activeResizeDir, setActiveResizeDir] = useState<ResizeDirection | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (mode === 'viewer' || visual.locked) return;
    e.stopPropagation();
    onSelect(e);

    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = { x: visual.x, y: visual.y };

    setIsDragging(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startX) / zoom;
      const dy = (moveEvent.clientY - startY) / zoom;
      const newX = Math.max(0, startPos.x + dx);
      const newY = Math.max(0, startPos.y + dy);
      onMove(newX, newY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [mode, visual.locked, onSelect, onMove, visual.x, visual.y, zoom]);

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
      newX = Math.max(0, newX);
      newY = Math.max(0, newY);

      onMove(newX, newY);
      onResize(newWidth, newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setActiveResizeDir(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [mode, visual.locked, onMove, onResize, visual, zoom]);

  if (visual.hidden) return null;

  return (
    <div
      ref={itemRef}
      className={`absolute bg-white dark:bg-neutral-800 rounded-lg shadow-md border-2
        ${isSelected ? 'border-amber-500 shadow-amber-500/20' : isMultiSelected ? 'border-blue-400 shadow-blue-400/20' : 'border-transparent hover:border-neutral-300 dark:hover:border-neutral-600'}
        ${isDragging ? 'opacity-80 cursor-grabbing' : visual.locked ? 'cursor-default' : 'cursor-grab'}
        ${isResizing ? 'opacity-90' : ''}
      `}
      style={{
        left: `${visual.x * zoom}px`,
        top: `${visual.y * zoom}px`,
        width: `${visual.width * zoom}px`,
        height: `${visual.height * zoom}px`,
        zIndex: visual.zIndex,
      }}
      onMouseDown={handleMouseDown}
      onContextMenu={onContextMenu}
    >
      {visual.showTitle && (
        <div className="px-3 py-1.5 border-b border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate">
          {visual.title}
        </div>
      )}

      <div className="flex-1 overflow-hidden p-2" style={{ height: visual.showTitle ? 'calc(100% - 32px)' : '100%' }}>
        <ChartRenderer
          visual={visual}
          queryState={queryState}
          width={visual.width - 20}
          height={visual.height - (visual.showTitle ? 52 : 20)}
        />
      </div>

      {isSelected && mode === 'editor' && !visual.locked && (
        <>
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
