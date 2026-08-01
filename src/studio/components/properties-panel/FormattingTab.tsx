'use client';

import React, { useState } from 'react';
import { useStudio } from '../../store/StudioContext';
import type { Visual } from '../../types/dashboard';
import { ChevronDown, Type, Palette, Grid3X3, Eye, BarChart3 } from 'lucide-react';

interface FormattingTabProps {
  visual: Visual;
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function FormattingSection({ title, icon, defaultOpen = false, children }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-neutral-200 dark:border-neutral-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
      >
        {icon}
        <span className="flex-1 text-left">{title}</span>
        <ChevronDown
          size={12}
          className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="px-3 pb-3 space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}

export function FormattingTab({ visual }: FormattingTabProps) {
  const { dispatch } = useStudio();

  const updateFormatting = (key: string, value: unknown) => {
    dispatch({
      type: 'UPDATE_VISUAL',
      payload: {
        id: visual.id,
        updates: {
          formatting: { ...visual.formatting, [key]: value },
        },
      },
    });
  };

  const updateTitle = (title: string) => {
    dispatch({
      type: 'UPDATE_VISUAL',
      payload: { id: visual.id, updates: { title } },
    });
  };

  const toggleShowTitle = () => {
    dispatch({
      type: 'UPDATE_VISUAL',
      payload: { id: visual.id, updates: { showTitle: !visual.showTitle } },
    });
  };

  return (
    <div className="space-y-0">
      <FormattingSection title="Título" icon={<Type size={12} />} defaultOpen={true}>
        <input
          type="text"
          value={visual.title}
          onChange={(e) => updateTitle(e.target.value)}
          className="w-full px-2 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={visual.showTitle}
            onChange={toggleShowTitle}
            className="rounded border-neutral-300"
          />
          Mostrar título
        </label>
      </FormattingSection>

      <FormattingSection title="Legenda" icon={<Eye size={12} />}>
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={visual.formatting.showLegend !== false}
            onChange={() => updateFormatting('showLegend', !visual.formatting.showLegend)}
            className="rounded border-neutral-300"
          />
          Mostrar legenda
        </label>
        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Posição</label>
          <select className="w-full mt-1 px-2 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
            <option value="bottom">Embaixo</option>
            <option value="top">Em cima</option>
            <option value="left">Esquerda</option>
            <option value="right">Direita</option>
          </select>
        </div>
      </FormattingSection>

      <FormattingSection title="Rótulos de Dados" icon={<BarChart3 size={12} />}>
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={visual.formatting.showDataLabels || false}
            onChange={() => updateFormatting('showDataLabels', !visual.formatting.showDataLabels)}
            className="rounded border-neutral-300"
          />
          Mostrar rótulos
        </label>
        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Tamanho da fonte</label>
          <input
            type="number"
            value={10}
            min={8}
            max={24}
            className="w-full mt-1 px-2 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Cor</label>
          <input
            type="color"
            value="#000000"
            className="w-8 h-8 rounded border border-neutral-200 dark:border-neutral-700 cursor-pointer"
          />
        </div>
      </FormattingSection>

      <FormattingSection title="Grade" icon={<Grid3X3 size={12} />}>
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={visual.formatting.showGridLines !== false}
            onChange={() => updateFormatting('showGridLines', !visual.formatting.showGridLines)}
            className="rounded border-neutral-300"
          />
          Mostrar linhas de grade
        </label>
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={visual.formatting.showAxisLabels !== false}
            onChange={() => updateFormatting('showAxisLabels', !visual.formatting.showAxisLabels)}
            className="rounded border-neutral-300"
          />
          Mostrar rótulos dos eixos
        </label>
      </FormattingSection>

      <FormattingSection title="Eixos" icon={<Type size={12} />}>
        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Rótulo Eixo X</label>
          <input
            type="text"
            value={visual.formatting.xAxisLabel || ''}
            onChange={(e) => updateFormatting('xAxisLabel', e.target.value)}
            placeholder="Ex: Mês"
            className="w-full mt-1 px-2 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Rótulo Eixo Y</label>
          <input
            type="text"
            value={visual.formatting.yAxisLabel || ''}
            onChange={(e) => updateFormatting('yAxisLabel', e.target.value)}
            placeholder="Ex: Valor (R$)"
            className="w-full mt-1 px-2 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </FormattingSection>

      <FormattingSection title="Cores" icon={<Palette size={12} />}>
        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Cor de Fundo</label>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="color"
              value={visual.formatting.backgroundColor || '#ffffff'}
              onChange={(e) => updateFormatting('backgroundColor', e.target.value)}
              className="w-8 h-8 rounded border border-neutral-200 dark:border-neutral-700 cursor-pointer"
            />
            <input
              type="text"
              value={visual.formatting.backgroundColor || ''}
              onChange={(e) => updateFormatting('backgroundColor', e.target.value)}
              placeholder="#ffffff"
              className="flex-1 px-2 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Cor da Borda</label>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="color"
              value={visual.formatting.borderColor || '#e5e7eb'}
              onChange={(e) => updateFormatting('borderColor', e.target.value)}
              className="w-8 h-8 rounded border border-neutral-200 dark:border-neutral-700 cursor-pointer"
            />
            <input
              type="text"
              value={visual.formatting.borderColor || ''}
              onChange={(e) => updateFormatting('borderColor', e.target.value)}
              placeholder="#e5e7eb"
              className="flex-1 px-2 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
      </FormattingSection>
    </div>
  );
}
