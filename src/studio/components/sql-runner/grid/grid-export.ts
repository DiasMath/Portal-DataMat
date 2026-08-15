import type { GridData, ExportFormat } from './types';

/**
 * Export grid data to CSV or JSON format.
 * Returns the formatted string ready for download.
 */
export function exportGridData(data: GridData, format: ExportFormat): string {
  if (format === 'json') {
    return exportToJson(data);
  }
  return exportToCsv(data);
}

/** Export as CSV with proper escaping */
function exportToCsv(data: GridData): string {
  const escapeCell = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const header = data.columns.map(escapeCell).join(',');
  const rows = data.rows.map(row =>
    data.columns.map(col => escapeCell(row[col])).join(',')
  );

  return [header, ...rows].join('\n');
}

/** Export as formatted JSON */
function exportToJson(data: GridData): string {
  const rows = data.rows.map(row => {
    const obj: Record<string, unknown> = {};
    data.columns.forEach(col => {
      obj[col] = row[col];
    });
    return obj;
  });

  return JSON.stringify(rows, null, 2);
}

/**
 * Trigger a file download in the browser.
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
