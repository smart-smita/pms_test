import React, { useEffect, useState } from 'react';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { apiRequest } from '../services/api';
import { Project, Customer, Country, ProjectType } from '../types';
import { Plus, Edit, Trash2, MapPin, RefreshCw, Eye, FolderKanban, Building2, Globe, Layers, IndianRupee } from 'lucide-react';
import { RequirePermission } from '../components/common/RequirePermission';
import { ConfirmDeleteModal } from '../components/common/ConfirmDeleteModal';
import { Project360Modal } from '../components/projects/Project360Modal';
import { showSuccess, showError } from '../utils/toast';
import { useAuth } from '../context/AuthContext';

export const Projects: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const isAdminOrManager = user?.role_name === 'Admin' || user?.role_name === 'Super Admin' || user?.role_name === 'Manager';

  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // 360 Workspace Modal
  const [is360ModalOpen, setIs360ModalOpen] = useState(false);
  const [selected360ProjectId, setSelected360ProjectId] = useState<number | null>(null);

  // Status Modal State
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusUpdatingProject, setStatusUpdatingProject] = useState<Project | null>(null);
  const [newStatus, setNewStatus] = useState<'active' | 'inactive' | 'completed' | 'cancelled'>('active');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<{ id: number; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProjects = async () => {
    setIsLoading(true);
    let url = '/projects';
    const query: string[] = [];
    if (filterStatus) query.push(`status=${filterStatus}`);
    if (query.length > 0) url += `?${query.join('&')}`;

    const res = await apiRequest<Project[]>(url);
    if (res.success && res.data) {
      setProjects(res.data);
    }
    setIsLoading(false);
  };

  const fetchMasters = async () => {
    const [cRes, coRes, ptRes] = await Promise.all([
      apiRequest<Customer[]>('/customers'),
      apiRequest<Country[]>('/masters/countries'),
      apiRequest<ProjectType[]>('/masters/project-types'),
    ]);
    if (cRes.success && cRes.data) setCustomers(cRes.data);
    if (coRes.success && coRes.data) setCountries(coRes.data);
    if (ptRes.success && ptRes.data) setProjectTypes(ptRes.data);
  };

  useEffect(() => {
    fetchMasters();
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [filterStatus]);

  // Client-side filtered list for Customer, Type, Country
  const filteredProjects = projects.filter((p: any) => {
    if (filterCustomer && String(p.customer_id) !== filterCustomer) return false;
    if (filterType && String(p.project_type_id) !== filterType) return false;
    if (filterCountry && String(p.country_id) !== filterCountry) return false;
    return true;
  });

  // Calculate dynamic metric summaries
  const activeProjectsCount = filteredProjects.filter((p) => p.status === 'active').length;
  const totalBudgetValue = filteredProjects.reduce((sum, p: any) => sum + Number(p.budget_amount || 0), 0);
  const avgProgressPct = filteredProjects.length > 0
    ? Math.round(filteredProjects.reduce((sum, p) => sum + Number(p.progress_percentage || 0), 0) / filteredProjects.length)
    : 0;

  const openCreateModal = () => {
    onNavigate('projects/create');
  };

  const openEditModal = (prj: Project) => {
    onNavigate(`projects/edit/${prj.project_id}`);
  };

  const open360Modal = (projectId: number) => {
    setSelected360ProjectId(projectId);
    setIs360ModalOpen(true);
  };

  const handleDelete = (id: number, name: string) => {
    setDeletingProject({ id, name });
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingProject) return;
    setIsDeleting(true);
    const res = await apiRequest(`/projects/${deletingProject.id}`, { method: 'DELETE' });
    setIsDeleting(false);

    if (res.success) {
      showSuccess('Project deleted successfully.');
      setIsDeleteModalOpen(false);
      fetchProjects();
    } else {
      showError(res.message || 'Failed to delete project.');
    }
  };

  const openStatusModal = (prj: Project) => {
    setStatusUpdatingProject(prj);
    setNewStatus(prj.status);
    setIsStatusModalOpen(true);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusUpdatingProject) return;

    setIsUpdatingStatus(true);
    const res = await apiRequest(`/projects/${statusUpdatingProject.project_id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });

    setIsUpdatingStatus(false);

    if (res.success) {
      showSuccess('Project status updated successfully.');
      setIsStatusModalOpen(false);
      fetchProjects();
    } else {
      showError(res.message || 'Unable to update project status.');
    }
  };

  const columns: Column<Project>[] = [
    {
      header: 'Code / Type',
      accessor: (r: any) => (
        <div>
          <div style={{ fontWeight: 700, color: '#818cf8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <FolderKanban size={15} /> {r.project_code}
          </div>
          {r.project_type_name && (
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.1rem' }}>
              {r.project_type_name}
            </div>
          )}
        </div>
      ),
      sortKey: 'project_code',
    },
    {
      header: 'Project Name & Client',
      accessor: (r: any) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
            {r.project_name}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.1rem' }}>
            <Building2 size={12} color="#6366f1" /> {r.customer_name || r.client_name || 'N/A'}
          </div>
        </div>
      ),
      sortKey: 'project_name',
    },
    {
      header: 'Location',
      accessor: (r: any) => (
        <div style={{ fontSize: '0.82rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 500 }}>
            <Globe size={13} color="#38bdf8" /> {r.country_name || 'Global'}
          </div>
          {r.community_name && (
            <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
              {r.community_name}
            </div>
          )}
        </div>
      ),
      sortKey: 'country_name',
    },
    {
      header: 'Budget Amount',
      accessor: (r: any) => (
        <div style={{ fontWeight: 700, color: '#4ade80', fontSize: '0.9rem' }}>
          ₹ {Number(r.budget_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
        </div>
      ),
      sortKey: 'budget_amount',
    },
    {
      header: 'Progress',
      accessor: (r) => (
        <div style={{ width: '120px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
            <span>{r.progress_percentage}%</span>
            <span style={{ color: '#94a3b8' }}>{r.completed_task_count}/{r.task_count} Tasks</span>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${r.progress_percentage}%`, height: '100%', background: '#6366f1' }} />
          </div>
        </div>
      ),
      sortKey: 'progress_percentage',
    },
    {
      header: 'Status',
      accessor: (r) => (
        <Badge
          variant={
            r.status === 'active'
              ? 'success'
              : r.status === 'completed'
              ? 'info'
              : r.status === 'cancelled'
              ? 'danger'
              : 'warning'
          }
        >
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
          <h1 className="page-title">Active Projects Explorer</h1>
          <p className="page-subtitle">Directory of active client projects, site geofences, scope of work & 360° financials</p>
        </div>
        {isAdminOrManager && (
          <Button variant="primary" onClick={openCreateModal}>
            <Plus size={18} /> Add Project
          </Button>
        )}
      </div>

      {/* Metric Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(99,102,241,0.12)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FolderKanban size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Active Projects</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>{activeProjectsCount}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(74,222,128,0.12)', color: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IndianRupee size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Contract Value</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#4ade80' }}>
              ₹ {totalBudgetValue.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(56,189,248,0.12)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Avg Progress</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#38bdf8' }}>{avgProgressPct}%</div>
          </div>
        </div>
      </div>

      {/* Multi-Attribute Filter Bar */}
      <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'center' }}>
        <FormSelect
          label="Customer / Client"
          value={filterCustomer}
          onChange={(e) => setFilterCustomer(e.target.value)}
          options={[
            { value: '', label: 'All Customers' },
            ...customers.map((c) => ({ value: String(c.customer_id), label: c.customer_name })),
          ]}
        />

        <FormSelect
          label="Project Type"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          options={[
            { value: '', label: 'All Project Types' },
            ...projectTypes.map((pt) => ({ value: String(pt.type_id), label: pt.type_name })),
          ]}
        />

        <FormSelect
          label="Country / Region"
          value={filterCountry}
          onChange={(e) => setFilterCountry(e.target.value)}
          options={[
            { value: '', label: 'All Countries' },
            ...countries.map((co) => ({ value: String(co.country_id), label: co.country_name })),
          ]}
        />

        <FormSelect
          label="Status"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'active', label: 'Active' },
            { value: 'completed', label: 'Completed' },
            { value: 'on-hold', label: 'On Hold' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
        />
      </div>

      {/* Projects Data Table */}
      <div className="glass-card">
        <DataTable
          columns={columns}
          data={filteredProjects}
          searchPlaceholder="Search projects by name, code, client, or location..."
          exportFilename="active_projects"
          isLoading={isLoading}
          actions={(row) => (
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <Button
                variant="secondary"
                onClick={() => open360Modal(row.project_id)}
                style={{ padding: '0.35rem 0.65rem', background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}
                title="View Scope, Disciplines, Invoices & Payments 360°"
              >
                <Eye size={14} /> 360° View
              </Button>
              {isAdminOrManager && (
                <>
                  <Button variant="secondary" onClick={() => openEditModal(row)} style={{ padding: '0.35rem 0.65rem' }}>
                    <Edit size={14} /> Edit
                  </Button>
                  <Button variant="secondary" onClick={() => openStatusModal(row)} style={{ padding: '0.35rem 0.65rem' }}>
                    <RefreshCw size={14} /> Status
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleDelete(row.project_id, row.project_name)}
                    style={{ padding: '0.35rem 0.65rem', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                  >
                    <Trash2 size={14} />
                  </Button>
                </>
              )}
            </div>
          )}
        />
      </div>

      {/* 360 Workspace Modal */}
      <Project360Modal
        isOpen={is360ModalOpen}
        onClose={() => setIs360ModalOpen(false)}
        projectId={selected360ProjectId}
      />

      {/* Project Status Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Change Project Status"
      >
        {statusUpdatingProject && (
          <form onSubmit={handleUpdateStatus}>
            <div style={{ marginBottom: '1.5rem', background: 'rgba(99, 102, 241, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Project</div>
              <div style={{ fontWeight: 600 }}>{statusUpdatingProject.project_name}</div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.5rem' }}>Current Status</div>
              <div>
                <Badge variant={statusUpdatingProject.status === 'active' ? 'success' : statusUpdatingProject.status === 'completed' ? 'info' : statusUpdatingProject.status === 'cancelled' ? 'danger' : 'warning'}>
                  {statusUpdatingProject.status}
                </Badge>
              </div>
            </div>

            <FormSelect
              label="Select New Status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as any)}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
              required
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <Button type="button" variant="secondary" onClick={() => setIsStatusModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isUpdatingStatus || newStatus === statusUpdatingProject.status}>
                {isUpdatingStatus ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        recordName={deletingProject?.name || 'this project'}
        isLoading={isDeleting}
      />
    </div>
  );
};
