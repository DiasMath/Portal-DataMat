'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { VisualType } from '../../types/visuals';
import { VISUAL_TYPE_LABELS } from '../../types/visuals';
import { VisualPreview } from '../properties-panel/VisualPreview';
import {
  X, Search,
} from 'lucide-react';

interface VisualGalleryDialogProps {
  onSelect: (type: VisualType) => void;
  onClose: () => void;
}

const DEFAULT_VISUAL_TYPES: VisualType[] = [
  'bar', 'line', 'area', 'pie', 'donut',
  'scatter', 'table', 'kpi', 'card', 'treemap',
  'waterfall', 'combo', 'radar', 'funnel', 'ribbon', 'matrix',
];

const ADDITIONAL_VISUAL_TYPES: VisualType[] = [
  'gauge', 'bullet', 'sunburst', 'sankey',
  'wordcloud', 'boxplot', 'histogram', 'dotplot', 'lollipop',
];

const DESCRIPTIONS: Record<VisualType, string> = {
  bar: 'Compare valores entre categorias',
  line: 'Mostre tendencias ao longo do tempo',
  area: 'Volume e tendencia com preenchimento',
  pie: 'Proporcao de partes em um todo',
  donut: 'Proporcao com espaco central',
  scatter: 'Correlacao entre duas variaveis',
  table: 'Dados detalhados em linhas e colunas',
  kpi: 'Indicador de desempenho principal',
  card: 'Valor destacado com contexto',
  gauge: 'Progresso em direcao a uma meta',
  treemap: 'Hierarquia com blocos proporcionais',
  waterfall: 'Variacoes positivas e negativas',
  combo: 'Barras e linhas no mesmo grafico',
  radar: 'Multiplas metricas em eixos radiais',
  funnel: 'Funil de conversao etapa a etapa',
  ribbon: 'Fluxo e ranking entre categorias',
  matrix: 'Tabela pivot com drill-down',
  bullet: 'Performance vs meta com faixas',
  sunburst: 'Hierarquia radial multi-nivel',
  sankey: 'Fluxo de dados entre origem e destino',
  wordcloud: 'Frequencia de palavras em texto',
  boxplot: 'Distribuicao estatistica completa',
  histogram: 'Frequencia de valores em intervalos',
  dotplot: 'Distribuicao de pontos por categoria',
  lollipop: 'Barras finas com pontas destacadas',
};

const CATEGORIES: { label: string; types: VisualType[] }[] = [
  { label: 'Especiais', types: ['gauge', 'bullet', 'lollipop'] },
  { label: 'Hierarquia e Fluxo', types: ['sunburst', 'sankey', 'ribbon'] },
  { label: 'Distribuicao', types: ['boxplot', 'histogram', 'dotplot', 'wordcloud'] },
];

export function VisualGalleryDialog({ onSelect, onClose }: VisualGalleryDialogProps) {
  const [search, setSearch] = useState('');

  const filteredTypes = useMemo(() => {
    if (!search) return ADDITIONAL_VISUAL_TYPES;
    const term = search.toLowerCase();
    return ADDITIONAL_VISUAL_TYPES.filter(t =>
      VISUAL_TYPE_LABELS[t].toLowerCase().includes(term) ||
      DESCRIPTIONS[t].toLowerCase().includes(term)
    );
  }, [search]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="text-sm font-semibold">Mais Visuais</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <X size={16} />
          </button>
        </div>

        <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-700">
          <div className="relative">
            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar visual..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {search ? (
            <div className="grid grid-cols-4 gap-3">
              {filteredTypes.map(type => (
                <VisualCard key={type} type={type} onSelect={onSelect} />
              ))}
            </div>
          ) : (
            CATEGORIES.map(cat => (
              <div key={cat.label}>
                <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  {cat.label}
                </h4>
                <div className="grid grid-cols-4 gap-3">
                  {cat.types.map(type => (
                    <VisualCard key={type} type={type} onSelect={onSelect} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function VisualCard({ type, onSelect }: { type: VisualType; onSelect: (type: VisualType) => void }) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );
    if (cardRef.current) {
      observer.observe(cardRef.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <button
      ref={cardRef}
      onClick={() => onSelect(type)}
      className="flex flex-col items-center gap-2 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all group"
    >
      <div className="w-40 h-28 flex items-center justify-center bg-neutral-50 dark:bg-neutral-800 rounded min-w-0">
        {isVisible ? (
          <VisualPreview type={type} width={140} height={100} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-300">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="7" height="9" rx="1"/>
              <rect x="14" y="3" width="7" height="5" rx="1"/>
              <rect x="3" y="16" width="7" height="5" rx="1"/>
              <rect x="14" y="16" width="7" height="9" rx="1"/>
            </svg>
          </div>
        )}
      </div>
      <span className="text-[10px] font-medium text-neutral-700 dark:text-neutral-300 text-center leading-tight">
        {VISUAL_TYPE_LABELS[type]}
      </span>
      <span className="text-[8px] text-muted-foreground text-center leading-tight">
        {DESCRIPTIONS[type]}
      </span>
    </button>
  );
}
