'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Trash2, Pencil } from 'lucide-react';
import type { Measure } from '../../types/dashboard';

interface MeasureNodeProps {
  measure: Measure;
  dispatch: React.Dispatch<any>;
}

interface MeasureNodeProps {
  measure: Measure;
  dispatch: React.Dispatch<any>;
}

export function MeasureNode({ measure, dispatch }: MeasureNodeProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `measure-${measure.id}`,
    data: {
      type: 'measure',
      measureId: measure.id,
      fieldName: measure.name,
      fieldType: 'numeric',
      label: measure.name,
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-1.5 px-2 py-1 pl-5 text-xs rounded cursor-grab active:cursor-grabbing transition-colors group
        ${isDragging ? 'opacity-50 bg-amber-100 dark:bg-amber-900/30' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}
      `}
    >
      <span className="text-amber-500 shrink-0">fx</span>
      <span className="flex-1 text-neutral-700 dark:text-neutral-300 truncate text-[10px]">{measure.name}</span>
      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0">
        <button
          onClick={() => dispatch({ type: 'OPEN_MEASURE_EDITOR', payload: measure.id })}
          className="text-muted-foreground hover:text-foreground"
        >
          <Pencil size={8} />
        </button>
        <button onClick={() => dispatch({ type: 'REMOVE_MEASURE', payload: measure.id })} className="text-muted-foreground hover:text-red-400"><Trash2 size={8} /></button>
      </div>
    </div>
  );
}
