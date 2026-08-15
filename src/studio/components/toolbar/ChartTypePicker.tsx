'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { VisualType } from '../../types/visuals';
import { VISUAL_TYPE_LABELS } from '../../types/visuals';
import {
  BarChart3, LineChart, AreaChart, PieChart, Circle, ScatterChart,
  Table, Hash, CreditCard, Gauge, TreePine, TrendingDown, Combine,
  Radar as RadarIcon, Filter, Waypoints, Grid3x3, Target, Sun,
  GitBranch, Cloud, Box, BarChart2, Disc, CircleDot, MoreHorizontal,
} from 'lucide-react';
import { VisualGalleryDialog } from './VisualGalleryDialog';

interface ChartTypePickerProps {
  onSelect: (type: VisualType) => void;
  onClose: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  bar: <BarChart3 size={16} />,
  line: <LineChart size={16} />,
  area: <AreaChart size={16} />,
  pie: <PieChart size={16} />,
  donut: <Circle size={16} />,
  scatter: <ScatterChart size={16} />,
  table: <Table size={16} />,
  kpi: <Hash size={16} />,
  card: <CreditCard size={16} />,
  gauge: <Gauge size={16} />,
  treemap: <TreePine size={16} />,
  waterfall: <TrendingDown size={16} />,
  combo: <Combine size={16} />,
  radar: <RadarIcon size={16} />,
  funnel: <Filter size={16} />,
  ribbon: <Waypoints size={16} />,
  matrix: <Grid3x3 size={16} />,
  bullet: <Target size={16} />,
  sunburst: <Sun size={16} />,
  sankey: <GitBranch size={16} />,
  wordcloud: <Cloud size={16} />,
  boxplot: <Box size={16} />,
  histogram: <BarChart2 size={16} />,
  dotplot: <Disc size={16} />,
  lollipop: <CircleDot size={16} />,
};

const DEFAULT_VISUALS: VisualType[] = [
  'bar', 'line', 'area', 'pie',
  'donut', 'scatter', 'table', 'kpi',
  'card', 'treemap', 'waterfall', 'combo',
  'radar', 'funnel', 'ribbon', 'matrix',
];

export function ChartTypePicker({ onSelect, onClose }: ChartTypePickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [showGallery, setShowGallery] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (showGallery) {
    return (
      <VisualGalleryDialog
        onSelect={(type) => { onSelect(type); onClose(); }}
        onClose={() => setShowGallery(false)}
      />
    );
  }

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-1 bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 p-2 z-50 w-56"
    >
      <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 mb-1.5">
        Tipo de Visual
      </div>
      <div className="grid grid-cols-4 gap-1">
        {DEFAULT_VISUALS.map((type) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title={VISUAL_TYPE_LABELS[type]}
          >
            {ICON_MAP[type]}
          </button>
        ))}
      </div>
      <button
        onClick={() => setShowGallery(true)}
        className="w-full flex items-center justify-center gap-1 mt-1 py-1.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors border-t border-neutral-200 dark:border-neutral-700 pt-2"
      >
        <MoreHorizontal size={12} />
        Mais visuais
      </button>
    </div>
  );
}
