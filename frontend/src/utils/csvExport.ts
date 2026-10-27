export interface CSVExportOptions {
  filename: string;
  columns: { label: string; key?: string; accessor?: (row: any) => string | number | null | undefined }[];
  data: any[];
}

export function exportToCSV({ filename, columns, data }: CSVExportOptions) {
  if (!data || data.length === 0) return;

  let validColumns = columns.filter((c) => c.key || c.accessor);

  // Fallback: If no columns matched, auto-derive columns from data
  if (validColumns.length === 0 && data.length > 0) {
    validColumns = Object.keys(data[0])
      .filter((k) => typeof data[0][k] !== 'object' || data[0][k] === null)
      .map((k) => ({
        label: k.replace(/_/g, ' ').toUpperCase(),
        key: k,
      }));
  }

  if (validColumns.length === 0) return;

  const headers = validColumns.map((c) => `"${c.label}"`).join(',');

  const rows = data.map((row) =>
    validColumns
      .map((col) => {
        let val: any = '';
        if (col.accessor) {
          val = col.accessor(row);
        } else if (col.key) {
          val = row[col.key];
        }
        if (val === null || val === undefined) val = '';
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(',')
  );

  const csvContent = [headers, ...rows].join('\n');
  
  // Add UTF-8 BOM to ensure Excel parses characters correctly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  let finalFilename = filename.replace('.csv', '');
  const dateStr = new Date().toISOString().split('T')[0];
  
  // Append date if not already there
  if (!finalFilename.endsWith(dateStr)) {
    finalFilename += `_${dateStr}`;
  }
  finalFilename += '.csv';

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', finalFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
