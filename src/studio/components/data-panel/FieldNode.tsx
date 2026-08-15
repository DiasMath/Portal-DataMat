'use client';

import React, { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useStudio } from '../../store/StudioContext';
import type { FieldSchema } from '../../types/dashboard';
import type { BucketField, VisualBuckets } from '../../types/visuals';
import { AGGREGATION_OPTIONS } from '../../types/visuals';
import { Settings, Trash2, FolderTree, Info } from 'lucide-react';

interface FieldNodeProps {
  tableName: string;
  tableLabel: string;
  field: FieldSchema;
  icon?: React.ReactNode;
}

const FIELD_TYPE_LABELS: Record<string, string> = {
  string: 'Texto',
  number: 'Número',
  date: 'Data',
  boolean: 'Booleano',
};

const FIELD_TYPE_COLORS: Record<string, string> = {
  string: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  number: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  date: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  boolean: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

export function FieldNode({ tableName, tableLabel, field, icon }: FieldNodeProps) {
  const { state, dispatch } = useStudio();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const selectedVisual = state.pages
    .find(p => p.id === state.activePageId)
    ?.visuals.find(v => v.id === state.selectedVisualId);

  const isChecked = selectedVisual ? isFieldInAnyBucket(selectedVisual.buckets as Record<string, BucketField[] | undefined>, tableName, field.name) : false;

  const sampleValues = useMemo(() => {
    const queryResult = state.queryResults[state.selectedVisualId || ''];
    if (!queryResult?.result?.rows) return [];
    const rows = queryResult.result.rows;
    const values = new Set<unknown>();
    for (const row of rows) {
      if (values.size >= 5) break;
      const val = row[field.name];
      if (val !== null && val !== undefined) values.add(val);
    }
    return Array.from(values).slice(0, 5);
  }, [state.queryResults, state.selectedVisualId, field.name]);

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

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: rect.right + 8, y: rect.top });
    setShowTooltip(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setShowTooltip(false);
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
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative flex items-center gap-1.5 px-2 py-1 text-xs rounded cursor-grab active:cursor-grabbing transition-colors
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
      <span className={`text-[8px] px-1 py-0.5 rounded shrink-0 ${FIELD_TYPE_COLORS[field.type] || 'bg-neutral-100 text-neutral-500'}`}>
        {FIELD_TYPE_LABELS[field.type] || field.type}
      </span>
      {field.isAggregatable && (
        <span className="text-[8px] text-muted-foreground shrink-0">Σ</span>
      )}

      {showTooltip && (
        <div
          ref={tooltipRef}
          className="fixed z-50 w-56 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl p-3 pointer-events-none"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <div className="text-xs font-medium text-foreground mb-1">{field.label || field.name}</div>
          <div className="text-[10px] text-muted-foreground mb-2">{tableName}</div>
          
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Info size={10} className="text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Tipo:</span>
              <span className={`text-[10px] px-1 py-0.5 rounded ${FIELD_TYPE_COLORS[field.type] || 'bg-neutral-100 text-neutral-500'}`}>
                {FIELD_TYPE_LABELS[field.type] || field.type}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Info size={10} className="text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Agregável:</span>
              <span className="text-[10px] text-foreground">{field.isAggregatable ? 'Sim' : 'Não'}</span>
            </div>

            {sampleValues.length > 0 && (
              <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                <div className="text-[10px] text-muted-foreground mb-1">Valores de exemplo:</div>
                <div className="flex flex-wrap gap-1">
                  {sampleValues.map((val, i) => (
                    <span key={i} className="text-[9px] px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-neutral-600 dark:text-neutral-400">
                      {String(val).slice(0, 20)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
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
                title="Remover do visual"
                aria-label="Remover do visual"
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
            title="Criar hierarquia"
            aria-label="Criar hierarquia"
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
