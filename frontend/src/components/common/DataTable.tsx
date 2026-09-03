import React, { useState, useMemo } from 'react';
import { Search, Download, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, AlertCircle, RefreshCw, Inbox } from 'lucide-react';
import { Button } from './Button';
import { exportToCSV } from '../../utils/csvExport';
import { showSuccess } from '../../utils/toast';

export interface Column<T> {
  header: string;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  render?: (row: T) => React.ReactNode;
  csvAccessor?: keyof T | ((row: T) => string | number | null | undefined);
  sortable?: boolean;
  sortKey?: keyof T | ((row: T) => any);
  excludeFromCSV?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  exportFilename?: string;
  actions?: (row: T) => React.ReactNode;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchPlaceholder = 'Search records...',
  exportFilename = 'report_export.csv',
  actions,
  isLoading = false,
  error = null,
  onRetry,
  defaultPageSize = 15,
  pageSizeOptions = [10, 15, 25, 50, 100],
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState<number>(defaultPageSize);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortColumnIndex, setSortColumnIndex] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filter Data
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((row) => {
      return columns.some((col) => {
        if (typeof col.csvAccessor === 'function') {
          const val = col.csvAccessor(row);
          if (val !== null && val !== undefined && String(val).toLowerCase().includes(term)) return true;
        } else if (typeof col.accessor === 'string' || typeof col.accessor === 'number') {
          const val = row[col.accessor as keyof T];
          if (val !== null && val !== undefined && String(val).toLowerCase().includes(term)) return true;
        }
        return false;
      }) || Object.values(row).some((val) => val !== null && val !== undefined && String(val).toLowerCase().includes(term));
    });
  }, [data, searchTerm, columns]);

  // Sort Data
  const sortedData = useMemo(() => {
    if (sortColumnIndex === null) return filteredData;
    const col = columns[sortColumnIndex];
    if (!col) return filteredData;

    return [...filteredData].sort((a, b) => {
      let valA: any;
      let valB: any;

      if (col.sortKey) {
        if (typeof col.sortKey === 'function') {
          valA = col.sortKey(a);
          valB = col.sortKey(b);
        } else {
          valA = a[col.sortKey];
          valB = b[col.sortKey];
        }
      } else if (typeof col.csvAccessor === 'function') {
        valA = col.csvAccessor(a);
        valB = col.csvAccessor(b);
      } else if (typeof col.accessor === 'string') {
        valA = a[col.accessor as keyof T];
        valB = b[col.accessor as keyof T];
      }

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [filteredData, sortColumnIndex, sortDirection, columns]);

  // Pagination bounds
  const totalRecords = sortedData.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const startIdx = (safeCurrentPage - 1) * pageSize;
    return sortedData.slice(startIdx, startIdx + pageSize);
  }, [sortedData, safeCurrentPage, pageSize]);

  const handleSort = (idx: number) => {
    const col = columns[idx];
    if (col.sortable === false) return;

    if (sortColumnIndex === idx) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumnIndex(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumnIndex(idx);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    if (data.length === 0) return;
    const csvColumns = columns
      .filter((c) => !c.excludeFromCSV)
      .map((c) => ({
        label: c.header,
        key: typeof c.csvAccessor === 'string' ? c.csvAccessor : typeof c.accessor === 'string' ? c.accessor : undefined,
        accessor: typeof c.csvAccessor === 'function' ? c.csvAccessor : undefined,
      }));

    exportToCSV({
      filename: exportFilename,
      columns: csvColumns,
      data: sortedData,
    });
    showSuccess(`Successfully exported ${sortedData.length} records to CSV.`);
  };

  // Generate Pagination Number Buttons
  const renderPaginationButtons = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safeCurrentPage > 3) pages.push('...');
      const start = Math.max(2, safeCurrentPage - 1);
      const end = Math.min(totalPages - 1, safeCurrentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (safeCurrentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    return pages.map((page, idx) => {
      if (page === '...') {
        return (
          <span key={`ellipsis-${idx}`} style={{ padding: '0 0.3rem', color: 'var(--text-muted)' }}>
            ...
          </span>
        );
      }
      const pageNum = page as number;
      const isActive = pageNum === safeCurrentPage;
      return (
        <button
          key={pageNum}
          className={`datatable-page-btn ${isActive ? 'active' : ''}`}
          onClick={() => setCurrentPage(pageNum)}
        >
          {pageNum}
        </button>
      );
    });
  };

  const fromRecord = totalRecords === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const toRecord = Math.min(safeCurrentPage * pageSize, totalRecords);

  return (
    <div className="datatable-wrapper">
      {/* Header Toolbar */}
      <div className="datatable-toolbar">
        {/* Search */}
        <div className="datatable-search-box">
          <Search size={16} className="datatable-search-icon" />
          <input
            type="text"
            className="form-input datatable-search-input"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Page Size Selector & Export */}
        <div className="datatable-toolbar-right">
          <div className="datatable-page-size">
            <span>Show:</span>
            <select
              className="form-select datatable-page-select"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span>entries</span>
          </div>

          <Button variant="secondary" onClick={handleExportCSV} style={{ height: '36px', padding: '0 0.85rem' }}>
            <Download size={15} /> Export CSV
          </Button>
        </div>
      </div>

      {/* Table Body / Error / Loading States */}
      <div className="table-container">
        {error ? (
          <div className="datatable-state-container">
            <AlertCircle size={36} color="var(--danger)" />
            <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Failed to load records</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{error}</div>
            {onRetry && (
              <Button variant="secondary" onClick={onRetry} style={{ marginTop: '0.5rem' }}>
                <RefreshCw size={14} /> Retry
              </Button>
            )}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((col, idx) => {
                  const isSortable = col.sortable !== false;
                  const isSorted = sortColumnIndex === idx;
                  return (
                    <th
                      key={idx}
                      className={`${col.className || ''} ${isSortable ? 'datatable-sort-header' : ''}`}
                      onClick={() => isSortable && handleSort(idx)}
                    >
                      <div className="datatable-header-content">
                        <span>{col.header}</span>
                        {isSortable && (
                          <span className="datatable-sort-icon">
                            {isSorted ? (
                              sortDirection === 'asc' ? (
                                <ArrowUp size={14} color="var(--accent-primary)" />
                              ) : (
                                <ArrowDown size={14} color="var(--accent-primary)" />
                              )
                            ) : (
                              <ArrowUpDown size={13} style={{ opacity: 0.4 }} />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
                {actions && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, rIdx) => (
                  <tr key={`skeleton-${rIdx}`}>
                    {columns.map((_, cIdx) => (
                      <td key={`skeleton-col-${cIdx}`}>
                        <div className="datatable-skeleton-line" />
                      </td>
                    ))}
                    {actions && (
                      <td style={{ textAlign: 'right' }}>
                        <div className="datatable-skeleton-line" style={{ width: '80px', marginLeft: 'auto' }} />
                      </td>
                    )}
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (actions ? 1 : 0)}>
                    <div className="datatable-state-container">
                      <Inbox size={32} style={{ opacity: 0.5, color: 'var(--text-secondary)' }} />
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {searchTerm ? 'No matching records found' : 'No records available'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {columns.map((col, cIdx) => (
                      <td key={cIdx} className={col.className}>
                        {col.render
                          ? col.render(row)
                          : typeof col.accessor === 'function'
                          ? col.accessor(row)
                          : col.accessor
                          ? String(row[col.accessor] ?? '-')
                          : '-'}
                      </td>
                    ))}
                    {actions && <td style={{ textAlign: 'right' }}>{actions(row)}</td>}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer Info & Numbered Pagination */}
      <div className="datatable-footer">
        <div className="datatable-info">
          Showing {fromRecord} to {toRecord} of {totalRecords} records
        </div>

        <div className="datatable-pagination-controls">
          <button
            className="datatable-page-btn nav-btn"
            disabled={safeCurrentPage === 1 || isLoading}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={16} /> Previous
          </button>

          <div className="datatable-page-numbers">{renderPaginationButtons()}</div>

          <button
            className="datatable-page-btn nav-btn"
            disabled={safeCurrentPage >= totalPages || isLoading}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
