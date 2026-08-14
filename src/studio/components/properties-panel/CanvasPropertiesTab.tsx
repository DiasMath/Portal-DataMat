'use client';

import React, { useState } from 'react';
import { useStudio } from '../../store/StudioContext';
import type { Visual } from '../../types/dashboard';
import { ChevronDown } from 'lucide-react';

interface CanvasPropertiesTabProps {
  visual: Visual;
}

interface SectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function Section({ title, defaultOpen = false, children }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-neutral-200 dark:border-neutral-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
      >
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

export function CanvasPropertiesTab({ visual }: CanvasPropertiesTabProps) {
  const { dispatch } = useStudio();
  const cp = visual.canvasProperties || {};

  const updateCanvasProp = (key: string, value: unknown) => {
    dispatch({
      type: 'UPDATE_VISUAL',
      payload: {
        id: visual.id,
        updates: {
          canvasProperties: { ...cp, [key]: value },
        },
      },
    });
  };

  const showShell = cp.showShell !== false;

  return (
    <div className="space-y-0">
      <Section title="Geral" defaultOpen>
        <Toggle label="Mostrar caixa" checked={showShell} onChange={() => updateCanvasProp('showShell', !showShell)} />
      </Section>

      <Section title="Posicao e Tamanho">
        <div className="grid grid-cols-2 gap-2">
          <NumberInput label="Posicao X" value={visual.x} onChange={(v) => dispatch({ type: 'UPDATE_VISUAL', payload: { id: visual.id, updates: { x: v } } })} step={10} />
          <NumberInput label="Posicao Y" value={visual.y} onChange={(v) => dispatch({ type: 'UPDATE_VISUAL', payload: { id: visual.id, updates: { y: v } } })} step={10} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumberInput label="Largura" value={visual.width} onChange={(v) => dispatch({ type: 'UPDATE_VISUAL', payload: { id: visual.id, updates: { width: v } } })} min={100} step={10} />
          <NumberInput label="Altura" value={visual.height} onChange={(v) => dispatch({ type: 'UPDATE_VISUAL', payload: { id: visual.id, updates: { height: v } } })} min={80} step={10} />
        </div>
        <Toggle label="Travar tamanho" checked={!!cp.locked} onChange={() => updateCanvasProp('locked', !cp.locked)} />
      </Section>

      {showShell && (
        <>
          <Section title="Aparencia">
            <Toggle label="Fundo transparente" checked={!!cp.backgroundTransparent} onChange={() => updateCanvasProp('backgroundTransparent', !cp.backgroundTransparent)} />
            {!cp.backgroundTransparent && (
              <>
                <ColorInput label="Cor de fundo" value={cp.backgroundColor || '#ffffff'} onChange={(v) => updateCanvasProp('backgroundColor', v)} />
                <NumberInput label="Opacidade" value={cp.backgroundOpacity ?? 1} onChange={(v) => updateCanvasProp('backgroundOpacity', v)} min={0} max={1} step={0.1} />
              </>
            )}
            <TextInput label="Imagem de fundo" value={cp.backgroundImage || ''} onChange={(v) => updateCanvasProp('backgroundImage', v)} placeholder="URL da imagem" />
          </Section>

          <Section title="Borda">
            <Toggle label="Mostrar borda" checked={!!cp.showBorder} onChange={() => updateCanvasProp('showBorder', !cp.showBorder)} />
            {cp.showBorder && (
              <>
                <ColorInput label="Cor da borda" value={cp.borderColor || '#e5e7eb'} onChange={(v) => updateCanvasProp('borderColor', v)} />
                <NumberInput label="Espessura" value={cp.borderWidth ?? 1} onChange={(v) => updateCanvasProp('borderWidth', v)} min={0} max={10} />
                <NumberInput label="Raio" value={cp.borderRadius ?? 0} onChange={(v) => updateCanvasProp('borderRadius', v)} min={0} max={20} />
              </>
            )}
          </Section>

          <Section title="Efeito">
            <Toggle label="Sombra" checked={!!cp.shadowEnabled} onChange={() => updateCanvasProp('shadowEnabled', !cp.shadowEnabled)} />
            {cp.shadowEnabled && (
              <>
                <ColorInput label="Cor da sombra" value={cp.shadowColor || 'rgba(0,0,0,0.2)'} onChange={(v) => updateCanvasProp('shadowColor', v)} />
                <NumberInput label="Desfoque" value={cp.shadowBlur ?? 10} onChange={(v) => updateCanvasProp('shadowBlur', v)} min={0} max={50} />
                <div className="grid grid-cols-2 gap-2">
                  <NumberInput label="Offset X" value={cp.shadowOffsetX ?? 0} onChange={(v) => updateCanvasProp('shadowOffsetX', v)} min={-20} max={20} />
                  <NumberInput label="Offset Y" value={cp.shadowOffsetY ?? 2} onChange={(v) => updateCanvasProp('shadowOffsetY', v)} min={-20} max={20} />
                </div>
              </>
            )}
          </Section>
        </>
      )}

      <Section title="Tooltip">
        <Toggle label="Habilitar tooltip" checked={cp.enableTooltip !== false} onChange={() => updateCanvasProp('enableTooltip', cp.enableTooltip === false ? true : false)} />
        {cp.enableTooltip !== false && (
          <SelectInput
            label="Estilo"
            value={cp.tooltipStyle || 'default'}
            onChange={(v) => updateCanvasProp('tooltipStyle', v)}
            options={[
              { value: 'default', label: 'Padrao' },
              { value: 'compact', label: 'Compacto' },
              { value: 'detailed', label: 'Detalhado' },
            ]}
          />
        )}
      </Section>
    </div>
  );
}
