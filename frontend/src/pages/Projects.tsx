import React, { useEffect, useState } from 'react';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { apiRequest } from '../services/api';
import { Project } from '../types';
import { Plus, Edit, Trash2, MapPin, RefreshCw } from 'lucide-react';
import { RequirePermission } from '../components/common/RequirePermission';

import { ConfirmDeleteModal } from '../components/common/ConfirmDeleteModal';
import { showSuccess, showError } from '../utils/toast';
import { useAuth } from '../context/AuthContext';

export const Projects: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const isAdmin = user?.role_name === 'Admin';

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Status Modal State
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusUpdatingProject, setStatusUpdatingProject] = useState<Project | null>(null);
  const [newStatus, setNewStatus] = useState<'active' | 'inactive' | 'completed' | 'cancelled'>('active');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<{ id: number, name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProjects = async () => {
    setIsLoading(true);
    const res = await apiRequest<Project[]>('/projects');
    if (res.success && res.data) {
      setProjects(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const openCreateModal = () => {
    onNavigate('projects/create');
  };

  const openEditModal = (prj: Project) => {
    onNavigate(`projects/edit/${prj.project_id}`);
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
      
      // Update just the affected row to avoid full reload
      setProjects(prev => prev.map(p => 
        p.project_id === statusUpdatingProject.project_id 
          ? { ...p, status: newStatus } 
          : p
      ));
    } else {
      showError(res.message || 'Unable to update project status.');
    }
  };

  const columns: Column<Project>[] = [
    { header: 'Code', accessor: 'project_code', sortKey: 'project_code' },
    { header: 'Project Name', accessor: 'project_name', sortKey: 'project_name' },
    { header: 'Client Name', accessor: (r) => r.client_name || '-', sortKey: 'client_name' },
    {
      header: 'GPS Location',
      accessor: (r) =>
        r.latitude && r.longitude ? (
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <MapPin size={14} color="#06b6d4" />
            {Number(r.latitude).toFixed(4)}, {Number(r.longitude).toFixed(4)} ({r.radius_meters}m)
          </span>
        ) : (
          <span style={{ color: '#64748b', fontSize: '0.8rem' }}>No GPS set</span>
        ),
      csvAccessor: (r) => r.latitude && r.longitude ? `${r.latitude}, ${r.longitude} (${r.radius_meters}m)` : 'No GPS set',
      sortKey: 'latitude'
    },
    {
      header: 'Progress',
      accessor: (r) => (
        <div style={{ width: '120px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
            <span>{r.progress_percentage}%</span>
            <span style={{ color: '#94a3b8' }}>{r.completed_task_count}/{r.task_count} tasks</span>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${r.progress_percentage}%`, height: '100%', background: '#6366f1' }} />
          </div>
        </div>
      ),
      csvAccessor: (r) => `${r.progress_percentage}% (${r.completed_task_count}/${r.task_count} tasks)`,
      sortKey: 'progress_percentage'
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
      csvAccessor: (r) => r.status.charAt(0).toUpperCase() + r.status.slice(1),
      sortKey: 'status'
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Project Management</h1>
          <p className="page-subtitle">Define client projects, site GPS boundaries, and track real-time task progress</p>
        </div>
        <Button variant="primary" onClick={openCreateModal}>
          <Plus size={18} /> Add Project
        </Button>
      </div>

        <div className="glass-card">
          <DataTable
            columns={columns}
            data={projects}
            searchPlaceholder="Search projects by name, code, or client..."
            exportFilename="projects"
            isLoading={isLoading}
            actions={isAdmin ? (row) => (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Button variant="secondary" onClick={() => openEditModal(row)} style={{ padding: '0.35rem 0.65rem' }}>
                  <Edit size={14} /> Edit
                </Button>
                <Button variant="secondary" onClick={() => openStatusModal(row)} style={{ padding: '0.35rem 0.65rem' }}>
                  <RefreshCw size={14} /> Status
                </Button>
                <Button variant="secondary" onClick={() => handleDelete(row.project_id, row.project_name)} style={{ padding: '0.35rem 0.65rem', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  <Trash2 size={14} /> Delete
                </Button>
              </div>
            ) : undefined}
          />
        </div>

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
              <div><Badge variant={statusUpdatingProject.status === 'active' ? 'success' : statusUpdatingProject.status === 'completed' ? 'info' : statusUpdatingProject.status === 'cancelled' ? 'danger' : 'warning'}>{statusUpdatingProject.status}</Badge></div>
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
