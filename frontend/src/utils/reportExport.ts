import { exportToCSV } from './csvExport';

export interface ReportExportColumn {
  label: string;
  key?: string;
  accessor?: (row: any) => string | number | null | undefined;
  format?: 'currency' | 'percent' | 'date' | 'number' | 'text';
}

export interface ReportExportOptions {
  title: string;
  subtitle?: string;
  filename: string;
  columns: ReportExportColumn[];
  data: any[];
  summaryMetrics?: { label: string; value: string | number }[];
  filtersApplied?: Record<string, string>;
}

/**
 * Exports report data to CSV with metadata and summary metrics
 */
export function exportReportToCSV(options: ReportExportOptions): void {
  const { title, subtitle, filename, columns, data, summaryMetrics, filtersApplied } = options;
  if (!data || data.length === 0) return;

  const lines: string[] = [];

  // Metadata headers
  lines.push(`"${title.replace(/"/g, '""')}"`);
  if (subtitle) lines.push(`"${subtitle.replace(/"/g, '""')}"`);
  lines.push(`"Generated On: ${new Date().toLocaleString()}"`);

  if (filtersApplied && Object.keys(filtersApplied).length > 0) {
    const filterParts = Object.entries(filtersApplied)
      .filter(([_, val]) => val)
      .map(([key, val]) => `${key}: ${val}`);
    if (filterParts.length > 0) {
      lines.push(`"Filters: ${filterParts.join(' | ')}"`);
    }
  }

  // Summary Metrics row
  if (summaryMetrics && summaryMetrics.length > 0) {
    lines.push('');
    lines.push('"KEY SUMMARY METRICS"');
    summaryMetrics.forEach((m) => {
      lines.push(`"${m.label}","${m.value}"`);
    });
    lines.push('');
  } else {
    lines.push('');
  }

  // Table Headers
  const headers = columns.map((col) => `"${col.label.replace(/"/g, '""')}"`).join(',');
  lines.push(headers);

  // Rows
  data.forEach((row) => {
    const rowValues = columns.map((col) => {
      let val: any = '';
      if (col.accessor) {
        val = col.accessor(row);
      } else if (col.key) {
        val = row[col.key];
      }
      if (val === null || val === undefined) val = '';
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    lines.push(rowValues.join(','));
  });

  const csvContent = lines.join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const dateStr = new Date().toISOString().split('T')[0];
  let finalFilename = filename.replace(/\.csv$/, '');
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

/**
 * Opens a clean printable window formatted for PDF generation
 */
export function printReport(options: ReportExportOptions): void {
  const { title, subtitle, columns, data, summaryMetrics, filtersApplied } = options;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to print/export PDF.');
    return;
  }

  const filtersHtml = filtersApplied && Object.keys(filtersApplied).length > 0
    ? `<div class="filters">
        ${Object.entries(filtersApplied)
          .filter(([_, v]) => v)
          .map(([k, v]) => `<span><strong>${k}:</strong> ${v}</span>`)
          .join(' &bull; ')}
       </div>`
    : '';

  const metricsHtml = summaryMetrics && summaryMetrics.length > 0
    ? `<div class="metrics-grid">
        ${summaryMetrics.map(m => `
          <div class="metric-box">
            <div class="metric-label">${m.label}</div>
            <div class="metric-value">${m.value}</div>
          </div>
        `).join('')}
       </div>`
    : '';

  const headersHtml = columns.map(c => `<th>${c.label}</th>`).join('');
  const rowsHtml = data.map((row, idx) => {
    const cells = columns.map(col => {
      let val: any = '';
      if (col.accessor) val = col.accessor(row);
      else if (col.key) val = row[col.key];
      return `<td>${val ?? ''}</td>`;
    }).join('');
    return `<tr class="${idx % 2 === 0 ? 'even' : 'odd'}">${cells}</tr>`;
  }).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - Report</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            padding: 24px;
            margin: 0;
            background: #fff;
          }
          .header {
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 16px;
            margin-bottom: 16px;
          }
          .title {
            font-size: 20px;
            font-weight: 700;
            color: #0f172a;
            margin: 0 0 4px 0;
          }
          .subtitle {
            font-size: 13px;
            color: #64748b;
            margin: 0 0 8px 0;
          }
          .meta {
            font-size: 11px;
            color: #94a3b8;
          }
          .filters {
            margin: 12px 0;
            padding: 8px 12px;
            background: #f8fafc;
            border-radius: 6px;
            font-size: 12px;
            color: #475569;
          }
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 12px;
            margin: 16px 0;
          }
          .metric-box {
            padding: 10px;
            background: #f1f5f9;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
          }
          .metric-label {
            font-size: 11px;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 600;
          }
          .metric-value {
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
            margin-top: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            margin-top: 16px;
          }
          th {
            background: #f8fafc;
            color: #475569;
            font-weight: 600;
            text-align: left;
            padding: 8px 10px;
            border: 1px solid #cbd5e1;
          }
          td {
            padding: 6px 10px;
            border: 1px solid #e2e8f0;
          }
          tr.even {
            background: #ffffff;
          }
          tr.odd {
            background: #f8fafc;
          }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">${title}</h1>
          ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
          <div class="meta">Generated: ${new Date().toLocaleString()}</div>
        </div>
        ${filtersHtml}
        ${metricsHtml}
        <table>
          <thead><tr>${headersHtml}</tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
