/**
 * Enterprise CSV Data Exporter
 * Safely serializes objects into RFC-4180 compliant CSV files and initiates browser download.
 */

export interface CsvColumn<T> {
  key: keyof T;
  label: string;
  format?: (val: any, row: T) => string;
}

export function exportToCsv<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: CsvColumn<T>[]
) {
  if (!data || data.length === 0) {
    throw new Error('No data available to export.');
  }

  const cols: CsvColumn<T>[] =
    columns ||
    Object.keys(data[0]).map((k) => ({
      key: k as keyof T,
      label: k.replace(/_/g, ' ').toUpperCase(),
    }));

  const escapeCell = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerRow = cols.map((c) => escapeCell(c.label)).join(',');
  const bodyRows = data.map((row) =>
    cols
      .map((c) => {
        const rawVal = row[c.key];
        const formatted = c.format ? c.format(rawVal, row) : rawVal;
        return escapeCell(formatted);
      })
      .join(',')
  );

  const csvContent = '\uFEFF' + [headerRow, ...bodyRows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `${filename}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

