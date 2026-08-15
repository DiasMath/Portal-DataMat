'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Table } from 'lucide-react';
import { useStudio } from '../../store/StudioContext';
import { SqlEditorBase } from '../shared/SqlEditorBase';

export function CalculatedTableEditor() {
  const { state, dispatch } = useStudio();
  const [tableName, setTableName] = useState('');
  const [expression, setExpression] = useState('');

  const editingTable = state.editingCalculatedTableId
    ? state.calculatedTables.find((t: { id: string }) => t.id === state.editingCalculatedTableId)
    : null;

  useEffect(() => {
    if (editingTable) {
      setTableName(editingTable.name);
      setExpression(editingTable.expression);
    }
  }, [editingTable]);

  const handleSave = useCallback(() => {
    if (!tableName.trim() || !expression.trim()) return;
    const selectMatch = expression.match(/SELECT\s+([\s\S]+?)\s+FROM/i);
    const columns = selectMatch
      ? selectMatch[1].split(',').map((col: string, i: number) => ({
          name: col.trim().split(/\s+AS\s+/i).pop()?.trim() || `Column${i + 1}`,
          type: 'string',
        }))
      : [];
    if (editingTable) {
      dispatch({
        type: 'UPDATE_CALCULATED_TABLE',
        payload: { id: editingTable.id, name: tableName.trim(), expression: expression.trim(), columns },
      });
    } else {
      dispatch({
        type: 'ADD_CALCULATED_TABLE',
        payload: { name: tableName.trim(), expression: expression.trim(), columns },
      });
    }
    dispatch({ type: 'CLOSE_CALCULATED_TABLE_EDITOR' });
  }, [tableName, expression, editingTable, dispatch]);

  const hasChanges = editingTable
    ? tableName !== editingTable.name || expression !== editingTable.expression
    : !!tableName.trim() || !!expression.trim();

  const canSave = !!tableName.trim() && !!expression.trim();

  return (
    <SqlEditorBase
      isOpen={!!state.calculatedTableEditorOpen}
      icon={<Table size={16} />}
      title={editingTable ? 'Editar Tabela Calculada' : 'Nova Tabela Calculada'}
      expression={expression}
      onExpressionChange={setExpression}
      canSave={canSave}
      hasChanges={hasChanges}
      onSave={handleSave}
      onClose={() => dispatch({ type: 'CLOSE_CALCULATED_TABLE_EDITOR' })}
      closeAction="CLOSE_CALCULATED_TABLE_EDITOR"
    >
      <div className="flex-1">
        <label className="block text-xs text-neutral-400 mb-1">Nome da Tabela</label>
        <input
          type="text"
          value={tableName}
          onChange={(e) => setTableName(e.target.value)}
          placeholder="Ex: VendasPorRegiao"
          className="w-full max-w-md px-2 py-1.5 text-sm bg-[#222] border border-[#333] rounded text-white placeholder-neutral-500 focus:outline-none focus:border-[#FFB03F]"
        />
      </div>
    </SqlEditorBase>
  );
}
