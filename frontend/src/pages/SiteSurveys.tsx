import React, { useEffect, useState } from 'react';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';
import { apiRequest, API_BASE_URL } from '../services/api';
import { SiteSurvey, Project, Discipline, Employee, Customer, SiteSurveyPhoto } from '../types';
import { Plus, Edit, Trash2, Camera, FileText, CheckCircle2, Building2, FolderKanban, MapPin, Eye, Upload, Image, Layers, User, Download, ClipboardCheck, Package, Mail, Send } from 'lucide-react';
import { ConfirmDeleteModal } from '../components/common/ConfirmDeleteModal';
import { showSuccess, showError } from '../utils/toast';
import { useAuth } from '../context/AuthContext';


interface SiteSurveysProps {
  initialTab?: 'inspection' | 'material';
  projectId?: number;
}

export const SiteSurveys: React.FC<SiteSurveysProps> = ({ initialTab = 'inspection', projectId }) => {
  const [activeSurveyTab, setActiveSurveyTab] = useState<'inspection' | 'material'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveSurveyTab(initialTab);
    }
  }, [initialTab]);
  const { user } = useAuth();
  const isAdminOrManager = user?.role_name === 'Admin' || user?.role_name === 'Super Admin' || user?.role_name === 'Manager';

  const [surveys, setSurveys] = useState<SiteSurvey[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filterProject, setFilterProject] = useState(projectId ? String(projectId) : '');
  const [filterDiscipline, setFilterDiscipline] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    if (projectId) {
      setFilterProject(String(projectId));
    }
  }, [projectId]);

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entryMode, setEntryMode] = useState<'system_entry' | 'report_attachment'>('system_entry');
  const [editingSurvey, setEditingSurvey] = useState<SiteSurvey | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    survey_code: '',
    project_id: '',
    customer_id: '',
    discipline_id: '',
    survey_date: new Date().toISOString().split('T')[0],
    conducted_by: user ? String(user.employee_id) : '',
    location_details: '',
    latitude: '',
    longitude: '',
    comments: '',
    remarks: '',
    wbs_id: '',
    site_conditions: '',
    measurements: '',
    labour_requirements: '',
    material_requirements: '',
    observations: '',
    report_number: '',
    period_from: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    period_to: new Date().toISOString().split('T')[0],
    prepared_by_name: user?.name ? `${user.name} (Senior Engineer)` : 'Kishan Khatke (Senior Engineer)',
    verified_by_name: 'Prashant Jadhav (Project Manager)',
    endorsed_by_name: 'Sagar Patil (AGM/GM)',
    document_number: 'PLN-03-F04',
    revision_number: 'R1',
    status: 'completed' as 'draft' | 'completed' | 'verified' | 'rejected',
  });

  // Photo uploads (Option 1)
  const [photosList, setPhotosList] = useState<{ file_base64: string; photo_name: string; caption: string; display_order?: number }[]>([]);

  // Attached Report File (Option 2)
  const [reportFile, setReportFile] = useState<{ base64: string; name: string } | null>(null);

  // Survey Detail / Photo Gallery Modal
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingSurvey, setViewingSurvey] = useState<SiteSurvey | null>(null);

  // Email Modal State (Standalone Report Dispatch)
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailingSurvey, setEmailingSurvey] = useState<SiteSurvey | null>(null);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingSurvey, setDeletingSurvey] = useState<{ id: number; code: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSurveys = async () => {
    setIsLoading(true);
    let url = '/site-surveys';
    const query: string[] = [];
    if (filterProject) query.push(`project_id=${filterProject}`);
    if (filterDiscipline) query.push(`discipline_id=${filterDiscipline}`);
    if (filterStatus) query.push(`status=${filterStatus}`);
    if (query.length > 0) url += `?${query.join('&')}`;

    const res = await apiRequest<SiteSurvey[]>(url);
    if (res.success && res.data) setSurveys(res.data);
    setIsLoading(false);
  };

  const fetchMasters = async () => {
    const [pRes, dRes, eRes, cRes] = await Promise.all([
      apiRequest<Project[]>('/projects'),
      apiRequest<Discipline[]>('/masters/disciplines'),
      apiRequest<Employee[]>('/employees'),
      apiRequest<Customer[]>('/customers'),
    ]);
    if (pRes.success && pRes.data) setProjects(pRes.data);
    if (dRes.success && dRes.data) setDisciplines(dRes.data);
    if (eRes.success && eRes.data) setEmployees(eRes.data);
    if (cRes.success && cRes.data) setCustomers(cRes.data);
  };

  useEffect(() => {
    fetchMasters();
  }, []);

  useEffect(() => {
    fetchSurveys();
  }, [filterProject, filterDiscipline, filterStatus]);

  const openCreateModal = () => {
    setEditingSurvey(null);
    setEntryMode('system_entry');
    setFormData({
      survey_code: '',
      project_id: projects.length > 0 ? String(projects[0].project_id) : '',
      customer_id: projects.length > 0 && projects[0].customer_id ? String(projects[0].customer_id) : '',
      discipline_id: disciplines.length > 0 ? String(disciplines[0].discipline_id) : '',
      survey_date: new Date().toISOString().split('T')[0],
      conducted_by: user ? String(user.employee_id) : '',
      location_details: '',
      latitude: '',
      longitude: '',
      comments: '',
      remarks: '',
      wbs_id: '',
      site_conditions: '',
      measurements: '',
      labour_requirements: '',
      material_requirements: '',
      observations: '',
      report_number: '',
      period_from: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      period_to: new Date().toISOString().split('T')[0],
      prepared_by_name: user?.name ? `${user.name} (Senior Engineer)` : 'Kishan Khatke (Senior Engineer)',
      verified_by_name: 'Prashant Jadhav (Project Manager)',
      endorsed_by_name: 'Sagar Patil (AGM/GM)',
      document_number: 'PLN-03-F04',
      revision_number: 'R1',
      status: 'completed',
    });
    setPhotosList([]);
    setReportFile(null);
    setIsModalOpen(true);
  };

  const openEditModal = (s: SiteSurvey) => {
    setEditingSurvey(s);
    setEntryMode(s.entry_type || 'system_entry');
    setFormData({
      survey_code: s.survey_code || '',
      project_id: s.project_id ? String(s.project_id) : '',
      customer_id: s.customer_id ? String(s.customer_id) : '',
      discipline_id: s.discipline_id ? String(s.discipline_id) : '',
      survey_date: s.survey_date ? s.survey_date.split('T')[0] : new Date().toISOString().split('T')[0],
      conducted_by: s.conducted_by ? String(s.conducted_by) : (user ? String(user.employee_id) : ''),
      location_details: s.location_details || '',
      latitude: s.latitude ? String(s.latitude) : '',
      longitude: s.longitude ? String(s.longitude) : '',
      comments: s.comments || '',
      remarks: s.remarks || '',
      wbs_id: s.wbs_id ? String(s.wbs_id) : '',
      site_conditions: s.site_conditions || '',
      measurements: s.measurements || '',
      labour_requirements: s.labour_requirements || '',
      material_requirements: s.material_requirements || '',
      observations: s.observations || '',
      report_number: s.report_number || '',
      period_from: s.period_from ? s.period_from.split('T')[0] : '',
      period_to: s.period_to ? s.period_to.split('T')[0] : '',
      prepared_by_name: s.prepared_by_name || '',
      verified_by_name: s.verified_by_name || '',
      endorsed_by_name: s.endorsed_by_name || '',
      document_number: s.document_number || 'PLN-03-F04',
      revision_number: s.revision_number || 'R1',
      status: s.status || 'completed',
    });
    setPhotosList(s.photos?.map((p, idx) => ({
      file_base64: p.file_path ? `${API_BASE_URL.replace('/api/v1', '')}${p.file_path}` : (p.file_base64 || ''),
      photo_name: p.photo_name || '',
      caption: p.caption || '',
      display_order: p.display_order || (idx + 1),
    })) || []);
    setReportFile(null);
    setIsModalOpen(true);
  };

  const openEmailModal = (s: SiteSurvey) => {
    setEmailingSurvey(s);
    const cust = customers.find(c => c.customer_id === s.customer_id);
    const email = s.customer_email || cust?.email || (cust as any)?.contact_email || '';
    setEmailRecipient(email);
    const repNum = s.report_number || s.survey_code || `SRV-${s.survey_id}`;
    setEmailSubject(`Photographic Progress Report: ${s.project_name || 'Project'} (${repNum})`);
    setEmailMessage(`Dear ${s.customer_name || 'Valued Client'},\n\nPlease find attached the formal Site Photographic Progress Report (${s.document_number || 'PLN-03-F04'}) for ${s.project_name || 'the project'}.\n\nPeriod: ${s.period_from ? new Date(s.period_from).toLocaleDateString() : 'Recent'} to ${s.period_to ? new Date(s.period_to).toLocaleDateString() : new Date().toLocaleDateString()}\n\nBest regards,\nSite Project Management Team`);
    setIsEmailModalOpen(true);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailingSurvey) return;
    if (!emailRecipient) {
      showError('Please enter recipient email address.');
      return;
    }
    setIsSendingEmail(true);
    const res = await apiRequest<{ success: boolean; message: string }>(`/site-surveys/${emailingSurvey.survey_id}/send-email`, {
      method: 'POST',
      body: JSON.stringify({
        recipient_email: emailRecipient,
        subject: emailSubject,
        message: emailMessage,
      }),
    });
    setIsSendingEmail(false);
    if (res.success) {
      showSuccess(`Photographic report successfully sent to ${emailRecipient}`);
      setIsEmailModalOpen(false);
    } else {
      showError(res.message || 'Failed to dispatch photographic report email.');
    }
  };

  const openViewModal = async (s: SiteSurvey) => {
    const res = await apiRequest<SiteSurvey>(`/site-surveys/${s.survey_id}`);
    if (res.success && res.data) {
      setViewingSurvey(res.data);
    } else {
      setViewingSurvey(s);
    }
    setIsViewModalOpen(true);
  };

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      files.forEach((file, fIdx) => {
        const reader = new FileReader();
        reader.onload = () => {
          setPhotosList((prev) => [
            ...prev,
            {
              file_base64: reader.result as string,
              photo_name: file.name.replace(/\.[^/.]+$/, ''),
              caption: '',
              display_order: prev.length + fIdx + 1,
            },
          ]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePhoto = (index: number) => {
    const updated = [...photosList];
    updated.splice(index, 1);
    setPhotosList(updated);
  };

  const handleReportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setReportFile({
          base64: reader.result as string,
          name: file.name,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project_id) { showError('Please select a project.'); return; }
    if (!formData.survey_date) { showError('Survey date is required.'); return; }
    if (!formData.conducted_by) { showError('Please select the conducting inspector.'); return; }

    setIsSubmitting(true);
    const selectedProj = projects.find((p) => String(p.project_id) === formData.project_id);

    const payload = {
      ...formData,
      project_id: Number(formData.project_id),
      customer_id: selectedProj?.customer_id || (formData.customer_id ? Number(formData.customer_id) : null),
      discipline_id: formData.discipline_id ? Number(formData.discipline_id) : null,
      wbs_id: formData.wbs_id ? Number(formData.wbs_id) : null,
      conducted_by: Number(formData.conducted_by),
      latitude: formData.latitude ? Number(formData.latitude) : null,
      longitude: formData.longitude ? Number(formData.longitude) : null,
      entry_type: entryMode,
      photos: entryMode === 'system_entry' ? photosList : [],
      report_base64: entryMode === 'report_attachment' && reportFile ? reportFile.base64 : undefined,
      report_file_name: entryMode === 'report_attachment' && reportFile ? reportFile.name : undefined,
    };

    const endpoint = editingSurvey ? `/site-surveys/${editingSurvey.survey_id}` : '/site-surveys';
    const method = editingSurvey ? 'PUT' : 'POST';

    const res = await apiRequest<SiteSurvey>(endpoint, {
      method,
      body: JSON.stringify(payload),
    });

    setIsSubmitting(false);

    if (res.success) {
      showSuccess(editingSurvey ? 'Site survey updated successfully.' : 'Site survey recorded successfully.');
      setIsModalOpen(false);
      fetchSurveys();
    } else {
      showError(res.message || 'Failed to save site survey.');
    }
  };

  const handleDelete = (id: number, code: string) => {
    setDeletingSurvey({ id, code });
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingSurvey) return;
    setIsDeleting(true);
    const res = await apiRequest(`/site-surveys/${deletingSurvey.id}`, { method: 'DELETE' });
    setIsDeleting(false);

    if (res.success) {
      showSuccess('Site survey deleted successfully.');
      setIsDeleteModalOpen(false);
      fetchSurveys();
    } else {
      showError(res.message || 'Failed to delete site survey.');
    }
  };

  const apiUrl = API_BASE_URL;

  const getAuthToken = () => {
    return localStorage.getItem('access_token') || localStorage.getItem('token') || '';
  };

  const columns: Column<SiteSurvey>[] = [
    {
      header: 'Survey Code / Date',
      accessor: (r) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--accent-primary, #4f46e5)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <FileText size={15} /> {r.survey_code}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #475569)', marginTop: '0.15rem' }}>
            Date: {new Date(r.survey_date).toLocaleDateString()}
          </div>
        </div>
      ),
      csvAccessor: (r) => `${r.survey_code} (${r.survey_date ? new Date(r.survey_date).toLocaleDateString() : ''})`,
      sortKey: 'survey_code',
    },
    {
      header: 'Project & Client',
      accessor: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary, #0f172a)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <FolderKanban size={14} color="#6366f1" /> {r.project_name || 'N/A'}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary, #334155)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
            <Building2 size={13} color="#0284c7" /> {r.customer_name || 'N/A'}
          </div>
        </div>
      ),
      csvAccessor: (r) => `${r.project_name || 'N/A'} - ${r.customer_name || 'N/A'}`,
      sortKey: 'project_name',
    },
    {
      header: 'Discipline',
      accessor: (r) => (
        <Badge variant="info">
          <Layers size={12} style={{ marginRight: '4px' }} />
          {r.discipline_name || 'General Site'}
        </Badge>
      ),
      csvAccessor: (r) => r.discipline_name || 'General Site',
      sortKey: 'discipline_name',
    },
    {
      header: 'Entry Mode',
      accessor: (r) => (
        <Badge variant={r.entry_type === 'system_entry' ? 'success' : 'secondary'}>
          {r.entry_type === 'system_entry' ? `System Form (${r.photo_count || 0} pics)` : 'Attached Report PDF'}
        </Badge>
      ),
      csvAccessor: (r) => (r.entry_type === 'system_entry' ? `System Form (${r.photo_count || 0} pics)` : 'Attached Report PDF'),
      sortKey: 'entry_type',
    },
    {
      header: 'Inspector',
      accessor: (r) => (
        <div style={{ fontSize: '0.85rem', color: 'var(--text-primary, #0f172a)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <User size={13} color="#16a34a" /> {r.conducted_by_name || 'N/A'}
        </div>
      ),
      csvAccessor: (r) => r.conducted_by_name || 'N/A',
      sortKey: 'conducted_by_name',
    },
    {
      header: 'Status',
      accessor: (r) => (
        <Badge variant={r.status === 'verified' ? 'success' : r.status === 'rejected' ? 'danger' : 'warning'}>
          {r.status}
        </Badge>
      ),
      csvAccessor: (r) => r.status,
      sortKey: 'status',
    },
  ];

  return (
    <div>
      {/* Top Survey Tabs Navigation Removed */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Site Inspection & Surveys</h1>
          <p className="page-subtitle">Record site surveys, upload inspection photos, map disciplines, and attach reports</p>
        </div>
        {isAdminOrManager && (
          <Button variant="primary" onClick={openCreateModal}>
            <Plus size={18} /> New Site Survey
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ minWidth: '220px' }}>
          <FormSelect
            label="Filter by Project"
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            options={[
              { value: '', label: 'All Projects' },
              ...projects.map((p) => ({ value: String(p.project_id), label: `${p.project_name} (${p.project_code})` })),
            ]}
          />
        </div>
        <div style={{ minWidth: '180px' }}>
          <FormSelect
            label="Filter by Discipline"
            value={filterDiscipline}
            onChange={(e) => setFilterDiscipline(e.target.value)}
            options={[
              { value: '', label: 'All Disciplines' },
              ...disciplines.map((d) => ({ value: String(d.discipline_id), label: d.discipline_name })),
            ]}
          />
        </div>
        <div style={{ minWidth: '160px' }}>
          <FormSelect
            label="Filter by Status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'completed', label: 'Completed' },
              { value: 'verified', label: 'Verified' },
              { value: 'draft', label: 'Draft' },
            ]}
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card">
        <DataTable
          columns={columns}
          data={surveys}
          searchPlaceholder="Search surveys by code, project, client, discipline or inspector..."
          exportFilename="site_surveys"
          isLoading={isLoading}
          actions={(row) => (
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <Button variant="secondary" onClick={() => openViewModal(row)} style={{ padding: '0.35rem 0.65rem' }}>
                <Eye size={14} /> View Details
              </Button>
              <Button
                variant="secondary"
                onClick={() => openEmailModal(row)}
                style={{
                  padding: '0.35rem 0.65rem',
                  background: 'rgba(99, 102, 241, 0.1)',
                  color: '#6366f1',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
                title="Send photographic report directly to client email"
              >
                <Mail size={14} /> Email Report
              </Button>
              {row.entry_type === 'system_entry' ? (
                <a
                  href={`${apiUrl}/site-surveys/${row.survey_id}/pdf?token=${encodeURIComponent(getAuthToken())}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => {
                    const token = getAuthToken();
                    if (!token) {
                      e.preventDefault();
                      showError('Authentication token missing. Please log in again.');
                    }
                  }}
                  style={{
                    padding: '0.35rem 0.65rem',
                    background: 'rgba(56, 189, 248, 0.1)',
                    color: '#38bdf8',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    textDecoration: 'none',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <Download size={14} /> Formal PDF
                </a>
              ) : row.attached_report_path ? (
                <a
                  href={`${apiUrl.replace('/api/v1', '')}${row.attached_report_path}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: '0.35rem 0.65rem',
                    background: 'rgba(56, 189, 248, 0.1)',
                    color: '#38bdf8',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    textDecoration: 'none',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <FileText size={14} /> Attached PDF
                </a>
              ) : null}
              {isAdminOrManager && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => openEditModal(row)}
                    style={{ padding: '0.35rem 0.55rem', color: '#6366f1' }}
                    title="Edit survey and metadata"
                  >
                    <Edit size={14} />
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleDelete(row.survey_id, row.survey_code)}
                    style={{ padding: '0.35rem 0.55rem', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                    title="Delete survey"
                  >
                    <Trash2 size={14} />
                  </Button>
                </>
              )}
            </div>
          )}
        />
      </div>

      {/* Create Modal with Option 1 vs Option 2 Tabs */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSurvey ? `Edit Site Survey (${editingSurvey.survey_code})` : 'New Site Inspection & Survey'}
      >
        {/* Option Toggle */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setEntryMode('system_entry')}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              border: 'none',
              background: entryMode === 'system_entry' ? '#4f46e5' : 'transparent',
              color: entryMode === 'system_entry' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Camera size={16} /> Option 1: System Survey Entry & Site Pics
          </button>

          <button
            type="button"
            onClick={() => setEntryMode('report_attachment')}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              border: 'none',
              background: entryMode === 'report_attachment' ? '#4f46e5' : 'transparent',
              color: entryMode === 'report_attachment' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Upload size={16} /> Option 2: Upload Survey Report PDF
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ maxHeight: '72vh', overflowY: 'auto', paddingRight: '0.3rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormSelect
              label="Select Project"
              value={formData.project_id}
              onChange={(e) => {
                const pid = e.target.value;
                const proj = projects.find((p) => String(p.project_id) === pid);
                setFormData({
                  ...formData,
                  project_id: pid,
                  customer_id: proj && proj.customer_id ? String(proj.customer_id) : formData.customer_id,
                });
              }}
              options={[
                { value: '', label: '-- Select Project --' },
                ...projects.map((p) => ({ value: String(p.project_id), label: `${p.project_name} (${p.project_code})` })),
              ]}
              required
            />

            <FormSelect
              label="Mapped Discipline"
              value={formData.discipline_id}
              onChange={(e) => setFormData({ ...formData, discipline_id: e.target.value })}
              options={[
                { value: '', label: '-- Select Discipline --' },
                ...disciplines.map((d) => ({ value: String(d.discipline_id), label: `${d.discipline_name} (${d.discipline_code})` })),
              ]}
            />

            <FormInput
              label="Survey Date"
              type="date"
              value={formData.survey_date}
              onChange={(e) => setFormData({ ...formData, survey_date: e.target.value })}
              required
            />

            <FormSelect
              label="Conducting Inspector / Employee"
              value={formData.conducted_by}
              onChange={(e) => setFormData({ ...formData, conducted_by: e.target.value })}
              options={[
                { value: '', label: '-- Select Inspector --' },
                ...employees.map((emp) => ({ value: String(emp.employee_id), label: `${emp.name} (${emp.role_name})` })),
              ]}
              required
            />
          </div>

          {/* OPTION 1 DETAILS: Form Fields + Photos */}
          {entryMode === 'system_entry' && (
            <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <FormInput
                  label="Location Details"
                  placeholder="Specific zone, floor, or block..."
                  value={formData.location_details}
                  onChange={(e) => setFormData({ ...formData, location_details: e.target.value })}
                />
                <FormInput
                  label="GPS Latitude"
                  type="number"
                  placeholder="e.g. 25.2048"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                />
                <FormInput
                  label="GPS Longitude"
                  type="number"
                  placeholder="e.g. 55.2708"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                />
              </div>

              {/* Photo Upload Gallery Section */}
              <div style={{ background: 'rgba(99,102,241,0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.15)', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Image size={16} color="#6366f1" /> Attach Site Inspection Photos ({photosList.length})
                  </label>
                  <label style={{ background: '#4f46e5', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Plus size={14} /> Select Photos
                    <input type="file" accept="image/*" multiple onChange={handlePhotoAdd} style={{ display: 'none' }} />
                  </label>
                </div>

                {photosList.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
                    {photosList.map((p, idx) => (
                      <div key={idx} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
                        <img src={p.file_base64} alt={p.photo_name} style={{ width: '100%', height: '85px', objectFit: 'cover' }} />
                        <div style={{ padding: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          <input
                            type="text"
                            placeholder="Caption (e.g. Beam work)..."
                            value={p.caption}
                            onChange={(e) => {
                              const updated = [...photosList];
                              updated[idx].caption = e.target.value;
                              setPhotosList(updated);
                            }}
                            style={{ width: '100%', padding: '0.25rem 0.4rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                          />
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                            <span>Order #{idx + 1}</span>
                            <span style={{ fontSize: '0.68rem', color: '#6366f1', fontWeight: 600 }}>Box {idx + 1}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removePhoto(idx)}
                          style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* OPTION 2 DETAILS: PDF Report File */}
          {entryMode === 'report_attachment' && (
            <div style={{ marginTop: '1rem', background: 'rgba(56,189,248,0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(56,189,248,0.2)', marginBottom: '1rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>
                Upload Survey Report File (PDF / DOCX)
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleReportFileChange}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  borderRadius: '6px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                }}
              />
              {reportFile && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: '#38bdf8', fontWeight: 600 }}>
                  Selected Report: {reportFile.name}
                </div>
              )}
            </div>
          )}

          {/* Formal Photographic Report (PLN-03-F04) Metadata */}
          <div style={{ marginTop: '1.25rem', background: 'rgba(99, 102, 241, 0.04)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4f46e5', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileText size={16} /> Formal Photographic Report Metadata (PLN-03-F04 Reference)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <FormInput
                label="Report Number"
                placeholder="e.g. PL1348PR55"
                value={formData.report_number}
                onChange={(e) => setFormData({ ...formData, report_number: e.target.value })}
              />
              <FormInput
                label="Document Control No"
                placeholder="PLN-03-F04"
                value={formData.document_number}
                onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
              />
              <FormInput
                label="Revision Number"
                placeholder="R1"
                value={formData.revision_number}
                onChange={(e) => setFormData({ ...formData, revision_number: e.target.value })}
              />
              <FormInput
                label="Period From"
                type="date"
                value={formData.period_from}
                onChange={(e) => setFormData({ ...formData, period_from: e.target.value })}
              />
              <FormInput
                label="Period To"
                type="date"
                value={formData.period_to}
                onChange={(e) => setFormData({ ...formData, period_to: e.target.value })}
              />
            </div>

            <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Signatories (3-Tier Governance Box)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '0.35rem' }}>
              <FormInput
                label="Prepared By (Senior Engineer)"
                placeholder="e.g. Kishan Khatke (Senior Engineer)"
                value={formData.prepared_by_name}
                onChange={(e) => setFormData({ ...formData, prepared_by_name: e.target.value })}
              />
              <FormInput
                label="Checked By (Project Manager)"
                placeholder="e.g. Prashant Jadhav (Project Manager)"
                value={formData.verified_by_name}
                onChange={(e) => setFormData({ ...formData, verified_by_name: e.target.value })}
              />
              <FormInput
                label="Approved By (AGM / GM)"
                placeholder="e.g. Sagar Patil (AGM/GM)"
                value={formData.endorsed_by_name}
                onChange={(e) => setFormData({ ...formData, endorsed_by_name: e.target.value })}
              />
            </div>
          </div>

          {/* New Survey Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <FormInput
              label="Site Conditions"
              placeholder="Describe current site conditions..."
              value={formData.site_conditions}
              onChange={(e) => setFormData({ ...formData, site_conditions: e.target.value })}
            />
            <FormInput
              label="Measurements"
              placeholder="Record any measurements..."
              value={formData.measurements}
              onChange={(e) => setFormData({ ...formData, measurements: e.target.value })}
            />
            <FormInput
              label="Labour Requirements"
              placeholder="Describe required labour..."
              value={formData.labour_requirements}
              onChange={(e) => setFormData({ ...formData, labour_requirements: e.target.value })}
            />
            <FormInput
              label="Material Requirements"
              placeholder="Describe required materials..."
              value={formData.material_requirements}
              onChange={(e) => setFormData({ ...formData, material_requirements: e.target.value })}
            />
            <FormInput
              label="Observations"
              placeholder="Other observations..."
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
            />
            <FormInput
              label="Management Remarks"
              placeholder="Action items or remarks..."
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            />
          </div>


          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingSurvey ? 'Update Survey' : 'Save Site Survey'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Survey & Photo Gallery Modal */}
      {isViewModalOpen && viewingSurvey && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={`Site Survey Details (${viewingSurvey.survey_code})`}
        >
          <div style={{ maxHeight: '75vh', overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem', background: 'var(--border-color)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Project:</span>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{viewingSurvey.project_name} ({viewingSurvey.project_code})</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Client:</span>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{viewingSurvey.customer_name || 'N/A'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Survey Date:</span>
                <div style={{ color: 'var(--text-primary)' }}>{new Date(viewingSurvey.survey_date).toLocaleDateString()}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Inspector:</span>
                <div style={{ color: 'var(--text-primary)' }}>{viewingSurvey.conducted_by_name}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Discipline:</span>
                <div><Badge variant="info">{viewingSurvey.discipline_name || 'General'}</Badge></div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Status:</span>
                <div><Badge variant={viewingSurvey.status === 'verified' ? 'success' : 'warning'}>{viewingSurvey.status}</Badge></div>
              </div>
            </div>

            {viewingSurvey.comments && (
              <div style={{ marginBottom: '1rem', background: 'var(--border-color)', padding: '0.75rem', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Inspector Comments:</span>
                <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-primary)', fontSize: '0.85rem' }}>{viewingSurvey.comments}</p>
              </div>
            )}

            {/* Photo Gallery */}
            {viewingSurvey.photos && viewingSurvey.photos.length > 0 && (
              <div style={{ marginTop: '1.25rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Camera size={16} color="#6366f1" /> Inspection Photo Gallery ({viewingSurvey.photos.length})
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
                  {viewingSurvey.photos.map((p, i) => (
                    <div key={i} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
                      <a href={`${apiUrl.replace('/api/v1', '')}${p.file_path}`} target="_blank" rel="noreferrer">
                        <img src={`${apiUrl.replace('/api/v1', '')}${p.file_path}`} alt={p.photo_name || 'Photo'} style={{ width: '100%', height: '110px', objectFit: 'cover' }} />
                      </a>
                      {p.caption && <div style={{ fontSize: '0.75rem', padding: '0.3rem', color: 'var(--text-secondary, #475569)', textAlign: 'center' }}>{p.caption}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PLN-03-F04 Report Governance Summary */}
            <div style={{ marginTop: '1.25rem', padding: '0.85rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4f46e5', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <FileText size={15} /> Formal Photographic Report Details (PLN-03-F04)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem', fontSize: '0.8rem' }}>
                <div><strong>Report No:</strong> {viewingSurvey.report_number || viewingSurvey.survey_code}</div>
                <div><strong>Document Ref:</strong> {viewingSurvey.document_number || 'PLN-03-F04'} (Rev {viewingSurvey.revision_number || 'R1'})</div>
                <div><strong>Period:</strong> {viewingSurvey.period_from ? new Date(viewingSurvey.period_from).toLocaleDateString() : 'N/A'} - {viewingSurvey.period_to ? new Date(viewingSurvey.period_to).toLocaleDateString() : 'N/A'}</div>
                <div><strong>Prepared By:</strong> {viewingSurvey.prepared_by_name || 'Senior Engineer'}</div>
                <div><strong>Checked By:</strong> {viewingSurvey.verified_by_name || 'Project Manager'}</div>
                <div><strong>Approved By:</strong> {viewingSurvey.endorsed_by_name || 'AGM/GM'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button
                  variant="primary"
                  onClick={() => openEmailModal(viewingSurvey)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Mail size={15} /> Send Report via Email
                </Button>
                <a
                  href={`${apiUrl}/site-surveys/${viewingSurvey.survey_id}/pdf?token=${encodeURIComponent(getAuthToken())}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => {
                    const token = getAuthToken();
                    if (!token) {
                      e.preventDefault();
                      showError('Authentication token missing. Please log in again.');
                    }
                  }}
                  style={{
                    padding: '0.45rem 0.85rem',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#0284c7',
                    border: '1px solid rgba(2, 132, 199, 0.3)',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Download size={15} /> Download Formal PDF (PLN-03-F04)
                </a>
              </div>
              <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Standalone Photographic Report Email Dispatch Modal */}
      {isEmailModalOpen && emailingSurvey && (
        <Modal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          title={`Email Photographic Report: ${emailingSurvey.report_number || emailingSurvey.survey_code}`}
        >
          <form onSubmit={handleSendEmail} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '6px', border: '1px solid rgba(99, 102, 241, 0.2)', fontSize: '0.85rem' }}>
              <div><strong>Project:</strong> {emailingSurvey.project_name} ({emailingSurvey.project_code})</div>
              <div><strong>Client:</strong> {emailingSurvey.customer_name || 'N/A'}</div>
              <div><strong>Attached File:</strong> Photographic-Report-{emailingSurvey.report_number || emailingSurvey.survey_code}.pdf (Cover Page + {emailingSurvey.photos?.length || 0} Photos)</div>
            </div>

            <FormInput
              label="Recipient Email Address *"
              type="email"
              placeholder="e.g. client@24wallstreet.com"
              value={emailRecipient}
              onChange={(e) => setEmailRecipient(e.target.value)}
              required
            />

            <FormInput
              label="Email Subject *"
              placeholder="Email subject..."
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              required
            />

            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Cover Message / Progress Notes
              </label>
              <textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={5}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  fontFamily: 'inherit',
                  lineHeight: '1.5',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Button type="button" variant="secondary" onClick={() => setIsEmailModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSendingEmail} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Send size={15} /> {isSendingEmail ? 'Dispatching Email...' : 'Send Report via Email'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        recordName={deletingSurvey?.code || 'this site survey'}
        isLoading={isDeleting}
      />
    </div>
  );
};
