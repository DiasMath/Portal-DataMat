'use client';

import React from 'react';
import { formatTooltipValue, type MeasureFormat } from '../../lib/format';

export { formatTooltipValue };

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: unknown;
    color?: string;
    measureFormat?: MeasureFormat;
  }>;
  label?: string;
  formatter?: (value: unknown, name: string, measureFormat?: MeasureFormat) => [string, string];
}

export function ChartTooltip({ active, payload, label, formatter }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg px-3 py-2 min-w-[120px]">
      {label && (
        <p className="text-[11px] font-semibold text-foreground mb-1 border-b border-neutral-100 dark:border-neutral-700 pb-1">
          {label}
        </p>
      )}
      <div className="space-y-0.5">
        {payload.map((entry, index) => {
          const [displayValue, displayName] = formatter
            ? formatter(entry.value, entry.name, entry.measureFormat)
            : formatTooltipValue(entry.value, entry.name, entry.measureFormat);
          return (
            <div key={index} className="flex items-center gap-2 text-[11px]">
              {entry.color && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
              )}
              <span className="text-muted-foreground flex-1">{displayName}</span>
              <span className="font-medium text-foreground">{displayValue}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
