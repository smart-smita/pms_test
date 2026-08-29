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
import { Plus, Edit, Trash2, MapPin } from 'lucide-react';
import { RequirePermission } from '../components/common/RequirePermission';

import { ProjectForm } from './ProjectForm';
export const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form State
  const [projectCode, setProjectCode] = useState('');
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [radiusMeters, setRadiusMeters] = useState<number>(500);
  const [status, setStatus] = useState<'active' | 'inactive' | 'completed' | 'cancelled'>('active');
  const [error, setError] = useState<string | null>(null);

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
    setEditingProject(null);
    setProjectCode(`PRJ-2026-${Math.floor(10 + Math.random() * 90)}`);
    setProjectName('');
    setClientName('');
    setLatitude('');
    setLongitude('');
    setRadiusMeters(500);
    setStatus('active');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (prj: Project) => {
    setEditingProject(prj);
    setProjectCode(prj.project_code);
    setProjectName(prj.project_name);
    setClientName(prj.client_name || '');
    setLatitude(prj.latitude !== undefined && prj.latitude !== null ? String(prj.latitude) : '');
    setLongitude(prj.longitude !== undefined && prj.longitude !== null ? String(prj.longitude) : '');
    setRadiusMeters(prj.radius_meters || 500);
    setStatus(prj.status);
    setError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      const res = await apiRequest(`/projects/${id}`, { method: 'DELETE' });
      if (res.success) fetchProjects();
      else alert(res.message || 'Failed to delete project');
    }
  };

  const columns: Column<Project>[] = [
    { header: 'Code', accessor: 'project_code' },
    { header: 'Project Name', accessor: 'project_name' },
    { header: 'Client Name', accessor: (r) => r.client_name || '-' },
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
    },
  ];

  if (isModalOpen) {
    return (
      <ProjectForm 
        project={editingProject} 
        onBack={() => setIsModalOpen(false)} 
        onSuccess={() => {
          setIsModalOpen(false);
          fetchProjects();
        }} 
      />
    );
  }

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

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="glass-card">
          <DataTable
            columns={columns}
            data={projects}
            searchPlaceholder="Search projects by name, code, or client..."
            exportFilename="projects_list.csv"
            actions={(row) => (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <RequirePermission module="projects" action="update">
                  <Button variant="secondary" onClick={() => openEditModal(row)} style={{ padding: '0.35rem 0.65rem' }}>
                    <Edit size={14} /> Edit
                  </Button>
                </RequirePermission>
                <RequirePermission module="projects" action="delete">
                  <Button variant="secondary" onClick={() => handleDelete(row.project_id)} style={{ padding: '0.35rem 0.65rem', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    <Trash2 size={14} /> Delete
                  </Button>
                </RequirePermission>
              </div>
            )}
          />
        </div>
      )}
    </div>
  );
};
