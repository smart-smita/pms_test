import React, { useEffect, useState } from 'react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { apiRequest } from '../services/api';
import {
  ArrowLeft,
  Edit,
  Download,
  CheckCircle2,
  XCircle,
  FolderKanban,
  Building2,
  HardHat,
  Package,
  Layers,
  Paperclip,
  FileText,
  DollarSign,
  Calendar,
  Clock,
  User,
  MapPin,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  Briefcase,
} from 'lucide-react';
import { showSuccess, showError } from '../utils/toast';
import { useAuth } from '../context/AuthContext';

interface QuotationViewProps {
  quotationId: number;
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

export const QuotationView: React.FC<QuotationViewProps> = ({ quotationId, onBack, onNavigate }) => {
  const { user } = useAuth();
  const isAdminOrManager =
    user?.role_name === 'Admin' || user?.role_name === 'Super Admin' || user?.role_name === 'Manager';

  const [quotation, setQuotation] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Reject Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchQuotation = async () => {
    setIsLoading(true);
    const res = await apiRequest<any>(`/quotations/${quotationId}`);
    if (res.success && res.data) {
      setQuotation(res.data);
    } else {
      showError(res.message || 'Failed to load quotation');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchQuotation();
  }, [quotationId]);

  const handleApprove = async () => {
    setIsUpdatingStatus(true);
    const res = await apiRequest(`/quotations/${quotationId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'approved' }),
    });
    setIsUpdatingStatus(false);

    if (res.success) {
      showSuccess('Quotation approved successfully!');
      fetchQuotation();
    } else {
      showError(res.message || 'Failed to approve quotation');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      showError('Please provide a reason for rejection');
      return;
    }

    setIsUpdatingStatus(true);
    const res = await apiRequest(`/quotations/${quotationId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'rejected', rejection_reason: rejectionReason.trim() }),
    });
    setIsUpdatingStatus(false);

    if (res.success) {
      showSuccess('Quotation marked as rejected');
      setIsRejectModalOpen(false);
      fetchQuotation();
    } else {
      showError(res.message || 'Failed to update status');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (!quotation) return;
    const rows = [
      ['Quotation Code', quotation.quotation_code || ''],
      ['Customer', quotation.customer_name || ''],
      ['Project', quotation.project_name || 'New Project'],
      ['Project Type', quotation.project_type_name || ''],
      ['Quotation Date', quotation.quotation_date ? quotation.quotation_date.split('T')[0] : ''],

      ['Currency', quotation.currency_code || 'INR'],
      ['Net Subtotal', quotation.subtotal_amount || 0],
      ['Discount', quotation.discount_amount || 0],
      ['Tax Amount', quotation.tax_amount || 0],
      ['Grand Total', quotation.total_amount || 0],
      ['Status', quotation.status || 'draft'],
      [''],
      ['--- WBS Line Items ---'],
      ['Discipline / Task', 'Type', 'Description', 'Quantity / Hours', 'Rate', 'Amount'],
    ];

    (quotation.disciplines || []).forEach((d: any) => {
      rows.push([
        d.discipline_name || '',
        d.wbs_type || '',
        d.labour_name || d.material_name || '',
        d.labour_hours || d.material_quantity || d.quantity || 1,
        d.labour_rate || d.material_rate || d.rate || 0,
        d.amount || 0,
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.map(String).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${quotation.quotation_code || 'quotation'}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '1rem',
          color: 'var(--text-secondary)',
        }}
      >
        <div className="spinner" />
        <p>Loading quotation details...</p>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Quotation not found.</p>
        <Button variant="primary" onClick={onBack} style={{ marginTop: '1rem' }}>
          Back to Quotations
        </Button>
      </div>
    );
  }

  const currencySymbol = quotation.currency_symbol || quotation.symbol || '₹';

  return (
    <div style={{ paddingBottom: '4rem' }}>
      {/* ── TOP HEADER / ACTIONS BAR ──────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Button
            variant="secondary"
            onClick={onBack}
            style={{
              padding: '0.45rem 0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <ArrowLeft size={16} /> Back
          </Button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 className="page-title" style={{ margin: 0 }}>
                {quotation.quotation_code}
              </h1>
              <Badge
                variant={
                  quotation.status === 'approved'
                    ? 'success'
                    : quotation.status === 'rejected'
                    ? 'danger'
                    : quotation.status === 'pending_approval'
                    ? 'warning'
                    : 'neutral'
                }
              >
                {quotation.status?.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <p className="page-subtitle" style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Created for {quotation.customer_name} • {quotation.project_name || 'New Project'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <Button
            variant="secondary"
            onClick={handlePrint}
            title="Print Quotation"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Printer size={15} /> Print
          </Button>
          <Button
            variant="secondary"
            onClick={handleExportCsv}
            title="Export CSV"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <FileSpreadsheet size={15} /> Export
          </Button>

          {quotation.status === 'approved' && onNavigate && (
            <Button
              variant="primary"
              onClick={async () => {
                try {
                  const pRes = await apiRequest<any[]>(`/planning?quotation_id=${quotationId}`);
                  if (pRes.success && pRes.data && pRes.data.length > 0) {
                    onNavigate(`planning/workspace/${pRes.data[0].id}/overview`);
                  } else {
                    onNavigate('planning/workspace');
                  }
                } catch (e) {
                  onNavigate('planning/workspace');
                }
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Layers size={15} /> Open Planning Workspace
            </Button>
          )}

          {isAdminOrManager && quotation.status !== 'approved' && (
            <Button
              variant="secondary"
              onClick={() => (onNavigate ? onNavigate(`quotations/edit/${quotationId}`) : onBack())}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Edit size={15} /> Edit
            </Button>
          )}

          {isAdminOrManager && quotation.status !== 'approved' && (
            <>
              <Button
                variant="primary"
                onClick={handleApprove}
                disabled={isUpdatingStatus}
                style={{
                  background: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <CheckCircle2 size={15} /> Approve
              </Button>
              <Button
                variant="secondary"
                onClick={() => setIsRejectModalOpen(true)}
                disabled={isUpdatingStatus}
                style={{
                  color: 'var(--danger)',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <XCircle size={15} /> Reject
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── RESPONSIVE GRID LAYOUT ───────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 340px',
          gap: '1.5rem',
          alignItems: 'start',
        }}
        className="quotation-view-layout"
      >
        {/* ── LEFT COLUMN ────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Key Information Banner */}
          <div
            className="glass-card"
            style={{
              padding: '1.25rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Customer / Client
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                {quotation.customer_name}
              </div>
              {quotation.contact_person && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Contact: {quotation.contact_person}
                </div>
              )}
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Project
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                {quotation.project_name || 'New Project'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Type: {quotation.project_type_name || 'General'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Dates
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                Date: {quotation.quotation_date ? quotation.quotation_date.split('T')[0] : 'N/A'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Currency
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--accent-primary)', marginTop: '0.2rem' }}>
                {quotation.currency_name || quotation.currency_code || 'INR'} ({currencySymbol})
              </div>
            </div>
          </div>

          {/* Scope Description */}
          {quotation.description && (
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem',
                }}
              >
                Scope Description / Notes
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {quotation.description}
              </p>
            </div>
          )}

          {/* Combined WBS Line Items */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
                paddingBottom: '0.5rem',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                <HardHat size={18} color="var(--warning)" />
                <span>WBS Tasks & Breakdown ({(quotation.disciplines || []).length} items)</span>
              </div>
            </div>

            {(quotation.disciplines || []).length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No WBS tasks recorded.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {quotation.disciplines.map((d: any, idx: number) => (
                  <div
                    key={d.quotation_discipline_id || idx}
                    style={{
                      background: 'var(--border-color)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem 1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            background: 'rgba(99, 102, 241, 0.15)',
                            color: 'var(--accent-primary)',
                          }}
                        >
                          #{idx + 1}
                        </span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                          {d.discipline_name}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Badge variant={d.wbs_type === 'material' ? 'info' : 'warning'}>
                          {d.wbs_type === 'material' ? <Package size={11} style={{ marginRight: '0.2rem' }} /> : <HardHat size={11} style={{ marginRight: '0.2rem' }} />}
                          {d.wbs_type?.toUpperCase() || 'LABOUR'}
                        </Badge>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                          {currencySymbol} {Number(d.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Sub-item Details */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.5rem',
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)',
                        marginTop: '0.5rem',
                        paddingTop: '0.5rem',
                        borderTop: '1px dashed var(--border-color)',
                      }}
                    >
                      {d.wbs_type === 'material' ? (
                        <>
                          <span>Item: <strong style={{ color: 'var(--text-primary)' }}>{d.material_name || d.discipline_name}</strong></span>
                          <span>Quantity: <strong style={{ color: 'var(--text-primary)' }}>{d.material_quantity || d.quantity || 1} {d.material_unit || d.unit || 'Nos'}</strong></span>
                          <span>Rate: <strong style={{ color: 'var(--text-primary)' }}>{currencySymbol} {Number(d.material_rate || d.rate || 0).toFixed(2)}</strong></span>
                        </>
                      ) : (
                        <>
                          <span>Labour: <strong style={{ color: 'var(--text-primary)' }}>{d.labour_name || d.discipline_name}</strong></span>
                          <span>Role: <strong style={{ color: 'var(--text-primary)' }}>{d.labour_type || 'Standard'}</strong></span>
                          <span>Hours: <strong style={{ color: 'var(--text-primary)' }}>{d.labour_hours || d.quantity || 0} hrs</strong></span>
                          <span>Rate: <strong style={{ color: 'var(--text-primary)' }}>{currencySymbol} {Number(d.labour_rate || d.rate || 0).toFixed(2)}/hr</strong></span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Terms & Conditions */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '1rem',
                paddingBottom: '0.5rem',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <FileText size={18} color="var(--accent-primary)" />
              <span>Terms & Conditions ({(quotation.terms_snapshots || []).length} clauses)</span>
            </div>

            {(quotation.terms_snapshots || []).length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Standard project terms apply.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {quotation.terms_snapshots.map((term: any, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--border-color)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      {idx + 1}. {term.title}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {term.description}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Supporting Documents */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '1rem',
                paddingBottom: '0.5rem',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <Paperclip size={18} color="var(--teal)" />
              <span>Supporting Documents ({(quotation.documents || []).length})</span>
            </div>

            {(quotation.documents || []).length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No attachments uploaded for this quotation.
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                {quotation.documents.map((doc: any) => (
                  <div
                    key={doc.document_id}
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--border-color)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                        {doc.file_name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : 'Attached'}
                      </div>
                    </div>
                    {doc.file_path && (
                      <a
                        href={doc.file_path}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          padding: '0.3rem 0.5rem',
                          background: 'rgba(99, 102, 241, 0.15)',
                          color: 'var(--accent-primary)',
                          borderRadius: '4px',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                          fontSize: '0.75rem',
                        }}
                      >
                        <Download size={12} /> View
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: FINANCIAL SUMMARY ─────────────────────────── */}
        <div style={{ position: 'sticky', top: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '1rem',
                paddingBottom: '0.5rem',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <DollarSign size={18} color="var(--success)" />
              <span>Financial Overview</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Net Subtotal:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {currencySymbol} {Number(quotation.subtotal_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              {Number(quotation.discount_amount || 0) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger)' }}>
                  <span>Discount:</span>
                  <span style={{ fontWeight: 600 }}>
                    - {currencySymbol} {Number(quotation.discount_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {/* Taxes */}
              {(quotation.taxes || []).map((t: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <span>{t.tax_name} ({t.tax_percentage}%):</span>
                  <span>
                    {currencySymbol} {Number(t.calculated_amount || t.tax_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Total Tax Amount:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {currencySymbol} {Number(quotation.tax_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Grand Total */}
              <div
                style={{
                  marginTop: '0.75rem',
                  paddingTop: '0.85rem',
                  borderTop: '2px solid var(--accent-primary)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Grand Total
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>
                    {quotation.currency_code || 'INR'}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '1.3rem',
                    fontWeight: 700,
                    color: 'var(--accent-primary)',
                  }}
                >
                  {currencySymbol} {Number(quotation.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Reject Quotation"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Please specify the reason for rejecting quotation <strong>{quotation.quotation_code}</strong>:
          </p>
          <textarea
            className="form-input"
            rows={3}
            placeholder="e.g. Budget constraints, scope changes, competitor selected..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button variant="secondary" onClick={() => setIsRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleReject}
              disabled={isUpdatingStatus}
              style={{ background: 'var(--danger)' }}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
