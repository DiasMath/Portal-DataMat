import type { VisualType } from '../../types/visuals';

export interface FormattingField {
  key: string;
  label: string;
  type: 'number' | 'text' | 'color' | 'select' | 'checkbox';
  options?: { value: string; label: string }[];
  path: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  visible?: (vType: VisualType) => boolean;
}

export interface FormattingSectionDef {
  id: string;
  label: string;
  icon: string;
  visible: (vType: VisualType) => boolean;
  fields: FormattingField[];
}

const AXIS_CHARTS: VisualType[] = ['bar', 'line', 'area', 'scatter', 'combo', 'lollipop', 'dotplot', 'boxplot'];
const LINE_CHARTS: VisualType[] = ['line', 'area'];
const BAR_CHARTS: VisualType[] = ['bar', 'combo', 'waterfall', 'lollipop'];

const FONT_WEIGHT_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'bold', label: 'Negrito' },
];

const FONT_STYLE_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'italic', label: 'Italico' },
];

const POSITION_OPTIONS = [
  { value: 'top', label: 'Cima' },
  { value: 'bottom', label: 'Baixo' },
  { value: 'left', label: 'Esquerda' },
  { value: 'right', label: 'Direita' },
];

const ALIGNMENT_OPTIONS = [
  { value: 'left', label: 'Esquerda' },
  { value: 'center', label: 'Centro' },
  { value: 'right', label: 'Direita' },
];

export const FORMATTING_SECTIONS: FormattingSectionDef[] = [
  {
    id: 'titulo',
    label: 'Titulo',
    icon: 'Type',
    visible: () => true,
    fields: [
      { key: 'title', label: 'Titulo', type: 'text', path: 'title', placeholder: 'Titulo do visual' },
      { key: 'showTitle', label: 'Mostrar titulo', type: 'checkbox', path: 'showTitle' },
      { key: 'headerMode', label: 'Modo', type: 'select', path: 'canvas.headerMode', options: [
        { value: 'hover', label: 'Mostrar no hover' },
        { value: 'always', label: 'Sempre mostrar' },
        { value: 'never', label: 'Nunca mostrar' },
      ]},
      { key: 'headerHeight', label: 'Altura', type: 'number', path: 'canvas.headerHeight', min: 20, max: 60 },
      { key: 'headerBackgroundColor', label: 'Cor de fundo', type: 'color', path: 'canvas.headerBackgroundColor' },
      { key: 'headerTextColor', label: 'Cor do texto', type: 'color', path: 'canvas.headerTextColor' },
      { key: 'headerFontFamily', label: 'Fonte', type: 'select', path: 'canvas.headerFontFamily', options: [
        { value: 'inherit', label: 'Padrao' },
        { value: 'Arial', label: 'Arial' },
        { value: 'Verdana', label: 'Verdana' },
        { value: 'Georgia', label: 'Georgia' },
        { value: 'Courier New', label: 'Courier New' },
      ]},
      { key: 'headerFontSize', label: 'Tamanho da fonte', type: 'number', path: 'canvas.headerFontSize', min: 8, max: 24 },
      { key: 'headerFontWeight', label: 'Estilo da fonte', type: 'select', path: 'canvas.headerFontWeight', options: [
        { value: 'normal', label: 'Normal' },
        { value: 'bold', label: 'Negrito' },
        { value: 'italic', label: 'Italico' },
        { value: 'bold-italic', label: 'Negrito + Italico' },
      ]},
      { key: 'headerAlignment', label: 'Alinhamento', type: 'select', path: 'canvas.headerAlignment', options: ALIGNMENT_OPTIONS },
    ],
  },
  {
    id: 'legenda',
    label: 'Legenda',
    icon: 'Eye',
    visible: (vType) => !['table', 'matrix', 'kpi', 'card', 'gauge', 'wordcloud'].includes(vType),
    fields: [
      { key: 'showLegend', label: 'Mostrar legenda', type: 'checkbox', path: 'fmt.showLegend' },
      { key: 'legendPosition', label: 'Posicao', type: 'select', path: 'fmt.legendPosition', options: POSITION_OPTIONS },
      { key: 'legendColor', label: 'Cor do texto', type: 'color', path: 'fmt.legendColor' },
      { key: 'legendFontSize', label: 'Tamanho da fonte', type: 'number', path: 'fmt.legendFontSize', min: 8, max: 20 },
      { key: 'legendFontWeight', label: 'Estilo', type: 'select', path: 'fmt.legendFontWeight', options: FONT_WEIGHT_OPTIONS },
      { key: 'legendFontFamily', label: 'Familia da fonte', type: 'text', path: 'fmt.legendFontFamily', placeholder: 'Ex: Inter' },
      { key: 'legendFontStyle', label: 'Italico', type: 'select', path: 'fmt.legendFontStyle', options: FONT_STYLE_OPTIONS },
    ],
  },
  {
    id: 'rotulos',
    label: 'Dados',
    icon: 'BarChart3',
    visible: (vType) => !['table', 'matrix'].includes(vType),
    fields: [
      { key: 'dataLabels', label: 'Mostrar dados', type: 'checkbox', path: 'fmt.dataLabels' },
      { key: 'dataLabelFormat', label: 'Formato', type: 'select', path: 'fmt.dataLabelFormat', options: [
        { value: 'value', label: 'Valor' },
        { value: 'percent', label: 'Percentual' },
      ]},
      { key: 'dataLabelFontSize', label: 'Tamanho da fonte', type: 'number', path: 'fmt.dataLabelFontSize', min: 8, max: 24 },
      { key: 'dataLabelColor', label: 'Cor do texto', type: 'color', path: 'fmt.dataLabelColor' },
      { key: 'dataLabelBgColor', label: 'Cor de fundo', type: 'color', path: 'fmt.dataLabelBgColor' },
      { key: 'dataLabelFontWeight', label: 'Negrito', type: 'select', path: 'fmt.dataLabelFontWeight', options: FONT_WEIGHT_OPTIONS },
      { key: 'dataLabelFontStyle', label: 'Italico', type: 'select', path: 'fmt.dataLabelFontStyle', options: FONT_STYLE_OPTIONS },
      { key: 'dataLabelPosition', label: 'Posicao', type: 'select', path: 'fmt.dataLabelPosition', options: [
        { value: 'top', label: 'Cima' },
        { value: 'outside', label: 'Fora' },
        { value: 'inside', label: 'Dentro' },
      ]},
      { key: 'dataLabelShowFor', label: 'Mostrar em', type: 'select', path: 'fmt.dataLabelShowFor', options: [
        { value: 'all', label: 'Todos' },
        { value: 'first', label: 'Primeiro' },
        { value: 'last', label: 'Ultimo' },
      ]},
    ],
  },
  {
    id: 'eixoX',
    label: 'Eixo X',
    icon: 'Minus',
    visible: (vType) => AXIS_CHARTS.includes(vType),
    fields: [
      { key: 'xAxisShow', label: 'Mostrar eixo X', type: 'checkbox', path: 'fmt.xAxisShow' },
      { key: 'xAxisTitle', label: 'Titulo do eixo', type: 'text', path: 'fmt.xAxisTitle', placeholder: 'Ex: Mes' },
      { key: 'xAxisColor', label: 'Cor', type: 'color', path: 'fmt.xAxisColor' },
      { key: 'xAxisFontSize', label: 'Tamanho da fonte', type: 'number', path: 'fmt.xAxisFontSize', min: 8, max: 20 },
      { key: 'xAxisFontWeight', label: 'Estilo', type: 'select', path: 'fmt.xAxisFontWeight', options: FONT_WEIGHT_OPTIONS },
      { key: 'xAxisFontFamily', label: 'Familia da fonte', type: 'text', path: 'fmt.xAxisFontFamily', placeholder: 'Ex: Inter' },
      { key: 'xAxisLabelRotate', label: 'Rotacao', type: 'select', path: 'fmt.xAxisLabelRotate', options: [
        { value: 'auto', label: 'Automatico' },
        { value: '0', label: '0 graus' },
        { value: '45', label: '45 graus' },
        { value: '90', label: '90 graus' },
      ]},
      { key: 'xAxisMin', label: 'Minimo', type: 'number', path: 'fmt.xAxisMin' },
      { key: 'xAxisMax', label: 'Maximo', type: 'number', path: 'fmt.xAxisMax' },
      { key: 'xAxisLineColor', label: 'Cor da linha', type: 'color', path: 'fmt.xAxisLineColor' },
    ],
  },
  {
    id: 'eixoY',
    label: 'Eixo Y',
    icon: 'Minus',
    visible: (vType) => AXIS_CHARTS.includes(vType),
    fields: [
      { key: 'yAxisShow', label: 'Mostrar eixo Y', type: 'checkbox', path: 'fmt.yAxisShow' },
      { key: 'yAxisTitle', label: 'Titulo do eixo', type: 'text', path: 'fmt.yAxisTitle', placeholder: 'Ex: Valor (R$)' },
      { key: 'yAxisColor', label: 'Cor', type: 'color', path: 'fmt.yAxisColor' },
      { key: 'yAxisFontSize', label: 'Tamanho da fonte', type: 'number', path: 'fmt.yAxisFontSize', min: 8, max: 20 },
      { key: 'yAxisFontWeight', label: 'Estilo', type: 'select', path: 'fmt.yAxisFontWeight', options: FONT_WEIGHT_OPTIONS },
      { key: 'yAxisFontFamily', label: 'Familia da fonte', type: 'text', path: 'fmt.yAxisFontFamily', placeholder: 'Ex: Inter' },
      { key: 'yAxisMin', label: 'Minimo', type: 'number', path: 'fmt.yAxisMin' },
      { key: 'yAxisMax', label: 'Maximo', type: 'number', path: 'fmt.yAxisMax' },
      { key: 'yAxisLineColor', label: 'Cor da linha', type: 'color', path: 'fmt.yAxisLineColor' },
    ],
  },
  {
    id: 'grade',
    label: 'Grade',
    icon: 'Grid3X3',
    visible: (vType) => AXIS_CHARTS.includes(vType),
    fields: [
      { key: 'showGridLines', label: 'Mostrar grade', type: 'checkbox', path: 'fmt.showGridLines' },
      { key: 'gridLineColor', label: 'Cor', type: 'color', path: 'fmt.gridLineColor' },
      { key: 'gridLineWidth', label: 'Espessura', type: 'number', path: 'fmt.gridLineWidth', min: 1, max: 5 },
      { key: 'gridLineDash', label: 'Tracejado', type: 'checkbox', path: 'fmt.gridLineDash' },
      { key: 'gridPaddingTop', label: 'Cima', type: 'number', path: 'fmt.gridPaddingTop', min: 0, max: 100 },
      { key: 'gridPaddingBottom', label: 'Baixo', type: 'number', path: 'fmt.gridPaddingBottom', min: 0, max: 100 },
      { key: 'gridPaddingLeft', label: 'Esquerda', type: 'number', path: 'fmt.gridPaddingLeft', min: 0, max: 200 },
      { key: 'gridPaddingRight', label: 'Direita', type: 'number', path: 'fmt.gridPaddingRight', min: 0, max: 200 },
    ],
  },
  {
    id: 'barras',
    label: 'Barras',
    icon: 'BarChart3',
    visible: (vType) => BAR_CHARTS.includes(vType),
    fields: [
      { key: 'barColor', label: 'Cor da barra', type: 'color', path: 'fmt.barColor' },
      { key: 'barWidth', label: 'Largura (%)', type: 'number', path: 'fmt.barWidth', min: 0, max: 100 },
      { key: 'barBorderRadius', label: 'Arredondamento', type: 'number', path: 'fmt.barBorderRadius', min: 0, max: 20 },
      { key: 'barGap', label: 'Espaco entre barras', type: 'text', path: 'fmt.barGap', placeholder: 'Ex: 30%' },
      { key: 'barCategoryGap', label: 'Espaco entre categorias', type: 'text', path: 'fmt.barCategoryGap', placeholder: 'Ex: 20%' },
      { key: 'showBackground', label: 'Mostrar fundo', type: 'checkbox', path: 'fmt.showBackground' },
    ],
  },
  {
    id: 'linhas',
    label: 'Linha',
    icon: 'TrendingUp',
    visible: (vType) => LINE_CHARTS.includes(vType),
    fields: [
      { key: 'lineColor', label: 'Cor da linha', type: 'color', path: 'fmt.lineColor' },
      { key: 'lineWidth', label: 'Espessura', type: 'number', path: 'fmt.lineWidth', min: 1, max: 10 },
      { key: 'lineStyle', label: 'Estilo', type: 'select', path: 'fmt.lineStyle', options: [
        { value: 'solid', label: 'Solida' },
        { value: 'dashed', label: 'Tracejada' },
        { value: 'dotted', label: 'Pontilhada' },
      ]},
      { key: 'smooth', label: 'Suavizar', type: 'checkbox', path: 'fmt.smooth' },
      { key: 'step', label: 'Degraus', type: 'checkbox', path: 'fmt.step' },
      { key: 'areaOpacity', label: 'Opacidade da area', type: 'number', path: 'fmt.areaOpacity', min: 0, max: 1, step: 0.1 },
      { key: 'areaColor', label: 'Cor da area', type: 'color', path: 'fmt.areaColor' },
      { key: 'showMarkers', label: 'Mostrar marcadores', type: 'checkbox', path: 'fmt.showMarkers' },
      { key: 'markerSize', label: 'Tamanho do marcador', type: 'number', path: 'fmt.markerSize', min: 1, max: 20 },
      { key: 'markerShape', label: 'Forma do marcador', type: 'select', path: 'fmt.markerShape', options: [
        { value: 'circle', label: 'Circulo' },
        { value: 'rect', label: 'Retangulo' },
        { value: 'triangle', label: 'Triangulo' },
        { value: 'diamond', label: 'Diamante' },
      ]},
    ],
  },
  {
    id: 'fatias',
    label: 'Fatias',
    icon: 'Circle',
    visible: (vType) => ['pie', 'donut'].includes(vType),
    fields: [
      { key: 'pieColor', label: 'Cor', type: 'color', path: 'fmt.pieColor' },
      { key: 'innerRadius', label: 'Raio interno (%)', type: 'number', path: 'fmt.innerRadius', min: 10, max: 90, visible: (vType) => vType === 'donut' },
      { key: 'outerRadius', label: 'Raio externo (%)', type: 'number', path: 'fmt.outerRadius', min: 10, max: 90 },
      { key: 'startAngle', label: 'Angulo inicial', type: 'number', path: 'fmt.startAngle', min: 0, max: 360 },
      { key: 'minAngle', label: 'Angulo minimo', type: 'number', path: 'fmt.minAngle', min: 0, max: 45 },
      { key: 'roseType', label: 'Modo rosca', type: 'select', path: 'fmt.roseType', options: [
        { value: 'none', label: 'Nenhum' },
        { value: 'radius', label: 'Raio' },
        { value: 'area', label: 'Area' },
      ]},
      { key: 'labelPosition', label: 'Posicao do rotulo', type: 'select', path: 'fmt.labelPosition', options: [
        { value: 'inside', label: 'Dentro' },
        { value: 'outside', label: 'Fora' },
      ]},
      { key: 'emphasisShadowBlur', label: 'Sombra ao focar', type: 'number', path: 'fmt.emphasisShadowBlur', min: 0, max: 30 },
      { key: 'emphasisShadowColor', label: 'Cor da sombra', type: 'color', path: 'fmt.emphasisShadowColor' },
    ],
  },
  {
    id: 'radar',
    label: 'Radar',
    icon: 'Radar',
    visible: (vType) => vType === 'radar',
    fields: [
      { key: 'radarShape', label: 'Forma', type: 'select', path: 'fmt.radarShape', options: [
        { value: 'polygon', label: 'Poligono' },
        { value: 'circle', label: 'Circulo' },
      ]},
      { key: 'radarRadius', label: 'Raio (%)', type: 'number', path: 'fmt.radarRadius', min: 10, max: 100 },
      { key: 'radarSplitNumber', label: 'Niveis', type: 'number', path: 'fmt.radarSplitNumber', min: 1, max: 10 },
      { key: 'radarAxisName', label: 'Nomes dos eixos', type: 'checkbox', path: 'fmt.radarAxisName' },
      { key: 'radarAreaOpacity', label: 'Opacidade', type: 'number', path: 'fmt.radarAreaOpacity', min: 0, max: 1, step: 0.1 },
      { key: 'radarLineColor', label: 'Cor da linha', type: 'color', path: 'fmt.radarLineColor' },
      { key: 'radarLineWidth', label: 'Espessura da linha', type: 'number', path: 'fmt.radarLineWidth', min: 1, max: 5 },
      { key: 'radarSplitLineColor', label: 'Cor da grade', type: 'color', path: 'fmt.radarSplitLineColor' },
      { key: 'radarStartAngle', label: 'Angulo inicial', type: 'number', path: 'fmt.radarStartAngle', min: 0, max: 360 },
      { key: 'radarAxisNameColor', label: 'Cor do nome do eixo', type: 'color', path: 'fmt.radarAxisNameColor' },
      { key: 'radarAxisNameFontSize', label: 'Tamanho do nome', type: 'number', path: 'fmt.radarAxisNameFontSize', min: 8, max: 20 },
      { key: 'radarSplitLineWidth', label: 'Espessura da grade', type: 'number', path: 'fmt.radarSplitLineWidth', min: 1, max: 5 },
      { key: 'radarSplitLineDash', label: 'Linha tracejada', type: 'checkbox', path: 'fmt.radarSplitLineDash' },
      { key: 'radarSplitAreaColor', label: 'Cor da area de fundo', type: 'color', path: 'fmt.radarSplitAreaColor' },
      { key: 'radarAxisLineColor', label: 'Cor da linha do eixo', type: 'color', path: 'fmt.radarAxisLineColor' },
    ],
  },
  {
    id: 'funil',
    label: 'Funil',
    icon: 'Filter',
    visible: (vType) => vType === 'funnel',
    fields: [
      { key: 'funnelAlign', label: 'Alinhamento', type: 'select', path: 'fmt.funnelAlign', options: [
        { value: 'left', label: 'Esquerda' },
        { value: 'center', label: 'Centro' },
        { value: 'right', label: 'Direita' },
      ]},
      { key: 'funnelSort', label: 'Ordenacao', type: 'select', path: 'fmt.funnelSort', options: [
        { value: 'descending', label: 'Decrescente' },
        { value: 'ascending', label: 'Crescente' },
        { value: 'none', label: 'Nenhuma' },
      ]},
      { key: 'funnelGap', label: 'Espacamento', type: 'number', path: 'fmt.funnelGap', min: 0, max: 20 },
      { key: 'funnelMinSize', label: 'Tamanho minimo', type: 'text', path: 'fmt.funnelMinSize' },
      { key: 'funnelMaxSize', label: 'Tamanho maximo', type: 'text', path: 'fmt.funnelMaxSize' },
      { key: 'labelPosition', label: 'Posicao do rotulo', type: 'select', path: 'fmt.labelPosition', options: [
        { value: 'inside', label: 'Dentro' },
        { value: 'outside', label: 'Fora' },
      ]},
      { key: 'emphasisShadowBlur', label: 'Sombra ao focar', type: 'number', path: 'fmt.emphasisShadowBlur', min: 0, max: 30 },
      { key: 'emphasisShadowColor', label: 'Cor da sombra', type: 'color', path: 'fmt.emphasisShadowColor' },
    ],
  },
  {
    id: 'sankey',
    label: 'Sankey',
    icon: 'GitBranch',
    visible: (vType) => ['sankey', 'ribbon'].includes(vType),
    fields: [
      { key: 'sankeyNodeAlign', label: 'Alinhamento', type: 'select', path: 'fmt.sankeyNodeAlign', options: [
        { value: 'left', label: 'Esquerda' },
        { value: 'right', label: 'Direita' },
        { value: 'justify', label: 'Justificar' },
      ]},
      { key: 'sankeyNodeWidth', label: 'Largura dos nos', type: 'number', path: 'fmt.sankeyNodeWidth', min: 5, max: 50 },
      { key: 'sankeyNodeGap', label: 'Espaco entre nos', type: 'number', path: 'fmt.sankeyNodeGap', min: 1, max: 30 },
      { key: 'sankeyLineCurveness', label: 'Curvatura', type: 'number', path: 'fmt.sankeyLineCurveness', min: 0, max: 1, step: 0.1 },
      { key: 'sankeyLineOpacity', label: 'Opacidade das linhas', type: 'number', path: 'fmt.sankeyLineOpacity', min: 0, max: 1, step: 0.1 },
      { key: 'sankeyOrient', label: 'Orientacao', type: 'select', path: 'fmt.sankeyOrient', options: [
        { value: 'horizontal', label: 'Horizontal' },
        { value: 'vertical', label: 'Vertical' },
      ]},
      { key: 'sankeyDraggable', label: 'Arrastavel', type: 'checkbox', path: 'fmt.sankeyDraggable' },
      { key: 'sankeyFocusAdjacency', label: 'Foco ao passar', type: 'checkbox', path: 'fmt.sankeyFocusAdjacency' },
      { key: 'sankeyLineStyle', label: 'Estilo da linha', type: 'select', path: 'fmt.sankeyLineStyle', options: [
        { value: 'gradient', label: 'Gradiente' },
        { value: 'opacity', label: 'Opacidade' },
      ]},
      { key: 'emphasisLineOpacity', label: 'Opacidade ao focar', type: 'number', path: 'fmt.emphasisLineOpacity', min: 0, max: 1, step: 0.1 },
    ],
  },
  {
    id: 'arvore',
    label: 'Treemap',
    icon: 'TreePine',
    visible: (vType) => vType === 'treemap',
    fields: [
      { key: 'treemapDrillDown', label: 'Drill-down', type: 'checkbox', path: 'fmt.treemapDrillDown' },
      { key: 'treemapBorderColor', label: 'Cor da borda', type: 'color', path: 'fmt.treemapBorderColor' },
      { key: 'treemapBorderWidth', label: 'Espessura da borda', type: 'number', path: 'fmt.treemapBorderWidth', min: 0, max: 10 },
      { key: 'treemapGapWidth', label: 'Espaco entre blocos', type: 'number', path: 'fmt.treemapGapWidth', min: 0, max: 10 },
      { key: 'treemapRoam', label: 'Pan/Zoom', type: 'checkbox', path: 'fmt.treemapRoam' },
      { key: 'treemapBreadth', label: 'Largura dos itens', type: 'number', path: 'fmt.treemapBreadth', min: 5, max: 50 },
      { key: 'treemapDepth', label: 'Profundidade', type: 'number', path: 'fmt.treemapDepth', min: 1, max: 10 },
      { key: 'treemapDrillDownIcon', label: 'Icone drill-down', type: 'text', path: 'fmt.treemapDrillDownIcon' },
      { key: 'treemapLeafDepth', label: 'Profundidade folha', type: 'number', path: 'fmt.treemapLeafDepth', min: 1, max: 10 },
      { key: 'treemapNodeClick', label: 'Clique no no', type: 'select', path: 'fmt.treemapNodeClick', options: [
        { value: 'zoomToNode', label: 'Zoom no no' },
        { value: 'link', label: 'Link' },
        { value: 'false', label: 'Nenhum' },
      ]},
      { key: 'treemapZoomToNodeRatio', label: 'Ratio zoom', type: 'number', path: 'fmt.treemapZoomToNodeRatio', min: 0.01, max: 1, step: 0.01 },
      { key: 'treemapUpperLabelShow', label: 'Label superior', type: 'checkbox', path: 'fmt.treemapUpperLabelShow' },
      { key: 'treemapUpperLabelHeight', label: 'Altura do label', type: 'number', path: 'fmt.treemapUpperLabelHeight', min: 5, max: 40 },
      { key: 'treemapItemBorderColor', label: 'Cor da borda do item', type: 'color', path: 'fmt.treemapItemBorderColor' },
      { key: 'treemapItemBorderWidth', label: 'Largura da borda do item', type: 'number', path: 'fmt.treemapItemBorderWidth', min: 0, max: 10 },
      { key: 'treemapItemGapWidth', label: 'Espaco entre itens', type: 'number', path: 'fmt.treemapItemGapWidth', min: 0, max: 10 },
      { key: 'treemapBreadcrumbShow', label: 'Mostrar breadcrumb', type: 'checkbox', path: 'fmt.treemapBreadcrumbShow' },
    ],
  },
  {
    id: 'waterfall',
    label: 'Waterfall',
    icon: 'BarChart3',
    visible: (vType) => vType === 'waterfall',
    fields: [
      { key: 'waterfallPositiveColor', label: 'Cor positivo', type: 'color', path: 'fmt.waterfallPositiveColor' },
      { key: 'waterfallNegativeColor', label: 'Cor negativo', type: 'color', path: 'fmt.waterfallNegativeColor' },
      { key: 'waterfallTotalColor', label: 'Cor total', type: 'color', path: 'fmt.waterfallTotalColor' },
      { key: 'showTotals', label: 'Mostrar total', type: 'checkbox', path: 'fmt.showTotals' },
      { key: 'showSubtotals', label: 'Mostrar subtotais', type: 'checkbox', path: 'fmt.showSubtotals' },
      { key: 'waterfallLineColor', label: 'Cor da linha conectora', type: 'color', path: 'fmt.waterfallLineColor' },
      { key: 'waterfallLineWidth', label: 'Espessura da linha', type: 'number', path: 'fmt.waterfallLineWidth', min: 1, max: 5 },
    ],
  },
  {
    id: 'gauge',
    label: 'Medidor',
    icon: 'Target',
    visible: (vType) => vType === 'gauge',
    fields: [
      { key: 'gaugeMin', label: 'Minimo', type: 'number', path: 'fmt.gaugeMin' },
      { key: 'gaugeMax', label: 'Maximo', type: 'number', path: 'fmt.gaugeMax' },
      { key: 'gaugeTarget', label: 'Meta', type: 'number', path: 'fmt.gaugeTarget' },
      { key: 'gaugeColor', label: 'Cor', type: 'color', path: 'fmt.gaugeColor' },
      { key: 'gaugeStartAngle', label: 'Angulo inicial', type: 'number', path: 'fmt.gaugeStartAngle', min: 90, max: 360 },
      { key: 'gaugeEndAngle', label: 'Angulo final', type: 'number', path: 'fmt.gaugeEndAngle', min: -180, max: 90 },
      { key: 'gaugeSplitNumber', label: 'Divisoes', type: 'number', path: 'fmt.gaugeSplitNumber', min: 2, max: 20 },
      { key: 'gaugeProgressWidth', label: 'Largura da barra', type: 'number', path: 'fmt.gaugeProgressWidth', min: 4, max: 30 },
      { key: 'gaugeAxisLineWidth', label: 'Largura do eixo', type: 'number', path: 'fmt.gaugeAxisLineWidth', min: 4, max: 30 },
      { key: 'gaugeShowAxisTick', label: 'Mostrar ticks', type: 'checkbox', path: 'fmt.gaugeShowAxisTick' },
      { key: 'gaugeSplitLineLength', label: 'Tamanho das divisoes', type: 'number', path: 'fmt.gaugeSplitLineLength', min: 2, max: 20 },
      { key: 'gaugeAnchorSize', label: 'Tamanho da ancora', type: 'number', path: 'fmt.gaugeAnchorSize', min: 4, max: 24 },
      { key: 'gaugePointerLength', label: 'Tamanho da ponteiro', type: 'text', path: 'fmt.gaugePointerLength' },
      { key: 'gaugePointerWidth', label: 'Largura do ponteiro', type: 'number', path: 'fmt.gaugePointerWidth', min: 2, max: 20 },
      { key: 'gaugeDetailFontSize', label: 'Tamanho do valor', type: 'number', path: 'fmt.gaugeDetailFontSize', min: 10, max: 40 },
      { key: 'gaugeDetailFormatter', label: 'Formato do valor', type: 'text', path: 'fmt.gaugeDetailFormatter' },
      { key: 'gaugeAnchorShow', label: 'Mostrar ancora', type: 'checkbox', path: 'fmt.gaugeAnchorShow' },
      { key: 'gaugeTitleFontSize', label: 'Tamanho do titulo', type: 'number', path: 'fmt.gaugeTitleFontSize', min: 8, max: 24 },
      { key: 'gaugeTitleColor', label: 'Cor do titulo', type: 'color', path: 'fmt.gaugeTitleColor' },
      { key: 'gaugeTitleOffsetCenter', label: 'Posicao do titulo', type: 'text', path: 'fmt.gaugeTitleOffsetCenter' },
      { key: 'gaugeDetailOffsetCenter', label: 'Posicao do valor', type: 'text', path: 'fmt.gaugeDetailOffsetCenter' },
      { key: 'gaugePointerOffsetCenter', label: 'Posicao do ponteiro', type: 'text', path: 'fmt.gaugePointerOffsetCenter' },
    ],
  },
  {
    id: 'kpi',
    label: 'KPI / Card',
    icon: 'BarChart3',
    visible: (vType) => ['kpi', 'card'].includes(vType),
    fields: [
      { key: 'kpiDisplayUnits', label: 'Unidades', type: 'select', path: 'fmt.kpiDisplayUnits', options: [
        { value: 'auto', label: 'Automatico' },
        { value: 'none', label: 'Nenhum' },
        { value: 'thousands', label: 'Milhar (K)' },
        { value: 'millions', label: 'Milhao (M)' },
      ]},
      { key: 'kpiDecimals', label: 'Casas decimais', type: 'number', path: 'fmt.kpiDecimals', min: 0, max: 10 },
      { key: 'showTrendIcon', label: 'Mostrar tendencia', type: 'checkbox', path: 'fmt.showTrendIcon' },
      { key: 'kpiTrendUpColor', label: 'Cor tendencia alta', type: 'color', path: 'fmt.kpiTrendUpColor' },
      { key: 'kpiTrendDownColor', label: 'Cor tendencia baixa', type: 'color', path: 'fmt.kpiTrendDownColor' },
      { key: 'kpiSparklineWidth', label: 'Espessura sparkline', type: 'number', path: 'fmt.kpiSparklineWidth', min: 0.5, max: 5, step: 0.5 },
      { key: 'kpiFontSize', label: 'Tamanho da fonte', type: 'number', path: 'fmt.kpiFontSize', min: 12, max: 96 },
      { key: 'kpiColor', label: 'Cor do valor', type: 'color', path: 'fmt.kpiColor' },
      { key: 'kpiFontWeight', label: 'Peso da fonte', type: 'text', path: 'fmt.kpiFontWeight', placeholder: '700' },
      { key: 'kpiFontFamily', label: 'Familia da fonte', type: 'text', path: 'fmt.kpiFontFamily' },
      { key: 'kpiPadding', label: 'Padding', type: 'number', path: 'fmt.kpiPadding', min: 0, max: 60 },
      { key: 'kpiBorderRadius', label: 'Arredondamento', type: 'number', path: 'fmt.kpiBorderRadius', min: 0, max: 30 },
      { key: 'kpiSubtitleFontSize', label: 'Tamanho do subtitulo', type: 'number', path: 'fmt.kpiSubtitleFontSize', min: 8, max: 24 },
      { key: 'kpiSubtitleColor', label: 'Cor do subtitulo', type: 'color', path: 'fmt.kpiSubtitleColor' },
      { key: 'kpiSubtitleFontWeight', label: 'Peso do subtitulo', type: 'text', path: 'fmt.kpiSubtitleFontWeight' },
      { key: 'kpiSubtitleMarginBottom', label: 'Margem inferior subtitulo', type: 'number', path: 'fmt.kpiSubtitleMarginBottom', min: 0, max: 30 },
      { key: 'kpiIconSize', label: 'Tamanho do icone', type: 'number', path: 'fmt.kpiIconSize', min: 8, max: 64 },
      { key: 'kpiIconColor', label: 'Cor do icone', type: 'color', path: 'fmt.kpiIconColor' },
    ],
  },
  {
    id: 'bullet',
    label: 'Bullet',
    icon: 'Target',
    visible: (vType) => vType === 'bullet',
    fields: [
      { key: 'bulletColor', label: 'Cor da barra', type: 'color', path: 'fmt.bulletColor' },
      { key: 'bulletBarWidth', label: 'Largura', type: 'text', path: 'fmt.bulletBarWidth' },
      { key: 'bulletMarkerColor', label: 'Cor do marcador', type: 'color', path: 'fmt.bulletMarkerColor' },
      { key: 'bulletMarkerWidth', label: 'Espessura do marcador', type: 'number', path: 'fmt.bulletMarkerWidth', min: 1, max: 10 },
      { key: 'bulletTargetColor', label: 'Cor do target', type: 'color', path: 'fmt.bulletTargetColor' },
      { key: 'bulletTargetWidth', label: 'Largura do target', type: 'number', path: 'fmt.bulletTargetWidth', min: 1, max: 10 },
    ],
  },
  {
    id: 'sunburst',
    label: 'Sunburst',
    icon: 'Sun',
    visible: (vType) => vType === 'sunburst',
    fields: [
      { key: 'sunburstInnerRadius', label: 'Raio interno', type: 'text', path: 'fmt.sunburstInnerRadius' },
      { key: 'sunburstOuterRadius', label: 'Raio externo', type: 'text', path: 'fmt.sunburstOuterRadius' },
      { key: 'sunburstBorderColor', label: 'Cor da borda', type: 'color', path: 'fmt.sunburstBorderColor' },
      { key: 'sunburstBorderWidth', label: 'Espessura da borda', type: 'number', path: 'fmt.sunburstBorderWidth', min: 0, max: 10 },
      { key: 'sunburstLabelRotate', label: 'Rotacao do label', type: 'select', path: 'fmt.sunburstLabelRotate', options: [
        { value: 'radial', label: 'Radial' },
        { value: 'tangential', label: 'Tangencial' },
      ]},
      { key: 'sunburstStartAngle', label: 'Angulo inicial', type: 'number', path: 'fmt.sunburstStartAngle', min: 0, max: 360 },
      { key: 'sunburstSort', label: 'Ordenacao', type: 'select', path: 'fmt.sunburstSort', options: [
        { value: 'desc', label: 'Decrescente' },
        { value: 'asc', label: 'Crescente' },
      ]},
      { key: 'sunburstItemBorderWidth', label: 'Espessura da borda item', type: 'number', path: 'fmt.sunburstItemBorderWidth', min: 0, max: 10 },
      { key: 'sunburstItemBorderColor', label: 'Cor da borda item', type: 'color', path: 'fmt.sunburstItemBorderColor' },
    ],
  },
  {
    id: 'wordcloud',
    label: 'WordCloud',
    icon: 'Type',
    visible: (vType) => vType === 'wordcloud',
    fields: [
      { key: 'wordCloudMinSize', label: 'Tamanho minimo', type: 'number', path: 'fmt.wordCloudMinSize', min: 6, max: 30 },
      { key: 'wordCloudMaxSize', label: 'Tamanho maximo', type: 'number', path: 'fmt.wordCloudMaxSize', min: 20, max: 120 },
      { key: 'wordCloudTextShadowBlur', label: 'Sombra do texto', type: 'number', path: 'fmt.wordCloudTextShadowBlur', min: 0, max: 30 },
      { key: 'wordCloudTextShadowColor', label: 'Cor da sombra', type: 'color', path: 'fmt.wordCloudTextShadowColor' },
    ],
  },
  {
    id: 'histogram',
    label: 'Histograma',
    icon: 'BarChart3',
    visible: (vType) => vType === 'histogram',
    fields: [
      { key: 'histogramBins', label: 'Numero de bins', type: 'number', path: 'fmt.histogramBins', min: 3, max: 50 },
      { key: 'histogramBarRadius', label: 'Arredondamento', type: 'number', path: 'fmt.histogramBarRadius', min: 0, max: 20 },
      { key: 'histogramYAxisLabel', label: 'Titulo eixo Y', type: 'text', path: 'fmt.histogramYAxisLabel' },
    ],
  },
  {
    id: 'boxplot',
    label: 'BoxPlot',
    icon: 'BarChart3',
    visible: (vType) => vType === 'boxplot',
    fields: [
      { key: 'barColor', label: 'Cor do box', type: 'color', path: 'fmt.barColor' },
      { key: 'bulletMarkerColor', label: 'Cor da mediana', type: 'color', path: 'fmt.bulletMarkerColor' },
      { key: 'barBorderRadius', label: 'Espessura da borda', type: 'number', path: 'fmt.barBorderRadius', min: 0, max: 5 },
    ],
  },
  {
    id: 'tabela',
    label: 'Tabela',
    icon: 'Settings',
    visible: (vType) => ['table', 'matrix'].includes(vType),
    fields: [
      { key: 'showTotalsTable', label: 'Mostrar totais', type: 'checkbox', path: 'fmt.showTotalsTable' },
      { key: 'showSubtotalsTable', label: 'Mostrar subtotais', type: 'checkbox', path: 'fmt.showSubtotalsTable' },
      { key: 'rowPadding', label: 'Padding das linhas', type: 'number', path: 'fmt.rowPadding', min: 0, max: 30 },
      { key: 'headerAlign', label: 'Alinhamento do cabecalho', type: 'select', path: 'fmt.headerAlign', options: ALIGNMENT_OPTIONS },
      { key: 'matrixIndent', label: 'Indentacao', type: 'checkbox', path: 'fmt.matrixIndent', visible: (vType) => vType === 'matrix' },
      { key: 'matrixShowHeaders', label: 'Mostrar cabecalhos', type: 'checkbox', path: 'fmt.matrixShowHeaders', visible: (vType) => vType === 'matrix' },
    ],
  },
  {
    id: 'tema',
    label: 'Tema',
    icon: 'Sun',
    visible: () => true,
    fields: [
      { key: 'chartTheme', label: 'Tema do grafico', type: 'select', path: 'fmt.chartTheme', options: [
        { value: 'transparent', label: 'Sem fundo' },
        { value: 'dark', label: 'Escuro' },
        { value: 'light', label: 'Claro' },
      ]},
    ],
  },
];
