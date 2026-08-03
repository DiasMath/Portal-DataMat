'use client';

import React from 'react';
import type { QueryResultData, VisualFormatting } from '../../types/visuals';

interface GaugeChartProps {
  data: QueryResultData;
  formatting: VisualFormatting;
  width: number;
  height: number;
}

export function GaugeChart({ data, formatting, width, height }: GaugeChartProps) {
  if (!data || data.columns.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        Arraste um campo para Valores
      </div>
    );
  }

  const valueKey = data.columns[data.columns.length - 1];
  const rawValue = data.rows[0]?.[valueKey];
  const value = typeof rawValue === 'number' ? rawValue : Number(rawValue) || 0;
  const min = formatting.gaugeMin ?? 0;
  const max = formatting.gaugeMax ?? 100;
  const target = formatting.gaugeTarget;
  const pct = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const angle = -90 + pct * 180;
  const color = formatting.gaugeColor || '#f59e0b';

  const r = Math.min(width, height) * 0.35;
  const cx = width / 2;
  const cy = height * 0.65;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-end pb-2">
      <svg width={width} height={height * 0.7} viewBox={`0 0 ${width} ${height * 0.7}`}>
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#374151"
          strokeWidth={12}
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={`${pct * Math.PI * r} ${Math.PI * r}`}
        />
        {target !== undefined && (() => {
          const targetPct = Math.min(1, Math.max(0, (target - min) / (max - min)));
          const targetAngle = -90 + targetPct * 180;
          const rad = (targetAngle * Math.PI) / 180;
          const tx = cx + (r - 10) * Math.cos(rad);
          const ty = cy + (r - 10) * Math.sin(rad);
          return <circle cx={tx} cy={ty} r={4} fill="#ef4444" />;
        })()}
        <text x={cx} y={cy - 10} textAnchor="middle" fill="white" fontSize={24} fontWeight="bold">
          {value.toLocaleString()}
        </text>
        <text x={cx - r} y={cy + 18} textAnchor="middle" fill="#9ca3af" fontSize={10}>{min}</text>
        <text x={cx + r} y={cy + 18} textAnchor="middle" fill="#9ca3af" fontSize={10}>{max}</text>
      </svg>
    </div>
  );
}
