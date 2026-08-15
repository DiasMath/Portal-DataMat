'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Trash2, Pencil, Clock } from 'lucide-react';
import type { Measure } from '../../types/dashboard';
import type { StudioAction } from '../../types/state';

interface MeasureNodeProps {
  measure: Measure;
  dispatch: React.Dispatch<StudioAction>;
}

export const MeasureNode = React.memo(function MeasureNode({ measure, dispatch }: MeasureNodeProps) {
  const isTemporary = measure.isTemporary;

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

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'SELECT_MEASURE', payload: measure.id });
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={handleClick}
      className={`flex items-center gap-1.5 px-2 py-1 pl-5 text-xs rounded cursor-grab active:cursor-grabbing transition-colors group
        ${isDragging ? 'opacity-50 bg-amber-100 dark:bg-amber-900/30' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}
      `}
    >
      {/* Icon: fx for normal, clock for temporary */}
      {isTemporary ? (
        <span className="text-violet-400 shrink-0"><Clock size={10} /></span>
      ) : (
        <span className="text-amber-500 shrink-0">fx</span>
      )}

      {/* Name with dashed style for temporary */}
      <span className={`flex-1 truncate text-[10px] ${
        isTemporary
          ? 'text-violet-300 border-b border-dashed border-violet-500/50'
          : 'text-neutral-700 dark:text-neutral-300'
      }`}>
        {measure.name}
      </span>

      {/* TEMP badge */}
      {isTemporary && (
        <span className="text-[8px] text-violet-400 bg-violet-500/10 px-1 rounded shrink-0">
          TEMP
        </span>
      )}

      {/* Actions */}
      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); dispatch({ type: 'OPEN_MEASURE_EDITOR', payload: measure.id }); }}
          className="text-muted-foreground hover:text-foreground"
          title="Editar medida"
          aria-label="Editar medida"
        >
          <Pencil size={8} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); dispatch({ type: 'REMOVE_MEASURE', payload: measure.id }); }}
          className="text-muted-foreground hover:text-red-400"
          title="Excluir medida"
          aria-label="Excluir medida"
        >
          <Trash2 size={8} />
        </button>
      </div>
    </div>
  );
});
