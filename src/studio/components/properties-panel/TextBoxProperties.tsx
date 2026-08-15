'use client';

/**
 * TextBoxProperties - Formatting panel for CanvasTextBox.
 * Shows when a TextBox is selected in the Properties Panel.
 */

import React from 'react';
import { useStudio } from '../../store/StudioContext';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
} from 'lucide-react';

export function TextBoxProperties() {
  const { state, dispatch } = useStudio();

  const selectedTextBox = state.textBoxes.find(tb => tb.id === state.selectedTextBoxId);

  if (!selectedTextBox) return null;

  const { formatting } = selectedTextBox;

  const updateFormatting = (updates: Partial<typeof formatting>) => {
    dispatch({
      type: 'UPDATE_TEXT_BOX',
      payload: {
        id: selectedTextBox.id,
        updates: { formatting: { ...formatting, ...updates } },
      },
    });
  };

  return (
    <div className="p-3 space-y-4">
      {/* Font Size */}
      <div>
        <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
          Tamanho da Fonte
        </label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="8"
            max="72"
            value={formatting.fontSize}
            onChange={(e) => updateFormatting({ fontSize: Number(e.target.value) })}
            className="flex-1 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <span className="text-xs text-muted-foreground w-8 text-right">{formatting.fontSize}</span>
        </div>
      </div>

      {/* Text Style */}
      <div>
        <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
          Estilo
        </label>
        <div className="flex gap-1">
          <button
            onClick={() => updateFormatting({ fontWeight: formatting.fontWeight === 'bold' ? 'normal' : 'bold' })}
            className={`p-2 rounded transition-colors ${
              formatting.fontWeight === 'bold'
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                : 'text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
            title="Negrito"
          >
            <Bold size={14} />
          </button>
          <button
            onClick={() => updateFormatting({ fontStyle: formatting.fontStyle === 'italic' ? 'normal' : 'italic' })}
            className={`p-2 rounded transition-colors ${
              formatting.fontStyle === 'italic'
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                : 'text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
            title="Itálico"
          >
            <Italic size={14} />
          </button>
          <button
            onClick={() => updateFormatting({ textDecoration: formatting.textDecoration === 'underline' ? 'none' : 'underline' })}
            className={`p-2 rounded transition-colors ${
              formatting.textDecoration === 'underline'
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                : 'text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
            title="Sublinhado"
          >
            <Underline size={14} />
          </button>
        </div>
      </div>

      {/* Text Alignment */}
      <div>
        <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
          Alinhamento
        </label>
        <div className="flex gap-1">
          <button
            onClick={() => updateFormatting({ textAlign: 'left' })}
            className={`p-2 rounded transition-colors ${
              formatting.textAlign === 'left'
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                : 'text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
            title="Alinhar à esquerda"
          >
            <AlignLeft size={14} />
          </button>
          <button
            onClick={() => updateFormatting({ textAlign: 'center' })}
            className={`p-2 rounded transition-colors ${
              formatting.textAlign === 'center'
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                : 'text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
            title="Centralizar"
          >
            <AlignCenter size={14} />
          </button>
          <button
            onClick={() => updateFormatting({ textAlign: 'right' })}
            className={`p-2 rounded transition-colors ${
              formatting.textAlign === 'right'
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                : 'text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
            title="Alinhar à direita"
          >
            <AlignRight size={14} />
          </button>
        </div>
      </div>

      {/* Text Color */}
      <div>
        <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
          Cor do Texto
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={formatting.color}
            onChange={(e) => updateFormatting({ color: e.target.value })}
            className="w-10 h-10 rounded border border-neutral-300 dark:border-neutral-600 cursor-pointer p-0.5"
          />
          <input
            type="text"
            value={formatting.color}
            onChange={(e) => updateFormatting({ color: e.target.value })}
            className="flex-1 px-2 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 font-mono"
          />
        </div>
      </div>

      {/* Position & Size */}
      <div>
        <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
          Posição & Tamanho
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-muted-foreground">X</span>
            <input
              type="number"
              value={selectedTextBox.x}
              onChange={(e) => dispatch({
                type: 'MOVE_TEXT_BOX',
                payload: { id: selectedTextBox.id, x: Number(e.target.value), y: selectedTextBox.y },
              })}
              className="w-full px-2 py-1 text-xs bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700"
            />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground">Y</span>
            <input
              type="number"
              value={selectedTextBox.y}
              onChange={(e) => dispatch({
                type: 'MOVE_TEXT_BOX',
                payload: { id: selectedTextBox.id, x: selectedTextBox.x, y: Number(e.target.value) },
              })}
              className="w-full px-2 py-1 text-xs bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700"
            />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground">Largura</span>
            <input
              type="number"
              value={selectedTextBox.width}
              onChange={(e) => dispatch({
                type: 'RESIZE_TEXT_BOX',
                payload: { id: selectedTextBox.id, width: Number(e.target.value), height: selectedTextBox.height },
              })}
              className="w-full px-2 py-1 text-xs bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700"
            />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground">Altura</span>
            <input
              type="number"
              value={selectedTextBox.height}
              onChange={(e) => dispatch({
                type: 'RESIZE_TEXT_BOX',
                payload: { id: selectedTextBox.id, width: selectedTextBox.width, height: Number(e.target.value) },
              })}
              className="w-full px-2 py-1 text-xs bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700"
            />
          </div>
        </div>
      </div>

      {/* Delete button */}
      <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700">
        <button
          onClick={() => dispatch({ type: 'REMOVE_TEXT_BOX', payload: selectedTextBox.id })}
          className="w-full px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
        >
          Excluir caixa de texto
        </button>
      </div>
    </div>
  );
}
