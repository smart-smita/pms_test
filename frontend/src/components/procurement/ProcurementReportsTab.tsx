import React, { useState, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet,
  Download,
  Filter,
  RefreshCw,
  Search,
  Layers,
  Building2,
  TrendingUp,
  Package,
  RotateCcw,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  FileText
} from 'lucide-react';
import { apiRequest } from '../../services/api';
import { exportToExcel, ExcelExportColumn } from '../../utils/excelExport';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { showSuccess, showError } from '../../utils/toast';

interface ProcurementReportsTabProps {
  stores: any[];
  materials: any[];
  projects: any[];
  vendors: any[];
}

export const ProcurementReportsTab: React.FC<ProcurementReportsTabProps> = ({
  stores,
  materials,
  projects,
  vendors,
}) => {
  // Selected Report
  const [reportType, setReportType] = useState<string>('purchased-vs-ordered');

  // Filters State
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    project_id: '',
    store_id: '',
    material_id: '',
    vendor_id: '',
    search: '',
  });

  // Pagination State
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(25);

  // Data & Loading State
  const [reportData, setReportData] = useState<{
    items: any[];
    total: number;
    totalPages: number;
    totals: any;
  }>({
    items: [],
    total: 0,
    totalPages: 1,
    totals: null,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Fetch Report Data
  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: String(page),
        limit: String(limit),
      };
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.project_id) params.project_id = filters.project_id;
      if (filters.store_id) params.store_id = filters.store_id;
      if (filters.material_id) params.material_id = filters.material_id;
      if (filters.vendor_id) params.vendor_id = filters.vendor_id;
      if (filters.search) params.search = filters.search;

      const queryString = new URLSearchParams(params).toString();
      const res = await apiRequest<{
        items: any[];
        total: number;
        totalPages: number;
        totals: any;
      }>(`/procurement/reports/${reportType}?${queryString}`);

      if (res?.data) {
        setReportData(res.data);
      }
    } catch (err: any) {
      showError(err.message || 'Failed to fetch report data');
    } finally {
      setIsLoading(false);
    }
  }, [reportType, filters, page, limit]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleApply = () => {
    if (filters.start_date && filters.end_date && filters.end_date < filters.start_date) {
      showError('Validation Error: End Date cannot precede Start Date');
      return;
    }
    setPage(1);
    fetchReport();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      start_date: '',
      end_date: '',
      project_id: '',
      store_id: '',
      material_id: '',
      vendor_id: '',
      search: '',
    });
    setPage(1);
  };

  // Client-Side Excel Export
  const handleExportExcel = () => {
    if (!reportData.items || reportData.items.length === 0) {
      showError('No records to export');
      return;
    }

    let columns: ExcelExportColumn[] = [];

    switch (reportType) {
      case 'purchased-vs-ordered':
        columns = [
          { label: 'PO Number', key: 'po_number' },
          { label: 'PO Date', key: 'po_date', type: 'date' },
          { label: 'Status', key: 'po_status' },
          { label: 'Vendor', key: 'vendor_name' },
          { label: 'Project', key: 'project_name' },
          { label: 'Material', key: 'material_name' },
          { label: 'Unit', key: 'unit' },
          { label: 'Rate (₹)', key: 'unit_rate', type: 'currency' },
          { label: 'Ordered Qty', key: 'ordered_quantity', type: 'number' },
          { label: 'Received Qty (Ledger)', key: 'received_quantity', type: 'number' },
          { label: 'Pending Qty', key: 'pending_quantity', type: 'number' },
          { label: 'Total Cost (₹)', key: 'total_ordered_cost', type: 'currency' },
        ];
        break;

      case 'qc-inspection':
        columns = [
          { label: 'GRN Number', key: 'grn_number' },
          { label: 'Delivery Date', key: 'delivery_date', type: 'date' },
          { label: 'Status', key: 'grn_status' },
          { label: 'PO Number', key: 'po_number' },
          { label: 'Vendor', key: 'vendor_name' },
          { label: 'Material', key: 'material_name' },
          { label: 'Ordered Qty', key: 'ordered_quantity', type: 'number' },
          { label: 'Received Qty', key: 'received_quantity', type: 'number' },
          { label: 'Accepted Qty', key: 'accepted_quantity', type: 'number' },
          { label: 'Rejected Qty', key: 'rejected_quantity', type: 'number' },
          { label: 'Damaged Qty', key: 'damaged_quantity', type: 'number' },
          { label: 'Accepted Value (₹)', key: 'total_accepted_value', type: 'currency' },
          { label: 'Remarks', key: 'remarks' },
        ];
        break;

      case 'stock-on-hand':
        columns = [
          { label: 'Store Name', key: 'store_name' },
          { label: 'Material Code', key: 'material_code' },
          { label: 'Material Name', key: 'material_name' },
          { label: 'Category', key: 'category' },
          { label: 'Unit', key: 'unit' },
          { label: 'Unit Rate (₹)', key: 'unit_rate', type: 'currency' },
          { label: 'On Hand (Ledger)', key: 'on_hand_qty', type: 'number' },
          { label: 'Reserved Qty', key: 'reserved_qty', type: 'number' },
          { label: 'Available Qty', key: 'available_qty', type: 'number' },
          { label: 'Total Valuation (₹)', key: 'total_valuation', type: 'currency' },
        ];
        break;

      case 'project-usage':
        columns = [
          { label: 'Txn Date', key: 'txn_date', type: 'date' },
          { label: 'Txn Type', key: 'txn_type' },
          { label: 'Project', key: 'project_name' },
          { label: 'WBS', key: 'wbs_name' },
          { label: 'Task', key: 'task_name' },
          { label: 'Store', key: 'store_name' },
          { label: 'Material', key: 'material_name' },
          { label: 'Unit', key: 'unit' },
          { label: 'Rate (₹)', key: 'rate', type: 'currency' },
          { label: 'Issued Qty', key: 'issued_qty', type: 'number' },
          { label: 'Consumed Qty', key: 'consumed_qty', type: 'number' },
          { label: 'Returned Qty', key: 'returned_qty', type: 'number' },
          { label: 'Net Used', key: 'net_used_qty', type: 'number' },
          { label: 'Net Cost (₹)', key: 'net_cost', type: 'currency' },
          { label: 'Logged By', key: 'created_by_name' },
          { label: 'Remarks', key: 'remarks' },
        ];
        break;

      case 'remaining-requirement':
        columns = [
          { label: 'Project', key: 'project_name' },
          { label: 'WBS', key: 'wbs_name' },
          { label: 'Material', key: 'material_name' },
          { label: 'Unit', key: 'unit' },
          { label: 'Rate (₹)', key: 'unit_rate', type: 'currency' },
          { label: 'Planned Qty', key: 'planned_quantity', type: 'number' },
          { label: 'Consumed (Ledger)', key: 'actual_consumed_qty', type: 'number' },
          { label: 'Remaining Req', key: 'remaining_requirement', type: 'number' },
          { label: 'Extra Qty', key: 'extra_quantity', type: 'number' },
          { label: 'Planned Cost (₹)', key: 'planned_cost', type: 'currency' },
          { label: 'Actual Cost (₹)', key: 'actual_cost', type: 'currency' },
        ];
        break;

      case 'purchase-vs-consumption':
        columns = [
          { label: 'Code', key: 'material_code' },
          { label: 'Material Name', key: 'material_name' },
          { label: 'Category', key: 'category' },
          { label: 'Unit', key: 'unit' },
          { label: 'Unit Rate (₹)', key: 'unit_rate', type: 'currency' },
          { label: 'Purchased Qty', key: 'purchased_qty', type: 'number' },
          { label: 'Purchased Cost (₹)', key: 'purchased_cost', type: 'currency' },
          { label: 'Consumed Qty', key: 'consumed_qty', type: 'number' },
          { label: 'Consumed Cost (₹)', key: 'consumed_cost', type: 'currency' },
          { label: 'In-Stock Val (₹)', key: 'in_stock_valuation', type: 'currency' },
        ];
        break;

      case 'stock-movement':
      default:
        columns = [
          { label: 'Ledger ID', key: 'ledger_id', type: 'number' },
          { label: 'Date', key: 'txn_date', type: 'date' },
          { label: 'Txn Type', key: 'txn_type' },
          { label: 'Ref Type', key: 'ref_type' },
          { label: 'Ref ID', key: 'ref_id', type: 'number' },
          { label: 'Store', key: 'store_name' },
          { label: 'Material', key: 'material_name' },
          { label: 'Unit', key: 'unit' },
          { label: 'Rate (₹)', key: 'rate', type: 'currency' },
          { label: 'Qty In', key: 'qty_in', type: 'number' },
          { label: 'Qty Out', key: 'qty_out', type: 'number' },
          { label: 'Total Value (₹)', key: 'total_value', type: 'currency' },
          { label: 'Project', key: 'project_name' },
          { label: 'Logged By', key: 'created_by_name' },
          { label: 'Remarks', key: 'remarks' },
        ];
        break;
    }

    exportToExcel({
      filename: `procurement_${reportType}`,
      columns,
      data: reportData.items,
    });
    showSuccess('Exported report to Excel successfully');
  };

  // Server-Side File Download (CSV or PDF)
  const handleServerExport = async (format: 'csv' | 'pdf') => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        ...(filters.start_date && { start_date: filters.start_date }),
        ...(filters.end_date && { end_date: filters.end_date }),
        ...(filters.project_id && { project_id: filters.project_id }),
        ...(filters.store_id && { store_id: filters.store_id }),
        ...(filters.material_id && { material_id: filters.material_id }),
        ...(filters.vendor_id && { vendor_id: filters.vendor_id }),
        ...(filters.search && { search: filters.search }),
        format,
      }).toString();

      const response = await fetch(`/api/v1/procurement/reports/${reportType}/export?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to export: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `procurement_${reportType}_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showSuccess(`Exported report to ${format.toUpperCase()} successfully`);
    } catch (err: any) {
      showError(err.message || `Failed to export ${format}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Format currency
  const formatCurrency = (val: number) => {
    return '₹' + Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const reportOptions = [
    { id: 'purchased-vs-ordered', label: 'Purchased vs Ordered vs Received vs Pending', icon: Package },
    { id: 'qc-inspection', label: 'QC / Inspection (Accepted vs Rejected vs Damaged)', icon: ShieldCheck },
    { id: 'stock-on-hand', label: 'Stock On-Hand by Store & Valuation', icon: Layers },
    { id: 'project-usage', label: 'Project Issue / Consumption / Return', icon: Building2 },
    { id: 'remaining-requirement', label: 'Remaining Requirement (Planned vs Actual)', icon: TrendingUp },
    { id: 'purchase-vs-consumption', label: 'Purchase Cost vs Consumption Cost', icon: FileSpreadsheet },
    { id: 'stock-movement', label: 'Stock Movement Audit History', icon: RotateCcw },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* ── Report Type Selector Strip ────────────────────────────────────── */}
      <div
        className="procurement-report-tabs-strip"
        style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
          paddingBottom: '0.625rem',
          borderBottom: '1px solid var(--border-color)',
          width: '100%',
        }}
      >
        {reportOptions.map((opt) => {
          const Icon = opt.icon;
          const isActive = reportType === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => {
                setReportType(opt.id);
                setPage(1);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1rem',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? 'var(--primary-color)' : 'var(--bg-secondary)',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                boxShadow: isActive ? '0 2px 4px rgba(79, 70, 229, 0.25)' : 'none',
              }}
            >
              <Icon size={16} />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Filters Bar ───────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'var(--card-bg)',
          padding: '1.25rem',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
            <Filter size={18} style={{ color: 'var(--primary-color)' }} />
            <span>Report Filters & Parameter Controls</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              <RotateCcw size={14} style={{ marginRight: '4px' }} /> Reset
            </Button>
            <Button variant="primary" size="sm" onClick={() => fetchReport()} disabled={isLoading}>
              <RefreshCw size={14} style={{ marginRight: '4px' }} /> Apply
            </Button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem' }}>
          {/* Start Date */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
              Start Date
            </label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
              }}
            />
          </div>

          {/* End Date */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
              End Date
            </label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
              }}
            />
          </div>

          {/* Project */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
              Project
            </label>
            <select
              value={filters.project_id}
              onChange={(e) => handleFilterChange('project_id', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
              }}
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.project_id} value={p.project_id}>
                  {p.project_name}
                </option>
              ))}
            </select>
          </div>

          {/* Store */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
              Store
            </label>
            <select
              value={filters.store_id}
              onChange={(e) => handleFilterChange('store_id', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
              }}
            >
              <option value="">All Stores</option>
              {stores.map((s) => (
                <option key={s.store_id} value={s.store_id}>
                  {s.store_name} ({s.store_code})
                </option>
              ))}
            </select>
          </div>

          {/* Material */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
              Material
            </label>
            <select
              value={filters.material_id}
              onChange={(e) => handleFilterChange('material_id', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
              }}
            >
              <option value="">All Materials</option>
              {materials.map((m) => (
                <option key={m.material_id} value={m.material_id}>
                  {m.material_name}
                </option>
              ))}
            </select>
          </div>

          {/* Vendor */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
              Vendor / Supplier
            </label>
            <select
              value={filters.vendor_id}
              onChange={(e) => handleFilterChange('vendor_id', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
              }}
            >
              <option value="">All Suppliers</option>
              {vendors.map((v) => (
                <option key={v.vendor_id} value={v.vendor_id}>
                  {v.vendor_name}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
              Keyword Search
            </label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="Search PO #, GRN #, material name, vendor..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Strict Ledger Totals Summary Strip ───────────────────────────── */}
      {reportData.totals && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {reportType === 'purchased-vs-ordered' && (
            <>
              <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #6366f1' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Ordered Qty</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#6366f1', marginTop: '4px' }}>
                  {Number(reportData.totals.total_ordered_qty || 0).toLocaleString()}
                </div>
              </div>
              <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #10b981' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Received Qty (Ledger)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>
                  {Number(reportData.totals.total_received_qty || 0).toLocaleString()}
                </div>
              </div>
              <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #f59e0b' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Pending Qty</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f59e0b', marginTop: '4px' }}>
                  {Number(reportData.totals.total_pending_qty || 0).toLocaleString()}
                </div>
              </div>
              <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #8b5cf6' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Ordered Cost</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#8b5cf6', marginTop: '4px' }}>
                  {formatCurrency(reportData.totals.total_ordered_amount)}
                </div>
              </div>
            </>
          )}

          {reportType === 'qc-inspection' && (
            <>
              <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #3b82f6' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Received Qty</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#3b82f6', marginTop: '4px' }}>
                  {Number(reportData.totals.total_received_qty || 0).toLocaleString()}
                </div>
              </div>
              <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #10b981' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Accepted Qty (Stock In)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>
                  {Number(reportData.totals.total_accepted_qty || 0).toLocaleString()}
                </div>
              </div>
              <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #ef4444' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Rejected Qty</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ef4444', marginTop: '4px' }}>
                  {Number(reportData.totals.total_rejected_qty || 0).toLocaleString()}
                </div>
              </div>
              <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #f97316' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Damaged Qty</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f97316', marginTop: '4px' }}>
                  {Number(reportData.totals.total_damaged_qty || 0).toLocaleString()}
                </div>
              </div>
              <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #6366f1' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Accepted Value</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#6366f1', marginTop: '4px' }}>
                  {formatCurrency(reportData.totals.total_accepted_value)}
                </div>
              </div>
            </>
          )}

          {reportType === 'stock-on-hand' && (
            <>
              <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #10b981' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total On-Hand Stock</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>
                  {Number(reportData.totals.total_on_hand || 0).toLocaleString()}
                </div>
              </div>
              <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #f59e0b' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Reserved</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f59e0b', marginTop: '4px' }}>
                  {Number(reportData.totals.total_reserved || 0).toLocaleString()}
                </div>
              </div>
              <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #3b82f6' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Available</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#3b82f6', marginTop: '4px' }}>
                  {Number(reportData.totals.total_available || 0).toLocaleString()}
                </div>
              </div>
              <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #8b5cf6' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Stock Valuation</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#8b5cf6', marginTop: '4px' }}>
                  {formatCurrency(reportData.totals.total_valuation)}
                </div>
              </div>
            </>
          )}

          {reportType === 'project-usage' && (
            <>
              <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #3b82f6' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Issued Qty</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#3b82f6', marginTop: '4px' }}>
                  {Number(reportData.totals.total_issued_qty || 0).toLocaleString()}
                </div>
              </div>
              <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #f59e0b' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Consumed Qty</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f59e0b', marginTop: '4px' }}>
                  {Number(reportData.totals.total_consumed_qty || 0).toLocaleString()}
                </div>
              </div>
              <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #10b981' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Returned Qty</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>
                  {Number(reportData.totals.total_returned_qty || 0).toLocaleString()}
                </div>
              </div>
              <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #6366f1' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Net Used Qty</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#6366f1', marginTop: '4px' }}>
                  {Number(reportData.totals.total_net_used_qty || 0).toLocaleString()}
                </div>
              </div>
              <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #ec4899' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Net Cost</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ec4899', marginTop: '4px' }}>
                  {formatCurrency(reportData.totals.total_net_cost)}
                </div>
              </div>
            </>
          )}

          {reportType === 'remaining-requirement' && (
            <>
              <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #3b82f6' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Planned Qty</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#3b82f6', marginTop: '4px' }}>
                  {Number(reportData.totals.total_planned_qty || 0).toLocaleString()}
                </div>
              </div>
              <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #10b981' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Actual Consumed (Ledger)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>
                  {Number(reportData.totals.total_consumed_qty || 0).toLocaleString()}
                </div>
              </div>
              <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #f59e0b' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Remaining Requirement</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f59e0b', marginTop: '4px' }}>
                  {Number(reportData.totals.total_remaining_qty || 0).toLocaleString()}
                </div>
              </div>
              <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #6366f1' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Planned vs Actual Cost</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {formatCurrency(reportData.totals.total_actual_cost)} / {formatCurrency(reportData.totals.total_planned_cost)}
                </div>
              </div>
            </>
          )}

          {reportType === 'purchase-vs-consumption' && (
            <>
              <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #3b82f6' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Purchase Cost</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#3b82f6', marginTop: '4px' }}>
                  {formatCurrency(reportData.totals.total_purchased_cost)}
                </div>
              </div>
              <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #f97316' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Consumption Cost</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f97316', marginTop: '4px' }}>
                  {formatCurrency(reportData.totals.total_consumed_cost)}
                </div>
              </div>
              <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #10b981' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Current In-Stock Valuation</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>
                  {formatCurrency(reportData.totals.total_in_stock_valuation)}
                </div>
              </div>
            </>
          )}

          {reportType === 'stock-movement' && (
            <>
              <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #10b981' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Qty Received In</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>
                  {Number(reportData.totals.total_qty_in || 0).toLocaleString()}
                </div>
              </div>
              <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #f97316' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Qty Issued / Moved Out</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f97316', marginTop: '4px' }}>
                  {Number(reportData.totals.total_qty_out || 0).toLocaleString()}
                </div>
              </div>
              <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #6366f1' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Movement Amount</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#6366f1', marginTop: '4px' }}>
                  {formatCurrency(reportData.totals.total_amount)}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Table & Actions Header ────────────────────────────────────────── */}
      <div
        style={{
          background: 'var(--card-bg)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>
              {reportOptions.find((o) => o.id === reportType)?.label}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Showing {reportData.items.length} of {reportData.total} entries (Strict Ledger Computed)
            </div>
          </div>

          {/* Export Actions Strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={reportData.items.length === 0}
            >
              <FileSpreadsheet size={15} style={{ marginRight: '5px', color: '#10b981' }} />
              Excel XML (.xls)
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleServerExport('csv')}
              disabled={reportData.items.length === 0 || isExporting}
            >
              <Download size={15} style={{ marginRight: '5px', color: '#6366f1' }} />
              CSV (.csv)
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleServerExport('pdf')}
              disabled={reportData.items.length === 0 || isExporting}
            >
              <FileText size={15} style={{ marginRight: '5px', color: '#ef4444' }} />
              PDF Table (.pdf)
            </Button>
          </div>
        </div>

        {/* ── Data Table ──────────────────────────────────────────────────── */}
        <div
          className="procurement-table-scroll"
          style={{
            width: '100%',
            maxWidth: '100%',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            display: 'block',
          }}
        >
          <table
            className="data-table"
            style={{
              width: '100%',
              minWidth: '1050px',
              borderCollapse: 'collapse',
              fontSize: '0.85rem',
            }}
          >
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                {reportType === 'purchased-vs-ordered' && (
                  <>
                    <th style={{ padding: '0.75rem 1rem' }}>PO #</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Vendor</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Project</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Material</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Unit Rate</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Ordered</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Received (Ledger)</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Pending</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Total Cost</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  </>
                )}

                {reportType === 'qc-inspection' && (
                  <>
                    <th style={{ padding: '0.75rem 1rem' }}>GRN #</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Delivery Date</th>
                    <th style={{ padding: '0.75rem 1rem' }}>PO #</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Vendor</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Material</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Recv Qty</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Accepted</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Rejected</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Damaged</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Accepted Value</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  </>
                )}

                {reportType === 'stock-on-hand' && (
                  <>
                    <th style={{ padding: '0.75rem 1rem' }}>Store</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Code</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Material Name</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Unit</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Unit Rate</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>On Hand (Ledger)</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Reserved</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Available</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Valuation</th>
                  </>
                )}

                {reportType === 'project-usage' && (
                  <>
                    <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Type</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Project</th>
                    <th style={{ padding: '0.75rem 1rem' }}>WBS</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Store</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Material</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Rate</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Issued</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Consumed</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Returned</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Net Used</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Net Cost</th>
                  </>
                )}

                {reportType === 'remaining-requirement' && (
                  <>
                    <th style={{ padding: '0.75rem 1rem' }}>Project</th>
                    <th style={{ padding: '0.75rem 1rem' }}>WBS</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Material</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Unit Rate</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Planned Qty</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Consumed (Ledger)</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Remaining Req</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Extra Qty</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Planned Cost</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actual Cost</th>
                  </>
                )}

                {reportType === 'purchase-vs-consumption' && (
                  <>
                    <th style={{ padding: '0.75rem 1rem' }}>Code</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Material Name</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Unit</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Rate</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Purchased Qty</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Purchased Cost</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Consumed Qty</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Consumed Cost</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>In-Stock Valuation</th>
                  </>
                )}

                {reportType === 'stock-movement' && (
                  <>
                    <th style={{ padding: '0.75rem 1rem' }}>ID</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Type</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Ref</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Store</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Material</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Rate</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Qty In</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Qty Out</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Total Value</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Project</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Remarks</th>
                  </>
                )}
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 8px' }} />
                    <div>Loading verified ledger report...</div>
                  </td>
                </tr>
              ) : reportData.items.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    <Package size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                    <div>No report records match the selected filters.</div>
                  </td>
                </tr>
              ) : (
                reportData.items.map((row: any, idx: number) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background 0.15s',
                    }}
                  >
                    {reportType === 'purchased-vs-ordered' && (
                      <>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{row.po_number}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{row.po_date}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{row.vendor_name}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{row.project_name || 'Central Store'}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{row.material_name}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{formatCurrency(row.unit_rate)}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>{row.ordered_quantity}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#10b981', fontWeight: 600 }}>
                          {row.received_quantity}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#f59e0b', fontWeight: 600 }}>
                          {row.pending_quantity}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>
                          {formatCurrency(row.total_ordered_cost)}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <Badge variant={row.po_status === 'approved' ? 'success' : 'warning'}>
                            {row.po_status}
                          </Badge>
                        </td>
                      </>
                    )}

                    {reportType === 'qc-inspection' && (
                      <>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{row.grn_number}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{row.delivery_date}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{row.po_number || '-'}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{row.vendor_name}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{row.material_name}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{row.received_quantity}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#10b981', fontWeight: 600 }}>
                          {row.accepted_quantity}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#ef4444', fontWeight: 600 }}>
                          {row.rejected_quantity}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#f97316', fontWeight: 600 }}>
                          {row.damaged_quantity}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>
                          {formatCurrency(row.total_accepted_value)}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <Badge variant={row.grn_status === 'posted' ? 'success' : 'warning'}>
                            {row.grn_status}
                          </Badge>
                        </td>
                      </>
                    )}

                    {reportType === 'stock-on-hand' && (
                      <>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{row.store_name}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{row.material_code}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{row.material_name}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{row.category}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{row.unit}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{formatCurrency(row.unit_rate)}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#10b981', fontWeight: 700 }}>
                          {row.on_hand_qty}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#f59e0b' }}>{row.reserved_qty}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#3b82f6', fontWeight: 600 }}>
                          {row.available_qty}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700 }}>
                          {formatCurrency(row.total_valuation)}
                        </td>
                      </>
                    )}

                    {reportType === 'project-usage' && (
                      <>
                        <td style={{ padding: '0.75rem 1rem' }}>{row.txn_date}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <Badge variant={row.txn_type === 'issue' ? 'info' : row.txn_type === 'return' ? 'success' : 'warning'}>
                            {row.txn_type}
                          </Badge>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>{row.project_name}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{row.wbs_name}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{row.store_name}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{row.material_name}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{formatCurrency(row.rate)}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{row.issued_qty}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{row.consumed_qty}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#10b981' }}>{row.returned_qty}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>{row.net_used_qty}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(row.net_cost)}</td>
                      </>
                    )}

                    {reportType === 'remaining-requirement' && (
                      <>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{row.project_name}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{row.wbs_name}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{row.material_name}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{formatCurrency(row.unit_rate)}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>{row.planned_quantity}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#10b981', fontWeight: 600 }}>
                          {row.actual_consumed_qty}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#f59e0b', fontWeight: 600 }}>
                          {row.remaining_requirement}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#ef4444' }}>{row.extra_quantity}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{formatCurrency(row.planned_cost)}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>
                          {formatCurrency(row.actual_cost)}
                        </td>
                      </>
                    )}

                    {reportType === 'purchase-vs-consumption' && (
                      <>
                        <td style={{ padding: '0.75rem 1rem' }}>{row.material_code}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{row.material_name}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{row.category}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{row.unit}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{formatCurrency(row.unit_rate)}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{row.purchased_qty}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#3b82f6', fontWeight: 600 }}>
                          {formatCurrency(row.purchased_cost)}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{row.consumed_qty}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#f97316', fontWeight: 600 }}>
                          {formatCurrency(row.consumed_cost)}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#10b981', fontWeight: 700 }}>
                          {formatCurrency(row.in_stock_valuation)}
                        </td>
                      </>
                    )}

                    {reportType === 'stock-movement' && (
                      <>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>#{row.ledger_id}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{row.txn_date}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <Badge variant="neutral">{row.txn_type}</Badge>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem' }}>
                          {row.ref_type} #{row.ref_id}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>{row.store_name}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{row.material_name}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{formatCurrency(row.rate)}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#10b981', fontWeight: 600 }}>
                          {row.qty_in > 0 ? `+${row.qty_in}` : '-'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#f97316', fontWeight: 600 }}>
                          {row.qty_out > 0 ? `-${row.qty_out}` : '-'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>
                          {formatCurrency(row.total_value)}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>{row.project_name || '-'}</td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{row.remarks || '-'}</td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Footer (DataTables Enterprise Format) ────────────────── */}
        <div className="datatable-footer" style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border-color)' }}>
          <div className="datatable-info">
            Showing <strong>{reportData.total === 0 ? 0 : (page - 1) * limit + 1}</strong> to{' '}
            <strong>{Math.min(page * limit, reportData.total)}</strong> of{' '}
            <strong>{reportData.total}</strong> entries (Strict Ledger Computed)
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="datatable-page-size">
              <span className="datatable-show-label">Show</span>
              <select
                className="form-select datatable-page-select"
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={500}>500</option>
              </select>
              <span className="datatable-entries-label">entries</span>
            </div>

            <div className="datatable-pagination-controls">
              <button
                className="datatable-page-btn nav-btn"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft size={15} />
                <span className="datatable-nav-label">Previous</span>
              </button>

              <div className="datatable-page-numbers">
                {Array.from({ length: Math.min(7, reportData.totalPages) }, (_, i) => {
                  const pNum = i + 1;
                  return (
                    <button
                      key={pNum}
                      className={`datatable-page-btn ${pNum === page ? 'active' : ''}`}
                      onClick={() => setPage(pNum)}
                    >
                      {pNum}
                    </button>
                  );
                })}
                {reportData.totalPages > 7 && (
                  <span style={{ padding: '0 0.3rem', color: 'var(--text-muted)' }}>...</span>
                )}
              </div>

              <button
                className="datatable-page-btn nav-btn"
                disabled={page >= reportData.totalPages || isLoading}
                onClick={() => setPage((p) => Math.min(reportData.totalPages, p + 1))}
                aria-label="Next page"
              >
                <span className="datatable-nav-label">Next</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
