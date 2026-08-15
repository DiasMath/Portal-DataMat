'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Database } from 'lucide-react';
import { useStudio } from '../../store/StudioContext';
import { SqlEditorBase } from '../shared/SqlEditorBase';

export function CalculatedColumnEditor() {
  const { state, dispatch } = useStudio();
  const [columnName, setColumnName] = useState('');
  const [tableName, setTableName] = useState('');
  const [expression, setExpression] = useState('');
  const [dataType, setDataType] = useState<'string' | 'number' | 'date' | 'boolean'>('number');

  const existingTables = state.dataModel?.tables || [];
  const editingColumn = state.editingCalculatedColumnId
    ? state.calculatedColumns.find((c: { id: string }) => c.id === state.editingCalculatedColumnId)
    : null;

  useEffect(() => {
    if (editingColumn) {
      setColumnName(editingColumn.name);
      setTableName(editingColumn.tableName);
      setExpression(editingColumn.expression);
      setDataType(editingColumn.dataType);
    }
  }, [editingColumn]);

  const handleSave = useCallback(() => {
    if (!columnName.trim() || !expression.trim() || !tableName.trim()) return;
    if (editingColumn) {
      dispatch({
        type: 'UPDATE_CALCULATED_COLUMN',
        payload: { id: editingColumn.id, name: columnName.trim(), tableName, expression: expression.trim(), dataType },
      });
    } else {
      dispatch({
        type: 'ADD_CALCULATED_COLUMN',
        payload: { name: columnName.trim(), tableName, expression: expression.trim(), dataType },
      });
    }
    dispatch({ type: 'CLOSE_CALCULATED_COLUMN_EDITOR' });
  }, [columnName, tableName, expression, dataType, editingColumn, dispatch]);

  const hasChanges = editingColumn
    ? columnName !== editingColumn.name || tableName !== editingColumn.tableName || expression !== editingColumn.expression || dataType !== editingColumn.dataType
    : !!columnName.trim() || !!expression.trim();

  const canSave = !!columnName.trim() && !!expression.trim() && !!tableName.trim();

  return (
    <SqlEditorBase
      isOpen={!!state.calculatedColumnEditorOpen}
      icon={<Database size={16} />}
      title={editingColumn ? 'Editar Coluna Calculada' : 'Nova Coluna Calculada'}
      expression={expression}
      onExpressionChange={setExpression}
      canSave={canSave}
      hasChanges={hasChanges}
      onSave={handleSave}
      onClose={() => dispatch({ type: 'CLOSE_CALCULATED_COLUMN_EDITOR' })}
      closeAction="CLOSE_CALCULATED_COLUMN_EDITOR"
    >
      <div className="flex-1">
        <label className="block text-xs text-neutral-400 mb-1">Nome da Coluna</label>
        <input
          type="text"
          value={columnName}
          onChange={(e) => setColumnName(e.target.value)}
          placeholder="Ex: ReceitaTotal"
          className="w-full px-2 py-1.5 text-sm bg-[#222] border border-[#333] rounded text-white placeholder-neutral-500 focus:outline-none focus:border-[#FFB03F]"
        />
      </div>
      <div className="flex-1">
        <label className="block text-xs text-neutral-400 mb-1">Tabela</label>
        <select
          value={tableName}
          onChange={(e) => setTableName(e.target.value)}
          className="w-full px-2 py-1.5 text-sm bg-[#222] border border-[#333] rounded text-white focus:outline-none focus:border-[#FFB03F]"
        >
          <option value="">Selecione...</option>
          {existingTables.map((table: { name: string; label?: string }) => (
            <option key={table.name} value={table.name}>{table.label || table.name}</option>
          ))}
        </select>
      </div>
      <div className="w-32">
        <label className="block text-xs text-neutral-400 mb-1">Tipo</label>
        <select
          value={dataType}
          onChange={(e) => setDataType(e.target.value as 'string' | 'number' | 'date' | 'boolean')}
          className="w-full px-2 py-1.5 text-sm bg-[#222] border border-[#333] rounded text-white focus:outline-none focus:border-[#FFB03F]"
        >
          <option value="number">Número</option>
          <option value="string">Texto</option>
          <option value="date">Data</option>
          <option value="boolean">Booleano</option>
        </select>
      </div>
    </SqlEditorBase>
  );
}
