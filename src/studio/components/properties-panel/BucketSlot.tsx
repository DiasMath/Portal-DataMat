'use client';

import React from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { useStudio } from '../../store/StudioContext';
import type { BucketField, VisualType, VisualBuckets } from '../../types/visuals';
import { AGGREGATION_OPTIONS } from '../../types/visuals';
import { X, GripVertical } from 'lucide-react';

interface DraggableFieldProps {
  field: BucketField;
  index: number;
  visualId: string;
  bucketKey: string;
  isNumericBucket: boolean;
}

function DraggableField({ field, index, visualId, bucketKey, isNumericBucket }: DraggableFieldProps) {
  const { dispatch } = useStudio();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `bucket-field-${visualId}-${bucketKey}-${index}`,
    data: {
      type: 'bucket-field',
      tableName: field.tableName,
      fieldName: field.fieldName,
      aggregation: field.aggregation,
      label: field.aggregation && field.aggregation !== 'NONE' ? `${field.aggregation}(${field.fieldName})` : field.fieldName,
      sourceVisualId: visualId,
      sourceBucket: bucketKey,
      sourceIndex: index,
    },
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({
      type: 'REMOVE_BUCKET_FIELD',
      payload: { visualId, bucket: bucketKey as keyof VisualBuckets, index },
    });
  };

  const handleAggregationChange = (aggregation: BucketField['aggregation']) => {
    dispatch({
      type: 'SET_BUCKET_FIELD',
      payload: {
        visualId,
        bucket: bucketKey as keyof VisualBuckets,
        field: { ...field, aggregation },
        index,
      },
    });
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-1.5 bg-white dark:bg-neutral-700 rounded px-2 py-1 text-xs border border-neutral-200 dark:border-neutral-600 cursor-grab active:cursor-grabbing transition-opacity
        ${isDragging ? 'opacity-40 ring-2 ring-amber-400' : ''}
      `}
    >
      <GripVertical size={8} className="text-muted-foreground shrink-0" />
      <span className="flex-1 truncate text-neutral-700 dark:text-neutral-300">
        {field.aggregation && field.aggregation !== 'NONE' ? `${field.aggregation}(${field.fieldName})` : field.fieldName}
      </span>
      {isNumericBucket && field.aggregation && (
        <select
          value={field.aggregation}
          onChange={(e) => handleAggregationChange(e.target.value as BucketField['aggregation'])}
          onClick={(e) => e.stopPropagation()}
          className="text-[8px] bg-transparent border-none text-muted-foreground focus:outline-none cursor-pointer"
        >
          {AGGREGATION_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}
      <button
        onClick={handleRemove}
        className="text-muted-foreground hover:text-red-500 transition-colors shrink-0"
      >
        <X size={8} />
      </button>
    </div>
  );
}

interface BucketSlotProps {
  bucketKey: string;
  label: string;
  fields: BucketField[];
  visualId: string;
  visualType: VisualType;
  isNumericBucket?: boolean;
}

export function BucketSlot({ bucketKey, label, fields, visualId, visualType, isNumericBucket }: BucketSlotProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `bucket-${visualId}-${bucketKey}`,
    data: {
      type: 'bucket',
      visualId,
      bucketKey,
      isNumericBucket,
    },
  });

  return (
    <div>
      <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 px-1">
        {label}
      </div>
      <div
        ref={setNodeRef}
        className={`min-h-[32px] rounded border border-dashed p-1.5 transition-colors
          ${isOver
            ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20'
            : fields.length > 0
              ? 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50'
              : 'border-neutral-200 dark:border-neutral-700 bg-transparent'
          }
        `}
      >
        {fields.length === 0 ? (
          <div className="flex items-center justify-center h-6 text-[10px] text-muted-foreground">
            Arraste campos aqui
          </div>
        ) : (
          <div className="space-y-1">
            {fields.map((field, index) => (
              <DraggableField
                key={`${field.tableName}.${field.fieldName}-${index}`}
                field={field}
                index={index}
                visualId={visualId}
                bucketKey={bucketKey}
                isNumericBucket={isNumericBucket || false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
