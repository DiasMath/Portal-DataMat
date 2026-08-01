'use client';

import React from 'react';
import type { QueryResultData, VisualFormatting } from '../../types/visuals';

interface KpiCardProps {
  data: QueryResultData;
  formatting: VisualFormatting;
  width: number;
  height: number;
}

export function KpiCard({ data, formatting, width, height }: KpiCardProps) {
  if (!data || data.rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        Arraste um campo numérico para Valores
      </div>
    );
  }

  const valueKey = data.columns[0];
  const rawValue = data.rows[0]?.[valueKey];
  const numericValue = typeof rawValue === 'number' ? rawValue : Number(rawValue);

  const formattedValue = isNaN(numericValue)
    ? String(rawValue)
    : numericValue.toLocaleString('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });

  return (
    <div className="flex flex-col items-center justify-center h-full gap-1">
      <span
        className="font-bold text-neutral-900 dark:text-white"
        style={{ fontSize: Math.max(20, Math.min(48, height * 0.35)) }}
      >
        {formattedValue}
      </span>
      {data.columns[0] && (
        <span className="text-xs text-muted-foreground text-center px-2">
          {data.columns[0]}
        </span>
      )}
    </div>
  );
}
