'use client';

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useStudio } from '../../store/StudioContext';
import type { FieldSchema } from '../../types/dashboard';
import type { BucketField, VisualBuckets } from '../../types/visuals';
import { AGGREGATION_OPTIONS } from '../../types/visuals';
import { Settings, Trash2, FolderTree } from 'lucide-react';

interface FieldNodeProps {
  tableName: string;
  tableLabel: string;
  field: FieldSchema;
  icon?: React.ReactNode;
}

export function FieldNode({ tableName, tableLabel, field, icon }: FieldNodeProps) {
  const { state, dispatch } = useStudio();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [contextMenu]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

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

  const handleRemoveFromVisual = useCallback(() => {
    if (!selectedVisual) return;
    const buckets = selectedVisual.buckets as Record<string, BucketField[] | undefined>;
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
    setContextMenu(null);
  }, [selectedVisual, tableName, field, dispatch]);

  const handleChangeAggregation = useCallback((agg: BucketField['aggregation']) => {
    if (!selectedVisual) return;
    const buckets = selectedVisual.buckets as Record<string, BucketField[] | undefined>;
    for (const [bucketKey, bucketFields] of Object.entries(buckets)) {
      const idx = bucketFields?.findIndex((f: BucketField) => f.tableName === tableName && f.fieldName === field.name);
      if (idx !== undefined && idx >= 0 && bucketFields) {
        dispatch({
          type: 'SET_BUCKET_FIELD',
          payload: {
            visualId: selectedVisual.id,
            bucket: bucketKey as keyof VisualBuckets,
            field: { ...bucketFields[idx], aggregation: agg },
            index: idx,
          },
        });
        return;
      }
    }
    setContextMenu(null);
  }, [selectedVisual, tableName, field, dispatch]);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onContextMenu={handleContextMenu}
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

      {contextMenu && (
        <div
          ref={menuRef}
          className="fixed z-50 min-w-[160px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl py-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {selectedVisual && isChecked && (
            <>
              <button
                onClick={handleRemoveFromVisual}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <Trash2 size={12} />
                Remover do visual
              </button>
              {field.isAggregatable && (
                <div className="px-3 py-1.5">
                  <div className="text-[10px] text-muted-foreground mb-1">Agregação</div>
                  <select
                    onChange={(e) => handleChangeAggregation(e.target.value as BucketField['aggregation'])}
                    className="w-full text-xs bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 px-2 py-1"
                    defaultValue="SUM"
                  >
                    {AGGREGATION_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
          <button
            onClick={() => setContextMenu(null)}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <FolderTree size={12} />
            Criar hierarquia (em breve)
          </button>
        </div>
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
