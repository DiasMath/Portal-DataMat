'use client';

import React, { useState } from 'react';
import { useStudio } from '../../store/StudioContext';
import { BucketSlot } from './BucketSlot';
import { FormattingTab } from './FormattingTab';
import { CanvasPropertiesTab } from './CanvasPropertiesTab';
import { PageSettings } from './PageSettings';
import { TextBoxProperties } from './TextBoxProperties';
import { VisualGalleryDialog } from '../toolbar/VisualGalleryDialog';
import type { VisualType } from '../../types/visuals';
import { VISUAL_TYPE_LABELS, BUCKET_LABELS, BUCKET_FIELDS_FOR_VISUAL } from '../../types/visuals';
import {
  BarChart3, LineChart, AreaChart, PieChart, Circle, ScatterChart,
  Table, Hash, CreditCard, TreePine, TrendingDown, Combine,
  Palette, PanelRightClose, Radar as RadarIcon, Filter,
  Grid3x3, Target, Sun, GitBranch, Cloud, Box, BarChart2,
  Disc, CircleDot, Waypoints, MoreHorizontal,
} from 'lucide-react';

const DEFAULT_VISUALS: { type: VisualType; icon: React.ReactNode; label: string }[] = [
  { type: 'bar', icon: <BarChart3 size={20} />, label: 'Barras' },
  { type: 'line', icon: <LineChart size={20} />, label: 'Linha' },
  { type: 'area', icon: <AreaChart size={20} />, label: 'Area' },
  { type: 'pie', icon: <PieChart size={20} />, label: 'Pizza' },
  { type: 'donut', icon: <Circle size={20} />, label: 'Rosca' },
  { type: 'scatter', icon: <ScatterChart size={20} />, label: 'Dispersao' },
  { type: 'table', icon: <Table size={20} />, label: 'Tabela' },
  { type: 'kpi', icon: <Hash size={20} />, label: 'KPI' },
  { type: 'card', icon: <CreditCard size={20} />, label: 'Cartao' },
  { type: 'treemap', icon: <TreePine size={20} />, label: 'Arvore' },
  { type: 'waterfall', icon: <TrendingDown size={20} />, label: 'Cascata' },
  { type: 'combo', icon: <Combine size={20} />, label: 'Combinado' },
  { type: 'radar', icon: <RadarIcon size={20} />, label: 'Radar' },
  { type: 'funnel', icon: <Filter size={20} />, label: 'Funil' },
  { type: 'ribbon', icon: <Waypoints size={20} />, label: 'Fita' },
  { type: 'matrix', icon: <Grid3x3 size={20} />, label: 'Matriz' },
];

const TOP_TABS = [
  { id: 'visual', icon: <BarChart3 size={16} />, label: 'Visual' },
  { id: 'formatting', icon: <Palette size={16} />, label: 'Formatacao' },
] as const;

export function PropertiesPanel() {
  const { state, dispatch } = useStudio();
  const [activeTab, setActiveTab] = useState<'visual' | 'formatting'>('visual');
  const [showGallery, setShowGallery] = useState(false);
  const [formattingSubTab, setFormattingSubTab] = useState<'visual' | 'geral'>('visual');

  const selectedVisual = state.pages
    .find(p => p.id === state.activePageId)
    ?.visuals.find(v => v.id === state.selectedVisualId);

  const selectedTextBox = state.textBoxes.find(tb => tb.id === state.selectedTextBoxId);

  if (selectedTextBox && !selectedVisual) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2 px-3 py-2.5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Caixa de Texto</span>
          </div>
          <div className="flex-1" />
          <button
            onClick={() => dispatch({ type: 'SELECT_TEXT_BOX', payload: null })}
            className="p-1.5 mr-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Recolher painel"
          >
            <PanelRightClose size={14} className="text-muted-foreground" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto studio-scrollbar">
          <TextBoxProperties />
        </div>
      </div>
    );
  }

  if (showGallery) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-700">
        <VisualGalleryDialog
          onSelect={(type) => {
            dispatch({ type: 'ADD_VISUAL', payload: { type, x: 50 + Math.random() * 200, y: 50 + Math.random() * 200 } });
            setShowGallery(false);
          }}
          onClose={() => setShowGallery(false)}
        />
      </div>
    );
  }

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
        <div className="flex items-center gap-2 px-3 py-2.5">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Visualizacoes</span>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => dispatch({ type: 'COLLAPSE_PROPERTIES_PANEL' })}
          className="p-1.5 mr-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Recolher painel"
        >
          <PanelRightClose size={14} className="text-muted-foreground" />
        </button>
      </div>

      <div className="flex gap-1 px-2 py-1">
        {TOP_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors relative -mb-px
              ${activeTab === tab.id
                ? 'text-amber-600'
                : 'text-muted-foreground hover:text-foreground'}
            `}
            title={tab.label}
          >
            {tab.icon}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-600" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto studio-scrollbar">
        {activeTab === 'visual' && (
          <div className="p-3">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1 border-t border-neutral-200 dark:border-neutral-700 pt-3">
              Criar visual
            </div>
            <div className="grid grid-cols-4 gap-1 mb-2">
              {DEFAULT_VISUALS.map(({ type, icon, label }) => {
                const isSelected = selectedVisual?.type === type;
                return (
                  <button
                    key={type}
                    onClick={() => selectedVisual ? handleTypeChange(type) : handleAddVisual(type)}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('studio/visual-type', type);
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors w-full min-w-0 cursor-grab
                      ${isSelected
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 ring-1 ring-amber-300 dark:ring-amber-700'
                        : 'text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-foreground'
                      }
                    `}
                    title={label}
                  >
                    {icon}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowGallery(true)}
              className="w-full flex items-center justify-center gap-1 py-1.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors border border-neutral-200 dark:border-neutral-700 mb-4"
            >
              <MoreHorizontal size={12} />
              Mais visuais
            </button>

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
          </div>
        )}

        {activeTab === 'formatting' && !selectedVisual && (
          <div>
            <div className="p-3 border-b border-neutral-200 dark:border-neutral-700">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Configuracoes da Pagina
              </div>
              <div className="text-[11px] text-muted-foreground">
                Nenhum visual selecionado
              </div>
            </div>
            <PageSettings />
          </div>
        )}

        {activeTab === 'formatting' && selectedVisual && (
          <div className="flex flex-col h-full">
            <div className="flex border-b border-neutral-200 dark:border-neutral-700">
              <button
                onClick={() => setFormattingSubTab('visual')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors relative
                  ${formattingSubTab === 'visual'
                    ? 'text-amber-600'
                    : 'text-muted-foreground hover:text-foreground'}
                `}
              >
                Visual
                {formattingSubTab === 'visual' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-600" />
                )}
              </button>
              <button
                onClick={() => setFormattingSubTab('geral')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors relative
                  ${formattingSubTab === 'geral'
                    ? 'text-amber-600'
                    : 'text-muted-foreground hover:text-foreground'}
                `}
              >
                Geral
                {formattingSubTab === 'geral' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-600" />
                )}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto studio-scrollbar">
              {formattingSubTab === 'visual' && (
                <FormattingTab visual={selectedVisual} />
              )}
              {formattingSubTab === 'geral' && (
                <CanvasPropertiesTab visual={selectedVisual} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
