'use client';

import React, { useCallback } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useStudio } from '../../store/StudioContext';
import type { FieldSchema } from '../../types/dashboard';
import type { BucketField, VisualBuckets } from '../../types/visuals';

interface FieldNodeProps {
  tableName: string;
  tableLabel: string;
  field: FieldSchema;
  icon?: React.ReactNode;
}

export function FieldNode({ tableName, tableLabel, field, icon }: FieldNodeProps) {
  const { state, dispatch } = useStudio();

  const selectedVisual = state.pages
    .find(p => p.id === state.activePageId)
    ?.visuals.find(v => v.id === state.selectedVisualId);

  const isChecked = selectedVisual ? isFieldInAnyBucket(selectedVisual.buckets as Record<string, BucketField[] | undefined>, tableName, field.name) : false;

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${tableName}.${field.name}`,
    data: {
      type: 'field',
      tableName,
      tableLabel,
      fieldName: field.name,
      fieldType: field.type,
      isAggregatable: field.isAggregatable,
      label: field.label || field.name,
    },
  });

  const handleCheckboxChange = useCallback(() => {
    if (!selectedVisual) return;

    const buckets = selectedVisual.buckets as Record<string, BucketField[] | undefined>;
    const fieldEntry: BucketField = {
      tableName,
      fieldName: field.name,
      aggregation: field.isAggregatable ? 'SUM' : 'NONE',
    };

    if (isChecked) {
      for (const [bucketKey, bucketFields] of Object.entries(buckets)) {
        const idx = bucketFields?.findIndex((f: BucketField) => f.tableName === tableName && f.fieldName === field.name);
        if (idx !== undefined && idx >= 0) {
          dispatch({
            type: 'REMOVE_BUCKET_FIELD',
            payload: {
              visualId: selectedVisual.id,
              bucket: bucketKey as keyof VisualBuckets,
              index: idx,
            },
          });
          return;
        }
      }
    } else {
      const bucketKey = getDefaultBucketForField(selectedVisual.type, field);
      if (bucketKey) {
        dispatch({
          type: 'SET_BUCKET_FIELD',
          payload: {
            visualId: selectedVisual.id,
            bucket: bucketKey as keyof VisualBuckets,
            field: fieldEntry,
          },
        });
      }
    }
  }, [selectedVisual, tableName, field, isChecked, dispatch]);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded cursor-grab active:cursor-grabbing transition-colors
        ${isDragging ? 'opacity-50 bg-amber-100 dark:bg-amber-900/30' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}
      `}
    >
      <input
        type="checkbox"
        checked={isChecked}
        onChange={handleCheckboxChange}
        onClick={(e) => e.stopPropagation()}
        className="scale-75 shrink-0 border-neutral-300 text-amber-500 focus:ring-amber-500"
      />
      {icon}
      <span className="text-neutral-600 dark:text-neutral-400 truncate flex-1">
        {field.label || field.name}
      </span>
      {field.isAggregatable && (
        <span className="text-[8px] text-muted-foreground shrink-0">Σ</span>
      )}
    </div>
  );
}

function isFieldInAnyBucket(buckets: Record<string, BucketField[] | undefined>, tableName: string, fieldName: string): boolean {
  for (const bucketFields of Object.values(buckets)) {
    if (bucketFields?.some(f => f.tableName === tableName && f.fieldName === fieldName)) {
      return true;
    }
  }
  return false;
}

function getDefaultBucketForField(visualType: string, field: FieldSchema): string | null {
  const bucketMap: Record<string, string[]> = {
    bar: ['xAxis', 'values'],
    line: ['xAxis', 'values'],
    area: ['xAxis', 'values'],
    pie: ['xAxis', 'values'],
    donut: ['xAxis', 'values'],
    scatter: ['xAxis', 'yAxis'],
    table: ['details'],
    kpi: ['values'],
    card: ['values'],
    treemap: ['xAxis', 'values'],
    waterfall: ['xAxis', 'values'],
    combo: ['xAxis', 'values'],
  };

  const buckets = bucketMap[visualType] || ['values'];

  if (field.isAggregatable) {
    return buckets.includes('values') ? 'values' : buckets[1] || buckets[0];
  }

  return buckets[0];
}
