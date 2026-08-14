'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useStudio } from '../../store/StudioContext';
import type { Relationship } from '../../types/dashboard';
import { X, Check, AlertCircle, AlertTriangle, Table } from 'lucide-react';
import { validateRelationship, type ValidationResult } from '../../lib/relationship-validator';

interface RelationshipEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  relationship: Relationship | null;
}

const TYPE_ICONS: Record<string, string> = {
  number: '#',
  string: 'T',
  date: ' Cal',
  boolean: ' B',
};

export function RelationshipEditor({ open, onOpenChange, relationship }: RelationshipEditorProps) {
  const { state, dispatch } = useStudio();
  const dataModel = state.dataModel;

  const [fromTable, setFromTable] = useState('');
  const [fromField, setFromField] = useState('');
  const [toTable, setToTable] = useState('');
  const [toField, setToField] = useState('');
  const [cardinality, setCardinality] = useState<'1:1' | '1:N' | 'N:1'>('N:1');
  const [crossFilterDirection, setCrossFilterDirection] = useState<'single' | 'both'>('single');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (relationship && dataModel) {
      setFromTable(relationship.fromTable);
      setFromField(relationship.fromField);
      setToTable(relationship.toTable);
      setToField(relationship.toField);
      setCardinality(relationship.cardinality);
      setIsActive(relationship.active !== false);
    }
  }, [relationship, dataModel]);

  const fromTableObj = dataModel?.tables.find(t => t.name === fromTable);
  const toTableObj = dataModel?.tables.find(t => t.name === toTable);

  // Validate current relationship
  const validation = useMemo<ValidationResult | null>(() => {
    if (!dataModel || !relationship) return null;
    const tempRel: Relationship = {
      ...relationship,
      fromTable,
      fromField,
      toTable,
      toField,
      cardinality,
      active: isActive,
    };
    return validateRelationship(tempRel, dataModel);
  }, [dataModel, relationship, fromTable, fromField, toTable, toField, cardinality, isActive]);

  const handleSave = () => {
    if (!relationship) return;
    
    dispatch({
      type: 'UPDATE_RELATIONSHIP',
      payload: {
        id: relationship.id,
        changes: {
          fromTable,
          fromField,
          toTable,
          toField,
          cardinality,
          active: isActive,
          crossFilterDirection,
        },
      },
    });
    onOpenChange(false);
  };

  if (!open || !relationship) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="relationship-editor-title"
        className="bg-[#1a1a1a] border border-[#333] rounded-xl shadow-2xl w-[700px] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#333] shrink-0">
          <h2 id="relationship-editor-title" className="text-sm font-semibold text-white">Editar relacionamento</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 rounded hover:bg-neutral-700 text-neutral-400 hover:text-white"
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 flex-1">
          {/* From Table */}
          <div className="mb-4">
            <label className="text-xs text-neutral-400 mb-1.5 block">Da tabela</label>
            <select
              value={fromTable}
              onChange={(e) => {
                setFromTable(e.target.value);
                setFromField('');
              }}
              className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded text-sm text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">Selecione uma tabela...</option>
              {dataModel?.tables.map(t => (
                <option key={t.name} value={t.name}>{t.label}</option>
              ))}
            </select>
            
            {/* Fixed-height table schema with horizontal scroll */}
            <div className="mt-2 border border-[#333] rounded overflow-hidden h-[120px]">
              {fromTableObj ? (
                <>
                  <div className="bg-[#2a2a2a] px-3 py-1 text-xs text-neutral-400 border-b border-[#333] flex items-center gap-1.5">
                    <Table size={10} className={fromTableObj.type === 'fact' ? 'text-blue-400' : 'text-amber-300'} />
                    {fromTableObj.label}
                  </div>
                   <div className="overflow-auto h-[88px] scrollbar-minimal">
                    <div className="flex gap-0 min-w-max">
                      {fromTableObj.fields.map(f => (
                        <div
                          key={f.name}
                          onClick={() => setFromField(f.name)}
                          className={`flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer transition-colors border-r border-[#333] last:border-r-0 ${
                            f.name === fromField
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'text-neutral-400 hover:bg-neutral-800/50'
                          }`}
                          style={{ minWidth: 100 }}
                        >
                          <span className="text-neutral-600 w-4 text-center">{TYPE_ICONS[f.type] || '?'}</span>
                          <span className="truncate">{f.label || f.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-neutral-600">
                  Selecione uma tabela
                </div>
              )}
            </div>
          </div>

          {/* To Table */}
          <div className="mb-4">
            <label className="text-xs text-neutral-400 mb-1.5 block">Para a tabela</label>
            <select
              value={toTable}
              onChange={(e) => {
                setToTable(e.target.value);
                setToField('');
              }}
              className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded text-sm text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">Selecione uma tabela...</option>
              {dataModel?.tables.filter(t => t.name !== fromTable).map(t => (
                <option key={t.name} value={t.name}>{t.label}</option>
              ))}
            </select>
            
            {/* Fixed-height table schema with horizontal scroll */}
            <div className="mt-2 border border-[#333] rounded overflow-hidden h-[120px]">
              {toTableObj ? (
                <>
                  <div className="bg-[#2a2a2a] px-3 py-1 text-xs text-neutral-400 border-b border-[#333] flex items-center gap-1.5">
                    <Table size={10} className={toTableObj.type === 'fact' ? 'text-blue-400' : 'text-amber-300'} />
                    {toTableObj.label}
                  </div>
                   <div className="overflow-auto h-[88px] scrollbar-minimal">
                    <div className="flex gap-0 min-w-max">
                      {toTableObj.fields.map(f => (
                        <div
                          key={f.name}
                          onClick={() => setToField(f.name)}
                          className={`flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer transition-colors border-r border-[#333] last:border-r-0 ${
                            f.name === toField
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'text-neutral-400 hover:bg-neutral-800/50'
                          }`}
                          style={{ minWidth: 100 }}
                        >
                          <span className="text-neutral-600 w-4 text-center">{TYPE_ICONS[f.type] || '?'}</span>
                          <span className="truncate">{f.label || f.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-neutral-600">
                  Selecione uma tabela
                </div>
              )}
            </div>
          </div>

          {/* Cardinality and Cross Filter */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-neutral-400 mb-1.5 block">Cardinalidade</label>
              <select
                value={cardinality}
                onChange={(e) => setCardinality(e.target.value as '1:1' | '1:N' | 'N:1')}
                className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="1:1">Um para um (1:1)</option>
                <option value="1:N">Um para muitos (1:*)</option>
                <option value="N:1">Muitos para um (*:1)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-neutral-400 mb-1.5 block">Direção do filtro cruzado</label>
              <select
                value={crossFilterDirection}
                onChange={(e) => setCrossFilterDirection(e.target.value as 'single' | 'both')}
                className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="single">Único</option>
                <option value="both">Ambos</option>
              </select>
            </div>
          </div>

          {/* Validation Results */}
          {validation && !validation.isValid && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={14} className="text-red-400" />
                <span className="text-xs font-medium text-red-400">Erros de Validação</span>
              </div>
              {validation.errors.map((err, i) => (
                <div key={i} className="text-xs text-red-300 ml-5">
                  {err.message}
                </div>
              ))}
            </div>
          )}

          {validation && validation.warnings.length > 0 && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-amber-400" />
                <span className="text-xs font-medium text-amber-400">Avisos</span>
              </div>
              {validation.warnings.map((warn, i) => (
                <div key={i} className="text-xs text-amber-300 ml-5">
                  {warn.message}
                </div>
              ))}
            </div>
          )}

          {validation && validation.isValid && validation.warnings.length === 0 && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Check size={14} className="text-green-400" />
                <span className="text-xs text-green-400">Relacionamento válido</span>
              </div>
            </div>
          )}

          {/* Active Toggle */}
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="active-toggle"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="accent-amber-500"
            />
            <label htmlFor="active-toggle" className="text-sm text-neutral-300">
              Ativar este relacionamento
            </label>
          </div>
          
          {fromTable && toTable && (!fromField || !toField) && (
            <div className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-400">
              <AlertCircle size={14} />
              <span>Selecione os campos para criar o relacionamento</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[#333] shrink-0">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-1.5 text-xs text-neutral-400 hover:text-white rounded hover:bg-[#333]"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!fromTable || !toTable || !fromField || !toField}
            className="px-4 py-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-black rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
