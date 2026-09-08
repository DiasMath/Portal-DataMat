/**
 * Exportação de resultados tabulares (CSV, JSON, SQL INSERT, XLSX).
 *
 * Antes essa lógica estava reimplementada três vezes, com pequenas
 * diferenças e bugs entre si:
 *  - `ResultsPanel.tsx` (SQL Workbench): CSV / JSON / SQL INSERT — sem XLSX.
 *  - `DataView.tsx` (Studio): CSV / JSON, e um botão "XLSX" que não fazia
 *    nada (`content = ''; return;`).
 *  - `grid-export.ts` (Studio SQL Runner): só CSV / JSON.
 *
 * Este módulo centraliza os quatro formatos com o pacote `xlsx` (SheetJS)
 * pra gerar planilhas de verdade, e é a única fonte usada pelos três locais.
 */

export interface TabularData {
  columns: string[];
  rows: Record<string, unknown>[];
}

export type ExportFormat = 'csv' | 'json' | 'sql' | 'xlsx';

function formatCsvCell(value: unknown, delimiter: string): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv(data: TabularData, delimiter = ','): string {
  const header = data.columns.map((c) => formatCsvCell(c, delimiter)).join(delimiter);
  const lines = data.rows.map((row) =>
    data.columns.map((col) => formatCsvCell(row[col], delimiter)).join(delimiter)
  );
  return [header, ...lines].join('\n');
}

export function toJson(data: TabularData): string {
  const rows = data.rows.map((row) => {
    const obj: Record<string, unknown> = {};
    data.columns.forEach((col) => {
      obj[col] = row[col];
    });
    return obj;
  });
  return JSON.stringify(rows, null, 2);
}

/**
 * Gera `INSERT INTO` prontos pra colar em outro banco. `tableName` é só
 * um palpite (nome da tabela de origem quando conhecido, ou "table_name"
 * como placeholder) — sempre revisar antes de rodar contra produção.
 */
export function toSqlInsert(data: TabularData, tableName = 'table_name'): string {
  const columnsSql = data.columns.map((c) => `\`${c}\``).join(', ');
  const statements = data.rows.map((row) => {
    const values = data.columns
      .map((col) => {
        const v = row[col];
        if (v === null || v === undefined) return 'NULL';
        if (typeof v === 'number' || typeof v === 'bigint') return String(v);
        if (typeof v === 'boolean') return v ? '1' : '0';
        if (v instanceof Date) return `'${v.toISOString().slice(0, 19).replace('T', ' ')}'`;
        return `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
      })
      .join(', ');
    return `INSERT INTO \`${tableName}\` (${columnsSql}) VALUES (${values});`;
  });
  return statements.join('\n');
}

/**
 * Gera um `.xlsx` de verdade via ExcelJS. Import dinâmico para não inflar
 * o bundle inicial de telas que nunca exportam nada.
 *
 * Usamos ExcelJS em vez do pacote `xlsx` (SheetJS): a versão distribuída
 * no npm está travada em 0.18.5 e tem 2 vulnerabilidades sem correção
 * disponível ali (o mantenedor só publica as versões corrigidas no CDN
 * próprio deles, fora do fluxo normal de `npm install`). ExcelJS é
 * mantido ativamente e não carrega esse risco.
 */
export async function toXlsxBlob(data: TabularData, sheetName = 'Resultado'): Promise<Blob> {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet((sheetName || 'Resultado').slice(0, 31));

  worksheet.columns = data.columns.map((col) => ({ header: col, key: col }));
  data.rows.forEach((row) => {
    const plainRow: Record<string, unknown> = {};
    data.columns.forEach((col) => {
      plainRow[col] = row[col] ?? '';
    });
    worksheet.addRow(plainRow);
  });
  worksheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadTextFile(content: string, filename: string, mimeType: string): void {
  downloadBlob(new Blob([content], { type: mimeType }), filename);
}

const EXTENSION_BY_FORMAT: Record<ExportFormat, string> = {
  csv: 'csv',
  json: 'json',
  sql: 'sql',
  xlsx: 'xlsx',
};

/**
 * Ponto único de entrada: gera o conteúdo no formato pedido e já dispara
 * o download com um nome de arquivo consistente entre Workbench e Studio.
 */
export async function exportTabularData(
  data: TabularData,
  format: ExportFormat,
  options?: { baseFilename?: string; tableName?: string; sheetName?: string; csvDelimiter?: string }
): Promise<void> {
  const baseFilename = options?.baseFilename || 'resultado';
  const filename = `${baseFilename}.${EXTENSION_BY_FORMAT[format]}`;

  if (format === 'csv') {
    downloadTextFile(toCsv(data, options?.csvDelimiter ?? ','), filename, 'text/csv;charset=utf-8;');
  } else if (format === 'json') {
    downloadTextFile(toJson(data), filename, 'application/json');
  } else if (format === 'sql') {
    downloadTextFile(toSqlInsert(data, options?.tableName), filename, 'text/plain;charset=utf-8;');
  } else if (format === 'xlsx') {
    const blob = await toXlsxBlob(data, options?.sheetName || options?.tableName);
    downloadBlob(blob, filename);
  }
}

/** Nome de arquivo com timestamp, no padrão já usado pelo grid do Studio. */
export function timestampedFilename(base: string): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
  return `${base}-${timestamp}`;
}
