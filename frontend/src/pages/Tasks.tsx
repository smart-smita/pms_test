import React, { useEffect, useState } from 'react';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { apiRequest, parseApiErrors } from '../services/api';
import { Task, Project, Employee } from '../types';
import { showSuccess, showError } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { ConfirmDeleteModal } from '../components/common/ConfirmDeleteModal';
import { RequirePermission } from '../components/common/RequirePermission';

export const Tasks: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role_name === 'Admin';

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectWbs, setProjectWbs] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [labours, setLabours] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingTask, setDeletingTask] = useState<{ id: number, name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [projectId, setProjectId] = useState<number>(0);
  const [wbsId, setWbsId] = useState<number>(0);
  const [assignedEmployeeIds, setAssignedEmployeeIds] = useState<number[]>([]);
  const [assignedLabourIds, setAssignedLabourIds] = useState<number[]>([]);
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [workerCount, setWorkerCount] = useState<number | string>(1);
  const [workingHours, setWorkingHours] = useState<number | string>(0);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [targetTime, setTargetTime] = useState('');
  
  // Status State
  const [status, setStatus] = useState<'pending' | 'in-progress' | 'completed' | 'delayed' | 'on-hold' | 'cancelled'>('pending');
  const [statusUpdatingId, setStatusUpdatingId] = useState<number>(0);
  
  // Errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    const promises: Promise<any>[] = [
      apiRequest<Task[]>('/tasks'),
      apiRequest<Project[]>('/projects'),
      apiRequest<Employee[]>('/employees'),
      apiRequest<any[]>('/labours'),
    ];

    const [tRes, pRes, eRes, lRes] = await Promise.all(promises);

    if (tRes.success && tRes.data) setTasks(tRes.data);
    if (pRes?.success && pRes.data) setProjects(pRes.data);
    if (eRes?.success && eRes.data) setEmployees(eRes.data.filter((e: Employee) => e.status === 'active'));
    if (lRes?.success && lRes.data) setLabours(lRes.data);

    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (projectId) {
      apiRequest<any[]>(`/projects/${projectId}/wbs`).then(res => {
        if (res.success && res.data) {
          setProjectWbs(res.data);
          if (!wbsId && res.data.length > 0) {
            setWbsId(res.data[0].id);
          }
        } else {
          setProjectWbs([]);
        }
      });
    } else {
      setProjectWbs([]);
    }
  }, [projectId]);

  const openCreateModal = () => {
    setEditingTask(null);
    setProjectId(projects[0]?.project_id || 0);
    setWbsId(0);
    setAssignedEmployeeIds(user?.employee_id ? [user.employee_id] : []);
    setAssignedLabourIds([]);
    setTaskName('');
    setDescription('');
    setWorkerCount(1);
    setWorkingHours(8);
    setStartDate(new Date().toISOString().split('T')[0]);
    setStartTime('09:00');
    setTargetDate(new Date().toISOString().split('T')[0]);
    setTargetTime('18:00');
    setStatus('pending');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (t: Task) => {
    setEditingTask(t);
    setProjectId(t.project_id);
    setWbsId(t.wbs_id || 0);
    setAssignedEmployeeIds(t.assigned_employees ? t.assigned_employees.map(e => e.employee_id) : []);
    setAssignedLabourIds(t.assigned_labours ? t.assigned_labours.map(l => l.labour_id) : []);
    setTaskName(t.task_name);
    setDescription(t.description || '');
    setWorkerCount(t.required_worker_count);
    setWorkingHours(Number(t.estimated_hours));
    setStartDate(t.start_date ? t.start_date.split('T')[0] : '');
    setStartTime(t.start_time || '');
    setTargetDate(t.target_date ? t.target_date.split('T')[0] : '');
    setTargetTime(t.target_time || '');
    setStatus(t.status as any);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openStatusModal = (t: Task) => {
    setEditingTask(t);
    setStatusUpdatingId(t.task_id);
    setStatus(t.status as any);
    setIsStatusModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    
    // Manual frontend date/time validation
    if (startDate && targetDate) {
      const startDateTime = new Date(`${startDate}T${startTime || '00:00:00'}`);
      const endDateTime = new Date(`${targetDate}T${targetTime || '23:59:59'}`);
      if (endDateTime < startDateTime) {
        setFormErrors({ target_date: 'End date/time cannot be earlier than start date/time.' });
        return;
      }
    }

    if (!projectId || !wbsId) {
      setFormErrors({ project_id: !projectId ? 'Required' : '', wbs_id: !wbsId ? 'Required' : '' });
      return;
    }
    
    if (assignedEmployeeIds.length === 0 && assignedLabourIds.length === 0) {
      setFormErrors({ assigned_employee_ids: 'Please select at least one employee or labourer.' });
      return;
    }

    setIsSubmitting(true);
    const payload: any = {
      project_id: projectId,
      wbs_id: wbsId,
      task_name: taskName,
      description,
      required_worker_count: typeof workerCount === 'string' ? (parseInt(workerCount, 10) || 1) : workerCount,
      estimated_hours: typeof workingHours === 'string' ? (parseFloat(workingHours) || 0) : workingHours,
      start_date: startDate || undefined,
      start_time: startTime || undefined,
      target_date: targetDate || undefined,
      target_time: targetTime || undefined,
      assigned_employee_ids: assignedEmployeeIds,
      assigned_labour_ids: assignedLabourIds
    };

    if (editingTask) {
      const res = await apiRequest(`/tasks/${editingTask.task_id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (res.success) {
        showSuccess('Task updated successfully.');
        setIsModalOpen(false);
        fetchData();
      } else {
        if (res.errors) setFormErrors(parseApiErrors(res.errors));
        showError(res.message || 'Failed to update task.');
      }
    } else {
      const res = await apiRequest('/tasks', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.success) {
        showSuccess('Task created successfully.');
        setIsModalOpen(false);
        fetchData();
      } else {
        if (res.errors) setFormErrors(parseApiErrors(res.errors));
        showError(res.message || 'Failed to create task.');
      }
    }
    setIsSubmitting(false);
  };

  const handleDelete = (id: number, name: string) => {
    setDeletingTask({ id, name });
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingTask) return;
    setIsDeleting(true);
    const res = await apiRequest(`/tasks/${deletingTask.id}`, { method: 'DELETE' });
    setIsDeleting(false);
    if (res.success) {
      showSuccess('Task deleted successfully.');
      setIsDeleteModalOpen(false);
      fetchData();
    } else {
      showError(res.message || 'Failed to delete task.');
    }
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusUpdatingId) return;
    
    setIsSubmitting(true);
    const res = await apiRequest(`/tasks/${statusUpdatingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });

    if (res.success) {
      showSuccess('Task status updated successfully.');
      setIsStatusModalOpen(false);
      fetchData();
    } else {
      showError(res.message || 'Failed to update task status.');
    }
    setIsSubmitting(false);
  };

  const formatDateTime = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr).toLocaleDateString();
    if (timeStr) return `${d} ${timeStr}`;
    return d;
  };

  const columns: Column<Task>[] = [
    { header: 'Project', accessor: (r) => r.project_name || '-', sortKey: 'project_name' },
    { header: 'WBS / Discipline', accessor: (r) => r.wbs_name || '-', sortKey: 'wbs_name' },
    { header: 'Task Name', accessor: 'task_name', sortKey: 'task_name' },
    ...(isAdmin ? [{ 
      header: 'Employee Name', 
      accessor: (r: Task) => (
        <span style={{ fontWeight: 500 }}>
          {r.assigned_employees && r.assigned_employees.length > 0 
            ? r.assigned_employees.map(e => e.name).join(', ') 
            : <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
          }
        </span>
      ),
      csvAccessor: (r: Task) => r.assigned_employees?.map(e => e.name).join(', ') || 'Unassigned',
      sortKey: (r: Task) => r.assigned_employees?.map(e => e.name).join(', ') || ''
    }] : []),
    ...(isAdmin ? [{ 
      header: 'Assigned Labours', 
      accessor: (r: Task) => (
        <span style={{ fontWeight: 500 }}>
          {r.assigned_labours && r.assigned_labours.length > 0 
            ? r.assigned_labours.map(l => l.name).join(', ') 
            : <span style={{ color: 'var(--text-muted)' }}>-</span>
          }
        </span>
      ),
      csvAccessor: (r: Task) => r.assigned_labours?.map(l => l.name).join(', ') || '-',
      sortKey: (r: Task) => r.assigned_labours?.map(l => l.name).join(', ') || ''
    }] : []),
    { header: 'Worker Count', accessor: 'required_worker_count', sortKey: 'required_worker_count' },
    { 
      header: 'Working Hours', 
      accessor: (r) => `${r.estimated_hours}h`,
      csvAccessor: (r) => `${r.estimated_hours}h`,
      sortKey: 'estimated_hours'
    },
    { 
      header: 'Start Date & Time', 
      accessor: (r) => formatDateTime(r.start_date, r.start_time),
      csvAccessor: (r) => formatDateTime(r.start_date, r.start_time),
      sortKey: (r) => `${r.start_date || ''} ${r.start_time || ''}`
    },
    { 
      header: 'End Date & Time', 
      accessor: (r) => formatDateTime(r.target_date, r.target_time),
      csvAccessor: (r) => formatDateTime(r.target_date, r.target_time),
      sortKey: (r) => `${r.target_date || ''} ${r.target_time || ''}`
    },
    {
      header: 'Status',
      accessor: (r) => (
        <Badge
          variant={
            r.status === 'completed' ? 'success' : 
            r.status === 'in-progress' ? 'info' : 
            r.status === 'delayed' ? 'danger' : 
            r.status === 'cancelled' ? 'danger' :
            'warning'
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
          <h1 className="page-title">{!isAdmin ? 'My Tasks' : 'Task Management'}</h1>
          <p className="page-subtitle">{!isAdmin ? 'View your assigned tasks and working schedules' : 'Manage tasks, assign responsible employees, and define required labor counts'}</p>
        </div>
        <Button variant="primary" onClick={openCreateModal}>
          <Plus size={18} /> Create Task
        </Button>
      </div>

        <div className="glass-card">
          <DataTable
            columns={columns}
            data={tasks}
            searchPlaceholder="Search tasks by name or project..."
            exportFilename="tasks"
            isLoading={isLoading}
            actions={(row) => (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {isAdmin && (
                  <Button variant="secondary" onClick={() => openEditModal(row)} style={{ padding: '0.35rem 0.65rem' }}>
                    <Edit size={14} /> Edit
                  </Button>
                )}
                <Button variant="secondary" onClick={() => openStatusModal(row)} style={{ padding: '0.35rem 0.65rem' }}>
                  <RefreshCw size={14} /> Status
                </Button>
                {isAdmin && (
                  <Button variant="secondary" onClick={() => handleDelete(row.task_id, row.task_name)} style={{ padding: '0.35rem 0.65rem', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    <Trash2 size={14} /> Delete
                  </Button>
                )}
              </div>
            )}
          />
        </div>

      {/* Task Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTask ? 'Edit Task' : 'Create New Task'}>
        <form noValidate onSubmit={handleSubmit}>
          
          {/* 1. Project */}
          <FormSelect
            label="Project *"
            value={projectId}
            onChange={(e) => { setProjectId(parseInt(e.target.value, 10) || 0); setFormErrors(prev => ({...prev, project_id: ''})); }}
            options={[
              { value: 0, label: '-- Select Project --' },
              ...projects.map((p) => ({ value: p.project_id, label: p.project_name }))
            ]}
            required
            error={formErrors.project_id}
          />
          
          {/* 2. WBS */}
          <FormSelect
            label="WBS (Discipline) *"
            value={wbsId}
            onChange={(e) => { setWbsId(parseInt(e.target.value, 10) || 0); setFormErrors(prev => ({...prev, wbs_id: ''})); }}
            options={[
              { value: 0, label: '-- Select WBS --' },
              ...projectWbs.map((w) => ({ value: w.id, label: w.wbs_name }))
            ]}
            required
            error={formErrors.wbs_id}
          />

          {/* 3. Employee Name (Multiselect logic via checkboxes for UI simplicity) */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Employee Name</label>
            <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--input-border)', borderRadius: 'var(--radius-sm)', padding: '0.5rem', background: 'var(--input-bg)', transition: 'border-color 0.2s ease, box-shadow 0.2s ease' }}>
              {employees.length === 0 ? (
                <div style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>No active employees found.</div>
              ) : (
                employees.map(emp => (
                  <label key={emp.employee_id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid var(--input-border)' }}>
                    <input 
                      type="checkbox" 
                      checked={assignedEmployeeIds.includes(emp.employee_id)}
                      onChange={(e) => {
                        if (e.target.checked) setAssignedEmployeeIds([...assignedEmployeeIds, emp.employee_id]);
                        else setAssignedEmployeeIds(assignedEmployeeIds.filter(id => id !== emp.employee_id));
                        setFormErrors(prev => ({...prev, assigned_employee_ids: ''}));
                      }}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <span>{emp.name} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({emp.role_name})</span></span>
                  </label>
                ))
              )}
            </div>
            {formErrors.assigned_employee_ids && <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem' }}>{formErrors.assigned_employee_ids}</div>}
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Labour / Worker Name</label>
            <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--input-border)', borderRadius: 'var(--radius-sm)', padding: '0.5rem', background: 'var(--input-bg)', transition: 'border-color 0.2s ease, box-shadow 0.2s ease' }}>
              {labours.length === 0 ? (
                <div style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>No labours found.</div>
              ) : (
                labours.map(labour => (
                  <label key={labour.labour_id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid var(--input-border)' }}>
                    <input 
                      type="checkbox" 
                      checked={assignedLabourIds.includes(labour.labour_id)}
                      onChange={(e) => {
                        if (e.target.checked) setAssignedLabourIds([...assignedLabourIds, labour.labour_id]);
                        else setAssignedLabourIds(assignedLabourIds.filter(id => id !== labour.labour_id));
                        setFormErrors(prev => ({...prev, assigned_employee_ids: ''}));
                      }}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <span>{labour.name} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({labour.labour_type === 'contractor' ? 'Contractor' : 'Direct'})</span></span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* 4. Task Name */}
          <FormInput label="Task Name *" type="text" value={taskName} onChange={(e) => { setTaskName(e.target.value); setFormErrors(prev => ({...prev, task_name: ''})); }} required error={formErrors.task_name} />

          {/* 5. Description */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {/* 6 & 7. Worker Count & Working Hours */}
          <div className="grid-2-col">
            <FormInput label="Worker Count *" type="number" value={workerCount} onChange={(e) => { setWorkerCount(e.target.value === '' ? '' : parseInt(e.target.value, 10)); setFormErrors(prev => ({...prev, required_worker_count: ''})); }} required error={formErrors.required_worker_count} />
            <FormInput label="Working Hours *" type="number" step="0.5" value={workingHours} onChange={(e) => { setWorkingHours(e.target.value === '' ? '' : parseFloat(e.target.value)); setFormErrors(prev => ({...prev, estimated_hours: ''})); }} required error={formErrors.estimated_hours} />
          </div>

          {/* 8. Start Date & Time */}
          <div className="grid-2-col">
            <FormInput label="Start Date *" type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setFormErrors(prev => ({...prev, start_date: ''})); }} required error={formErrors.start_date} />
            <FormInput label="Start Time *" type="time" value={startTime} onChange={(e) => { setStartTime(e.target.value); setFormErrors(prev => ({...prev, start_time: ''})); }} required error={formErrors.start_time} />
          </div>

          {/* 9. End Date & Time */}
          <div className="grid-2-col">
            <FormInput label="End Date *" type="date" value={targetDate} onChange={(e) => { setTargetDate(e.target.value); setFormErrors(prev => ({...prev, target_date: ''})); }} required error={formErrors.target_date} />
            <FormInput label="End Time *" type="time" value={targetTime} onChange={(e) => { setTargetTime(e.target.value); setFormErrors(prev => ({...prev, target_time: ''})); }} required error={formErrors.target_time} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (editingTask ? 'Save Task' : 'Create Task')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Status Modal */}
      <Modal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} title="Change Task Status">
        <form noValidate onSubmit={handleStatusSubmit}>
          <div style={{ marginBottom: '1.5rem', background: 'rgba(99, 102, 241, 0.1)', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Task</div>
            <div style={{ fontWeight: 600 }}>{editingTask?.task_name}</div>
          </div>
          
          <FormSelect
            label="Select New Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'in-progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'delayed', label: 'Delayed' },
              { value: 'on-hold', label: 'On Hold' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            required
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Status'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        recordName={deletingTask?.name || 'this task'}
        isLoading={isDeleting}
      />
    </div>
  );
};
