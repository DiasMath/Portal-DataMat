'use client';

import React, { useRef, useCallback } from 'react';
import { useStudio } from '../../store/StudioContext';
import { PAGE_PRESETS } from '../../types/canvas';
import { Image, X } from 'lucide-react';
import { FormattingSection } from '../shared/FormattingSection';

export function PageSettings() {
  const { state, dispatch } = useStudio();
  const activePage = state.pages.find(p => p.id === state.activePageId);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      dispatch({
        type: 'SET_PAGE_BACKGROUND_IMAGE',
        payload: { pageId: activePage.id, backgroundImage: dataUrl },
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [activePage.id, dispatch]);

  const handleRemoveImage = useCallback(() => {
    dispatch({
      type: 'SET_PAGE_BACKGROUND_IMAGE',
      payload: { pageId: activePage.id, backgroundImage: undefined },
    });
  }, [activePage.id, dispatch]);

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

      <FormattingSection title="Imagem de Fundo" icon={<Image size={12} />} defaultOpen={true}>
        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Imagem de Fundo</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          {activePage.backgroundImage ? (
            <div className="mt-1 relative group">
              <div
                className="w-full h-16 rounded border border-neutral-200 dark:border-neutral-700 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${activePage.backgroundImage})` }}
              />
              <button
                onClick={handleRemoveImage}
                className="absolute top-1 right-1 p-0.5 bg-neutral-900/80 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={10} />
              </button>
            </div>
          ) : (
            <div className="mt-1 flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] text-muted-foreground bg-neutral-100 dark:bg-neutral-800 rounded border border-dashed border-neutral-300 dark:border-neutral-600 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                <Image size={12} />
                Carregar imagem
              </button>
            </div>
          )}
          <div className="mt-1">
            <label className="text-[9px] text-muted-foreground">Posição</label>
            <select
              value={activePage.backgroundImagePosition || 'cover'}
              onChange={(e) => {
                dispatch({
                  type: 'SET_PAGE_BACKGROUND_IMAGE',
                  payload: {
                    pageId: activePage.id,
                    backgroundImagePosition: e.target.value as 'cover' | 'contain' | 'stretch' | 'center',
                  },
                });
              }}
              className="w-full mt-0.5 px-2 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700"
            >
              <option value="cover">Preencher</option>
              <option value="contain">Ajustar</option>
              <option value="stretch">Esticar</option>
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
