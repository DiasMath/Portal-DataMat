'use client';

import React, { useEffect, useRef } from 'react';
import type { VisualType } from '../../types/visuals';
import { VISUAL_TYPE_LABELS } from '../../types/visuals';
import {
  BarChart3,
  LineChart,
  AreaChart,
  PieChart,
  Circle,
  ScatterChart,
  Table,
  Hash,
  CreditCard,
  Gauge,
  TreePine,
  TrendingDown,
  Combine,
} from 'lucide-react';

interface ChartTypePickerProps {
  onSelect: (type: VisualType) => void;
  onClose: () => void;
}

const CHART_TYPES: { type: VisualType; icon: React.ReactNode }[] = [
  { type: 'bar', icon: <BarChart3 size={16} /> },
  { type: 'line', icon: <LineChart size={16} /> },
  { type: 'area', icon: <AreaChart size={16} /> },
  { type: 'pie', icon: <PieChart size={16} /> },
  { type: 'donut', icon: <Circle size={16} /> },
  { type: 'scatter', icon: <ScatterChart size={16} /> },
  { type: 'table', icon: <Table size={16} /> },
  { type: 'kpi', icon: <Hash size={16} /> },
  { type: 'card', icon: <CreditCard size={16} /> },
  { type: 'treemap', icon: <TreePine size={16} /> },
  { type: 'waterfall', icon: <TrendingDown size={16} /> },
  { type: 'combo', icon: <Combine size={16} /> },
];

export function ChartTypePicker({ onSelect, onClose }: ChartTypePickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-1 bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 p-2 z-50 w-48"
    >
      <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 mb-1.5">
        Tipo de Visual
      </div>
      <div className="grid grid-cols-3 gap-1">
        {CHART_TYPES.map(({ type, icon }) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            {icon}
            <span className="text-[9px] text-muted-foreground leading-tight text-center">
              {VISUAL_TYPE_LABELS[type]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
