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
import { LabourCombobox } from '../components/common/LabourCombobox';

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
  const [assignedEmployeeId, setAssignedEmployeeId] = useState<number | string>('');
  const [allocations, setAllocations] = useState<any[]>([]);
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [workerCount, setWorkerCount] = useState<number | string>(1);
  const [workingHours, setWorkingHours] = useState<number | string>(0);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [targetTime, setTargetTime] = useState('');
  const [taskAddress, setTaskAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // Auto-calculate Worker Count based on allocated labour workers count
  useEffect(() => {
    if (isModalOpen) {
      setWorkerCount(allocations.length > 0 ? allocations.length : 1);
    }
  }, [allocations, isModalOpen]);

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

  // Labour Creation Modal State
  const [isCreateLabourModalOpen, setIsCreateLabourModalOpen] = useState(false);
  const [createLabourForm, setCreateLabourForm] = useState({
    name: '',
    contact_number: '',
    aadhar_id: '',
    labour_type: 'direct_labour' as 'direct_labour' | 'contractor'
  });

  // Labour Allocation Form State
  const [allocationForm, setAllocationForm] = useState({
    work_date: '',
    labour_id: '',
    amount: '',
    payment_status: 'Paid',
    work_description: ''
  });
  const [editingAllocIndex, setEditingAllocIndex] = useState<number | null>(null);

  const resetAllocationForm = () => {
    setAllocationForm({
      work_date: startDate || new Date().toISOString().split('T')[0],
      labour_id: '',
      amount: '',
      payment_status: 'Paid',
      work_description: ''
    });
    setEditingAllocIndex(null);
  };

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
    setAssignedEmployeeId(user?.employee_id || '');
    setAllocations([]);
    setTaskName('');
    setDescription('');
    setWorkerCount(1);
    setWorkingHours(8);
    setStartDate(new Date().toISOString().split('T')[0]);
    setStartTime('09:00');
    setTargetDate(new Date().toISOString().split('T')[0]);
    setTargetTime('18:00');
    setTaskAddress('');
    setLatitude('');
    setLongitude('');
    setStatus('pending');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = async (t: Task) => {
    setEditingTask(t);
    setProjectId(t.project_id);
    setWbsId(t.wbs_id || 0);
    setAssignedEmployeeId(t.assigned_employees && t.assigned_employees.length > 0 ? t.assigned_employees[0].employee_id : '');
    
    setAllocations([]);
    apiService.get<any[]>(`/tasks/${t.task_id}/allocations`).then(res => {
      if (res.success && res.data) {
        const task = t;
        setAllocations(
          task.allocations?.map((a: any) => ({
            work_log_id: a.work_log_id,
            labour_id: a.labour_id || '',
            work_date: a.work_date ? a.work_date.split('T')[0] : '',
            amount: a.amount || '',
            work_description: a.work_description || '',
            payment_status: a.payment_status || 'Paid',
          })) || res.data.map((a: any) => ({
            work_log_id: a.work_log_id,
            labour_id: a.labour_id || '',
            work_date: a.work_date ? a.work_date.split('T')[0] : '',
            amount: a.amount || '',
            work_description: a.work_description || '',
            payment_status: a.payment_status || 'Paid',
          })) || []
        );
        resetAllocationForm();
      }
    }).catch(console.error);

    setTaskName(t.task_name);
    setDescription(t.description || '');
    setWorkerCount(t.required_worker_count);
    setWorkingHours(Number(t.estimated_hours));
    setStartDate(t.start_date ? t.start_date.split('T')[0] : '');
    setStartTime(t.start_time || '');
    setTargetDate(t.target_date ? t.target_date.split('T')[0] : '');
    setTargetTime(t.target_time || '');
    setTaskAddress((t as any).task_address || '');
    setLatitude((t as any).latitude || '');
    setLongitude((t as any).longitude || '');
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

  const handleInitiateCreateLabour = (name: string, type: 'direct_labour' | 'contractor') => {
    setCreateLabourForm({ name, labour_type: type, contact_number: '', aadhar_id: '' });
    setIsCreateLabourModalOpen(true);
  };

  const handleCreateLabourSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createLabourForm.name.trim() || !createLabourForm.contact_number.trim()) {
      showError('Name and Contact Number are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiService.post<any>('/labours', {
        ...createLabourForm,
        status: 'active'
      });
      if (res.success && res.data) {
        showSuccess('Labour created successfully.');
        const newLabour = {
          labour_id: res.data.labour_id,
          name: res.data.name,
          labour_type: res.data.labour_type,
          sub_worker_count: 0
        };
        setLabours([...labours, newLabour]);
        setAllocationForm({ ...allocationForm, labour_id: String(newLabour.labour_id) });
        setIsCreateLabourModalOpen(false);
      } else {
        showError(res.message || 'Failed to create labour.');
      }
    } catch (err: any) {
      showError(err.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
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

    if (!assignedEmployeeId && allocations.length === 0) {
      setFormErrors({ assigned_employee_ids: 'Please select an employee or add a labour allocation.' });
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
      assigned_employee_ids: assignedEmployeeId ? [Number(assignedEmployeeId)] : [],
      allocations: allocations.map(a => ({
        ...a,
        labour_id: typeof a.labour_id === 'string' ? parseInt(a.labour_id, 10) || 0 : a.labour_id,
        amount: typeof a.amount === 'string' ? parseFloat(a.amount) || 0 : a.amount
      })),
      task_address: taskAddress,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
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
      accessor: (r: Task) => {
        const est = Number(r.estimated_hours || 0);
        const act = Number(r.actual_hours || 0);
        const rem = Math.max(est - act, 0);
        const alloc = r.allocation_status || (act > est ? 'Hours Exceeded' : act >= est * 0.85 ? 'Near Limit' : 'Within Allocation');
        const badgeBg = alloc === 'Hours Exceeded' ? 'rgba(239, 68, 68, 0.12)' : alloc === 'Near Limit' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)';
        const badgeColor = alloc === 'Hours Exceeded' ? '#ef4444' : alloc === 'Near Limit' ? '#f59e0b' : '#10b981';

        return (
          <div>
            <div style={{ fontWeight: 600 }}>{est}h <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>(Rem: {rem}h)</span></div>
            <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Logged: {act}h</div>
            <div style={{ marginTop: '0.2rem' }}>
              <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: badgeBg, color: badgeColor, fontWeight: 700 }}>
                {alloc}
              </span>
            </div>
          </div>
        );
      },
      csvAccessor: (r: Task) => `${r.estimated_hours}h (Actual: ${r.actual_hours || 0}h, Rem: ${Math.max((r.estimated_hours || 0) - (r.actual_hours || 0), 0)}h)`,
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
                step="any"
                min="0"
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
              const pid = parseInt(e.target.value, 10) || 0;
              setProjectId(pid);
              setWbsId(0);
              setFormErrors((prev) => ({ ...prev, project_id: '', wbs_id: '' }));
              // Auto-fill address and GPS from selected project
              if (!editingTask) {
                const proj = projects.find(p => p.project_id === pid);
                if (proj) {
                  setTaskAddress(proj.project_address || '');
                  setLatitude((proj as any).latitude || '');
                  setLongitude((proj as any).longitude || '');
                }
              }
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

          {/* 3. Employee Allocation (Single Dropdown) */}
          <FormSelect
            label="Employee Name *"
            value={assignedEmployeeId}
            onChange={(e) => {
              setAssignedEmployeeId(e.target.value);
              setFormErrors((prev) => ({ ...prev, assigned_employee_ids: '' }));
            }}
            options={[
              { value: '', label: '-- Select Employee --' },
              ...employees.map((emp) => ({
                value: emp.employee_id,
                label: `${emp.name} (${emp.role_name || emp.employee_code || 'Employee'})`,
              })),
            ]}
            error={formErrors.assigned_employee_ids}
            required
          />



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
            <div>
              <FormInput
                label="Worker Count *"
                type="number"
                value={workerCount}
                readOnly
                style={{ background: 'var(--input-bg-solid)', opacity: 0.85, cursor: 'not-allowed' }}
                required
                error={formErrors.required_worker_count}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '-0.3rem', marginBottom: '0.5rem' }}>
                Auto-updated from allocated labour workers ({allocations.length} allocated)
              </span>
            </div>
            <FormInput
              label="Working Hours *"
              type="number"
              step="any"
              min="0"
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
          <div className="form-group" style={{ marginBottom: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
            <div style={{ background: '#6366f1', color: 'white', padding: '0.75rem 1rem', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <Calendar size={16} /> Labour / Contractor Daily Allocation
            </div>
            <div style={{ border: '1px solid #e2e8f0', borderTop: 'none', padding: '1.5rem', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Add daily work allocation records for workers on this task. Each worker can work multiple dates, and multiple workers can be allocated per date.
              </p>

              {(!startDate || !targetDate) && (
                <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Please select Task <strong>Start Date</strong> and <strong>End Date</strong> above before adding allocations.
                </div>
              )}

              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                <div className="grid-3-col" style={{ gap: '1rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Work Date <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                      type="date"
                      className="form-input"
                      value={allocationForm.work_date}
                      min={startDate}
                      max={targetDate}
                      disabled={!startDate || !targetDate}
                      onChange={(e) => setAllocationForm({ ...allocationForm, work_date: e.target.value })}
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div style={{ flex: 1.5, minWidth: '220px', position: 'relative' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Select Labour / Contractor <span style={{ color: '#ef4444' }}>*</span></label>
                    <LabourCombobox
                      selectedLabourId={allocationForm.labour_id}
                      labours={labours}
                      onSelectLabour={(l) => setAllocationForm({ ...allocationForm, labour_id: l ? String(l.labour_id) : '' })}
                      onInitiateCreate={handleInitiateCreateLabour}
                      disabled={!startDate || !targetDate}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Amount (₹) <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="form-input"
                      value={allocationForm.amount}
                      disabled={!startDate || !targetDate}
                      onChange={(e) => setAllocationForm({ ...allocationForm, amount: e.target.value })}
                      placeholder="Enter amount..."
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <div className="grid-2-col" style={{ gap: '1rem', marginTop: '1rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Payment Status</label>
                    <select
                      className="form-input"
                      value={allocationForm.payment_status}
                      disabled={!startDate || !targetDate}
                      onChange={(e) => setAllocationForm({ ...allocationForm, payment_status: e.target.value })}
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                    >
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Remarks / Notes</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <input
                        type="text"
                        className="form-input"
                        value={allocationForm.work_description}
                        disabled={!startDate || !targetDate}
                        onChange={(e) => setAllocationForm({ ...allocationForm, work_description: e.target.value })}
                        placeholder="Optional work notes / remarks"
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', flex: 1 }}
                      />
                      <Button
                        type="button"
                        variant="primary"
                        disabled={!startDate || !targetDate || !allocationForm.work_date || !allocationForm.labour_id || !allocationForm.amount}
                        onClick={() => {
                          if (editingAllocIndex !== null) {
                            const newAlloc = [...allocations];
                            newAlloc[editingAllocIndex] = { ...allocationForm };
                            setAllocations(newAlloc);
                          } else {
                            setAllocations([...allocations, { ...allocationForm }]);
                          }
                          resetAllocationForm();
                        }}
                        style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', height: '36px', background: editingAllocIndex !== null ? '#f59e0b' : '#a855f7', borderColor: editingAllocIndex !== null ? '#f59e0b' : '#a855f7' }}
                      >
                        {editingAllocIndex !== null ? <><Edit size={14} /> Update</> : <><Plus size={14} /> Add Allocation</>}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#7dd3fc', color: '#0f172a', fontSize: '0.8rem', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #cbd5e1' }}>Date</th>
                      <th style={{ padding: '0.75rem', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #cbd5e1' }}>Labour / Contractor</th>
                      <th style={{ padding: '0.75rem', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #cbd5e1' }}>Type</th>
                      <th style={{ padding: '0.75rem', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #cbd5e1' }}>Amount (₹)</th>
                      <th style={{ padding: '0.75rem', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #cbd5e1' }}>Payment Status</th>
                      <th style={{ padding: '0.75rem', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #cbd5e1' }}>Remarks</th>
                      <th style={{ padding: '0.75rem', borderBottom: '1px solid #cbd5e1', width: '70px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allocations.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No allocations added.
                        </td>
                      </tr>
                    ) : (
                      allocations.map((alloc, idx) => {
                        const labour = labours.find(l => l.labour_id === Number(alloc.labour_id));
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                            <td style={{ padding: '0.75rem', borderRight: '1px solid #e2e8f0', color: '#475569' }}>
                              {alloc.work_date ? new Date(alloc.work_date).toLocaleDateString('en-GB') : '-'}
                            </td>
                            <td style={{ padding: '0.75rem', borderRight: '1px solid #e2e8f0' }}>
                              <div style={{ fontWeight: 600, color: '#334155' }}>{labour?.name || 'Unknown'}</div>
                              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>(L{String(labour?.labour_id).padStart(3, '0')})</div>
                            </td>
                            <td style={{ padding: '0.75rem', borderRight: '1px solid #e2e8f0' }}>
                              {labour?.labour_type === 'contractor' ? (
                                <span style={{ background: '#fef3c7', color: '#d97706', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>Contractor</span>
                              ) : (
                                <span style={{ background: '#4f46e5', color: 'white', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>Direct Labour</span>
                              )}
                            </td>
                            <td style={{ padding: '0.75rem', borderRight: '1px solid #e2e8f0', fontWeight: 500, color: '#334155' }}>
                              ₹{Number(alloc.amount).toFixed(2)}
                            </td>
                            <td style={{ padding: '0.75rem', borderRight: '1px solid #e2e8f0' }}>
                              {alloc.payment_status?.toLowerCase() === 'paid' ? (
                                <span style={{ background: '#22c55e', color: 'white', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>Paid</span>
                              ) : (
                                <span style={{ background: '#f1f5f9', color: '#64748b', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>{alloc.payment_status || 'Pending'}</span>
                              )}
                            </td>
                            <td style={{ padding: '0.75rem', borderRight: '1px solid #e2e8f0', color: '#475569' }}>
                              {alloc.work_description || '-'}
                            </td>
                            <td style={{ padding: '0.75rem', textAlign: 'center', display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setAllocationForm({
                                    work_date: alloc.work_date,
                                    labour_id: alloc.labour_id.toString(),
                                    amount: alloc.amount.toString(),
                                    payment_status: alloc.payment_status || 'Pending',
                                    work_description: alloc.work_description || ''
                                  });
                                  setEditingAllocIndex(idx);
                                }}
                                style={{ background: '#38bdf8', border: 'none', color: 'white', cursor: 'pointer', padding: '0.3rem', borderRadius: '4px' }}
                                title="Edit Allocation"
                              >
                                <Edit size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const newAlloc = [...allocations];
                                  newAlloc.splice(idx, 1);
                                  setAllocations(newAlloc);
                                  if (editingAllocIndex === idx) resetAllocationForm();
                                }}
                                style={{ background: '#ef4444', border: 'none', color: 'white', cursor: 'pointer', padding: '0.3rem', borderRadius: '4px' }}
                                title="Delete Allocation"
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {allocations.length > 0 && (
                    <tfoot style={{ background: '#f8fafc', fontWeight: 600 }}>
                      <tr>
                        <td colSpan={3} style={{ padding: '0.75rem', borderRight: '1px solid #e2e8f0', textAlign: 'right', color: '#64748b' }}>
                          Total Summary:
                        </td>
                        <td style={{ padding: '0.75rem', borderRight: '1px solid #e2e8f0', color: '#334155' }}>
                          ₹{allocations.reduce((sum, a) => sum + Number(a.amount || 0), 0).toFixed(2)}
                        </td>
                        <td colSpan={3} style={{ padding: '0.75rem' }}>
                          <span style={{ background: '#4f46e5', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                            {allocations.length} Allocations
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
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

      {isAdmin && (
        <ConfirmDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          recordName={deletingTask?.name || 'this task'}
          isLoading={isDeleting}
        />
      )}

      {/* Create Labour / Contractor Modal */}
      <Modal isOpen={isCreateLabourModalOpen} onClose={() => setIsCreateLabourModalOpen(false)} title="Create New Labour / Contractor">
        <form noValidate onSubmit={handleCreateLabourSubmit}>
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input
              type="text"
              className="form-input"
              value={createLabourForm.name}
              onChange={(e) => setCreateLabourForm({ ...createLabourForm, name: e.target.value })}
              required
            />
          </div>
          
          <div className="form-group">
            <FormSelect
              label="Type *"
              value={createLabourForm.labour_type}
              onChange={(e) => setCreateLabourForm({ ...createLabourForm, labour_type: e.target.value as any })}
              options={[
                { value: 'direct_labour', label: 'Direct Labour' },
                { value: 'contractor', label: 'Contractor' }
              ]}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contact Number (10 digits) *</label>
            <input
              type="text"
              className="form-input"
              value={createLabourForm.contact_number}
              onChange={(e) => setCreateLabourForm({ ...createLabourForm, contact_number: e.target.value })}
              maxLength={10}
              placeholder="e.g. 9876543210"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Aadhar ID (Optional)</label>
            <input
              type="text"
              className="form-input"
              value={createLabourForm.aadhar_id}
              onChange={(e) => setCreateLabourForm({ ...createLabourForm, aadhar_id: e.target.value })}
              maxLength={12}
              placeholder="e.g. 123456789012"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsCreateLabourModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Labour'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
