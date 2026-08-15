'use client';

import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, LineChart, PieChart, ScatterChart, GaugeChart, RadarChart, FunnelChart, TreemapChart, SankeyChart, SunburstChart, BoxplotChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, MarkLineComponent, MarkAreaComponent, MarkPointComponent, TitleComponent } from 'echarts/components';

use([
  CanvasRenderer,
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  GaugeChart,
  RadarChart,
  FunnelChart,
  TreemapChart,
  SankeyChart,
  SunburstChart,
  BoxplotChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  MarkLineComponent,
  MarkAreaComponent,
  MarkPointComponent,
  TitleComponent,
]);

export { default as ReactECharts } from 'echarts-for-react';
