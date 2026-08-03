'use client';

import React from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import type { QueryResultData, VisualFormatting } from '../../types/visuals';

/* eslint-disable @typescript-eslint/no-explicit-any */
const TreemapContent = (props: any) => {
  const x = Number(props.x) || 0;
  const y = Number(props.y) || 0;
  const width = Number(props.width) || 0;
  const height = Number(props.height) || 0;
  const name = String(props.name || '');
  const index = Number(props.index) || 0;
  const colors = props._colors || ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
  if (width < 20 || height < 16) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={colors[index % colors.length]} rx={2} opacity={0.85} />
      {width > 40 && height > 20 && (
        <text x={x + 6} y={y + 16} fill="white" fontSize={11} fontWeight="500">
          {name.slice(0, Math.floor(width / 7))}
        </text>
      )}
    </g>
  );
};

interface TreemapChartProps {
  data: QueryResultData;
  formatting: VisualFormatting;
  width: number;
  height: number;
  crossFilterValue?: unknown;
  onCrossFilter?: (fieldName: string, value: unknown) => void;
}

const DEFAULT_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export function TreemapChart({ data, formatting, width, height, crossFilterValue, onCrossFilter }: TreemapChartProps) {
  if (!data || data.columns.length < 2) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        Arraste um campo para Nome e um para Valores
      </div>
    );
  }

  const nameKey = data.columns[0];
  const valueKey = data.columns[1];
  const colors = formatting.colorPalette || DEFAULT_COLORS;

  const treeData = data.rows.map((row, i) => ({
    name: String(row[nameKey] ?? ''),
    size: Number(row[valueKey]) || 0,
    fill: colors[i % colors.length],
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <Treemap
        data={treeData}
        dataKey="size"
        nameKey="name"
        stroke="#1f2937"
        fill="#111827"
        content={<TreemapContent _colors={colors} />}
      />
    </ResponsiveContainer>
  );
}
