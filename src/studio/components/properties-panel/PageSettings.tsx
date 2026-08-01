'use client';

import React from 'react';
import { useStudio } from '../../store/StudioContext';
import { PAGE_PRESETS } from '../../types/canvas';
import { ChevronDown, Image } from 'lucide-react';

export function PageSettings() {
  const { state, dispatch } = useStudio();
  const activePage = state.pages.find(p => p.id === state.activePageId);

  if (!activePage) return null;

  const pageWidth = activePage.pageWidth || 1920;
  const pageHeight = activePage.pageHeight || 1080;

  const handlePresetChange = (presetName: string) => {
    const preset = PAGE_PRESETS.find(p => p.name === presetName);
    if (preset) {
      dispatch({
        type: 'SET_PAGE_SIZE',
        payload: {
          pageId: activePage.id,
          width: preset.width,
          height: preset.height,
          preset: preset.name,
        },
      });
    }
  };

  const handleSizeChange = (field: 'width' | 'height', value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 100 || num > 5000) return;
    dispatch({
      type: 'SET_PAGE_SIZE',
      payload: {
        pageId: activePage.id,
        width: field === 'width' ? num : pageWidth,
        height: field === 'height' ? num : pageHeight,
        preset: undefined,
      },
    });
  };

  return (
    <div className="space-y-0">
      <FormattingSection title="Presets da Página" icon={<Image size={12} />} defaultOpen={true}>
        <div className="grid grid-cols-2 gap-1">
          {PAGE_PRESETS.map(preset => {
            const isActive = activePage.pagePreset === preset.name;
            return (
              <button
                key={preset.name}
                onClick={() => handlePresetChange(preset.name)}
                className={`text-left p-2 rounded-md text-[10px] transition-colors
                  ${isActive
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 ring-1 ring-amber-300 dark:ring-amber-700'
                    : 'text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }
                `}
              >
                <div className="font-medium">{preset.label}</div>
                <div className="text-[9px] opacity-70">{preset.width} × {preset.height}</div>
              </button>
            );
          })}
        </div>
      </FormattingSection>

      <FormattingSection title="Tamanho Personalizado" icon={<Image size={12} />}>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="text-[9px] text-muted-foreground">Largura</label>
            <input
              type="number"
              value={pageWidth}
              onChange={(e) => handleSizeChange('width', e.target.value)}
              min={100}
              max={5000}
              className="w-full px-2 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <span className="text-muted-foreground mt-4">×</span>
          <div className="flex-1">
            <label className="text-[9px] text-muted-foreground">Altura</label>
            <input
              type="number"
              value={pageHeight}
              onChange={(e) => handleSizeChange('height', e.target.value)}
              min={100}
              max={5000}
              className="w-full px-2 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
      </FormattingSection>

      <FormattingSection title="Aparência" icon={<Image size={12} />}>
        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Cor de Fundo</label>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="color"
              value={activePage.background || '#ffffff'}
              onChange={(e) => {
                dispatch({
                  type: 'SET_PAGE_SIZE',
                  payload: {
                    pageId: activePage.id,
                    width: pageWidth,
                    height: pageHeight,
                    preset: activePage.pagePreset,
                  },
                });
              }}
              className="w-8 h-8 rounded border border-neutral-200 dark:border-neutral-700 cursor-pointer"
            />
            <input
              type="text"
              value={activePage.background || '#ffffff'}
              onChange={(e) => {}}
              placeholder="#ffffff"
              className="flex-1 px-2 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Imagem de Fundo</label>
          <div className="mt-1 flex items-center gap-2">
            <button className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] text-muted-foreground bg-neutral-100 dark:bg-neutral-800 rounded border border-dashed border-neutral-300 dark:border-neutral-600 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
              <Image size={12} />
              Carregar imagem
            </button>
          </div>
          <div className="mt-1">
            <label className="text-[9px] text-muted-foreground">Posição</label>
            <select className="w-full mt-0.5 px-2 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
              <option value="cover">Preencher</option>
              <option value="contain">Ajustar</option>
              <option value="repeat">Repetir</option>
              <option value="center">Centralizar</option>
            </select>
          </div>
        </div>
      </FormattingSection>

      <div className="px-3 py-2 border-t border-neutral-200 dark:border-neutral-700">
        <div className="text-[10px] text-muted-foreground">
          Página: {pageWidth} × {pageHeight}px
        </div>
      </div>
    </div>
  );
}

function FormattingSection({
  title,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

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
