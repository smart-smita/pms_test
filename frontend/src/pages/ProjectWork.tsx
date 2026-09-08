import React, { useState, useEffect } from 'react';
import { Briefcase, Layers, Clock, CheckCircle, Edit, Plus, Trash2, AlertTriangle, ShieldAlert, X, ChevronRight, ChevronDown, Filter, RotateCcw, FileSpreadsheet, FileText, BarChart3, Upload, Search, Maximize2, CalendarDays, Link } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { Project, ProjectWBS, MasterWBS, Task, Employee } from '../types';
import { showSuccess, showError } from '../utils/toast';

export const ProjectWork: React.FC = () => {
  const { user } = useAuth();
  const canManage = user?.role_name === 'Admin' || user?.role_name === 'Super Admin' || user?.role_name === 'Manager';

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [wbsAllocations, setWbsAllocations] = useState<ProjectWBS[]>([]);
  const [masterWbsList, setMasterWbsList] = useState<MasterWBS[]>([]);
  const [loading, setLoading] = useState(false);

  // Subnav Tab State
  const [activeTab, setActiveTab] = useState<'disciplines' | 'allocation' | 'gantt' | 'dependency' | 'summary'>('disciplines');

  // Filter & Search State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Applied Filters (for Apply button functionality)
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    statusFilter: '',
    levelFilter: '',
    fromDate: '',
    toDate: '',
  });

  // Tree Expand / Collapse State
  const [expandedNodes, setExpandedNodes] = useState<Record<string | number, boolean>>({});

  // Add Allocation Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    wbs_id: '',
    start_date: '',
    end_date: '',
    total_hours: 0,
    note: '',
  });

  // Edit Modal State
  const [editingWbs, setEditingWbs] = useState<ProjectWBS | null>(null);
  const [editForm, setEditForm] = useState({
    start_date: '',
    end_date: '',
    total_hours: 0,
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
        const initialExpanded: Record<string | number, boolean> = {};
        res.data.forEach((item) => { initialExpanded[item.id] = true; });
        setExpandedNodes(initialExpanded);
      }
    } catch (err) {
      console.error('Error loading project WBS allocations:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleNodeExpand = (id: string | number) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleExpandAll = () => {
    const allExpanded = Object.values(expandedNodes).every(Boolean);
    const updated: Record<string | number, boolean> = {};
    wbsAllocations.forEach((item) => { updated[item.id] = !allExpanded; });
    setExpandedNodes(updated);
  };

  const applyFilters = () => {
    setAppliedFilters({
      search,
      statusFilter,
      levelFilter,
      fromDate,
      toDate,
    });
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setLevelFilter('');
    setFromDate('');
    setToDate('');
    setAppliedFilters({ search: '', statusFilter: '', levelFilter: '', fromDate: '', toDate: '' });
  };

  const handleOpenAddModal = () => {
    setAddForm({ wbs_id: '', start_date: '', end_date: '', total_hours: 0, note: '' });
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !addForm.wbs_id) {
      showError('Please select a valid WBS discipline');
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
        note: addForm.note || undefined,
      });
      if (res.success) {
        showSuccess('WBS Discipline allocated successfully');
        setIsAddModalOpen(false);
        fetchProjectWbs(Number(selectedProjectId));
      } else {
        showError(res.message || 'Failed to allocate WBS discipline');
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
        showSuccess('WBS planned details updated successfully');
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
        showSuccess('WBS Discipline allocation removed successfully');
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

  const availableMasterWbs = masterWbsList.filter((m) => !wbsAllocations.some((alloc) => alloc.wbs_id === m.id));

  const filteredAllocations = wbsAllocations.filter((item) => {
    if (appliedFilters.search.trim()) {
      const term = appliedFilters.search.toLowerCase();
      const matchName = item.wbs_name?.toLowerCase().includes(term);
      const matchCode = item.wbs_code?.toLowerCase().includes(term);
      if (!matchName && !matchCode) return false;
    }
    if (appliedFilters.statusFilter) {
      const isActive = item.status == 1 || String(item.status).toLowerCase() === 'active' || String(item.status).toLowerCase() === '1';
      if (appliedFilters.statusFilter === 'active' && !isActive) return false;
      if (appliedFilters.statusFilter === 'inactive' && isActive) return false;
    }
    // Note: level mapping logic could go here if `item.level` was defined
    return true;
  });

  return (
    <div className="page-body">
      {/* Header & Title */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Briefcase size={24} style={{ color: '#6366f1' }} /> Project Master / Manage Project Work
          </h1>
          <p className="page-subtitle">View and manage project work details, discipline allocations, and log time sheets.</p>
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
                {p.project_code || `P0${p.project_id}`} - {p.project_name}
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
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Total Disciplines</span>
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

      {/* Project Work Details - Disciplines List Table */}
      <div className="glass-card mb-6" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={20} style={{ color: '#6366f1' }} /> Project Work Details
          </h2>
          {selectedProjectId && canManage && (
            <button
              onClick={handleOpenAddModal}
              className="btn btn-primary"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', padding: '0.5rem 1.25rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', border: 'none' }}
            >
              + Add New Discipline
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Loading disciplines...</div>
        ) : filteredAllocations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            No discipline records found for this project.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table className="minimal-table" style={{ width: '100%', minWidth: '850px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'left', width: '50px' }}>No.</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Discipline Name</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Plan Start Date</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Plan End Date</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Plan HRs</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Actual Start Date</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Actual End Date</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actual HRs</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAllocations.map((item, idx) => {
                  const isActive = item.status == 1 || String(item.status).toLowerCase() === 'active' || String(item.status).toLowerCase() === '1';
                  const plannedH = Number(item.total_hours || 0);
                  const actualH = Number(item.actual_hours || 0);

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{idx + 1}</td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-primary)', fontWeight: 600 }}>{item.wbs_name}</td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{item.start_date ? item.start_date.split('T')[0] : '-'}</td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{item.end_date ? item.end_date.split('T')[0] : '-'}</td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>{plannedH}</td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{item.actual_start_date ? item.actual_start_date.split('T')[0] : '-'}</td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{item.actual_end_date ? item.actual_end_date.split('T')[0] : '-'}</td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 700, color: '#10b981' }}>{actualH}</td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <span style={{
                          color: isActive ? '#10b981' : '#ef4444',
                          background: isActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                          {canManage && (
                            <button
                              onClick={() => handleOpenEdit(item)}
                              title="Edit Discipline"
                              style={{ background: '#3b82f6', color: '#fff', padding: '0.4rem 0.5rem', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                            >
                              <Edit size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenTimesheet(item)}
                            title="Log Time Sheet"
                            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.4rem 0.5rem', borderRadius: '6px', cursor: 'pointer' }}
                          >
                            <CalendarDays size={14} />
                          </button>
                          {canManage && (
                            <button
                              onClick={() => handleOpenDelete(item)}
                              title="Remove Discipline"
                              style={{ background: '#ef4444', color: '#fff', padding: '0.4rem 0.5rem', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal - Allocate WBS */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="flex items-center gap-2">
                <Plus size={18} style={{ color: '#8b5cf6' }} /> Allocate WBS Discipline
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="modal-close-btn"><X size={18} /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSaveAdd} className="flex-col gap-4">
                <div className="form-group mb-4">
                  <label className="form-label text-xs">Select WBS Discipline <span className="text-danger">*</span></label>
                  <select required value={addForm.wbs_id} onChange={(e) => setAddForm({ ...addForm, wbs_id: e.target.value })} className="form-input" style={{ borderRadius: '8px' }}>
                    <option value="">-- Choose Master WBS --</option>
                    {availableMasterWbs.map((m) => <option key={m.id} value={m.id}>{m.wbs_name} ({m.wbs_code})</option>)}
                  </select>
                </div>
                <div className="grid-2-col mb-4">
                  <div className="form-group mb-0">
                    <label className="form-label text-xs">Plan Start Date</label>
                    <input type="date" value={addForm.start_date} onChange={(e) => setAddForm({ ...addForm, start_date: e.target.value })} className="form-input" style={{ borderRadius: '8px' }} />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label text-xs">Plan End Date</label>
                    <input type="date" value={addForm.end_date} onChange={(e) => setAddForm({ ...addForm, end_date: e.target.value })} className="form-input" style={{ borderRadius: '8px' }} />
                  </div>
                </div>
                <div className="form-group mb-4">
                  <label className="form-label text-xs">Planned Total Hours</label>
                  <input type="number" step="0.5" required value={addForm.total_hours} onChange={(e) => setAddForm({ ...addForm, total_hours: Number(e.target.value) })} className="form-input" style={{ borderRadius: '8px' }} />
                </div>
                <div className="form-group mb-4">
                  <label className="form-label text-xs">Planning Notes</label>
                  <textarea rows={3} value={addForm.note} onChange={(e) => setAddForm({ ...addForm, note: e.target.value })} className="form-input" style={{ borderRadius: '8px' }} placeholder="Additional notes or specifications..." />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-outline-grey" style={{ padding: '0.5rem 1rem', borderRadius: '6px' }}>Cancel</button>
                  <button type="submit" disabled={isSubmitting || availableMasterWbs.length === 0} className="btn btn-primary" style={{ background: '#8b5cf6', padding: '0.5rem 1.5rem', borderRadius: '6px' }}>
                    {isSubmitting ? 'Allocating...' : 'Allocate WBS'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Edit Plan */}
      {editingWbs && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="flex items-center gap-2">
                <Edit size={18} style={{ color: '#8b5cf6' }} /> Edit Plan - {editingWbs.wbs_name}
              </h3>
              <button onClick={() => setEditingWbs(null)} className="modal-close-btn"><X size={18} /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSaveEdit} className="flex-col gap-4">
                <div className="grid-2-col mb-4">
                  <div className="form-group mb-0">
                    <label className="form-label text-xs">Plan Start Date</label>
                    <input type="date" value={editForm.start_date} onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })} className="form-input" style={{ borderRadius: '8px' }} />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label text-xs">Plan End Date</label>
                    <input type="date" value={editForm.end_date} onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })} className="form-input" style={{ borderRadius: '8px' }} />
                  </div>
                </div>
                <div className="form-group mb-4">
                  <label className="form-label text-xs">Planned Total Hours</label>
                  <input type="number" step="0.5" required value={editForm.total_hours} onChange={(e) => setEditForm({ ...editForm, total_hours: Number(e.target.value) })} className="form-input" style={{ borderRadius: '8px' }} />
                </div>
                <div className="form-group mb-4">
                  <label className="form-label text-xs">Planning Notes</label>
                  <textarea rows={3} value={editForm.note} onChange={(e) => setEditForm({ ...editForm, note: e.target.value })} className="form-input" style={{ borderRadius: '8px' }} />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setEditingWbs(null)} className="btn btn-outline-grey" style={{ padding: '0.5rem 1rem', borderRadius: '6px' }}>Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ background: '#8b5cf6', padding: '0.5rem 1.5rem', borderRadius: '6px' }}>
                    {isSubmitting ? 'Saving...' : 'Save WBS Plan'}
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
                <ShieldAlert size={18} /> Remove WBS Discipline
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
                    <p style={{ fontSize: '0.85rem' }}>Cannot remove this WBS discipline cleanly because active records depend on it:</p>
                    <ul style={{ paddingLeft: '1.5rem', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                      {dependencyInfo.taskCount > 0 && <li><strong>{dependencyInfo.taskCount}</strong> associated task(s)</li>}
                      {dependencyInfo.timesheetCount > 0 && <li><strong>{dependencyInfo.timesheetCount}</strong> timesheet log(s)</li>}
                      {dependencyInfo.labourAttendanceCount > 0 && <li><strong>{dependencyInfo.labourAttendanceCount}</strong> labour attendance record(s)</li>}
                    </ul>
                  </div>
                  <p className="text-xs text-muted mt-2">Are you sure you want to force remove this WBS discipline? Linked items will lose their WBS reference.</p>
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
                {/* Discipline Name */}
                <div className="form-group mb-3">
                  <label className="form-label text-xs font-semibold mb-1 block">Discipline Name</label>
                  <input
                    type="text"
                    disabled
                    readOnly
                    value={timesheetWbs.wbs_name || ''}
                    className="form-input"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-color)', cursor: 'not-allowed', borderRadius: '6px', fontWeight: 600 }}
                  />
                </div>
                {/* Choose Task Name (optional) */}
                <div className="form-group mb-3">
                  <label className="form-label text-xs font-semibold mb-1 block">Choose Task Name (optional)</label>
                  <select
                    value={timesheetForm.task_id}
                    onChange={(e) => setTimesheetForm({ ...timesheetForm, task_id: e.target.value })}
                    className="form-select"
                    style={{ borderRadius: '6px' }}
                  >
                    <option value="">-- Select Task --</option>
                    {availableTasks.map((t) => (
                      <option key={t.task_id} value={t.task_id}>
                        {t.task_name}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-muted mt-1 block" style={{ fontSize: '0.7rem' }}>
                    * If no task is selected, a new task will be automatically created in Task Management.
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
                      step="0.5"
                      min="0.1"
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
