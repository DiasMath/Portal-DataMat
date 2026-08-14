'use client';

import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import type { EChartsOption } from 'echarts';
import { ReactECharts } from '../../lib/echarts/registry';
import { getEChartsTheme, type ThemeMode } from '../../lib/echarts/theme';

interface EChartWrapperProps {
  option: EChartsOption;
  width?: number;
  height?: number;
  theme?: ThemeMode;
  animation?: boolean;
  notMerge?: boolean;
  lazyUpdate?: boolean;
  onEvents?: Record<string, (params: unknown) => void>;
  className?: string;
  style?: React.CSSProperties;
}

export const EChartWrapper = React.memo(function EChartWrapper({
  option,
  width,
  height,
  theme = 'transparent',
  animation = false,
  notMerge = true,
  lazyUpdate = true,
  onEvents,
  className,
  style,
}: EChartWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: width || 300,
    height: height || 200,
  });

  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDimensions({ width: rect.width, height: rect.height });
      }
    }
  }, []);

  useEffect(() => {
    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, [updateDimensions]);

  // Force re-measure when width/height props change (fallback)
  useEffect(() => {
    if (width && height) {
      setDimensions({ width, height });
    }
  }, [width, height]);

  const themeConfig = useMemo(() => getEChartsTheme(theme), [theme]);

  const mergedOption = useMemo(() => {
    return {
      ...themeConfig,
      ...option,
      animation,
      tooltip: {
        ...(themeConfig as Record<string, unknown>).tooltip as object,
        ...(option.tooltip as object),
        appendToBody: true,
      },
    };
  }, [option, themeConfig, animation]);

  // Use a key based on dimensions to force ReactECharts to re-render with correct size
  const chartKey = `${dimensions.width}-${dimensions.height}`;

  return (
    <div ref={containerRef} className={className} style={{ width: '100%', height: '100%', ...style }}>
      <ReactECharts
        key={chartKey}
        option={mergedOption}
        style={{ width: dimensions.width, height: dimensions.height }}
        notMerge={notMerge}
        lazyUpdate={lazyUpdate}
        onEvents={onEvents}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  );
});
