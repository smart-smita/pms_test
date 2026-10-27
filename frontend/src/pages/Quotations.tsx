import React, { useEffect, useState } from 'react';
import { DataTable, Column } from '../components/common/DataTable';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { apiRequest } from '../services/api';
import { Quotation, Customer } from '../types';
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  CheckCircle2,
  Download,
  Building2,
  FolderKanban,
  HardHat,
  Eye,
  FileSpreadsheet,
  Printer,
  Sparkles,
  Search,
  Layers,
} from 'lucide-react';
import { ConfirmDeleteModal } from '../components/common/ConfirmDeleteModal';
import { showSuccess, showError } from '../utils/toast';
import { useAuth } from '../context/AuthContext';

interface QuotationsProps {
  onNavigate?: (page: string) => void;
}

export const Quotations: React.FC<QuotationsProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const isAdminOrManager =
    user?.role_name === 'Admin' || user?.role_name === 'Super Admin' || user?.role_name === 'Manager';

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingQuotation, setDeletingQuotation] = useState<{ id: number; code: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Status Action State
  const [approvingId, setApprovingId] = useState<number | null>(null);

  const fetchQuotations = async () => {
    setIsLoading(true);
    let url = '/quotations';
    const params = new URLSearchParams();
    if (filterCustomer) params.append('customer_id', filterCustomer);
    if (filterStatus) params.append('status', filterStatus);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await apiRequest<Quotation[]>(url);
    if (res.success && res.data) {
      setQuotations(res.data);
    }
    setIsLoading(false);
  };

  const fetchMasters = async () => {
    const custRes = await apiRequest<Customer[]>('/customers');
    if (custRes.success && custRes.data) setCustomers(custRes.data);
  };

  useEffect(() => {
    fetchMasters();
  }, []);

  useEffect(() => {
    fetchQuotations();
  }, [filterCustomer, filterStatus]);

  const handleCreateNew = () => {
    if (onNavigate) {
      onNavigate('quotations/create');
    }
  };

  const handleEdit = (id: number) => {
    if (onNavigate) {
      onNavigate(`quotations/edit/${id}`);
    }
  };

  const handleView = (id: number) => {
    if (onNavigate) {
      onNavigate(`quotations/view/${id}`);
    }
  };

  const handleDelete = (id: number, code: string) => {
    setDeletingQuotation({ id, code });
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingQuotation) return;
    setIsDeleting(true);
    const res = await apiRequest(`/quotations/${deletingQuotation.id}`, { method: 'DELETE' });
    setIsDeleting(false);

    if (res.success) {
      showSuccess('Quotation deleted successfully');
      setIsDeleteModalOpen(false);
      fetchQuotations();
    } else {
      showError(res.message || 'Unable to delete quotation');
    }
  };

  const handleApprove = async (id: number) => {
    setApprovingId(id);
    const res = await apiRequest(`/quotations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'approved' }),
    });
    setApprovingId(null);

    if (res.success) {
      showSuccess('Quotation approved successfully');
      fetchQuotations();
    } else {
      showError(res.message || 'Failed to approve quotation');
    }
  };

  const handleExportCsv = (q: Quotation) => {
    const rows = [
      ['Quotation Code', q.quotation_code || ''],
      ['Customer', q.customer_name || ''],
      ['Project', q.project_name || ''],
      ['Date', q.quotation_date ? q.quotation_date.split('T')[0] : ''],
      ['Grand Total', q.total_amount || 0],
      ['Status', q.status || 'draft'],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.map(String).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${q.quotation_code || 'quotation'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: Column<Quotation>[] = [
    {
      header: 'Code',
      accessor: (r) => (
        <span
          onClick={() => handleView(r.quotation_id)}
          style={{
            fontFamily: 'monospace',
            fontWeight: 700,
            fontSize: '0.82rem',
            color: 'var(--accent-primary)',
            background: 'rgba(99, 102, 241, 0.1)',
            padding: '0.25rem 0.5rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            cursor: 'pointer',
          }}
          title="Click to view full page"
        >
          {r.quotation_code}
        </span>
      ),
      sortKey: 'quotation_code',
    },
    {
      header: 'Customer',
      accessor: (r) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <div
            onClick={() => handleView(r.quotation_id)}
            style={{
              fontWeight: 600,
              fontSize: '0.88rem',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              cursor: 'pointer',
            }}
          >
            <Building2 size={14} color="var(--accent-primary)" />
            {r.customer_name}
          </div>
          {(r as any).contact_person && (
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Contact: {(r as any).contact_person}
            </div>
          )}
        </div>
      ),
      sortKey: 'customer_name',
    },
    {
      header: 'Project / Type',
      accessor: (r) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.82rem' }}>
          <div style={{ fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <FolderKanban size={13} color="var(--info)" />
            {r.project_name || <span style={{ color: 'var(--warning)', fontStyle: 'italic' }}>New Project (Pending)</span>}
          </div>
          {(r as any).project_type_name && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {(r as any).project_type_name}
            </div>
          )}
        </div>
      ),
      sortKey: 'project_name',
    },
    {
      header: 'Date',
      accessor: (r) => (
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          <div>{r.quotation_date ? String(r.quotation_date).split('T')[0] : 'N/A'}</div>
        </div>
      ),
      sortKey: 'quotation_date',
    },
    {
      header: 'Grand Total',
      accessor: (r) => {
        const symbol = r.currency_symbol || (r as any).symbol || '₹';
        return (
          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--accent-primary)' }}>
            {symbol} {Number(r.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        );
      },
      sortKey: 'total_amount',
    },
    {
      header: 'Status',
      accessor: (r) => (
        <Badge
          variant={
            r.status === 'approved'
              ? 'success'
              : r.status === 'rejected'
              ? 'danger'
              : r.status === 'pending_approval'
              ? 'warning'
              : 'neutral'
          }
        >
          {r.status?.replace('_', ' ').toUpperCase()}
        </Badge>
      ),
      sortKey: 'status',
    },
  ];

  return (
    <div>
      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={24} color="var(--accent-primary)" /> Quotations
          </h1>
          <p className="page-subtitle" style={{ color: 'var(--text-muted)' }}>
            Manage commercial client proposals, combined WBS trees, terms, and approval workflows
          </p>
        </div>

        {isAdminOrManager && (
          <Button variant="primary" onClick={handleCreateNew} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plus size={18} /> Create Quotation
          </Button>
        )}
      </div>

      {/* ── FILTER TOOLBAR ────────────────────────────────────────────── */}
      <div
        className="glass-card"
        style={{
          padding: '1rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ flex: 1, minWidth: '200px' }}>
          <select
            className="form-select"
            value={filterCustomer}
            onChange={(e) => setFilterCustomer(e.target.value)}
          >
            <option value="">All Customers</option>
            {customers.map((c) => (
              <option key={c.customer_id} value={String(c.customer_id)}>
                {c.customer_name} ({c.customer_code})
              </option>
            ))}
          </select>
        </div>

        <div style={{ width: '180px' }}>
          <select
            className="form-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {(filterCustomer || filterStatus) && (
          <Button
            variant="secondary"
            onClick={() => {
              setFilterCustomer('');
              setFilterStatus('');
            }}
            style={{ fontSize: '0.82rem' }}
          >
            Reset Filters
          </Button>
        )}
      </div>

      {/* ── MAIN DATA TABLE ───────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <DataTable
          columns={columns}
          data={quotations}
          searchPlaceholder="Search quotations by code, customer, or project..."
          exportFilename="quotations_list"
          isLoading={isLoading}
          actions={(row) => (
            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
              <Button
                variant="secondary"
                onClick={() => handleView(row.quotation_id)}
                title="View Full Quotation Page"
                style={{ padding: '0.35rem 0.6rem', color: 'var(--text-primary)' }}
              >
                <Eye size={14} />
              </Button>

              {isAdminOrManager && row.status !== 'approved' && (
                <Button
                  variant="secondary"
                  onClick={() => handleEdit(row.quotation_id)}
                  title="Edit Quotation Form"
                  style={{ padding: '0.35rem 0.6rem', color: 'var(--text-primary)' }}
                >
                  <Edit size={14} />
                </Button>
              )}

              {row.status === 'approved' && onNavigate && (
                <Button
                  variant="secondary"
                  onClick={async () => {
                    // Look up planning record for this quotation
                    try {
                      const pRes = await apiRequest<any[]>(`/planning?quotation_id=${row.quotation_id}`);
                      if (pRes.success && pRes.data && pRes.data.length > 0) {
                        onNavigate(`planning/workspace/${pRes.data[0].id}/overview`);
                      } else {
                        onNavigate('planning/workspace');
                      }
                    } catch (e) {
                      onNavigate('planning/workspace');
                    }
                  }}
                  title="Open Planning Workspace"
                  style={{
                    padding: '0.35rem 0.6rem',
                    color: 'var(--accent-primary)',
                    borderColor: 'rgba(59, 130, 246, 0.3)',
                  }}
                >
                  <Layers size={14} />
                </Button>
              )}

              {isAdminOrManager && row.status !== 'approved' && (
                <Button
                  variant="secondary"
                  onClick={() => handleApprove(row.quotation_id)}
                  disabled={approvingId === row.quotation_id}
                  title="Approve Quotation"
                  style={{
                    padding: '0.35rem 0.6rem',
                    color: 'var(--success)',
                    borderColor: 'rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <CheckCircle2 size={14} />
                </Button>
              )}

              {isAdminOrManager && (
                <Button
                  variant="secondary"
                  onClick={() => handleDelete(row.quotation_id, row.quotation_code)}
                  title="Delete Quotation"
                  style={{
                    padding: '0.35rem 0.6rem',
                    color: 'var(--danger)',
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                  }}
                >
                  <Trash2 size={14} />
                </Button>
              )}
            </div>
          )}
        />
      </div>

      {/* ── DELETE MODAL ──────────────────────────────────────────────── */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        recordName={deletingQuotation?.code || 'this quotation'}
        isLoading={isDeleting}
      />
    </div>
  );
};
