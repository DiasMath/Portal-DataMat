'use client';

import React, { useCallback, useRef } from 'react';

interface PanelResizerProps {
  direction: 'left' | 'right';
  currentSize: number;
  onResize: (size: number) => void;
  minSize?: number;
  maxSize?: number;
}

export function PanelResizer({
  direction,
  currentSize,
  onResize,
  minSize = 180,
  maxSize = 450,
}: PanelResizerProps) {
  const isDragging = useRef(false);
  const startPos = useRef(0);
  const startSize = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    startPos.current = e.clientX;
    startSize.current = currentSize;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = direction === 'right'
        ? moveEvent.clientX - startPos.current
        : startPos.current - moveEvent.clientX;
      const newSize = Math.max(minSize, Math.min(maxSize, startSize.current + delta));
      onResize(newSize);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [currentSize, direction, minSize, maxSize, onResize]);

  return (
    <div
      onMouseDown={handleMouseDown}
      className="w-1 shrink-0 cursor-col-resize hover:bg-amber-500/50 active:bg-amber-500/70 transition-colors relative group"
    >
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-neutral-700 group-hover:bg-amber-500 transition-colors" />
    </div>
  );
}
