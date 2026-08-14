'use client';

import React from 'react';
import type { Visual } from '../../types/dashboard';
import type { VisualType } from '../../types/visuals';
import type { StudioAction } from '../../types/state';
import { FormattingSection } from '../shared/FormattingSection';
import type { FormattingSectionDef, FormattingField } from './formattingConfig';

function getValue(visual: Visual, path: string): unknown {
  if (path === 'title') return visual.title;
  if (path === 'showTitle') return visual.showTitle;
  if (path.startsWith('canvas.')) {
    const key = path.slice(7);
    return (visual.canvasProperties as Record<string, unknown>)?.[key];
  }
  if (path.startsWith('fmt.')) {
    const key = path.slice(4);
    return (visual.formatting as Record<string, unknown>)?.[key];
  }
  return undefined;
}

function getDefaultValue(field: FormattingField): unknown {
  switch (field.type) {
    case 'number': return field.min ?? 0;
    case 'checkbox': return false;
    case 'color': return '#374151';
    default: return '';
  }
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
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full mt-1 px-2 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-500" />
    </div>
  );
}

function NumberInput({ label, value, onChange, min, max, step }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <div>
      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <input type="number" value={value} min={min} max={max} step={step} onChange={(e) => onChange(Number(e.target.value))}
        className="w-full mt-1 px-2 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-500" />
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
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 px-2 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );
}

function renderField(
  field: FormattingField,
  value: unknown,
  onChange: (v: unknown) => void,
  vType: VisualType
) {
  if (field.visible && !field.visible(vType)) return null;

  switch (field.type) {
    case 'checkbox':
      return <Toggle key={field.key} label={field.label} checked={!!value} onChange={() => onChange(!value)} />;
    case 'number':
      return <NumberInput key={field.key} label={field.label} value={(value as number) ?? (getDefaultValue(field) as number)} onChange={(v) => onChange(v)} min={field.min} max={field.max} step={field.step} />;
    case 'color':
      return <ColorInput key={field.key} label={field.label} value={(value as string) || '#374151'} onChange={(v) => onChange(v)} />;
    case 'select':
      return <SelectInput key={field.key} label={field.label} value={(value as string) || ''} onChange={(v) => onChange(v)} options={field.options || []} />;
    case 'text':
    default:
      return <TextInput key={field.key} label={field.label} value={(value as string) || ''} onChange={(v) => onChange(v)} placeholder={field.placeholder} />;
  }
}

function buildUpdateFn(visual: Visual, dispatch: React.Dispatch<StudioAction>, path: string) {
  if (path === 'title') {
    return (v: unknown) => dispatch({ type: 'UPDATE_VISUAL', payload: { id: visual.id, updates: { title: String(v) } } });
  }
  if (path === 'showTitle') {
    return (_v: unknown) => dispatch({ type: 'UPDATE_VISUAL', payload: { id: visual.id, updates: { showTitle: !visual.showTitle } } });
  }
  if (path.startsWith('canvas.')) {
    const key = path.slice(7);
    return (v: unknown) => dispatch({
      type: 'UPDATE_VISUAL',
      payload: { id: visual.id, updates: { canvasProperties: { ...visual.canvasProperties, [key]: v } } },
    });
  }
  if (path.startsWith('fmt.')) {
    const key = path.slice(4);
    return (v: unknown) => dispatch({
      type: 'UPDATE_VISUAL',
      payload: { id: visual.id, updates: { formatting: { ...visual.formatting, [key]: v } } },
    });
  }
  return () => {};
}

interface Props {
  visual: Visual;
  dispatch: React.Dispatch<StudioAction>;
  section: FormattingSectionDef;
}

export function FormattingSectionRenderer({ visual, dispatch, section }: Props) {
  if (!section.visible(visual.type)) return null;

  const visibleFields = section.fields.filter((f) => {
    if (f.visible && !f.visible(visual.type)) return false;
    return true;
  });

  if (visibleFields.length === 0) return null;

  return (
    <FormattingSection key={section.id} title={section.label} icon={null}>
      {visibleFields.map((field) => {
        const value = getValue(visual, field.path);
        const onChange = buildUpdateFn(visual, dispatch, field.path);
        return renderField(field, value, onChange, visual.type);
      })}
    </FormattingSection>
  );
}
