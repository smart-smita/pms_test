import React, { useState, useEffect, useMemo } from 'react';
import { Briefcase, Layers, Clock, Edit, Plus, Trash2, AlertTriangle, ShieldAlert, X, BarChart3, Upload, CalendarDays } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { Project, ProjectWBS, MasterWBS, Task, Employee } from '../types';
import { showSuccess, showError } from '../utils/toast';
import { DataTable, Column } from '../components/common/DataTable';
import { TaskCombobox } from '../components/common/TaskCombobox';

export const ProjectWork: React.FC = () => {
  const { user } = useAuth();
  const canManage = user?.role_name === 'Admin' || user?.role_name === 'Super Admin' || user?.role_name === 'Manager';

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [wbsAllocations, setWbsAllocations] = useState<ProjectWBS[]>([]);
  const [masterWbsList, setMasterWbsList] = useState<MasterWBS[]>([]);
  const [loading, setLoading] = useState(false);

  // Subnav Tab State (kept for future use)
  const [activeTab, setActiveTab] = useState<'disciplines' | 'allocation' | 'gantt' | 'dependency' | 'summary'>('disciplines');

  // (Legacy filter state removed – DataTable handles search/sort/pagination internally)

  // Add Allocation Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    wbs_id: '',
    start_date: '',
    end_date: '',
    total_hours: 0,
    actual_start_date: '',
    actual_end_date: '',
    actual_hours: 0,
    note: '',
  });

  // Edit Modal State
  const [editingWbs, setEditingWbs] = useState<ProjectWBS | null>(null);
  const [editForm, setEditForm] = useState({
    start_date: '',
    end_date: '',
    total_hours: 0,
    actual_start_date: '',
    actual_end_date: '',
    actual_hours: 0,
    note: '',
  });

  // Delete Modal State
  const [deletingWbs, setDeletingWbs] = useState<ProjectWBS | null>(null);
  const [dependencyInfo, setDependencyInfo] = useState<{
    hasDependencies: boolean;
    taskCount: number;
    timesheetCount: number;
    labourAttendanceCount: number;
  } | null>(null);
  const [checkingDeps, setCheckingDeps] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timesheet Modal State
  const [timesheetWbs, setTimesheetWbs] = useState<ProjectWBS | null>(null);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timesheetForm, setTimesheetForm] = useState({
    task_id: '',
    employee_id: '',
    log_date: new Date().toISOString().split('T')[0],
    working_hours: '',
  });
  const [isLoggingTimesheet, setIsLoggingTimesheet] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchMasterWbs();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      const proj = projects.find((p) => p.project_id === Number(selectedProjectId)) || null;
      setSelectedProject(proj);
      fetchProjectWbs(Number(selectedProjectId));
    } else {
      setSelectedProject(null);
      setWbsAllocations([]);
    }
  }, [selectedProjectId, projects]);

  const fetchProjects = async () => {
    try {
      const res = await apiService.get<Project[]>('/projects');
      if (res.data) {
        setProjects(res.data);
        if (res.data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(res.data[0].project_id);
        }
      }
    } catch (err) {
      console.error('Error loading projects:', err);
    }
  };

  const fetchMasterWbs = async () => {
    try {
      const res = await apiService.get<MasterWBS[]>('/wbs');
      if (res.data) setMasterWbsList(res.data);
    } catch (err) {
      console.error('Error loading master WBS list:', err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await apiService.get<Employee[]>('/employees');
      if (res.data) setEmployees(res.data);
    } catch (err) {
      console.error('Error loading employees:', err);
    }
  };

  const handleOpenTimesheet = async (item: ProjectWBS) => {
    setTimesheetWbs(item);
    setTimesheetForm({
      task_id: '',
      employee_id: user?.employee_id ? String(user.employee_id) : '',
      log_date: new Date().toISOString().split('T')[0],
      working_hours: '',
    });

    if (employees.length === 0) {
      fetchEmployees();
    }

    if (selectedProjectId) {
      try {
        const res = await apiService.get<Task[]>(`/tasks?project_id=${selectedProjectId}`);
        if (res.data) {
          const matchingTasks = res.data.filter(
            (t) => !t.wbs_id || Number(t.wbs_id) === Number(item.id) || Number(t.wbs_id) === Number(item.wbs_id)
          );
          setAvailableTasks(matchingTasks);
        }
      } catch (err) {
        console.error('Error loading tasks for timesheet:', err);
      }
    }
  };

  const handleSaveTimesheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timesheetWbs || !selectedProjectId) return;
    if (!timesheetForm.employee_id) {
      showError('Please select an employee');
      return;
    }
    if (!timesheetForm.working_hours || Number(timesheetForm.working_hours) <= 0) {
      showError('Please enter valid working hours');
      return;
    }

    setIsLoggingTimesheet(true);
    try {
      const res = await apiService.post('/timesheets', {
        project_id: Number(selectedProjectId),
        wbs_id: timesheetWbs.id,
        task_id: timesheetForm.task_id ? Number(timesheetForm.task_id) : null,
        employee_id: Number(timesheetForm.employee_id),
        log_date: timesheetForm.log_date,
        working_hours: Number(timesheetForm.working_hours),
      });

      if (res.success) {
        showSuccess('Time sheet logged successfully');
        setTimesheetWbs(null);
        fetchProjectWbs(Number(selectedProjectId));
      } else {
        showError(res.message || 'Failed to log time sheet');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to log time sheet');
    } finally {
      setIsLoggingTimesheet(false);
    }
  };

  const fetchProjectWbs = async (projectId: number) => {
    setLoading(true);
    try {
      const res = await apiService.get<ProjectWBS[]>(`/projects/${projectId}/wbs`);
      if (res.data) {
        setWbsAllocations(res.data);
      }
    } catch (err) {
      console.error('Error loading project WBS allocations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setAddForm({ wbs_id: '', start_date: '', end_date: '', total_hours: 0, actual_start_date: '', actual_end_date: '', actual_hours: 0, note: '' });
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !addForm.wbs_id) {
      showError('Please select a valid WBS');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await apiService.post('/wbs/project-wbs', {
        project_id: Number(selectedProjectId),
        wbs_id: Number(addForm.wbs_id),
        start_date: addForm.start_date || undefined,
        end_date: addForm.end_date || undefined,
        total_hours: Number(addForm.total_hours || 0),
        actual_start_date: addForm.actual_start_date || undefined,
        actual_end_date: addForm.actual_end_date || undefined,
        actual_hours: Number(addForm.actual_hours || 0),
        note: addForm.note || undefined,
      });
      if (res.success) {
        showSuccess('WBS allocated successfully');
        setIsAddModalOpen(false);
        fetchProjectWbs(Number(selectedProjectId));
      } else {
        showError(res.message || 'Failed to allocate WBS');
      }
    } catch (err: any) {
      showError(err.message || 'Allocation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (wbs: ProjectWBS) => {
    setEditingWbs(wbs);
    setEditForm({
      start_date: wbs.start_date ? wbs.start_date.split('T')[0] : '',
      end_date: wbs.end_date ? wbs.end_date.split('T')[0] : '',
      total_hours: Number(wbs.total_hours || 0),
      actual_start_date: wbs.actual_start_date ? wbs.actual_start_date.split('T')[0] : '',
      actual_end_date: wbs.actual_end_date ? wbs.actual_end_date.split('T')[0] : '',
      actual_hours: Number(wbs.actual_hours || 0),
      note: wbs.note || '',
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWbs) return;
    setIsSubmitting(true);
    try {
      const res = await apiService.put(`/wbs/project-wbs/${editingWbs.id}`, editForm);
      if (res.success) {
        showSuccess('WBS details updated successfully');
        setEditingWbs(null);
        if (selectedProjectId) fetchProjectWbs(Number(selectedProjectId));
      } else {
        showError(res.message || 'Update failed');
      }
    } catch (err: any) {
      showError(err.message || 'Update failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDelete = async (wbs: ProjectWBS) => {
    setDeletingWbs(wbs);
    setCheckingDeps(true);
    setDependencyInfo(null);
    try {
      const res = await apiService.get(`/wbs/project-wbs/${wbs.id}/dependencies`);
      if (res.data) setDependencyInfo(res.data);
    } catch (err) {
      console.error('Error fetching dependencies:', err);
    } finally {
      setCheckingDeps(false);
    }
  };

  const handleConfirmDelete = async (force = false) => {
    if (!deletingWbs) return;
    setIsSubmitting(true);
    try {
      const res = await apiService.delete(`/wbs/project-wbs/${deletingWbs.id}${force ? '?force=true' : ''}`);
      if (res.success) {
        showSuccess('WBS allocation removed successfully');
        setDeletingWbs(null);
        if (selectedProjectId) fetchProjectWbs(Number(selectedProjectId));
      } else {
        showError(res.message || 'Deletion failed');
      }
    } catch (err: any) {
      showError(err.message || 'Deletion failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalDisciplines = wbsAllocations.length;
  const totalPlannedHours = wbsAllocations.reduce((acc, curr) => acc + Number(curr.total_hours || 0), 0);
  const totalActualHours = wbsAllocations.reduce((acc, curr) => acc + Number(curr.actual_hours || 0), 0);
  const overallProgress = totalPlannedHours > 0 ? ((totalActualHours / totalPlannedHours) * 100).toFixed(2) : '0.00';

  const availableMasterWbs = masterWbsList;

  /**
   * Enrich each WBS allocation with computed numeric fields so DataTable
   * can sort, search, and CSV-export them cleanly.
   */
  const tableData = useMemo(() =>
    wbsAllocations.map((item) => {
      const plannedH = Number(item.total_hours || 0);
      const actualH  = Number(item.actual_hours  || 0);
      const remainingH = Math.max(plannedH - actualH, 0);
      const compPct = Number(
        item.completion_percentage !== undefined
          ? item.completion_percentage
          : plannedH > 0 ? Math.min(Math.round((actualH / plannedH) * 100), 100) : 0
      );
      const statusRaw = String(item.status || '').toLowerCase().trim();

      // Derive human-readable status label
      let statusLabel = 'Planned';
      if (compPct >= 100 || statusRaw === 'completed')                        statusLabel = 'Completed';
      else if (statusRaw === 'active' || statusRaw === '1' || item.status == 1) statusLabel = 'Active';
      else if (statusRaw === 'planned')                                         statusLabel = 'Planned';
      else if (statusRaw === 'delayed')                                         statusLabel = 'Delayed';
      else if (statusRaw === 'on-hold' || statusRaw === 'on hold')             statusLabel = 'On Hold';
      else if (statusRaw === 'cancelled')                                       statusLabel = 'Cancelled';
      else if (statusRaw === 'inactive' || statusRaw === '0' || item.status == 0) statusLabel = 'Inactive';

      return {
        ...item,
        _plannedH:   plannedH,
        _actualH:    actualH,
        _remainingH: remainingH,
        _compPct:    compPct,
        _statusLabel: statusLabel,
        _startDate:  item.start_date ? item.start_date.split('T')[0] : '',
        _endDate:    item.end_date   ? item.end_date.split('T')[0]   : '',
      };
    }),
  [wbsAllocations]);

  type EnrichedWBS = (typeof tableData)[0];

  return (
    <div className="page-body">
      {/* Header & Title */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Briefcase size={24} style={{ color: '#6366f1' }} /> Project Master / Manage Project Work
          </h1>
          <p className="page-subtitle">View and manage project work details, WBS allocations, and log time sheets.</p>
        </div>
      </div>

      {/* Select Project & Details Header Card */}
      <div className="glass-card mb-6" style={{ padding: '1.25rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
        <div style={{ flex: '1 1 300px', maxWidth: '500px' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'block' }}>Project Name</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : '')}
            className="form-select"
            style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 500 }}
          >
            <option value="">-- Choose Project --</option>
            {projects.map((p) => (
              <option key={p.project_id} value={p.project_id}>
                {p.project_name}
              </option>
            ))}
          </select>
        </div>

        {selectedProject && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>Project Ref</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedProject.project_code || `PRJ-${selectedProject.project_id}`}</span>
              {selectedProject.project_date && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                  {selectedProject.project_date.split('T')[0]}
                </span>
              )}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>Client Name</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedProject.client_name || 'Standard Client'}</span>
            </div>
          </div>
        )}
      </div>

      {/* 4 Premium Metric Cards Grid */}
      {selectedProject && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Total WBS</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalDisciplines}</div>
            </div>
            <div style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={24} />
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Total Planned Hours</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {totalPlannedHours.toLocaleString('en-US', { minimumFractionDigits: 0 })} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>hrs</span>
              </div>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={24} />
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Total Actual Hours</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {totalActualHours.toLocaleString('en-US', { minimumFractionDigits: 0 })} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>hrs</span>
              </div>
            </div>
            <div style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Upload size={24} />
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Overall Progress</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>{overallProgress}%</div>
            </div>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart3 size={24} />
            </div>
          </div>
        </div>
      )}

      {/* Project Work Details — DataTable */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden', marginBottom: '1.5rem' }}>

        {/* Card header */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center',
          justifyContent: 'space-between', gap: '0.75rem',
          padding: '1.1rem 1.5rem', borderBottom: '1px solid var(--border-color)',
        }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={18} style={{ color: '#6366f1' }} /> Project Work Details
          </h2>
          {selectedProjectId && canManage && (
            <button
              onClick={handleOpenAddModal}
              className="btn btn-primary"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', padding: '0.5rem 1.25rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', border: 'none' }}
            >
              + Add New WBS
            </button>
          )}
        </div>

        {/* DataTable */}
        <div style={{ padding: '1rem 1.25rem' }}>
          <DataTable<EnrichedWBS>
            data={tableData}
            isLoading={loading}
            searchPlaceholder="Search by WBS name, status, dates…"
            exportFilename="project_work_wbs"
            defaultPageSize={15}
            pageSizeOptions={[10, 15, 25, 50, 100]}
            columns={[
              {
                header: 'No.',
                sortable: false,
                excludeFromCSV: true,
                csvAccessor: (r) => String(tableData.indexOf(r) + 1),
                accessor: (r) => (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 500 }}>
                    {tableData.indexOf(r) + 1}
                  </span>
                ),
              },
              {
                header: 'WBS Name',
                sortKey: 'wbs_name',
                csvAccessor: (r) => r.wbs_name || '',
                accessor: (r) => (
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{r.wbs_name}</div>
                    {r.wbs_code && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>{r.wbs_code}</div>
                    )}
                  </div>
                ),
              },
              {
                header: 'Plan Start',
                sortKey: '_startDate',
                csvAccessor: (r) => r._startDate || '-',
                accessor: (r) => (
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {r._startDate || '-'}
                  </span>
                ),
              },
              {
                header: 'Plan End',
                sortKey: '_endDate',
                csvAccessor: (r) => r._endDate || '-',
                accessor: (r) => (
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {r._endDate || '-'}
                  </span>
                ),
              },
              {
                header: 'Plan Hrs',
                sortKey: '_plannedH',
                csvAccessor: (r) => r._plannedH,
                accessor: (r) => (
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{r._plannedH}</span>
                ),
              },
              {
                header: 'Actual Hrs',
                sortKey: '_actualH',
                csvAccessor: (r) => r._actualH,
                accessor: (r) => (
                  <span style={{ fontWeight: 700, color: '#10b981' }}>{r._actualH}</span>
                ),
              },
              {
                header: 'Remaining Hrs',
                sortKey: '_remainingH',
                csvAccessor: (r) => r._remainingH,
                accessor: (r) => (
                  <span style={{ fontWeight: 600, color: r._remainingH === 0 ? '#10b981' : 'var(--text-secondary)' }}>
                    {r._remainingH}
                  </span>
                ),
              },
              {
                header: 'Comp %',
                sortKey: '_compPct',
                csvAccessor: (r) => `${r._compPct}%`,
                accessor: (r) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '90px' }}>
                    <div style={{ flex: 1, height: '5px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden', minWidth: '40px' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(r._compPct, 100)}%`,
                        background: r._compPct >= 100 ? '#10b981' : r._compPct >= 60 ? '#6366f1' : '#f59e0b',
                        borderRadius: '3px',
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                    <span style={{ fontWeight: 700, color: '#6366f1', fontSize: '0.82rem', whiteSpace: 'nowrap', minWidth: '38px' }}>
                      {r._compPct}%
                    </span>
                  </div>
                ),
              },
              {
                header: 'Status',
                sortKey: '_statusLabel',
                csvAccessor: (r) => r._statusLabel,
                accessor: (r) => {
                  const colorMap: Record<string, { color: string; bg: string; border: string }> = {
                    Completed: { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)'  },
                    Active:    { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.3)'   },
                    Planned:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
                    Delayed:   { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)'  },
                    'On Hold': { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.3)' },
                    Cancelled: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)'  },
                    Inactive:  { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.3)' },
                  };
                  const s = colorMap[r._statusLabel] || colorMap['Planned'];
                  return (
                    <span style={{
                      color: s.color, background: s.bg, border: `1px solid ${s.border}`,
                      padding: '0.22rem 0.6rem', borderRadius: '6px',
                      fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap', display: 'inline-block',
                    }}>
                      {r._statusLabel}
                    </span>
                  );
                },
              },
            ] as Column<EnrichedWBS>[]}
            actions={(row) => (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                {canManage && (
                  <button
                    onClick={() => handleOpenEdit(row)}
                    title="Edit WBS"
                    style={{ background: '#3b82f6', color: '#fff', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                  >
                    <Edit size={13} />
                  </button>
                )}
                <button
                  onClick={() => handleOpenTimesheet(row)}
                  title="Log Time Sheet"
                  style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#6366f1', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', cursor: 'pointer', flexShrink: 0 }}
                >
                  <CalendarDays size={13} />
                </button>
                {canManage && (
                  <button
                    onClick={() => handleOpenDelete(row)}
                    title="Remove WBS"
                    style={{ background: '#ef4444', color: '#fff', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            )}
          />
        </div>
      </div>

      {/* Modal - Discipline Form (Add) */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 className="flex items-center gap-2 text-lg font-bold" style={{ color: '#0f172a' }}>
                WBS Form
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="modal-close-btn"><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ paddingTop: '1rem' }}>
              <form onSubmit={handleSaveAdd} className="flex-col gap-4">
                {/* WBS Name */}
                <div className="form-group mb-3">
                  <label className="form-label text-xs font-semibold mb-1 block">WBS Name <span className="text-danger">*</span></label>
                  <select
                    required
                    value={addForm.wbs_id}
                    onChange={(e) => setAddForm({ ...addForm, wbs_id: e.target.value })}
                    className="form-select"
                    style={{ borderRadius: '6px' }}
                  >
                    <option value="">Select WBS</option>
                    {availableMasterWbs.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.wbs_name} ({m.wbs_code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Plan Start & End Date */}
                <div className="form-group mb-3">
                  <label className="form-label text-xs font-semibold mb-1 block">Plan Start & End Date</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="date"
                      value={addForm.start_date}
                      onChange={(e) => setAddForm({ ...addForm, start_date: e.target.value })}
                      className="form-input"
                      style={{ borderRadius: '6px', flex: 1 }}
                    />
                    <span style={{ background: '#818cf8', color: '#ffffff', padding: '0.4rem 0.8rem', borderRadius: '4px', fontWeight: 600, fontSize: '0.85rem' }}>
                      to
                    </span>
                    <input
                      type="date"
                      value={addForm.end_date}
                      onChange={(e) => setAddForm({ ...addForm, end_date: e.target.value })}
                      className="form-input"
                      style={{ borderRadius: '6px', flex: 1 }}
                    />
                  </div>
                </div>

                {/* Plan Hrs */}
                <div className="form-group mb-3">
                  <label className="form-label text-xs font-semibold mb-1 block">Plan Hrs.</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="e.g. 10"
                    value={addForm.total_hours}
                    onChange={(e) => setAddForm({ ...addForm, total_hours: Number(e.target.value) })}
                    className="form-input"
                    style={{ borderRadius: '6px' }}
                  />
                </div>

                {/* Actual Start & End Date */}
                <div className="form-group mb-3">
                  <label className="form-label text-xs font-semibold mb-1 block">Actual Start & End Date</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="date"
                      value={addForm.actual_start_date}
                      onChange={(e) => setAddForm({ ...addForm, actual_start_date: e.target.value })}
                      className="form-input"
                      style={{ borderRadius: '6px', flex: 1 }}
                    />
                    <span style={{ background: '#818cf8', color: '#ffffff', padding: '0.4rem 0.8rem', borderRadius: '4px', fontWeight: 600, fontSize: '0.85rem' }}>
                      to
                    </span>
                    <input
                      type="date"
                      value={addForm.actual_end_date}
                      onChange={(e) => setAddForm({ ...addForm, actual_end_date: e.target.value })}
                      className="form-input"
                      style={{ borderRadius: '6px', flex: 1 }}
                    />
                  </div>
                </div>

                {/* Actual Hrs */}
                <div className="form-group mb-4">
                  <label className="form-label text-xs font-semibold mb-1 block">Actual Hrs.</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="e.g. 0"
                    value={addForm.actual_hours}
                    onChange={(e) => setAddForm({ ...addForm, actual_hours: Number(e.target.value) })}
                    className="form-input"
                    style={{ borderRadius: '6px' }}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="btn"
                    style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: '#475569', padding: '0.5rem 1.25rem', borderRadius: '6px' }}
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || availableMasterWbs.length === 0}
                    className="btn"
                    style={{ background: '#f43f5e', color: '#ffffff', padding: '0.5rem 1.5rem', borderRadius: '6px', fontWeight: 600, border: 'none' }}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Discipline Form (Edit) */}
      {editingWbs && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 className="flex items-center gap-2 text-lg font-bold" style={{ color: '#0f172a' }}>
                WBS Form
              </h3>
              <button onClick={() => setEditingWbs(null)} className="modal-close-btn"><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ paddingTop: '1rem' }}>
              <form onSubmit={handleSaveEdit} className="flex-col gap-4">
                {/* WBS Name (Disabled on Edit) */}
                <div className="form-group mb-3">
                  <label className="form-label text-xs font-semibold mb-1 block">WBS Name</label>
                  <input
                    type="text"
                    disabled
                    readOnly
                    value={editingWbs.wbs_name || ''}
                    className="form-input"
                    style={{ background: '#f1f5f9', color: '#334155', cursor: 'not-allowed', borderRadius: '6px', fontWeight: 500 }}
                  />
                </div>

                {/* Plan Start & End Date */}
                <div className="form-group mb-3">
                  <label className="form-label text-xs font-semibold mb-1 block">Plan Start & End Date</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="date"
                      disabled
                      readOnly
                      value={editForm.start_date}
                      onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                      className="form-input"
                      style={{ background: '#f1f5f9', color: '#334155', cursor: 'not-allowed', borderRadius: '6px', flex: 1 }}
                    />
                    <span style={{ background: '#818cf8', color: '#ffffff', padding: '0.4rem 0.8rem', borderRadius: '4px', fontWeight: 600, fontSize: '0.85rem' }}>
                      to
                    </span>
                    <input
                      type="date"
                      disabled
                      readOnly
                      value={editForm.end_date}
                      onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                      className="form-input"
                      style={{ background: '#f1f5f9', color: '#334155', cursor: 'not-allowed', borderRadius: '6px', flex: 1 }}
                    />
                  </div>
                </div>

                {/* Plan Hrs */}
                <div className="form-group mb-3">
                  <label className="form-label text-xs font-semibold mb-1 block">Plan Hrs.</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    disabled
                    readOnly
                    value={editForm.total_hours}
                    onChange={(e) => setEditForm({ ...editForm, total_hours: Number(e.target.value) })}
                    className="form-input"
                    style={{ background: '#f1f5f9', color: '#334155', cursor: 'not-allowed', borderRadius: '6px' }}
                  />
                </div>

                {/* Actual Start & End Date */}
                <div className="form-group mb-3">
                  <label className="form-label text-xs font-semibold mb-1 block">Actual Start & End Date</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="date"
                      value={editForm.actual_start_date}
                      onChange={(e) => setEditForm({ ...editForm, actual_start_date: e.target.value })}
                      className="form-input"
                      style={{ borderRadius: '6px', flex: 1 }}
                    />
                    <span style={{ background: '#818cf8', color: '#ffffff', padding: '0.4rem 0.8rem', borderRadius: '4px', fontWeight: 600, fontSize: '0.85rem' }}>
                      to
                    </span>
                    <input
                      type="date"
                      value={editForm.actual_end_date}
                      onChange={(e) => setEditForm({ ...editForm, actual_end_date: e.target.value })}
                      className="form-input"
                      style={{ borderRadius: '6px', flex: 1 }}
                    />
                  </div>
                </div>

                {/* Actual Hrs */}
                <div className="form-group mb-4">
                  <label className="form-label text-xs font-semibold mb-1 block">Actual Hrs.</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={editForm.actual_hours}
                    onChange={(e) => setEditForm({ ...editForm, actual_hours: Number(e.target.value) })}
                    className="form-input"
                    style={{ borderRadius: '6px' }}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <button
                    type="button"
                    onClick={() => setEditingWbs(null)}
                    className="btn"
                    style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: '#475569', padding: '0.5rem 1.25rem', borderRadius: '6px' }}
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn"
                    style={{ background: '#f43f5e', color: '#ffffff', padding: '0.5rem 1.5rem', borderRadius: '6px', fontWeight: 600, border: 'none' }}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Delete */}
      {deletingWbs && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="flex items-center gap-2 text-danger">
                <ShieldAlert size={18} /> Remove WBS
              </h3>
              <button onClick={() => setDeletingWbs(null)} className="modal-close-btn"><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p className="font-semibold text-sm mb-4">{deletingWbs.wbs_name}</p>
              
              {checkingDeps ? (
                <div className="flex justify-center p-4">Loading dependencies...</div>
              ) : dependencyInfo?.hasDependencies ? (
                <div className="flex-col gap-3">
                  <div style={{ padding: '1rem', background: 'var(--warning-bg)', borderRadius: 'var(--radius-md)', color: 'var(--warning)' }}>
                    <div className="font-bold flex items-center gap-2 mb-2">
                      <AlertTriangle size={16} /> Active Dependencies Found
                    </div>
                    <p style={{ fontSize: '0.85rem' }}>Cannot remove this WBS cleanly because active records depend on it:</p>
                    <ul style={{ paddingLeft: '1.5rem', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                      {dependencyInfo.taskCount > 0 && <li><strong>{dependencyInfo.taskCount}</strong> associated task(s)</li>}
                      {dependencyInfo.timesheetCount > 0 && <li><strong>{dependencyInfo.timesheetCount}</strong> timesheet log(s)</li>}
                      {dependencyInfo.labourAttendanceCount > 0 && <li><strong>{dependencyInfo.labourAttendanceCount}</strong> labour attendance record(s)</li>}
                    </ul>
                  </div>
                  <p className="text-xs text-muted mt-2">Are you sure you want to force remove this WBS? Linked items will lose their WBS reference.</p>
                </div>
              ) : (
                <p className="text-sm">Are you sure you want to remove <strong>{deletingWbs.wbs_name}</strong> from this project?</p>
              )}
              
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setDeletingWbs(null)} className="btn btn-outline-grey" style={{ padding: '0.5rem 1rem', borderRadius: '6px' }}>Cancel</button>
                <button type="button" disabled={isSubmitting} onClick={() => handleConfirmDelete(dependencyInfo?.hasDependencies || false)} className="btn btn-primary" style={{ background: '#ef4444', padding: '0.5rem 1.5rem', borderRadius: '6px' }}>
                  {isSubmitting ? 'Removing...' : dependencyInfo?.hasDependencies ? 'Force Remove' : 'Confirm Remove'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Log Time Sheet */}
      {timesheetWbs && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 className="flex items-center gap-2 text-lg font-bold" style={{ color: '#0f172a' }}>
                Log Time Sheet
              </h3>
              <button onClick={() => setTimesheetWbs(null)} className="modal-close-btn"><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ paddingTop: '1rem' }}>
              <form onSubmit={handleSaveTimesheet} className="flex-col gap-4">
                {/* Project Name */}
                <div className="form-group mb-3">
                  <label className="form-label text-xs font-semibold mb-1 block">Project Name</label>
                  <input
                    type="text"
                    disabled
                    readOnly
                    value={selectedProject ? `${selectedProject.project_code || `P0${selectedProject.project_id}`} ${selectedProject.project_name}` : ''}
                    className="form-input"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-color)', cursor: 'not-allowed', borderRadius: '6px', fontWeight: 600 }}
                  />
                </div>
                {/* WBS Name */}
                <div className="form-group mb-3">
                  <label className="form-label text-xs font-semibold mb-1 block">WBS Name</label>
                  <input
                    type="text"
                    disabled
                    readOnly
                    value={timesheetWbs.wbs_name || ''}
                    className="form-input"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-color)', cursor: 'not-allowed', borderRadius: '6px', fontWeight: 600 }}
                  />
                </div>

                {/* Choose Task Name (Searchable Combobox) */}
                <div className="form-group mb-3">
                  <label className="form-label text-xs font-semibold mb-1 block">Choose Task Name (optional)</label>
                  <TaskCombobox
                    projectId={selectedProjectId}
                    wbsId={timesheetWbs.id || timesheetWbs.wbs_id}
                    selectedTaskId={timesheetForm.task_id}
                    tasks={availableTasks.map((t) => ({
                      id: t.task_id,
                      name: t.task_name,
                      project_id: t.project_id,
                      wbs_id: t.wbs_id,
                    }))}
                    onSelectTask={(sel) => setTimesheetForm({ ...timesheetForm, task_id: sel ? String(sel.id) : '' })}
                    onTaskCreated={(newTask) => {
                      setAvailableTasks((prev) => [
                        ...prev,
                        {
                          task_id: newTask.id,
                          task_name: newTask.name,
                          project_id: newTask.project_id,
                          wbs_id: newTask.wbs_id,
                        } as Task,
                      ]);
                      setTimesheetForm({ ...timesheetForm, task_id: String(newTask.id) });
                    }}
                    placeholder="Search task or type to create new..."
                  />
                  <span className="text-xs text-muted mt-1 block" style={{ fontSize: '0.7rem' }}>
                    * If no task is selected or a new task is typed, it will be automatically created under Project + WBS.
                  </span>
                </div>

                {/* Employee Name */}
                <div className="form-group mb-3">
                  <label className="form-label text-xs font-semibold mb-1 block">Employee Name <span className="text-danger">*</span></label>
                  <select
                    required
                    value={timesheetForm.employee_id}
                    onChange={(e) => setTimesheetForm({ ...timesheetForm, employee_id: e.target.value })}
                    className="form-select"
                    style={{ borderRadius: '6px' }}
                  >
                    <option value="">-- Select Employee --</option>
                    {employees.map((emp) => (
                      <option key={emp.employee_id} value={emp.employee_id}>
                        {emp.name} ({emp.employee_code || `EMP0${emp.employee_id}`})
                      </option>
                    ))}
                  </select>
                </div>
                {/* Log Date & Work HRs */}
                <div className="grid-2-col mb-4">
                  <div className="form-group mb-0">
                    <label className="form-label text-xs font-semibold mb-1 block">Log Date <span className="text-danger">*</span></label>
                    <input
                      type="date"
                      required
                      value={timesheetForm.log_date}
                      onChange={(e) => setTimesheetForm({ ...timesheetForm, log_date: e.target.value })}
                      className="form-input"
                      style={{ borderRadius: '6px' }}
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label text-xs font-semibold mb-1 block">Work HRs. <span className="text-danger">*</span></label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      placeholder="e.g. 6"
                      value={timesheetForm.working_hours}
                      onChange={(e) => setTimesheetForm({ ...timesheetForm, working_hours: e.target.value })}
                      className="form-input"
                      style={{ borderRadius: '6px' }}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setTimesheetWbs(null)}
                    className="btn btn-outline-grey"
                    style={{ padding: '0.5rem 1.25rem', borderRadius: '6px' }}
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isLoggingTimesheet}
                    className="btn btn-primary"
                    style={{ background: '#f43f5e', color: '#ffffff', padding: '0.5rem 1.5rem', borderRadius: '6px', fontWeight: 600, border: 'none' }}
                  >
                    {isLoggingTimesheet ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
