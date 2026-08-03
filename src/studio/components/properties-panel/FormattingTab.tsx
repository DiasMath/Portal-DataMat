'use client';

import React, { useState } from 'react';
import { useStudio } from '../../store/StudioContext';
import type { Visual } from '../../types/dashboard';
import type { VisualType } from '../../types/visuals';
import { VISUAL_TYPE_LABELS } from '../../types/visuals';
import { ChevronDown, Type, Palette, Grid3X3, Eye, BarChart3, Search, Settings, TrendingUp, Circle, Minus } from 'lucide-react';

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
        <ChevronDown size={12} className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <div className="px-3 pb-3 space-y-2">{children}</div>}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} className="rounded border-neutral-300" />
      {label}
    </label>
  );
}

function TextInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full mt-1 px-2 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
      />
    </div>
  );
}

function NumberInput({ label, value, onChange, min, max, step }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <div>
      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full mt-1 px-2 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
      />
    </div>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-2 mt-1">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-8 h-8 rounded border border-neutral-200 dark:border-neutral-700 cursor-pointer" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 px-2 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-500" />
      </div>
    </div>
  );
}

function SelectInput({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 px-2 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700"
      >
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );
}

export function FormattingTab({ visual }: FormattingTabProps) {
  const { dispatch } = useStudio();
  const [searchTerm, setSearchTerm] = useState('');

  const updateFormatting = (key: string, value: unknown) => {
    dispatch({
      type: 'UPDATE_VISUAL',
      payload: { id: visual.id, updates: { formatting: { ...visual.formatting, [key]: value } } },
    });
  };

  const updateTitle = (title: string) => {
    dispatch({ type: 'UPDATE_VISUAL', payload: { id: visual.id, updates: { title } } });
  };

  const toggleShowTitle = () => {
    dispatch({ type: 'UPDATE_VISUAL', payload: { id: visual.id, updates: { showTitle: !visual.showTitle } } });
  };

  const f = visual.formatting;
  const vType = visual.type;

  const showAxes = ['bar', 'line', 'area', 'scatter', 'combo'].includes(vType);
  const showLegend = !['table', 'kpi', 'card', 'gauge'].includes(vType);
  const showDataLabels = !['table'].includes(vType);
  const showGridLines = showAxes;
  const showPieSlices = ['pie', 'donut'].includes(vType);
  const showLines = ['line', 'area'].includes(vType);
  const showGauge = vType === 'gauge';
  const showKpi = vType === 'kpi' || vType === 'card';
  const showTableOptions = vType === 'table';

  const allSections = [
    { key: 'titulo', title: 'Título', icon: <Type size={12} />, show: true, defaultOpen: true },
    { key: 'propriedades', title: 'Propriedades', icon: <Settings size={12} />, show: true },
    { key: 'legenda', title: 'Legenda', icon: <Eye size={12} />, show: showLegend },
    { key: 'rotulos', title: 'Rótulos de Dados', icon: <BarChart3 size={12} />, show: showDataLabels },
    { key: 'eixos', title: 'Eixos', icon: <Minus size={12} />, show: showAxes },
    { key: 'grade', title: 'Grade', icon: <Grid3X3 size={12} />, show: showGridLines },
    { key: 'linhas', title: 'Linhas e Marcadores', icon: <TrendingUp size={12} />, show: showLines },
    { key: 'fatias', title: 'Fatias', icon: <Circle size={12} />, show: showPieSlices },
    { key: 'gauge', title: 'Eixo do Medidor', icon: <BarChart3 size={12} />, show: showGauge },
    { key: 'kpi', title: 'Indicador KPI', icon: <BarChart3 size={12} />, show: showKpi },
    { key: 'tabela', title: 'Opções da Tabela', icon: <Settings size={12} />, show: showTableOptions },
    { key: 'cores', title: 'Cores', icon: <Palette size={12} />, show: true },
  ];

  const filteredSections = searchTerm
    ? allSections.filter(s => s.show && s.title.toLowerCase().includes(searchTerm.toLowerCase()))
    : allSections.filter(s => s.show);

  return (
    <div className="space-y-0">
      <div className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-700">
        <div className="relative">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar configuração..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-7 pr-2 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {filteredSections.map(section => {
        if (section.key === 'titulo') return (
          <FormattingSection key="titulo" title="Título" icon={<Type size={12} />} defaultOpen>
            <TextInput label="Título" value={visual.title} onChange={updateTitle} />
            <Toggle label="Mostrar título" checked={visual.showTitle} onChange={toggleShowTitle} />
          </FormattingSection>
        );

        if (section.key === 'propriedades') return (
          <FormattingSection key="propriedades" title="Propriedades" icon={<Settings size={12} />}>
            <div className="grid grid-cols-2 gap-2">
              <NumberInput label="Largura" value={visual.width} onChange={(v) => dispatch({ type: 'UPDATE_VISUAL', payload: { id: visual.id, updates: { width: v } } })} min={100} step={10} />
              <NumberInput label="Altura" value={visual.height} onChange={(v) => dispatch({ type: 'UPDATE_VISUAL', payload: { id: visual.id, updates: { height: v } } })} min={80} step={10} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <NumberInput label="Posição X" value={visual.x} onChange={(v) => dispatch({ type: 'UPDATE_VISUAL', payload: { id: visual.id, updates: { x: v } } })} step={10} />
              <NumberInput label="Posição Y" value={visual.y} onChange={(v) => dispatch({ type: 'UPDATE_VISUAL', payload: { id: visual.id, updates: { y: v } } })} step={10} />
            </div>
          </FormattingSection>
        );

        if (section.key === 'legenda') return (
          <FormattingSection key="legenda" title="Legenda" icon={<Eye size={12} />}>
            <Toggle label="Mostrar legenda" checked={f.showLegend !== false} onChange={() => updateFormatting('showLegend', !f.showLegend)} />
            <SelectInput label="Posição" value={f.legendPosition || 'bottom'} onChange={(v) => updateFormatting('legendPosition', v)} options={[
              { value: 'top', label: 'Em cima' },
              { value: 'bottom', label: 'Embaixo' },
              { value: 'left', label: 'Esquerda' },
              { value: 'right', label: 'Direita' },
            ]} />
          </FormattingSection>
        );

        if (section.key === 'rotulos') return (
          <FormattingSection key="rotulos" title="Rótulos de Dados" icon={<BarChart3 size={12} />}>
            <Toggle label="Mostrar rótulos" checked={!!f.dataLabels} onChange={() => updateFormatting('dataLabels', !f.dataLabels)} />
            <SelectInput label="Formato" value={f.dataLabelFormat || 'value'} onChange={(v) => updateFormatting('dataLabelFormat', v)} options={[
              { value: 'value', label: 'Valor' },
              { value: 'percent', label: 'Percentual' },
            ]} />
            <NumberInput label="Tamanho da fonte" value={f.dataLabelFontSize || 10} onChange={(v) => updateFormatting('dataLabelFontSize', v)} min={8} max={24} />
            <ColorInput label="Cor" value={f.dataLabelColor || '#374151'} onChange={(v) => updateFormatting('dataLabelColor', v)} />
          </FormattingSection>
        );

        if (section.key === 'eixos') return (
          <FormattingSection key="eixos" title="Eixos" icon={<Minus size={12} />}>
            <Toggle label="Mostrar rótulos dos eixos" checked={f.showAxisLabels !== false} onChange={() => updateFormatting('showAxisLabels', !f.showAxisLabels)} />
            <TextInput label="Rótulo Eixo X" value={f.xAxisLabel || ''} onChange={(v) => updateFormatting('xAxisLabel', v)} placeholder="Ex: Mês" />
            <TextInput label="Rótulo Eixo Y" value={f.yAxisLabel || ''} onChange={(v) => updateFormatting('yAxisLabel', v)} placeholder="Ex: Valor (R$)" />
          </FormattingSection>
        );

        if (section.key === 'grade') return (
          <FormattingSection key="grade" title="Grade" icon={<Grid3X3 size={12} />}>
            <Toggle label="Mostrar linhas de grade" checked={f.showGridLines !== false} onChange={() => updateFormatting('showGridLines', !f.showGridLines)} />
          </FormattingSection>
        );

        if (section.key === 'linhas') return (
          <FormattingSection key="linhas" title="Linhas e Marcadores" icon={<TrendingUp size={12} />}>
            <SelectInput label="Estilo da linha" value={f.lineStyle || 'solid'} onChange={(v) => updateFormatting('lineStyle', v)} options={[
              { value: 'solid', label: 'Sólida' },
              { value: 'dashed', label: 'Tracejada' },
              { value: 'dotted', label: 'Pontilhada' },
            ]} />
            <NumberInput label="Espessura" value={f.strokeWidth || 2} onChange={(v) => updateFormatting('strokeWidth', v)} min={1} max={10} />
            <Toggle label="Mostrar marcadores" checked={f.showMarkers !== false} onChange={() => updateFormatting('showMarkers', !f.showMarkers)} />
            <NumberInput label="Tamanho do marcador" value={f.markerSize || 3} onChange={(v) => updateFormatting('markerSize', v)} min={1} max={12} />
          </FormattingSection>
        );

        if (section.key === 'fatias') return (
          <FormattingSection key="fatias" title="Fatias" icon={<Circle size={12} />}>
            <NumberInput label="Rotação (graus)" value={f.rotation || 0} onChange={(v) => updateFormatting('rotation', v)} min={0} max={360} />
            {vType === 'donut' && (
              <NumberInput label="Raio interno (%)" value={f.innerRadius || 50} onChange={(v) => updateFormatting('innerRadius', v)} min={10} max={90} />
            )}
          </FormattingSection>
        );

        if (section.key === 'gauge') return (
          <FormattingSection key="gauge" title="Eixo do Medidor" icon={<BarChart3 size={12} />}>
            <NumberInput label="Mínimo" value={f.gaugeMin || 0} onChange={(v) => updateFormatting('gaugeMin', v)} />
            <NumberInput label="Máximo" value={f.gaugeMax || 100} onChange={(v) => updateFormatting('gaugeMax', v)} />
            <NumberInput label="Meta" value={f.gaugeTarget || 75} onChange={(v) => updateFormatting('gaugeTarget', v)} />
            <ColorInput label="Cor de preenchimento" value={f.gaugeColor || '#f59e0b'} onChange={(v) => updateFormatting('gaugeColor', v)} />
          </FormattingSection>
        );

        if (section.key === 'kpi') return (
          <FormattingSection key="kpi" title="Indicador KPI" icon={<BarChart3 size={12} />}>
            <SelectInput label="Unidade de exibição" value={f.displayUnits || 'auto'} onChange={(v) => updateFormatting('displayUnits', v)} options={[
              { value: 'auto', label: 'Automático' },
              { value: 'none', label: 'Nenhum' },
              { value: 'thousands', label: 'Milhar (K)' },
              { value: 'millions', label: 'Milhão (M)' },
              { value: 'billions', label: 'Bilhão (B)' },
            ]} />
            <NumberInput label="Casas decimais" value={f.decimalPlaces || 0} onChange={(v) => updateFormatting('decimalPlaces', v)} min={0} max={10} />
            <Toggle label="Mostrar ícone de tendência" checked={f.showTrendIcon !== false} onChange={() => updateFormatting('showTrendIcon', !f.showTrendIcon)} />
          </FormattingSection>
        );

        if (section.key === 'tabela') return (
          <FormattingSection key="tabela" title="Opções da Tabela" icon={<Settings size={12} />}>
            <Toggle label="Mostrar totais" checked={f.showTotals !== false} onChange={() => updateFormatting('showTotals', !f.showTotals)} />
            <Toggle label="Mostrar subtotais" checked={f.showSubtotals !== false} onChange={() => updateFormatting('showSubtotals', !f.showSubtotals)} />
            <NumberInput label="Padding das linhas" value={f.rowPadding || 8} onChange={(v) => updateFormatting('rowPadding', v)} min={0} max={30} />
            <SelectInput label="Alinhamento do cabeçalho" value={f.headerAlign || 'left'} onChange={(v) => updateFormatting('headerAlign', v)} options={[
              { value: 'left', label: 'Esquerda' },
              { value: 'center', label: 'Centro' },
              { value: 'right', label: 'Direita' },
            ]} />
          </FormattingSection>
        );

        if (section.key === 'cores') return (
          <FormattingSection key="cores" title="Cores" icon={<Palette size={12} />}>
            <ColorInput label="Cor de Fundo" value={f.backgroundColor || '#ffffff'} onChange={(v) => updateFormatting('backgroundColor', v)} />
            <ColorInput label="Cor da Borda" value={f.borderColor || '#e5e7eb'} onChange={(v) => updateFormatting('borderColor', v)} />
            <NumberInput label="Raio da borda" value={f.borderRadius || 0} onChange={(v) => updateFormatting('borderRadius', v)} min={0} max={20} />
          </FormattingSection>
        );

        return null;
      })}
    </div>
  );
}
