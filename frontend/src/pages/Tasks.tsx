import React, { useEffect, useState } from 'react';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { apiRequest, parseApiErrors, apiService } from '../services/api';
import { Task, Project, Employee } from '../types';
import { showSuccess, showError } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit, Trash2, RefreshCw, Eye, Calendar, Filter, RotateCcw } from 'lucide-react';
import { ConfirmDeleteModal } from '../components/common/ConfirmDeleteModal';
import { RequirePermission } from '../components/common/RequirePermission';
import { LogHistoryModal } from '../components/common/LogHistoryModal';

export const Tasks: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role_name === 'Admin';
  const canManage = user?.role_name === 'Admin' || user?.role_name === 'Manager';

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectWbs, setProjectWbs] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [labours, setLabours] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cascading Filter State
  const [filterProjectId, setFilterProjectId] = useState<number>(0);
  const [filterWbsId, setFilterWbsId] = useState<number>(0);
  const [filterDisciplines, setFilterDisciplines] = useState<any[]>([]);

  // Task Create/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingTask, setDeletingTask] = useState<{ id: number; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Task Form State
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

  // Log History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyTaskId, setHistoryTaskId] = useState<number | null>(null);

  // Log Timesheet Modal State
  const [isTimesheetModalOpen, setIsTimesheetModalOpen] = useState(false);
  const [timesheetTask, setTimesheetTask] = useState<Task | null>(null);
  const [timesheetForm, setTimesheetForm] = useState({
    employee_id: user?.employee_id || (user as any)?.id || '',
    log_date: new Date().toISOString().split('T')[0],
    working_hours: '',
    comment: '',
  });
  const [isLoggingTimesheet, setIsLoggingTimesheet] = useState(false);

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

  // Cascading Disciplines fetch for top filter
  useEffect(() => {
    if (filterProjectId) {
      apiService.get<any[]>(`/projects/${filterProjectId}/wbs`).then((res) => {
        if (res.success && res.data) {
          setFilterDisciplines(res.data);
        } else {
          setFilterDisciplines([]);
        }
      });
    } else {
      setFilterDisciplines([]);
      setFilterWbsId(0);
    }
  }, [filterProjectId]);

  // Form WBS fetch
  useEffect(() => {
    if (projectId) {
      apiRequest<any[]>(`/projects/${projectId}/wbs`).then((res) => {
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
    setAssignedEmployeeIds(t.assigned_employees ? t.assigned_employees.map((e) => e.employee_id) : []);
    setAssignedLabourIds(t.assigned_labours ? t.assigned_labours.map((l) => l.labour_id) : []);
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

  const openViewLogs = (t: Task) => {
    setHistoryTaskId(t.task_id);
    setIsHistoryModalOpen(true);
  };

  const openLogTimesheetModal = (t: Task) => {
    setTimesheetTask(t);
    setTimesheetForm({
      employee_id: user?.employee_id || (user as any)?.id || (employees[0]?.employee_id || ''),
      log_date: new Date().toISOString().split('T')[0],
      working_hours: '',
      comment: '',
    });
    setIsTimesheetModalOpen(true);
  };

  const handleSaveTimesheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timesheetTask) return;
    if (!timesheetForm.employee_id) {
      showError('Please select an employee');
      return;
    }
    const hrs = Number(timesheetForm.working_hours);
    if (!hrs || hrs <= 0) {
      showError('Please enter valid work hours greater than 0');
      return;
    }

    setIsLoggingTimesheet(true);
    try {
      const res = await apiService.post('/timesheets', {
        project_id: timesheetTask.project_id,
        wbs_id: timesheetTask.wbs_id || null,
        task_id: timesheetTask.task_id,
        employee_id: Number(timesheetForm.employee_id),
        log_date: timesheetForm.log_date,
        working_hours: hrs,
        comment: timesheetForm.comment || null,
      });

      if (res.success) {
        showSuccess('Timesheet logged successfully for task');
        setIsTimesheetModalOpen(false);
        setTimesheetTask(null);
        fetchData();
      } else {
        showError(res.message || 'Failed to log timesheet');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to log timesheet');
    } finally {
      setIsLoggingTimesheet(false);
    }
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
      required_worker_count: typeof workerCount === 'string' ? parseInt(workerCount, 10) || 1 : workerCount,
      estimated_hours: typeof workingHours === 'string' ? parseFloat(workingHours) || 0 : workingHours,
      start_date: startDate || undefined,
      start_time: startTime || undefined,
      target_date: targetDate || undefined,
      target_time: targetTime || undefined,
      assigned_employee_ids: assignedEmployeeIds,
      assigned_labour_ids: assignedLabourIds,
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

  // Filter tasks based on selected Project & Discipline
  const filteredTasks = tasks.filter((t) => {
    if (filterProjectId && t.project_id !== filterProjectId) return false;
    if (filterWbsId && t.wbs_id !== filterWbsId) return false;
    return true;
  });

  const columns: Column<Task>[] = [
    { header: 'Project', accessor: (r) => r.project_name || '-', sortKey: 'project_name' },
    { header: 'WBS / Discipline', accessor: (r) => r.wbs_name || '-', sortKey: 'wbs_name' },
    { header: 'Task Name', accessor: 'task_name', sortKey: 'task_name' },
    ...(isAdmin
      ? [
          {
            header: 'Employee Name',
            accessor: (r: Task) => (
              <span style={{ fontWeight: 500 }}>
                {r.assigned_employees && r.assigned_employees.length > 0 ? (
                  r.assigned_employees.map((e) => e.name).join(', ')
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                )}
              </span>
            ),
            csvAccessor: (r: Task) => r.assigned_employees?.map((e) => e.name).join(', ') || 'Unassigned',
            sortKey: (r: Task) => r.assigned_employees?.map((e) => e.name).join(', ') || '',
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            header: 'Assigned Labours',
            accessor: (r: Task) => (
              <span style={{ fontWeight: 500 }}>
                {r.assigned_labours && r.assigned_labours.length > 0 ? (
                  r.assigned_labours.map((l) => l.name).join(', ')
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>-</span>
                )}
              </span>
            ),
            csvAccessor: (r: Task) => r.assigned_labours?.map((l) => l.name).join(', ') || '-',
            sortKey: (r: Task) => r.assigned_labours?.map((l) => l.name).join(', ') || '',
          },
        ]
      : []),
    { header: 'Worker Count', accessor: 'required_worker_count', sortKey: 'required_worker_count' },
    {
      header: 'Working Hours',
      accessor: (r: Task) =>
        r.actual_hours !== undefined && r.actual_hours !== null ? (
          <div>
            <span>{r.estimated_hours}h</span>
            <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Logged: {r.actual_hours}h</div>
          </div>
        ) : (
          `${r.estimated_hours}h`
        ),
      csvAccessor: (r: Task) => `${r.estimated_hours}h (Actual: ${r.actual_hours || 0}h)`,
      sortKey: 'estimated_hours',
    },
    {
      header: 'Start Date & Time',
      accessor: (r) => formatDateTime(r.start_date, r.start_time),
      csvAccessor: (r) => formatDateTime(r.start_date, r.start_time),
      sortKey: (r) => `${r.start_date || ''} ${r.start_time || ''}`,
    },
    {
      header: 'End Date & Time',
      accessor: (r) => formatDateTime(r.target_date, r.target_time),
      csvAccessor: (r) => formatDateTime(r.target_date, r.target_time),
      sortKey: (r) => `${r.target_date || ''} ${r.target_time || ''}`,
    },
    {
      header: 'Status',
      accessor: (r) => (
        <Badge
          variant={
            r.status === 'completed'
              ? 'success'
              : r.status === 'in-progress'
              ? 'info'
              : r.status === 'delayed'
              ? 'danger'
              : r.status === 'cancelled'
              ? 'danger'
              : 'warning'
          }
        >
          {r.status}
        </Badge>
      ),
      csvAccessor: (r) => r.status.charAt(0).toUpperCase() + r.status.slice(1),
      sortKey: 'status',
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{!isAdmin ? 'My Tasks' : 'Task Management'}</h1>
          <p className="page-subtitle">
            {!isAdmin
              ? 'View your assigned tasks and working schedules'
              : 'Manage tasks, assign responsible employees, and track complete timesheet log history'}
          </p>
        </div>
        <Button variant="primary" onClick={openCreateModal}>
          <Plus size={18} /> Create Task
        </Button>
      </div>

      {/* Cascading Filter Bar */}
      <div className="glass-card" style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>
            <Filter size={16} style={{ color: '#6366f1' }} /> Filter Tasks:
          </div>

          <div style={{ minWidth: '200px' }}>
            <select
              className="form-input"
              value={filterProjectId}
              onChange={(e) => {
                setFilterProjectId(parseInt(e.target.value, 10) || 0);
                setFilterWbsId(0);
              }}
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.875rem' }}
            >
              <option value={0}>All Projects</option>
              {projects.map((p) => (
                <option key={p.project_id} value={p.project_id}>
                  {p.project_name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: '200px' }}>
            <select
              className="form-input"
              value={filterWbsId}
              onChange={(e) => setFilterWbsId(parseInt(e.target.value, 10) || 0)}
              disabled={!filterProjectId}
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.875rem' }}
            >
              <option value={0}>{filterProjectId ? 'All Disciplines' : 'Select Project First'}</option>
              {filterDisciplines.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.wbs_name}
                </option>
              ))}
            </select>
          </div>

          {(filterProjectId !== 0 || filterWbsId !== 0) && (
            <Button
              variant="secondary"
              onClick={() => {
                setFilterProjectId(0);
                setFilterWbsId(0);
              }}
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
            >
              <RotateCcw size={14} /> Reset Filters
            </Button>
          )}

          <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing <strong>{filteredTasks.length}</strong> of {tasks.length} tasks
          </div>
        </div>
      </div>

      <div className="glass-card">
        <DataTable
          columns={columns}
          data={filteredTasks}
          searchPlaceholder="Search tasks by name, project, or discipline..."
          exportFilename="tasks"
          isLoading={isLoading}
          actions={(row) => (
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {/* View Logs Button (Eye Icon) */}
              <Button
                variant="secondary"
                onClick={() => openViewLogs(row)}
                style={{ padding: '0.35rem 0.6rem', color: '#6366f1', borderColor: 'rgba(99, 102, 241, 0.3)' }}
                title="View Log History"
              >
                <Eye size={14} /> Logs
              </Button>

              {/* Log Timesheet Button (Calendar Icon) */}
              <Button
                variant="secondary"
                onClick={() => openLogTimesheetModal(row)}
                style={{ padding: '0.35rem 0.6rem', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                title="Log Timesheet"
              >
                <Calendar size={14} /> Log Time
              </Button>

              {isAdmin && (
                <Button variant="secondary" onClick={() => openEditModal(row)} style={{ padding: '0.35rem 0.6rem' }}>
                  <Edit size={14} /> Edit
                </Button>
              )}

              <Button variant="secondary" onClick={() => openStatusModal(row)} style={{ padding: '0.35rem 0.6rem' }}>
                <RefreshCw size={14} /> Status
              </Button>

              {isAdmin && (
                <Button
                  variant="secondary"
                  onClick={() => handleDelete(row.task_id, row.task_name)}
                  style={{ padding: '0.35rem 0.6rem', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                >
                  <Trash2 size={14} /> Delete
                </Button>
              )}
            </div>
          )}
        />
      </div>

      {/* Log History Modal Component */}
      <LogHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        taskId={historyTaskId}
        onLogUpdated={fetchData}
      />

      {/* Log Timesheet Modal for specific task */}
      {timesheetTask && (
        <Modal
          isOpen={isTimesheetModalOpen}
          onClose={() => {
            setIsTimesheetModalOpen(false);
            setTimesheetTask(null);
          }}
          title="Log Time Sheet"
        >
          <form noValidate onSubmit={handleSaveTimesheet}>
            <div style={{ marginBottom: '1rem', background: 'rgba(99, 102, 241, 0.05)', padding: '0.85rem 1rem', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Project & Discipline</div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                {timesheetTask.project_name} &rarr; {timesheetTask.wbs_name || 'General'}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#6366f1', marginTop: '0.25rem', fontWeight: 500 }}>
                Task: {timesheetTask.task_name}
              </div>
            </div>

            <FormSelect
              label="Employee Name *"
              value={timesheetForm.employee_id}
              onChange={(e) => setTimesheetForm({ ...timesheetForm, employee_id: e.target.value })}
              options={[
                { value: '', label: '-- Select Employee --' },
                ...employees.map((emp) => ({
                  value: emp.employee_id,
                  label: `${emp.name} (${emp.employee_code})`,
                })),
              ]}
              required
            />

            <div className="grid-2-col">
              <FormInput
                label="Log Date *"
                type="date"
                value={timesheetForm.log_date}
                onChange={(e) => setTimesheetForm({ ...timesheetForm, log_date: e.target.value })}
                required
              />
              <FormInput
                label="Work HRs. *"
                type="number"
                step="0.5"
                placeholder="e.g. 6"
                value={timesheetForm.working_hours}
                onChange={(e) => setTimesheetForm({ ...timesheetForm, working_hours: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Log Description / Remarks</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Enter work details or progress remarks..."
                value={timesheetForm.comment}
                onChange={(e) => setTimesheetForm({ ...timesheetForm, comment: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsTimesheetModalOpen(false);
                  setTimesheetTask(null);
                }}
              >
                Close
              </Button>
              <Button type="submit" variant="primary" disabled={isLoggingTimesheet}>
                {isLoggingTimesheet ? 'Saving...' : 'Save Log'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Task Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTask ? 'Edit Task' : 'Create New Task'}>
        <form noValidate onSubmit={handleSubmit}>
          {/* 1. Project */}
          <FormSelect
            label="Project *"
            value={projectId}
            onChange={(e) => {
              setProjectId(parseInt(e.target.value, 10) || 0);
              setFormErrors((prev) => ({ ...prev, project_id: '' }));
            }}
            options={[
              { value: 0, label: '-- Select Project --' },
              ...projects.map((p) => ({ value: p.project_id, label: p.project_name })),
            ]}
            required
            error={formErrors.project_id}
          />

          {/* 2. WBS */}
          <FormSelect
            label="WBS (Discipline) *"
            value={wbsId}
            onChange={(e) => {
              setWbsId(parseInt(e.target.value, 10) || 0);
              setFormErrors((prev) => ({ ...prev, wbs_id: '' }));
            }}
            options={[
              { value: 0, label: '-- Select WBS --' },
              ...projectWbs.map((w) => ({ value: w.id, label: w.wbs_name })),
            ]}
            required
            error={formErrors.wbs_id}
          />

          {/* 3. Employee Name */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Employee Name</label>
            <div
              style={{
                maxHeight: '150px',
                overflowY: 'auto',
                border: '1px solid var(--input-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.5rem',
                background: 'var(--input-bg)',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              {employees.length === 0 ? (
                <div style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>No active employees found.</div>
              ) : (
                employees.map((emp) => (
                  <label
                    key={emp.employee_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.5rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--input-border)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={assignedEmployeeIds.includes(emp.employee_id)}
                      onChange={(e) => {
                        if (e.target.checked) setAssignedEmployeeIds([...assignedEmployeeIds, emp.employee_id]);
                        else setAssignedEmployeeIds(assignedEmployeeIds.filter((id) => id !== emp.employee_id));
                        setFormErrors((prev) => ({ ...prev, assigned_employee_ids: '' }));
                      }}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <span>
                      {emp.name} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({emp.role_name})</span>
                    </span>
                  </label>
                ))
              )}
            </div>
            {formErrors.assigned_employee_ids && (
              <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                {formErrors.assigned_employee_ids}
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Labour / Worker Name</label>
            <div
              style={{
                maxHeight: '150px',
                overflowY: 'auto',
                border: '1px solid var(--input-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.5rem',
                background: 'var(--input-bg)',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              {labours.length === 0 ? (
                <div style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>No labours found.</div>
              ) : (
                labours.map((labour) => (
                  <label
                    key={labour.labour_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.5rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--input-border)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={assignedLabourIds.includes(labour.labour_id)}
                      onChange={(e) => {
                        if (e.target.checked) setAssignedLabourIds([...assignedLabourIds, labour.labour_id]);
                        else setAssignedLabourIds(assignedLabourIds.filter((id) => id !== labour.labour_id));
                        setFormErrors((prev) => ({ ...prev, assigned_employee_ids: '' }));
                      }}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <span>
                      {labour.name}{' '}
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        ({labour.labour_type === 'contractor' ? 'Contractor' : 'Direct'})
                      </span>
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* 4. Task Name */}
          <FormInput
            label="Task Name *"
            type="text"
            value={taskName}
            onChange={(e) => {
              setTaskName(e.target.value);
              setFormErrors((prev) => ({ ...prev, task_name: '' }));
            }}
            required
            error={formErrors.task_name}
          />

          {/* 5. Description */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {/* 6 & 7. Worker Count & Working Hours */}
          <div className="grid-2-col">
            <FormInput
              label="Worker Count *"
              type="number"
              value={workerCount}
              onChange={(e) => {
                setWorkerCount(e.target.value === '' ? '' : parseInt(e.target.value, 10));
                setFormErrors((prev) => ({ ...prev, required_worker_count: '' }));
              }}
              required
              error={formErrors.required_worker_count}
            />
            <FormInput
              label="Working Hours *"
              type="number"
              step="0.5"
              value={workingHours}
              onChange={(e) => {
                setWorkingHours(e.target.value === '' ? '' : parseFloat(e.target.value));
                setFormErrors((prev) => ({ ...prev, estimated_hours: '' }));
              }}
              required
              error={formErrors.estimated_hours}
            />
          </div>

          {/* 8. Start Date & Time */}
          <div className="grid-2-col">
            <FormInput
              label="Start Date *"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setFormErrors((prev) => ({ ...prev, start_date: '' }));
              }}
              required
              error={formErrors.start_date}
            />
            <FormInput
              label="Start Time *"
              type="time"
              value={startTime}
              onChange={(e) => {
                setStartTime(e.target.value);
                setFormErrors((prev) => ({ ...prev, start_time: '' }));
              }}
              required
              error={formErrors.start_time}
            />
          </div>

          {/* 9. End Date & Time */}
          <div className="grid-2-col">
            <FormInput
              label="End Date *"
              type="date"
              value={targetDate}
              onChange={(e) => {
                setTargetDate(e.target.value);
                setFormErrors((prev) => ({ ...prev, target_date: '' }));
              }}
              required
              error={formErrors.target_date}
            />
            <FormInput
              label="End Time *"
              type="time"
              value={targetTime}
              onChange={(e) => {
                setTargetTime(e.target.value);
                setFormErrors((prev) => ({ ...prev, target_time: '' }));
              }}
              required
              error={formErrors.target_time}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingTask ? 'Save Task' : 'Create Task'}
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
