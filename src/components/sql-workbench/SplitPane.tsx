'use client';

import { useState, useRef, useCallback, ReactNode } from 'react';

interface SplitPaneProps {
  left: ReactNode;
  right: ReactNode;
  direction: 'horizontal' | 'vertical';
  initialSize?: number;
  minSize?: number;
  maxSize?: number;
}

export function SplitPane({
  left,
  right,
  direction,
  initialSize = 50,
  minSize = 20,
  maxSize = 80,
}: SplitPaneProps) {
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      if (direction === 'horizontal') {
        const containerWidth = containerRef.current.clientWidth;
        const newSize = (e.clientX / containerWidth) * 100;
        setSize(Math.max(minSize, Math.min(maxSize, newSize)));
      } else {
        const containerHeight = containerRef.current.clientHeight;
        const newSize = (e.clientY / containerHeight) * 100;
        setSize(Math.max(minSize, Math.min(maxSize, newSize)));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [direction, minSize, maxSize]);

  const isHorizontal = direction === 'horizontal';

  const firstStyle = isHorizontal
    ? { width: `${size}%`, overflow: 'hidden' as const }
    : { height: `${size}%`, overflow: 'hidden' as const };

  const secondStyle = isHorizontal
    ? { width: `${100 - size}%`, overflow: 'hidden' as const }
    : { height: `${100 - size}%`, overflow: 'hidden' as const };

  const containerClass = isHorizontal
    ? 'flex flex-row flex-1 h-full'
    : 'flex flex-col flex-1 h-full';

  const dividerClass = isHorizontal
    ? 'w-1 bg-border hover:bg-primary/50 cursor-col-resize flex-shrink-0 transition-colors'
    : 'h-1 bg-border hover:bg-primary/50 cursor-row-resize flex-shrink-0 transition-colors';

  return (
    <div ref={containerRef} className={containerClass}>
      <div style={firstStyle}>{left}</div>
      <div
        className={dividerClass}
        onMouseDown={handleMouseDown}
      />
      <div style={secondStyle}>{right}</div>
    </div>
  );
}