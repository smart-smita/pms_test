import React, { useState } from 'react';
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export interface Column<T> {
  header: string;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  onSearch?: (term: string) => void;
  exportFilename?: string;
  actions?: (row: T) => React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchPlaceholder = 'Search records...',
  exportFilename = 'report_export.csv',
  actions,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const filteredData = data.filter((row) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return Object.values(row).some(
      (val) => val !== null && val !== undefined && String(val).toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportCSV = () => {
    if (data.length === 0) return;
    const headers = columns.map((c) => `"${c.header}"`).join(',');
    const rows = filteredData.map((row) =>
      columns
        .map((col) => {
          let val: any = '';
          if (typeof col.accessor === 'function') {
            val = '';
          } else if (col.accessor) {
            val = row[col.accessor];
          }
          if (val === null || val === undefined) val = '';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',')
    );

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', exportFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', minWidth: '260px', flex: 1, maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <Button variant="secondary" onClick={handleExportCSV}>
          <Download size={16} /> Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={col.className}>
                  {col.header}
                </th>
              ))}
              {actions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  No records found
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rIdx) => (
                <tr key={rIdx}>
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className={col.className}>
                      {typeof col.accessor === 'function'
                        ? col.accessor(row)
                        : col.accessor
                        ? String(row[col.accessor] ?? '-')
                        : '-'}
                    </td>
                  ))}
                  {actions && <td>{actions(row)}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
        <div>
          Showing {paginatedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
          {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} entries
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Button
            variant="secondary"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            style={{ padding: '0.4rem 0.75rem' }}
          >
            <ChevronLeft size={16} />
          </Button>
          <span style={{ fontWeight: 600, color: '#f8fafc' }}>
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            style={{ padding: '0.4rem 0.75rem' }}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
