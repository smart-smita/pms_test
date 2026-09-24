import React, { useEffect, useState } from 'react';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';
import { apiRequest } from '../services/api';
import { SiteSurvey, Project, Discipline, Employee, Customer, SiteSurveyPhoto } from '../types';
import { Plus, Edit, Trash2, Camera, FileText, CheckCircle2, Building2, FolderKanban, MapPin, Eye, Upload, Image, Layers, User, Download } from 'lucide-react';
import { ConfirmDeleteModal } from '../components/common/ConfirmDeleteModal';
import { showSuccess, showError } from '../utils/toast';
import { useAuth } from '../context/AuthContext';

export const SiteSurveys: React.FC = () => {
  const { user } = useAuth();
  const isAdminOrManager = user?.role_name === 'Admin' || user?.role_name === 'Super Admin' || user?.role_name === 'Manager';

  const [surveys, setSurveys] = useState<SiteSurvey[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filterProject, setFilterProject] = useState('');
  const [filterDiscipline, setFilterDiscipline] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

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
    status: 'completed' as 'draft' | 'completed' | 'verified' | 'rejected',
  });

  // Photo uploads (Option 1)
  const [photosList, setPhotosList] = useState<{ file_base64: string; photo_name: string; caption: string }[]>([]);

  // Attached Report File (Option 2)
  const [reportFile, setReportFile] = useState<{ base64: string; name: string } | null>(null);

  // Survey Detail / Photo Gallery Modal
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingSurvey, setViewingSurvey] = useState<SiteSurvey | null>(null);

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
      status: 'completed',
    });
    setPhotosList([]);
    setReportFile(null);
    setIsModalOpen(true);
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
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          setPhotosList((prev) => [
            ...prev,
            {
              file_base64: reader.result as string,
              photo_name: file.name.replace(/\.[^/.]+$/, ''),
              caption: '',
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

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

  const columns: Column<SiteSurvey>[] = [
    {
      header: 'Survey Code / Date',
      accessor: (r) => (
        <div>
          <div style={{ fontWeight: 700, color: '#818cf8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <FileText size={15} /> {r.survey_code}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            Date: {new Date(r.survey_date).toLocaleDateString()}
          </div>
        </div>
      ),
      sortKey: 'survey_code',
    },
    {
      header: 'Project & Client',
      accessor: (r) => (
        <div>
          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <FolderKanban size={14} color="#6366f1" /> {r.project_name || 'N/A'}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Building2 size={13} color="#38bdf8" /> {r.customer_name || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      header: 'Discipline',
      accessor: (r) => (
        <Badge variant="info">
          <Layers size={12} style={{ marginRight: '4px' }} />
          {r.discipline_name || 'General Site'}
        </Badge>
      ),
    },
    {
      header: 'Entry Mode',
      accessor: (r) => (
        <Badge variant={r.entry_type === 'system_entry' ? 'success' : 'secondary'}>
          {r.entry_type === 'system_entry' ? `System Form (${r.photo_count || 0} pics)` : 'Attached Report PDF'}
        </Badge>
      ),
    },
    {
      header: 'Inspector',
      accessor: (r) => (
        <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <User size={13} color="#4ade80" /> {r.conducted_by_name || 'N/A'}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (r) => (
        <Badge variant={r.status === 'verified' ? 'success' : r.status === 'rejected' ? 'danger' : 'warning'}>
          {r.status}
        </Badge>
      ),
      sortKey: 'status',
    },
  ];

  return (
    <div>
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
              {row.entry_type === 'system_entry' ? (
                <a
                  href={`${apiUrl}/site-surveys/${row.survey_id}/pdf`}
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
                  <Download size={14} /> PDF Report
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
                <Button
                  variant="secondary"
                  onClick={() => handleDelete(row.survey_id, row.survey_code)}
                  style={{ padding: '0.35rem 0.65rem', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                >
                  <Trash2 size={14} />
                </Button>
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
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem' }}>
                    {photosList.map((p, idx) => (
                      <div key={idx} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
                        <img src={p.file_base64} alt={p.photo_name} style={{ width: '100%', height: '80px', objectFit: 'cover' }} />
                        <div style={{ padding: '0.3rem' }}>
                          <FormInput
                            label=""
                            placeholder="Caption..."
                            value={p.caption}
                            onChange={(e) => {
                              const updated = [...photosList];
                              updated[idx].caption = e.target.value;
                              setPhotosList(updated);
                            }}
                          />
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

          {/* Comments & Remarks */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <FormInput
              label="Inspector Comments"
              placeholder="Site observations & findings..."
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
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
              <div style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px' }}>
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
                      {p.caption && <div style={{ fontSize: '0.75rem', padding: '0.3rem', color: '#cbd5e1', textAlign: 'center' }}>{p.caption}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
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
