'use client';

import React, { useState } from 'react';
import { useStudio } from '../../store/StudioContext';
import { BucketSlot } from './BucketSlot';
import { FormattingTab } from './FormattingTab';
import { PageSettings } from './PageSettings';
import type { VisualType } from '../../types/visuals';
import { BUCKET_LABELS, BUCKET_FIELDS_FOR_VISUAL } from '../../types/visuals';
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
  TreePine,
  TrendingDown,
  Combine,
  Palette,
  PanelRightClose,
} from 'lucide-react';

const CHART_ICONS: { type: VisualType; icon: React.ReactNode; label: string }[] = [
  { type: 'bar', icon: <BarChart3 size={20} />, label: 'Barras' },
  { type: 'line', icon: <LineChart size={20} />, label: 'Linha' },
  { type: 'area', icon: <AreaChart size={20} />, label: 'Área' },
  { type: 'pie', icon: <PieChart size={20} />, label: 'Pizza' },
  { type: 'donut', icon: <Circle size={20} />, label: 'Rosca' },
  { type: 'scatter', icon: <ScatterChart size={20} />, label: 'Dispersão' },
  { type: 'table', icon: <Table size={20} />, label: 'Tabela' },
  { type: 'kpi', icon: <Hash size={20} />, label: 'KPI' },
  { type: 'card', icon: <CreditCard size={20} />, label: 'Cartão' },
  { type: 'treemap', icon: <TreePine size={20} />, label: 'Mapa Árvore' },
  { type: 'waterfall', icon: <TrendingDown size={20} />, label: 'Cascata' },
  { type: 'combo', icon: <Combine size={20} />, label: 'Combinado' },
];

export function PropertiesPanel() {
  const { state, dispatch } = useStudio();
  const [activeTab, setActiveTab] = useState<'visual' | 'formatting'>('visual');

  const selectedVisual = state.pages
    .find(p => p.id === state.activePageId)
    ?.visuals.find(v => v.id === state.selectedVisualId);

  const handleTypeChange = (type: VisualType) => {
    if (selectedVisual) {
      dispatch({ type: 'UPDATE_VISUAL', payload: { id: selectedVisual.id, updates: { type } } });
    }
  };

  const handleAddVisual = (type: VisualType) => {
    dispatch({ type: 'ADD_VISUAL', payload: { type, x: 50 + Math.random() * 200, y: 50 + Math.random() * 200 } });
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-700">
      <div className="flex items-center border-b border-neutral-200 dark:border-neutral-700">
        <button
          onClick={() => setActiveTab('visual')}
          className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors
            ${activeTab === 'visual' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-muted-foreground hover:text-foreground'}
          `}
        >
          <BarChart3 size={14} />
          <span>Visual</span>
        </button>
        <button
          onClick={() => setActiveTab('formatting')}
          className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors
            ${activeTab === 'formatting' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-muted-foreground hover:text-foreground'}
          `}
        >
          <Palette size={14} />
          <span>Formato</span>
        </button>

        <div className="flex-1" />

        <button
          onClick={() => dispatch({ type: 'COLLAPSE_PROPERTIES_PANEL' })}
          className="p-1.5 mr-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Recolher painel"
        >
          <PanelRightClose size={14} className="text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto studio-scrollbar">
        {activeTab === 'visual' && (
          <div className="p-3">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Criar visual
            </div>
            <div className="grid grid-cols-3 gap-1 mb-4">
              {CHART_ICONS.map(({ type, icon, label }) => {
                const isSelected = selectedVisual?.type === type;
                return (
                  <button
                    key={type}
                    onClick={() => selectedVisual ? handleTypeChange(type) : handleAddVisual(type)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors
                      ${isSelected
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 ring-1 ring-amber-300 dark:ring-amber-700'
                        : 'text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-foreground'
                      }
                    `}
                    title={label}
                  >
                    {icon}
                    <span className="text-[10px] leading-none">{label}</span>
                  </button>
                );
              })}
            </div>

            {selectedVisual && (
              <div className="border-t border-neutral-200 dark:border-neutral-700 pt-3">
                <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
                  Campos
                </div>
                <div className="space-y-2.5">
                  {(BUCKET_FIELDS_FOR_VISUAL[selectedVisual.type] || []).map(bucketKey => (
                    <BucketSlot
                      key={bucketKey}
                      bucketKey={bucketKey as keyof typeof BUCKET_LABELS}
                      label={BUCKET_LABELS[bucketKey] || bucketKey}
                      fields={selectedVisual.buckets[bucketKey as keyof typeof selectedVisual.buckets] || []}
                      visualId={selectedVisual.id}
                      visualType={selectedVisual.type}
                      isNumericBucket={bucketKey === 'values' || bucketKey === 'yAxis'}
                    />
                  ))}
                </div>
              </div>
            )}

            {!selectedVisual && (
              <div className="mt-4 text-center text-xs text-muted-foreground px-2">
                Selecione um visual no canvas para editar,<br />ou clique em um ícone acima para adicionar
              </div>
            )}
          </div>
        )}

        {activeTab === 'formatting' && selectedVisual && (
          <FormattingTab visual={selectedVisual} />
        )}

        {activeTab === 'formatting' && !selectedVisual && (
          <div>
            <div className="p-3 border-b border-neutral-200 dark:border-neutral-700">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Configurações da Página
              </div>
              <div className="text-[11px] text-muted-foreground">
                Nenhum visual selecionado
              </div>
            </div>
            <PageSettings />
          </div>
        )}
      </div>
    </div>
  );
}
