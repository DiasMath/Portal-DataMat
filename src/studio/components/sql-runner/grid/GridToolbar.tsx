'use client';

import { Copy, Check, Download, RefreshCw } from 'lucide-react';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import type { ExportFormat, GridData } from './types';
import { GRID_COLORS } from './types';

interface GridToolbarProps {
  data: GridData;
  onExport: (format: ExportFormat) => void;
  onRerun?: () => void;
}

/**
 * Results toolbar with copy, export, and rerun actions.
 * Shows row count and execution time.
 */
export function GridToolbar({ data, onExport, onRerun }: GridToolbarProps) {
  const { copied, copy } = useCopyToClipboard();

  const handleCopyAll = () => {
    const header = data.columns.join('\t');
    const rows = data.rows.map(row =>
      data.columns.map(col => {
        const v = row[col];
        return v === null || v === undefined ? 'NULL' : String(v);
      }).join('\t')
    );
    copy([header, ...rows].join('\n'));
  };

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 text-[10px]"
      style={{
        backgroundColor: GRID_COLORS.headerBg,
        borderTop: `1px solid ${GRID_COLORS.gridLines}`,
        borderBottom: `1px solid ${GRID_COLORS.gridLines}`,
      }}
    >
      {/* Row count and time */}
      <span style={{ color: GRID_COLORS.rowNumber }}>
        {data.rows.length} linha{data.rows.length !== 1 ? 's' : ''}
      </span>
      <span style={{ color: GRID_COLORS.gridLines }}>·</span>
      <span style={{ color: GRID_COLORS.rowNumber }}>
        {data.executionTime}ms
      </span>

      <div className="flex-1" />

      {/* Copy all */}
      <button
        onClick={handleCopyAll}
        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-neutral-800 transition-colors"
        style={{ color: GRID_COLORS.rowText }}
        title="Copiar todos os resultados"
      >
        {copied ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
        {copied ? 'Copiado!' : 'Copiar'}
      </button>

      {/* Export CSV */}
      <button
        onClick={() => onExport('csv')}
        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-neutral-800 transition-colors"
        style={{ color: GRID_COLORS.rowText }}
        title="Exportar como CSV"
      >
        <Download size={10} />
        CSV
      </button>

      {/* Export JSON */}
      <button
        onClick={() => onExport('json')}
        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-neutral-800 transition-colors"
        style={{ color: GRID_COLORS.rowText }}
        title="Exportar como JSON"
      >
        <Download size={10} />
        JSON
      </button>

      {/* Export XLSX */}
      <button
        onClick={() => onExport('xlsx')}
        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-neutral-800 transition-colors"
        style={{ color: GRID_COLORS.rowText }}
        title="Exportar como Excel"
      >
        <Download size={10} />
        XLSX
      </button>

      {/* Rerun */}
      {onRerun && (
        <button
          onClick={onRerun}
          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-neutral-800 transition-colors"
          style={{ color: GRID_COLORS.rowText }}
          title="Reexecutar query"
        >
          <RefreshCw size={10} />
        </button>
      )}
    </div>
  );
}
