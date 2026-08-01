'use client';

import React, { useRef, useCallback, useState } from 'react';
import type { TableSchema } from '../../types/dashboard';
import { Hash, Type, Calendar, ToggleLeft, GripVertical } from 'lucide-react';

interface TableEntityProps {
  table: TableSchema;
  x: number;
  y: number;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  number: <Hash size={9} className="text-blue-400" />,
  string: <Type size={9} className="text-green-400" />,
  date: <Calendar size={9} className="text-purple-400" />,
  boolean: <ToggleLeft size={9} className="text-orange-400" />,
};

export function TableEntity({ table, x, y, isSelected, onSelect, onMove }: TableEntityProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, posX: x, posY: y };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - dragStart.current.x;
      const dy = moveEvent.clientY - dragStart.current.y;
      onMove(dragStart.current.posX + dx, dragStart.current.posY + dy);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [x, y, onSelect, onMove]);

  const headerColor = table.type === 'fact'
    ? 'bg-amber-600/20 border-b-amber-500/50'
    : 'bg-amber-600/20 border-b-amber-500/50';

  const headerText = table.type === 'fact' ? 'text-amber-400' : 'text-amber-300';

  return (
    <div
      className={`absolute w-[220px] rounded-lg shadow-xl border transition-shadow select-none
        ${isSelected ? 'border-amber-500 shadow-amber-500/20' : 'border-neutral-600 hover:border-neutral-500'}
        ${isDragging ? 'opacity-80' : ''}
      `}
      style={{ left: x, top: y, zIndex: isSelected ? 10 : 1 }}
      onMouseDown={handleMouseDown}
    >
      <div className={`flex items-center gap-2 px-3 py-2 rounded-t-lg border-b ${headerColor} cursor-grab active:cursor-grabbing`}>
        <GripVertical size={10} className="text-neutral-500" />
        <span className={`text-xs font-semibold ${headerText}`}>{table.label}</span>
        <span className="ml-auto text-[9px] text-neutral-500">{table.type === 'fact' ? 'Fato' : 'Dim'}</span>
      </div>
      <div className="bg-neutral-900 rounded-b-lg max-h-[200px] overflow-y-auto">
        {table.fields.map(field => (
          <div
            key={field.name}
            className="flex items-center gap-2 px-3 py-1 text-[11px] border-b border-neutral-800 last:border-0 hover:bg-neutral-800/50"
          >
            {TYPE_ICONS[field.type]}
            <span className="text-neutral-400 truncate">{field.label || field.name}</span>
            {field.isAggregatable && (
              <span className="ml-auto text-[8px] text-amber-400 bg-amber-400/10 px-1 rounded">#</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
