'use client';

import React from 'react';
import type { QueryResultData, VisualFormatting } from '../../types/visuals';
import { formatMeasureValue, type MeasureFormat } from '../../lib/format';
import { ReactECharts } from '../../lib/echarts/registry';

interface KpiCardProps {
  data: QueryResultData;
  formatting: VisualFormatting;
  width?: number;
  height?: number;
  measureFormats?: Record<string, MeasureFormat>;
}

export function KpiCard({ data, formatting, width, height, measureFormats }: KpiCardProps) {
  if (!data || data.rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        Arraste um campo numerico para Valores
      </div>
    );
  }

  const valueKey = data.columns[0];
  const rawValue = data.rows[0]?.[valueKey];
  const numericValue = typeof rawValue === 'number' ? rawValue : Number(rawValue);

  const measureFormat = measureFormats?.[valueKey];
  const formattedValue = measureFormat
    ? formatMeasureValue(rawValue, measureFormat.format, measureFormat.decimalPlaces)
    : isNaN(numericValue)
      ? String(rawValue)
      : numericValue.toLocaleString('pt-BR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: formatting.kpiDecimals ?? 0,
        });

  const sparkData = data.rows.slice(0, 20).map(row => Number(row[valueKey] ?? 0));
  const showSparkline = data.rows.length > 1 && formatting.showTrendIcon !== false;

  const trend = sparkData.length >= 2
    ? sparkData[sparkData.length - 1] > sparkData[0] ? 'up' : 'down'
    : null;

  return (
    <div
      className="flex flex-col items-center justify-center h-full gap-1"
      style={{
        padding: formatting.kpiPadding ?? 24,
        borderRadius: formatting.kpiBorderRadius ?? 12,
      }}
    >
      <span
        style={{
          fontSize: formatting.kpiFontSize ?? 48,
          color: formatting.kpiColor ?? '#1a1a2e',
          fontWeight: formatting.kpiFontWeight ?? '700',
          fontFamily: formatting.kpiFontFamily ?? 'Inter',
          fontStyle: formatting.kpiFontStyle,
        }}
      >
        {formattedValue}
      </span>
      {data.columns[0] && (
        <span
          style={{
            fontSize: formatting.kpiSubtitleFontSize ?? 13,
            color: formatting.kpiSubtitleColor ?? '#666',
            fontWeight: formatting.kpiSubtitleFontWeight ?? '500',
            fontFamily: formatting.kpiSubtitleFontFamily,
            fontStyle: formatting.kpiSubtitleFontStyle,
            marginBottom: formatting.kpiSubtitleMarginBottom ?? 12,
            textAlign: 'center',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '100%',
          }}
        >
          {data.columns[0]}
        </span>
      )}
      {showSparkline && sparkData.length > 1 && (
        <div className="w-full flex-1 min-h-0">
          <ReactECharts
            option={{
              grid: { left: 0, right: 0, top: 0, bottom: 0 },
              xAxis: { type: 'category', show: false, data: sparkData.map((_, i) => i) },
              yAxis: { type: 'value', show: false },
              series: [{
                type: 'line',
                data: sparkData,
                smooth: true,
                symbol: 'none',
                lineStyle: { width: formatting.kpiSparklineWidth ?? 1.5, color: trend === 'up' ? (formatting.kpiTrendUpColor ?? '#10b981') : (formatting.kpiTrendDownColor ?? '#ef4444') },
                areaStyle: {
                  color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                      { offset: 0, color: trend === 'up' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)' },
                      { offset: 1, color: 'transparent' },
                    ],
                  },
                },
              }],
            }}
            style={{ width: '100%', height: '100%' }}
            opts={{ renderer: 'canvas' }}
            notMerge
          />
        </div>
      )}
      {trend && formatting.showTrendIcon !== false && (
        <span
          style={{
            fontSize: formatting.kpiIconSize ?? 32,
            color: formatting.kpiIconColor ?? '#1890ff',
          }}
        >
          {trend === 'up' ? '↑' : '↓'}
        </span>
      )}
    </div>
  );
}
