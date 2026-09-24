import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { apiRequest } from '../../services/api';
import { Project360Data } from '../../types';
import {
  Building2,
  FolderKanban,
  MapPin,
  FileText,
  Clock,
  Receipt,
  IndianRupee,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Globe,
  Download,
  ExternalLink,
  ShieldCheck,
  User,
  Mail,
  Phone,
} from 'lucide-react';

interface Project360ModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number | null;
}

export const Project360Modal: React.FC<Project360ModalProps> = ({ isOpen, onClose, projectId }) => {
  const [data, setData] = useState<Project360Data | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'scope' | 'terms' | 'work' | 'surveys' | 'invoices' | 'payments'>('overview');

  useEffect(() => {
    if (isOpen && projectId) {
      fetch360Details(projectId);
    }
  }, [isOpen, projectId]);

  const fetch360Details = async (id: number) => {
    setIsLoading(true);
    const res = await apiRequest<Project360Data & { surveys?: any[] }>(`/projects/${id}/360`);
    if (res.success && res.data) {
      setData(res.data);
    }
    setIsLoading(false);
  };

  if (!isOpen) return null;

  const project = data?.project;
  const customer = data?.customer;
  const quotation = data?.quotation;
  const disciplines = data?.disciplines || [];
  const documents = data?.documents || [];
  const tasks = data?.tasks || [];
  const surveys = (data as any)?.surveys || [];
  const invoices = data?.invoices || [];
  const payments = data?.payments || [];
  const financials = data?.financials;

  const handleDownloadPdf = (quotationId: number, code: string) => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    window.open(`${apiUrl}/quotations/${quotationId}/pdf?token=${token}`, '_blank');
  };

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        project ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
              <FolderKanban size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {project.project_name} <span style={{ color: '#818cf8', fontWeight: 600 }}>({project.project_code})</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.1rem' }}>
                <span>Client: {customer?.customer_name || project.client_name || 'N/A'}</span>
                <span>• Location: {project.country_name || 'Global'} {project.community_name ? `(${project.community_name})` : ''}</span>
              </div>
            </div>
          </div>
        ) : (
          'Project 360° Workspace'
        )
      }
    >
      {isLoading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <LoadingSpinner />
        </div>
      ) : !data || !project ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
          Unable to load 360° workspace details for this project.
        </div>
      ) : (
        <div style={{ maxHeight: '78vh', overflowY: 'auto', paddingRight: '0.3rem' }}>
          {/* Top Summary Banner */}
          <div style={{ background: 'rgba(99, 102, 241, 0.04)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.15)', marginBottom: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Project Status</span>
              <div style={{ marginTop: '0.2rem' }}>
                <Badge variant={project.status === 'active' ? 'success' : 'warning'}>{project.status}</Badge>
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Completion %</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.1rem' }}>
                {project.progress_percentage || 0}%
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Budget Amount</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#4ade80', marginTop: '0.1rem' }}>
                ₹ {Number(financials?.budget_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Invoiced</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.1rem' }}>
                ₹ {Number(financials?.total_invoiced || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Balance Due</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: financials?.balance_due && financials.balance_due > 0 ? '#ef4444' : '#10b981', marginTop: '0.1rem' }}>
                ₹ {Number(financials?.balance_due || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div style={{ display: 'flex', gap: '0.4rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.4rem' }}>
            <button
              onClick={() => setActiveTab('overview')}
              style={{
                padding: '0.5rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'overview' ? '#4f46e5' : 'transparent',
                color: activeTab === 'overview' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                whiteSpace: 'nowrap',
              }}
            >
              <FolderKanban size={15} /> Overview & Location
            </button>
            <button
              onClick={() => setActiveTab('scope')}
              style={{
                padding: '0.5rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'scope' ? '#4f46e5' : 'transparent',
                color: activeTab === 'scope' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                whiteSpace: 'nowrap',
              }}
            >
              <Layers size={15} /> Scope & Disciplines ({disciplines.length})
            </button>
            <button
              onClick={() => setActiveTab('terms')}
              style={{
                padding: '0.5rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'terms' ? '#4f46e5' : 'transparent',
                color: activeTab === 'terms' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                whiteSpace: 'nowrap',
              }}
            >
              <FileText size={15} /> Terms & Permits ({documents.length})
            </button>
            <button
              onClick={() => setActiveTab('work')}
              style={{
                padding: '0.5rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'work' ? '#4f46e5' : 'transparent',
                color: activeTab === 'work' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                whiteSpace: 'nowrap',
              }}
            >
              <Clock size={15} /> Work & Tasks ({tasks.length})
            </button>
            <button
              onClick={() => setActiveTab('surveys')}
              style={{
                padding: '0.5rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'surveys' ? '#4f46e5' : 'transparent',
                color: activeTab === 'surveys' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                whiteSpace: 'nowrap',
              }}
            >
              <ShieldCheck size={15} /> Site Inspections & Surveys ({surveys.length})
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              style={{
                padding: '0.5rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'invoices' ? '#4f46e5' : 'transparent',
                color: activeTab === 'invoices' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                whiteSpace: 'nowrap',
              }}
            >
              <Receipt size={15} /> Monthly Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              style={{
                padding: '0.5rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'payments' ? '#4f46e5' : 'transparent',
                color: activeTab === 'payments' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                whiteSpace: 'nowrap',
              }}
            >
              <IndianRupee size={15} /> Payments & Cashflow ({payments.length})
            </button>
          </div>

          {/* TAB 1: OVERVIEW & LOCATION */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Building2 size={16} color="#6366f1" /> Client & Account Details
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Client Name: </span>
                    <strong style={{ color: 'var(--text-primary)' }}>{customer?.customer_name || project.client_name || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Client Code: </span>
                    <strong style={{ color: '#818cf8' }}>{customer?.customer_code || project.client_code || 'N/A'}</strong>
                  </div>
                  {customer?.contact_person && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <User size={13} color="#cbd5e1" /> Contact: {customer.contact_person}
                    </div>
                  )}
                  {customer?.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Mail size={13} color="#38bdf8" /> Email: {customer.email}
                    </div>
                  )}
                  {customer?.contact_number && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Phone size={13} color="#4ade80" /> Phone: {customer.contact_number}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MapPin size={16} color="#f43f5e" /> Project Location & Geofence
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Country / State: </span>
                    <strong style={{ color: 'var(--text-primary)' }}>{project.country_name || 'N/A'} {project.community_name ? `(${project.community_name})` : ''}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Site Address: </span>
                    <span style={{ color: 'var(--text-primary)' }}>{project.project_address || 'No specific address configured'}</span>
                  </div>
                  {project.latitude && project.longitude && (
                    <div>
                      <span style={{ color: '#94a3b8' }}>GPS Coordinates: </span>
                      <strong style={{ color: '#38bdf8' }}>{project.latitude}, {project.longitude}</strong>
                    </div>
                  )}
                  <div>
                    <span style={{ color: '#94a3b8' }}>Allowed Radius: </span>
                    <strong style={{ color: '#4ade80' }}>{project.radius_meters || 500} meters</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SCOPE OF WORK & DISCIPLINES */}
          {activeTab === 'scope' && (
            <div>
              {quotation && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(99,102,241,0.06)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Linked Quotation: <strong style={{ color: '#818cf8' }}>{quotation.quotation_code}</strong> (Rev #{quotation.revision_number || 1})
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Approved Total: ₹ {Number(quotation.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadPdf(quotation.quotation_id, quotation.quotation_code)}
                    style={{ padding: '0.4rem 0.75rem', background: '#4f46e5', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <Download size={14} /> Download Quote PDF
                  </button>
                </div>
              )}

              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                Discipline Line Items Breakdown ({disciplines.length})
              </h4>

              {disciplines.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                  No discipline line items associated with this project quotation.
                </div>
              ) : (
                <table className="minimal-table" style={{ width: '100%', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <th style={{ textAlign: 'left', padding: '0.6rem' }}>Discipline</th>
                      <th style={{ textAlign: 'center', padding: '0.6rem' }}>Unit</th>
                      <th style={{ textAlign: 'right', padding: '0.6rem' }}>Quantity</th>
                      <th style={{ textAlign: 'right', padding: '0.6rem' }}>Rate (₹)</th>
                      <th style={{ textAlign: 'right', padding: '0.6rem' }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disciplines.map((d, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.6rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {d.discipline_name} <span style={{ color: '#94a3b8', fontWeight: 400 }}>({d.discipline_code})</span>
                        </td>
                        <td style={{ padding: '0.6rem', textAlign: 'center', color: '#94a3b8' }}>{d.unit || 'lump_sum'}</td>
                        <td style={{ padding: '0.6rem', textAlign: 'right' }}>{d.quantity}</td>
                        <td style={{ padding: '0.6rem', textAlign: 'right' }}>₹ {Number(d.rate).toFixed(2)}</td>
                        <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: 700, color: '#4ade80' }}>
                          ₹ {Number(d.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 3: TERMS & PERMITS */}
          {activeTab === 'terms' && (
            <div>
              {quotation?.terms_conditions && (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Contractual Terms & Conditions Snapshot</h4>
                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{quotation.terms_conditions}</p>
                </div>
              )}

              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Attached Documents & Permits ({documents.length})</h4>
              {documents.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                  No permission or permit documents uploaded for this project.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {documents.map((doc) => (
                    <div key={doc.document_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{doc.document_name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Type: {doc.doc_type_name || 'Document'} | Expiry: {doc.expiry_date ? new Date(doc.expiry_date).toLocaleDateString() : 'N/A'}</div>
                      </div>
                      {doc.file_path && (
                        <a href={`${apiUrl.replace('/api/v1', '')}${doc.file_path}`} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 600 }}>
                          View File
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: WORK STATUS & TASKS */}
          {activeTab === 'work' && (
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Project Tasks & Progress ({tasks.length})</h4>
              {tasks.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                  No tasks assigned to this project yet.
                </div>
              ) : (
                <table className="minimal-table" style={{ width: '100%', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <th style={{ textAlign: 'left', padding: '0.6rem' }}>Task Name</th>
                      <th style={{ textAlign: 'left', padding: '0.6rem' }}>WBS Discipline</th>
                      <th style={{ textAlign: 'right', padding: '0.6rem' }}>Est. Hours</th>
                      <th style={{ textAlign: 'center', padding: '0.6rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((t) => (
                      <tr key={t.task_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.6rem', fontWeight: 600, color: 'var(--text-primary)' }}>{t.task_name}</td>
                        <td style={{ padding: '0.6rem', color: '#94a3b8' }}>{t.wbs_name || 'General'}</td>
                        <td style={{ padding: '0.6rem', textAlign: 'right' }}>{t.estimated_hours} hrs</td>
                        <td style={{ padding: '0.6rem', textAlign: 'center' }}><Badge variant="info">{t.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 5: SITE INSPECTIONS & SURVEYS */}
          {activeTab === 'surveys' && (
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                Site Inspection & Survey Reports ({surveys.length})
              </h4>
              {surveys.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                  No site surveys or inspection reports recorded for this project.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {surveys.map((s: any) => (
                    <div key={s.survey_id} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div>
                          <strong style={{ color: '#818cf8', fontSize: '0.95rem' }}>{s.survey_code}</strong>
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginLeft: '0.5rem' }}>
                            ({new Date(s.survey_date).toLocaleDateString()}) • Inspector: {s.conducted_by_name}
                          </span>
                        </div>
                        <Badge variant={s.entry_type === 'system_entry' ? 'success' : 'secondary'}>
                          {s.entry_type === 'system_entry' ? `Form Entry (${s.photo_count || 0} pics)` : 'Attached Report PDF'}
                        </Badge>
                      </div>

                      {s.discipline_name && (
                        <div style={{ fontSize: '0.8rem', color: '#38bdf8', marginBottom: '0.4rem' }}>
                          Discipline: <strong>{s.discipline_name}</strong>
                        </div>
                      )}

                      {s.comments && (
                        <p style={{ fontSize: '0.82rem', color: '#cbd5e1', margin: '0.3rem 0', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '6px' }}>
                          {s.comments}
                        </p>
                      )}

                      {s.attached_report_path && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <a href={`${apiUrl.replace('/api/v1', '')}${s.attached_report_path}`} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 600 }}>
                            View Survey Report PDF
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: INVOICES & BILLING */}
          {activeTab === 'invoices' && (
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Monthly Progress Invoices ({invoices.length})</h4>
              {invoices.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                  No monthly progress invoices generated yet for this project.
                </div>
              ) : (
                <table className="minimal-table" style={{ width: '100%', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <th style={{ textAlign: 'left', padding: '0.6rem' }}>Invoice #</th>
                      <th style={{ textAlign: 'left', padding: '0.6rem' }}>Date</th>
                      <th style={{ textAlign: 'right', padding: '0.6rem' }}>Subtotal</th>
                      <th style={{ textAlign: 'right', padding: '0.6rem' }}>Tax</th>
                      <th style={{ textAlign: 'right', padding: '0.6rem' }}>Total Amount</th>
                      <th style={{ textAlign: 'center', padding: '0.6rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.invoice_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.6rem', fontWeight: 600, color: '#818cf8' }}>{inv.invoice_number}</td>
                        <td style={{ padding: '0.6rem', color: '#94a3b8' }}>{new Date(inv.invoice_date).toLocaleDateString()}</td>
                        <td style={{ padding: '0.6rem', textAlign: 'right' }}>₹ {Number(inv.subtotal_amount).toFixed(2)}</td>
                        <td style={{ padding: '0.6rem', textAlign: 'right' }}>₹ {Number(inv.tax_amount).toFixed(2)}</td>
                        <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: 700, color: '#4ade80' }}>
                          ₹ {Number(inv.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '0.6rem', textAlign: 'center' }}><Badge variant={inv.status === 'paid' ? 'success' : 'warning'}>{inv.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 6: PAYMENTS & CASHFLOW */}
          {activeTab === 'payments' && (
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Received Payments & Receipts ({payments.length})</h4>
              {payments.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                  No payment receipts recorded yet for this project.
                </div>
              ) : (
                <table className="minimal-table" style={{ width: '100%', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <th style={{ textAlign: 'left', padding: '0.6rem' }}>Payment Date</th>
                      <th style={{ textAlign: 'left', padding: '0.6rem' }}>Invoice #</th>
                      <th style={{ textAlign: 'left', padding: '0.6rem' }}>Method / Ref</th>
                      <th style={{ textAlign: 'right', padding: '0.6rem' }}>Amount Paid (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.payment_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.6rem', color: 'var(--text-primary)' }}>{new Date(p.payment_date).toLocaleDateString()}</td>
                        <td style={{ padding: '0.6rem', color: '#818cf8', fontWeight: 600 }}>{p.invoice_number || `INV #${p.invoice_id}`}</td>
                        <td style={{ padding: '0.6rem', color: '#94a3b8' }}>{p.payment_method} {p.reference_number ? `(${p.reference_number})` : ''}</td>
                        <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: 700, color: '#4ade80' }}>
                          ₹ {Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
