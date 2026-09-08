import type { GridData, ExportFormat } from './types';
import { exportTabularData, timestampedFilename } from '@/lib/export/tabular-export';

/**
 * Exporta os dados do grid (CSV / JSON / SQL INSERT / XLSX) delegando pro
 * módulo compartilhado `@/lib/export/tabular-export`, usado também pelo
 * SQL Workbench e pelo DataView — mantém os três formatos consistentes e
 * evita reimplementar CSV/JSON aqui.
 */
export async function downloadGridExport(data: GridData, format: ExportFormat, tableName?: string): Promise<void> {
  await exportTabularData(
    { columns: data.columns, rows: data.rows },
    format,
    { baseFilename: timestampedFilename('query-result'), tableName }
  );
}
