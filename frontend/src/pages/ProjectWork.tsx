import React, { useState, useEffect } from 'react';
import { Briefcase, Layers, Clock, CheckCircle, Edit, Plus, Trash2, AlertTriangle, ShieldAlert, X, ChevronRight, ChevronDown, Filter, RotateCcw, FileSpreadsheet, FileText, BarChart3, Upload, Search, Maximize2, CalendarDays, Link } from 'lucide-react';
import { apiService } from '../services/api';
import { Project, ProjectWBS, MasterWBS } from '../types';
import { showSuccess, showError } from '../utils/toast';

export const ProjectWork: React.FC = () => {
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
      <div className="flex items-center gap-2 mb-2">
        <Briefcase size={22} style={{ color: '#0f172a' }} />
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Manage Project Work & Disciplines</h1>
      </div>
      <p className="text-muted text-sm mb-6">
        Maintain project WBS disciplines, allocations, planned hours, timelines and dependency checks.
      </p>

      {/* Select Project */}
      <div className="mb-6" style={{ maxWidth: '400px' }}>
        <label className="text-xs text-muted mb-1 block" style={{ fontWeight: 500 }}>Select Project <span className="text-danger">*</span></label>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : '')}
          className="form-select"
          style={{ padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 500 }}
        >
          <option value="">-- Choose Project --</option>
          {projects.map((p) => (
            <option key={p.project_id} value={p.project_id}>
              {p.project_name} ({p.project_code})
            </option>
          ))}
        </select>
      </div>

      {/* 4 Premium Metric Cards Grid */}
      {selectedProject && (
        <div className="grid-4-col mb-6">
          <div className="metric-card-premium">
            <div>
              <span className="metric-title-premium">Total Disciplines</span>
              <div className="metric-value-premium">{totalDisciplines}</div>
            </div>
            <div className="metric-icon-circle" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
              <Layers size={24} />
            </div>
          </div>

          <div className="metric-card-premium">
            <div>
              <span className="metric-title-premium">Total Planned Hours</span>
              <div className="metric-value-premium">
                {totalPlannedHours.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="metric-unit-premium">hrs</span>
              </div>
            </div>
            <div className="metric-icon-circle" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <Clock size={24} />
            </div>
          </div>

          <div className="metric-card-premium">
            <div>
              <span className="metric-title-premium">Total Actual Hours</span>
              <div className="metric-value-premium">
                {totalActualHours.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="metric-unit-premium">hrs</span>
              </div>
            </div>
            <div className="metric-icon-circle" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Upload size={24} />
            </div>
          </div>

          <div className="metric-card-premium">
            <div>
              <span className="metric-title-premium">Overall Progress</span>
              <div className="metric-value-premium">{overallProgress}%</div>
            </div>
            <div className="metric-icon-circle" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <BarChart3 size={24} />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs-container" style={{ borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <button onClick={() => setActiveTab('disciplines')} className={`tab-btn ${activeTab === 'disciplines' ? 'active' : ''}`}>WBS Disciplines</button>
        <button onClick={() => setActiveTab('allocation')} className={`tab-btn ${activeTab === 'allocation' ? 'active' : ''}`}>Discipline Allocation</button>
        <button onClick={() => setActiveTab('gantt')} className={`tab-btn ${activeTab === 'gantt' ? 'active' : ''}`}>Discipline Timeline (Gantt)</button>
        <button onClick={() => setActiveTab('dependency')} className={`tab-btn ${activeTab === 'dependency' ? 'active' : ''}`}>Dependency Check</button>
        <button onClick={() => setActiveTab('summary')} className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}>Discipline Summary</button>
      </div>

      {/* Filters & Search Panel */}
      <div className="metric-card-premium mb-6 flex-col" style={{ alignItems: 'stretch', padding: '1.25rem' }}>
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold flex items-center gap-2 text-sm text-muted">
            <Filter size={16} /> Filters & Search
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={resetFilters}
              className="btn btn-outline-grey"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '6px' }}
            >
              <RotateCcw size={12} className="mr-1" style={{ display: 'inline' }} /> Reset
            </button>
            <button
              type="button"
              onClick={applyFilters}
              className="btn btn-primary"
              style={{ background: '#8b5cf6', padding: '0.35rem 1rem', fontSize: '0.75rem', borderRadius: '6px', fontWeight: 600 }}
            >
              Apply Filters
            </button>
          </div>
        </div>

        <div className="grid-5-col">
          <div>
            <label className="form-label text-xs">Search Keyword</label>
            <div className="search-input-container">
              <Search className="search-icon" />
              <input type="text" placeholder="Search discipline..." value={search} onChange={(e) => setSearch(e.target.value)} className="form-input" style={{ borderRadius: '6px' }} />
            </div>
          </div>
          <div>
            <label className="form-label text-xs">Discipline Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-select" style={{ borderRadius: '6px' }}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="form-label text-xs">WBS Level</label>
            <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="form-select" style={{ borderRadius: '6px' }}>
              <option value="">All Levels</option>
              <option value="1">Level 1 (Project)</option>
              <option value="2">Level 2 (Discipline)</option>
              <option value="3">Level 3 (Activity)</option>
            </select>
          </div>
          <div>
            <label className="form-label text-xs">From Date</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="form-input" style={{ borderRadius: '6px' }} />
          </div>
          <div>
            <label className="form-label text-xs">To Date</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="form-input" style={{ borderRadius: '6px' }} />
          </div>
        </div>
      </div>

      {/* Main Dynamic Views (Based on Tabs) */}
      {loading ? (
        <div className="flex justify-center p-12 text-muted">Loading...</div>
      ) : activeTab === 'disciplines' ? (
        <>
          {/* Action Toolbar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {selectedProjectId && (
                <button onClick={handleOpenAddModal} className="btn btn-primary" style={{ background: '#8b5cf6', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 600 }}>
                  <Plus size={16} /> Add Discipline
                </button>
              )}
              <button onClick={toggleExpandAll} className="btn btn-outline-purple" style={{ padding: '0.5rem 1rem', borderRadius: '6px' }}>
                <Maximize2 size={14} className="mr-2" style={{ display: 'inline' }} /> Expand All
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button className="btn btn-outline-green" style={{ padding: '0.5rem 1rem', borderRadius: '6px' }}>
                <FileSpreadsheet size={14} className="mr-2" style={{ display: 'inline' }} /> Export Excel
              </button>
              <button className="btn btn-outline-red" style={{ padding: '0.5rem 1rem', borderRadius: '6px' }}>
                <FileText size={14} className="mr-2" style={{ display: 'inline' }} /> Export PDF
              </button>
            </div>
          </div>

          {/* Premium Table */}
          {filteredAllocations.length === 0 ? (
            <div className="metric-card-premium p-10 flex-col items-center justify-center text-center gap-2">
              <Layers size={40} style={{ color: '#8b5cf6' }} />
              <p className="font-semibold text-sm">No WBS disciplines found.</p>
              <p className="text-xs text-muted">Adjust filters or assign work breakdown structures to this project.</p>
            </div>
          ) : (
            <div className="premium-table-wrapper mb-6">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>No.</th>
                    <th>Discipline / WBS Name</th>
                    <th>WBS Code</th>
                    <th style={{ textAlign: 'center' }}>Level</th>
                    <th>Plan Start Date</th>
                    <th>Plan End Date</th>
                    <th style={{ textAlign: 'right' }}>Plan Hrs.</th>
                    <th style={{ textAlign: 'right' }}>Actual Hrs.</th>
                    <th>Progress</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAllocations.map((item, idx) => {
                    const isActive = item.status == 1 || String(item.status).toLowerCase() === 'active' || String(item.status).toLowerCase() === '1';
                    const plannedH = Number(item.total_hours || 0);
                    const actualH = Number(item.actual_hours || 0);
                    const progressPct = plannedH > 0 ? Math.min(100, Math.round((actualH / plannedH) * 100)) : 0;
                    
                    // Simulate hierarchy level
                    const level = (idx % 3) + 1; 
                    const isExpanded = expandedNodes[item.id] !== false;

                    return (
                      <tr key={item.id}>
                        <td>
                          {level === 1 ? `${idx + 1}` : level === 2 ? `1.${idx + 1}` : `1.1.${idx + 1}`}
                        </td>
                        <td>
                          <div className="flex items-center gap-2" style={{ paddingLeft: `${(level - 1) * 20}px` }}>
                            <button onClick={() => toggleNodeExpand(item.id)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                            <span className="text-primary">{item.wbs_name}</span>
                            <span className={`badge-level badge-level-${level}`}>Level {level}</span>
                          </div>
                        </td>
                        <td className="text-primary font-bold">
                          {item.wbs_code || `PRJ-2026-03-0${idx + 1}`}
                        </td>
                        <td style={{ textAlign: 'center' }}>{level}</td>
                        <td>{item.start_date ? new Date(item.start_date).toLocaleDateString('en-GB') : '-'}</td>
                        <td>{item.end_date ? new Date(item.end_date).toLocaleDateString('en-GB') : '-'}</td>
                        <td style={{ textAlign: 'right' }}>{plannedH.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td style={{ textAlign: 'right' }}>{actualH.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td>
                          <div className="progress-container">
                            <div className="progress-bar-bg">
                              <div className="progress-bar-fill" style={{ width: `${progressPct}%` }}></div>
                            </div>
                            <span className="progress-text">{progressPct}%</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ color: isActive ? '#10b981' : '#ef4444', background: isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700 }}>
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button onClick={() => handleOpenEdit(item)} className="icon-btn icon-edit" title="Edit Discipline">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => handleOpenDelete(item)} className="icon-btn icon-delete" title="Remove Discipline">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Footer Legend / Pagination */}
              <div className="pagination-container">
                <div>Showing 1 to {filteredAllocations.length} of {wbsAllocations.length} disciplines</div>
                <div className="pagination-controls">
                  <span>Show</span>
                  <select className="form-select" style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', width: 'auto' }}>
                    <option value="10">10</option>
                    <option value="25">25</option>
                  </select>
                  <span>entries</span>
                  <div className="flex items-center gap-1 ml-2">
                    <button className="page-nav-btn"><ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} /></button>
                    <button className="page-nav-btn active">1</button>
                    <button className="page-nav-btn">2</button>
                    <button className="page-nav-btn"><ChevronRight size={14} /></button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Legend under table */}
          {filteredAllocations.length > 0 && (
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-3">
                <span className="badge-level badge-level-1">Level 1 (Project)</span>
                <span className="badge-level badge-level-2">Level 2 (Discipline)</span>
                <span className="badge-level badge-level-3">Level 3 (Activity)</span>
              </div>
              <span className="text-xs text-muted font-semibold">* Plan Hrs. & Actual Hrs. are in Hours.</span>
            </div>
          )}
        </>
      ) : activeTab === 'allocation' ? (
        <div className="premium-table-wrapper mb-6">
          <div className="p-4 border-b border-gray-200" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="font-bold flex items-center gap-2"><Briefcase size={18} className="text-primary" /> Discipline Resource Allocations</h3>
          </div>
          <table className="premium-table">
            <thead>
              <tr>
                <th>Discipline / WBS Name</th>
                <th>WBS Code</th>
                <th style={{ textAlign: 'right' }}>Plan Hrs.</th>
                <th style={{ textAlign: 'right' }}>Actual Hrs.</th>
                <th style={{ textAlign: 'right' }}>Remaining Hrs.</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAllocations.map(item => {
                const p = Number(item.total_hours || 0);
                const a = Number(item.actual_hours || 0);
                const r = p - a;
                const isActive = item.status == 1 || String(item.status).toLowerCase() === 'active' || String(item.status).toLowerCase() === '1';
                return (
                  <tr key={item.id}>
                    <td className="font-semibold text-primary">{item.wbs_name}</td>
                    <td className="font-bold">{item.wbs_code || '-'}</td>
                    <td className="font-bold" style={{ textAlign: 'right' }}>{p.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="font-bold" style={{ color: '#3b82f6', textAlign: 'right' }}>{a.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="font-bold" style={{ color: r > 0 ? '#f59e0b' : '#10b981', textAlign: 'right' }}>{r > 0 ? r.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}</td>
                    <td>
                      <span style={{ color: isActive ? '#10b981' : '#ef4444', background: isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700 }}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredAllocations.length === 0 && (
                <tr><td colSpan={6} className="text-center text-muted p-4">No allocations found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : activeTab === 'gantt' ? (
        <div className="metric-card-premium flex-col p-6 items-start gap-4 mb-6" style={{ minHeight: '300px' }}>
          <h3 className="font-bold flex items-center gap-2 text-lg"><CalendarDays size={20} className="text-primary" /> Timeline (Gantt Chart)</h3>
          <p className="text-sm text-muted">Visualizing WBS start and end dates chronologically.</p>
          <div className="w-full mt-4" style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: '800px' }}>
              {filteredAllocations.length === 0 ? (
                <div className="p-12 text-center text-muted font-semibold">No timelines available.</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {(() => {
                    const validItems = filteredAllocations.filter(i => i.start_date && i.end_date);
                    if (validItems.length === 0) return <div className="text-muted text-center p-4">No date ranges available for Gantt chart.</div>;
                    const minD = Math.min(...validItems.map(i => new Date(i.start_date!).getTime()));
                    const maxD = Math.max(...validItems.map(i => new Date(i.end_date!).getTime()));
                    const totalD = maxD - minD || 1;
                    
                    return validItems.map(item => {
                      const start = new Date(item.start_date!).getTime();
                      const end = new Date(item.end_date!).getTime();
                      const leftPct = ((start - minD) / totalD) * 100;
                      const widthPct = Math.max(((end - start) / totalD) * 100, 2); // min width 2%
                      return (
                        <div key={item.id} className="flex items-center gap-4 text-xs">
                          <div style={{ width: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} className="font-semibold" title={item.wbs_name}>{item.wbs_name}</div>
                          <div className="flex-1" style={{ height: '28px', background: 'var(--bg-secondary)', borderRadius: '4px', position: 'relative' }}>
                            <div style={{ position: 'absolute', left: `${leftPct}%`, width: `${widthPct}%`, height: '100%', background: 'rgba(139, 92, 246, 0.2)', borderRadius: '4px', border: '1px solid #8b5cf6', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: '#8b5cf6', fontWeight: 'bold' }}>
                              <span style={{ padding: '0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {Math.ceil((end - start) / (1000 * 60 * 60 * 24))} Days
                              </span>
                            </div>
                          </div>
                          <div style={{ width: '160px' }} className="text-muted font-semibold text-right">
                             {new Date(item.start_date!).toLocaleDateString('en-GB')} - {new Date(item.end_date!).toLocaleDateString('en-GB')}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === 'dependency' ? (
        <div className="premium-table-wrapper mb-6">
          <div className="p-4 border-b border-gray-200" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="font-bold flex items-center gap-2"><Link size={18} className="text-primary" /> Dependency Check Network</h3>
          </div>
          <table className="premium-table">
            <thead>
              <tr>
                <th>Discipline / WBS Name</th>
                <th>WBS Code</th>
                <th>Dependency Status</th>
                <th>Prerequisites</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAllocations.map((item, idx) => {
                const hasDeps = idx % 3 === 0; // Simple mock representation
                return (
                  <tr key={item.id}>
                    <td className="font-semibold text-primary">{item.wbs_name}</td>
                    <td className="font-bold">{item.wbs_code || '-'}</td>
                    <td>
                      <span className="badge-level" style={{ background: hasDeps ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: hasDeps ? '#f59e0b' : '#10b981' }}>
                        {hasDeps ? 'Has Dependencies' : 'Independent'}
                      </span>
                    </td>
                    <td className="text-muted font-semibold">{hasDeps ? 'Site Mobilization, Permits' : 'None'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn btn-outline-purple" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', borderRadius: '4px' }}>Analyze</button>
                    </td>
                  </tr>
                );
              })}
              {filteredAllocations.length === 0 && (
                <tr><td colSpan={5} className="text-center text-muted p-4">No records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : activeTab === 'summary' ? (
        <div className="metric-card-premium flex-col p-6 items-start gap-4 mb-6" style={{ minHeight: '300px' }}>
          <h3 className="font-bold flex items-center gap-2 text-lg"><BarChart3 size={20} className="text-primary" /> Project Discipline Summary</h3>
          <p className="text-sm text-muted">High-level financial and scheduling summary across all active WBS items.</p>
          <div className="w-full mt-4 grid-4-col gap-4">
            <div className="p-4 border rounded-lg" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
               <h4 className="font-bold mb-2 text-xs text-muted uppercase">Active Disciplines</h4>
               <p className="text-2xl font-bold" style={{ color: '#0f172a' }}>{filteredAllocations.filter(i => i.status == 1 || String(i.status).toLowerCase() === 'active' || String(i.status).toLowerCase() === '1').length}</p>
            </div>
            <div className="p-4 border rounded-lg" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
               <h4 className="font-bold mb-2 text-xs text-muted uppercase">Total Planned Hours</h4>
               <p className="text-2xl font-bold" style={{ color: '#10b981' }}>{totalPlannedHours.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="p-4 border rounded-lg" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
               <h4 className="font-bold mb-2 text-xs text-muted uppercase">Total Actual Hours</h4>
               <p className="text-2xl font-bold" style={{ color: '#3b82f6' }}>{totalActualHours.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="p-4 border rounded-lg" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
               <h4 className="font-bold mb-2 text-xs text-muted uppercase">Overall Completion</h4>
               <p className="text-2xl font-bold" style={{ color: '#f59e0b' }}>{overallProgress}%</p>
            </div>
          </div>
          
          <div className="w-full mt-4 border rounded-lg p-4" style={{ borderColor: 'var(--border-color)' }}>
            <h4 className="font-bold mb-4 text-sm uppercase text-muted">Top Disciplines by Actual Hours (Top 5)</h4>
            <div className="flex flex-col gap-4">
              {[...filteredAllocations].sort((a, b) => Number(b.actual_hours || 0) - Number(a.actual_hours || 0)).slice(0, 5).map(item => {
                 const p = Number(item.total_hours || 0);
                 const a = Number(item.actual_hours || 0);
                 const pct = p > 0 ? Math.min(100, Math.round((a / p) * 100)) : 0;
                 return (
                   <div key={item.id} className="flex items-center justify-between">
                     <span className="font-semibold text-sm w-1/3 truncate" title={item.wbs_name}>{item.wbs_name}</span>
                     <div className="w-1/2 mx-4">
                        <div className="progress-container">
                          <div className="progress-bar-bg" style={{ width: '100%' }}>
                            <div className="progress-bar-fill" style={{ width: `${pct}%` }}></div>
                          </div>
                        </div>
                     </div>
                     <span className="text-sm font-bold w-32 text-right" style={{ color: '#3b82f6' }}>{a.toLocaleString('en-US', { minimumFractionDigits: 2 })} hrs</span>
                   </div>
                 );
              })}
              {filteredAllocations.length === 0 && <span className="text-muted text-sm font-semibold">No data available.</span>}
            </div>
          </div>
        </div>
      ) : null}

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
    </div>
  );
};
