import React, { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Badge } from './Badge';
import { apiRequest } from '../../services/api';
import { LoadingSpinner } from './LoadingSpinner';
import { DocumentRenewalModal } from './DocumentRenewalModal';
import { DocumentModal } from './DocumentModal';
import {
  User,
  Shield,
  FileText,
  Calendar,
  Phone,
  Briefcase,
  Globe,
  Bell,
  ExternalLink,
  RefreshCw,
  Plus,
  CheckCircle,
  AlertTriangle,
  Clock,
  CreditCard,
} from 'lucide-react';
import { showError } from '../../utils/toast';

interface LabourDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  labourId: number;
  onUpdated?: () => void;
}

export const LabourDetailsModal: React.FC<LabourDetailsModalProps> = ({
  isOpen,
  onClose,
  labourId,
  onUpdated,
}) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'visa' | 'contract' | 'documents' | 'notifications'>('profile');

  // Renewal Modal State
  const [renewTarget, setRenewTarget] = useState<any | null>(null);

  // Upload more docs modal
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const fetchDetails = async () => {
    if (!labourId) return;
    setLoading(true);
    const res = await apiRequest(`/labours/${labourId}/details`);
    if (res.success && res.data) {
      setData(res.data);
    } else {
      showError(res.message || 'Failed to load labour profile details');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen && labourId) {
      fetchDetails();
    }
  }, [isOpen, labourId]);

  if (!isOpen) return null;

  const labour = data?.labour;
  const visa = data?.visa;
  const passport = data?.passport;
  const labourCard = data?.labour_card;
  const contract = data?.contract;
  const emreads = data?.emreads;
  const documents: any[] = data?.documents || [];
  const notifications: any[] = data?.notification_history || [];

  const renderStatusBadge = (calc?: any) => {
    if (!calc) return <Badge variant="secondary">Not Recorded</Badge>;
    if (calc.status === 'EXPIRED') {
      return <span style={{ padding: '0.25rem 0.6rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontWeight: 600, fontSize: '0.78rem' }}>{calc.statusLabel}</span>;
    }
    if (calc.badgeVariant === 'critical') {
      return <span style={{ padding: '0.25rem 0.6rem', borderRadius: '6px', background: 'rgba(249, 115, 22, 0.2)', color: '#f97316', fontWeight: 600, fontSize: '0.78rem' }}>{calc.statusLabel}</span>;
    }
    if (calc.status === 'EXPIRING_SOON') {
      return <span style={{ padding: '0.25rem 0.6rem', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontWeight: 600, fontSize: '0.78rem' }}>{calc.statusLabel}</span>;
    }
    return <span style={{ padding: '0.25rem 0.6rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 600, fontSize: '0.78rem' }}>{calc.statusLabel}</span>;
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={labour ? `${labour.name} (LAB-${String(labour.labour_id).padStart(3, '0')})` : 'Labour Details'}
      >
        {loading || !labour ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <LoadingSpinner />
            <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>Loading profile details...</div>
          </div>
        ) : (
          <div>
            {/* Header Strip */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(56, 189, 248, 0.05) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: '#6366f1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                  }}
                >
                  {labour.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{labour.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Type: <strong style={{ color: '#c7d2fe' }}>{labour.labour_type === 'contractor' ? 'Contractor' : 'Direct Labour'}</strong>
                    {labour.contractor_name && ` (Contractor: ${labour.contractor_name})`}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    background: labour.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: labour.status === 'active' ? '#10b981' : '#ef4444',
                    textTransform: 'uppercase',
                  }}
                >
                  {labour.status || 'Active'}
                </span>
                <Button variant="secondary" onClick={() => setUploadModalOpen(true)}>
                  <Plus size={14} /> Upload Doc
                </Button>
              </div>
            </div>

            {/* Tab navigation */}
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                borderBottom: '1px solid var(--border-color)',
                marginBottom: '1.25rem',
              }}
            >
              {[
                { key: 'profile', label: 'Basic & Identity' },
                { key: 'visa', label: 'Visa & Immigration' },
                { key: 'contract', label: 'Labour Card & Contract' },
                { key: 'documents', label: `Documents (${documents.length})` },
                { key: 'notifications', label: `Expiry Alerts (${notifications.length})` },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key as any)}
                  style={{
                    padding: '0.6rem 1rem',
                    border: 'none',
                    borderBottom: activeTab === t.key ? '2px solid #6366f1' : '2px solid transparent',
                    background: 'transparent',
                    color: activeTab === t.key ? '#6366f1' : 'var(--text-secondary)',
                    fontWeight: activeTab === t.key ? 600 : 400,
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* TAB 1: Profile & Identity */}
            {activeTab === 'profile' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Basic Information Card */}
                <div
                  style={{
                    padding: '1.25rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <h4 style={{ margin: '0 0 1rem 0', color: '#6366f1', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={16} /> Basic Worker Information
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.78rem' }}>Labour ID</span>
                      <strong>LAB-{String(labour.labour_id).padStart(3, '0')}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.78rem' }}>Full Name</span>
                      <strong>{labour.name}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.78rem' }}>Labour Type</span>
                      <span style={{ textTransform: 'capitalize' }}>{labour.labour_type.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.78rem' }}>Contact Mobile</span>
                      <strong>{labour.contact_number || 'N/A'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.78rem' }}>Country</span>
                      <strong>{labour.country_name || 'India'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.78rem' }}>Nationality</span>
                      <strong>{labour.nationality_name || 'Indian'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.78rem' }}>Assigned Project</span>
                      <strong>{labour.assigned_project_name || 'Unassigned'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.78rem' }}>Contractor / Agency</span>
                      <strong>{labour.contractor_name || 'Direct Hire'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.78rem' }}>Registered Date</span>
                      <span>{new Date(labour.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Identity & Government IDs */}
                <div
                  style={{
                    padding: '1.25rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <h4 style={{ margin: '0 0 1rem 0', color: '#6366f1', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={16} /> Identity & Government Documents
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                    <div style={{ padding: '0.85rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.78rem' }}>National ID / Aadhaar ID</span>
                      <strong style={{ fontSize: '0.95rem' }}>{labour.aadhar_id || 'Not Provided'}</strong>
                    </div>
                    <div style={{ padding: '0.85rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.78rem' }}>EMREADS ID / Emirates ID</span>
                      <strong style={{ fontSize: '0.95rem' }}>{labour.emreads_id || emreads?.document_number || 'Not Provided'}</strong>
                    </div>
                  </div>

                  {/* Passport Card */}
                  <div
                    style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      background: 'rgba(56, 189, 248, 0.03)',
                      borderRadius: '8px',
                      border: '1px solid rgba(56, 189, 248, 0.2)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>Passport:</span>
                        <strong>{passport?.document_number || 'No Passport On Record'}</strong>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.25rem', display: 'flex', gap: '1rem' }}>
                        {passport?.issue_date && <span>Issued: {new Date(passport.issue_date).toLocaleDateString()}</span>}
                        {passport?.expiry_date && <span>Expires: {new Date(passport.expiry_date).toLocaleDateString()}</span>}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {passport && renderStatusBadge(passport.expiry_calc)}
                      {passport?.file_path && (
                        <a
                          href={passport.file_path}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: '0.35rem 0.65rem',
                            borderRadius: '6px',
                            background: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8',
                            fontSize: '0.8rem',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                        >
                          <ExternalLink size={12} /> View
                        </a>
                      )}
                      {passport && (
                        <button
                          onClick={() => setRenewTarget(passport)}
                          style={{
                            padding: '0.35rem 0.65rem',
                            borderRadius: '6px',
                            background: 'rgba(99, 102, 241, 0.15)',
                            color: '#818cf8',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                        >
                          <RefreshCw size={12} /> Renew
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Visa & Immigration */}
            {activeTab === 'visa' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {visa ? (
                  <div
                    style={{
                      padding: '1.25rem',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 style={{ margin: 0, color: '#38bdf8', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={18} /> Active Visa Document
                      </h4>
                      {renderStatusBadge(visa.expiry_calc)}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.78rem' }}>Visa Number</span>
                        <strong style={{ fontSize: '0.95rem' }}>{visa.document_number || 'N/A'}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.78rem' }}>Visa Document Name</span>
                        <strong>{visa.document_name}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.78rem' }}>Issue Date</span>
                        <span>{visa.issue_date ? new Date(visa.issue_date).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.78rem' }}>Expiry Date</span>
                        <strong>{visa.expiry_date ? new Date(visa.expiry_date).toLocaleDateString() : 'N/A'}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.78rem' }}>Days Remaining</span>
                        <strong style={{ color: visa.days_remaining <= 5 ? '#ef4444' : '#10b981' }}>
                          {visa.days_remaining !== undefined ? `${visa.days_remaining} day(s)` : 'N/A'}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.78rem' }}>Uploaded By</span>
                        <span>{visa.uploaded_by_name || 'System Admin'}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                      {visa.file_path && (
                        <a
                          href={visa.file_path}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: '0.45rem 0.85rem',
                            borderRadius: '8px',
                            background: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8',
                            fontSize: '0.85rem',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <ExternalLink size={14} /> View Visa Document
                        </a>
                      )}
                      <Button variant="primary" onClick={() => setRenewTarget(visa)}>
                        <RefreshCw size={14} /> Replace / Renew Visa
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <p>No active visa registered for this worker.</p>
                    <Button variant="primary" onClick={() => setUploadModalOpen(true)}>
                      <Plus size={16} /> Upload Visa Document
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Labour Card & Contract */}
            {activeTab === 'contract' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Labour Card Section */}
                <div
                  style={{
                    padding: '1.25rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, color: '#f59e0b', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CreditCard size={18} /> Labour Card
                    </h4>
                    {labourCard ? renderStatusBadge(labourCard.expiry_calc) : <Badge variant="secondary">No Card</Badge>}
                  </div>

                  {labourCard ? (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', fontSize: '0.85rem', marginBottom: '1rem' }}>
                        <div>
                          <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.78rem' }}>Card Number</span>
                          <strong>{labourCard.document_number || 'N/A'}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.78rem' }}>Issue Date</span>
                          <span>{labourCard.issue_date ? new Date(labourCard.issue_date).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.78rem' }}>Expiry Date</span>
                          <strong>{labourCard.expiry_date ? new Date(labourCard.expiry_date).toLocaleDateString() : 'N/A'}</strong>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        {labourCard.file_path && (
                          <a
                            href={labourCard.file_path}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              padding: '0.4rem 0.75rem',
                              borderRadius: '6px',
                              background: 'rgba(56, 189, 248, 0.15)',
                              color: '#38bdf8',
                              fontSize: '0.8rem',
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}
                          >
                            <ExternalLink size={13} /> View File
                          </a>
                        )}
                        <Button variant="secondary" onClick={() => setRenewTarget(labourCard)}>
                          <RefreshCw size={13} /> Renew Card
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      No Labour Card uploaded yet. Click <strong>Upload Doc</strong> to add.
                    </div>
                  )}
                </div>

                {/* Contract Section */}
                <div
                  style={{
                    padding: '1.25rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, color: '#10b981', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Briefcase size={18} /> Labour / Employment Contract
                    </h4>
                    {contract ? renderStatusBadge(contract.expiry_calc) : <Badge variant="secondary">No Contract</Badge>}
                  </div>

                  {contract ? (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', fontSize: '0.85rem', marginBottom: '1rem' }}>
                        <div>
                          <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.78rem' }}>Contract Number</span>
                          <strong>{contract.document_number || 'N/A'}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.78rem' }}>Start Date</span>
                          <span>{contract.issue_date ? new Date(contract.issue_date).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.78rem' }}>End Date</span>
                          <strong>{contract.expiry_date ? new Date(contract.expiry_date).toLocaleDateString() : 'N/A'}</strong>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        {contract.file_path && (
                          <a
                            href={contract.file_path}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              padding: '0.4rem 0.75rem',
                              borderRadius: '6px',
                              background: 'rgba(56, 189, 248, 0.15)',
                              color: '#38bdf8',
                              fontSize: '0.8rem',
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}
                          >
                            <ExternalLink size={13} /> View Contract
                          </a>
                        )}
                        <Button variant="secondary" onClick={() => setRenewTarget(contract)}>
                          <RefreshCw size={13} /> Renew Contract
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      No contract registered on file. Click <strong>Upload Doc</strong> to attach.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: All Uploaded Documents */}
            {activeTab === 'documents' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Total Documents: <strong>{documents.length}</strong>
                  </div>
                  <Button variant="primary" onClick={() => setUploadModalOpen(true)}>
                    <Plus size={14} /> Upload New Document
                  </Button>
                </div>

                {documents.length === 0 ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No documents uploaded yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto' }}>
                    {documents.map((doc) => (
                      <div
                        key={doc.document_id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.85rem 1rem',
                          background: 'rgba(255, 255, 255, 0.02)',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <FileText size={18} color="#6366f1" />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                              {doc.document_name}
                              {doc.doc_type_name && <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '0.4rem' }}>({doc.doc_type_name})</span>}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', gap: '0.75rem' }}>
                              {doc.document_number && <span>Doc #: {doc.document_number}</span>}
                              {doc.expiry_date && <span>Expires: {new Date(doc.expiry_date).toLocaleDateString()}</span>}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {doc.status === 'archived' ? (
                            <Badge variant="secondary">Archived</Badge>
                          ) : (
                            renderStatusBadge({
                              status: doc.calculated_status,
                              statusLabel: doc.days_remaining !== undefined && doc.days_remaining !== null
                                ? doc.days_remaining < 0 ? `Expired (${Math.abs(doc.days_remaining)}d ago)` : `${doc.days_remaining}d left`
                                : 'Active',
                              badgeVariant: doc.days_remaining !== undefined && doc.days_remaining <= 5 ? 'critical' : 'success',
                            })
                          )}
                          {doc.file_path && (
                            <a
                              href={doc.file_path}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                padding: '0.3rem 0.6rem',
                                borderRadius: '6px',
                                background: 'rgba(56, 189, 248, 0.1)',
                                color: '#38bdf8',
                                fontSize: '0.78rem',
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                            >
                              <ExternalLink size={12} /> View
                            </a>
                          )}
                          {doc.status !== 'archived' && (
                            <button
                              onClick={() => setRenewTarget(doc)}
                              style={{
                                padding: '0.3rem 0.6rem',
                                borderRadius: '6px',
                                background: 'rgba(99, 102, 241, 0.1)',
                                color: '#818cf8',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.78rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                            >
                              <RefreshCw size={12} /> Renew
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: Expiry Alert History */}
            {activeTab === 'notifications' && (
              <div>
                <h4 style={{ margin: '0 0 1rem 0', color: '#f59e0b', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Bell size={16} /> Document Expiry Alert History
                </h4>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No expiry alert notifications sent for this worker yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '350px', overflowY: 'auto' }}>
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        style={{
                          padding: '0.85rem 1rem',
                          background: 'rgba(255, 255, 255, 0.02)',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                            {n.doc_type_name}: {n.document_name} ({n.document_number || 'N/A'})
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                            Recipient: <strong>{n.recipient_name}</strong> ({n.recipient_role})
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span
                            style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '6px',
                              background: n.days_before <= 2 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: n.days_before <= 2 ? '#ef4444' : '#f59e0b',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                            }}
                          >
                            {n.days_before === 0 ? 'Expired' : `${n.days_before}d reminder`}
                          </span>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem' }}>
                            {new Date(n.sent_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Renewal Modal */}
      {renewTarget && (
        <DocumentRenewalModal
          isOpen={!!renewTarget}
          onClose={() => setRenewTarget(null)}
          onSuccess={() => {
            fetchDetails();
            onUpdated?.();
          }}
          document={renewTarget}
          entityName={labour?.name}
        />
      )}

      {/* Upload Additional Document Modal */}
      {uploadModalOpen && labour && (
        <DocumentModal
          isOpen={uploadModalOpen}
          onClose={() => {
            setUploadModalOpen(false);
            fetchDetails();
            onUpdated?.();
          }}
          entityType="labour"
          entityId={labour.labour_id}
          entityName={labour.name}
        />
      )}
    </>
  );
};
export default LabourDetailsModal;
