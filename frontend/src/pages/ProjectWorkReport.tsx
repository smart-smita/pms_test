import React, { useState, useEffect } from 'react';
import { Briefcase, Layers, Clock, CheckCircle2, TrendingUp, BarChart2, ChevronDown, ChevronUp, Download, RotateCcw, Building2, LayoutList, FileText } from 'lucide-react';
import { apiService } from '../services/api';
import { ProjectWorkRow } from '../types';

type ReportRow = ProjectWorkRow;

export const ProjectWorkReport: React.FC = () => {
  const [reportData, setReportData] = useState<ReportRow[]>([]);
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);
  
  // Filter state
  const [selectedProject, setSelectedProject] = useState<string | number>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [expandedWbs, setExpandedWbs] = useState<Record<string, boolean>>({});
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchData();
  }, [selectedProject, startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const projRes = await apiService.get<any[]>('/projects');
      if (projRes.data) {
        setProjects(projRes.data.map((p) => ({ id: p.project_id, name: p.project_name })));
      }

      const res = await apiService.get<ReportRow[]>('/reports/project-work', {
        project_id: selectedProject || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      if (res.data) {
        setReportData(res.data);
        const initExpWbs: Record<string, boolean> = {};
        const initExpProj: Record<string, boolean> = {};
        res.data.forEach((r) => {
          const projName = r.project_name || 'Unassigned Project';
          initExpProj[projName] = true;
          const key = `${projName}_${r.wbs_name || 'General'}`;
          initExpWbs[key] = true;
        });
        setExpandedWbs(initExpWbs);
        setExpandedProjects(initExpProj);
      }
    } catch (err) {
      console.error('Error fetching project work report:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group data by Project -> WBS Discipline
  const grouped: Record<string, Record<string, ReportRow[]>> = {};
  reportData.forEach((row) => {
    const projName = row.project_name || 'Unassigned Project';
    const wbsName = row.wbs_name || 'General / Unallocated WBS';
    if (!grouped[projName]) grouped[projName] = {};
    if (!grouped[projName][wbsName]) grouped[projName][wbsName] = [];
    grouped[projName][wbsName].push(row);
  });

  const toggleWbsGroup = (key: string) => setExpandedWbs((p) => ({ ...p, [key]: !p[key] }));
  const toggleProject = (key: string) => setExpandedProjects((p) => ({ ...p, [key]: !p[key] }));

  const resetFilters = () => {
    setSelectedProject('');
    setStartDate('');
    setEndDate('');
  };

  // Calculate executive metrics
  const totalProjects = Object.keys(grouped).length;
  const totalTasks = reportData.length;
  const totalEstHours = reportData.reduce((acc, r) => acc + Number(r.estimated_hours || 0), 0);
  const totalActHours = reportData.reduce((acc, r) => acc + Number(r.actual_hours || 0), 0);
  const completedTasksCount = reportData.filter((r) => r.task_status === 'completed').length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

  return (
    <div className="page-body">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="flex items-center gap-2" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
            <Briefcase size={24} style={{ color: '#0f172a' }} />
            Project Work & Discipline Report
          </h1>
          <p className="text-muted text-sm mt-1">
            Comprehensive breakdown by project, discipline, tasks, estimated vs actual hours.
          </p>
        </div>
        <button className="btn btn-outline-purple" style={{ padding: '0.6rem 1rem', borderRadius: '8px', background: '#fff' }}>
          Export Report <Download size={14} className="ml-2" style={{ display: 'inline' }} />
        </button>
      </div>

      {/* Filter Panel */}
      <div className="report-filter-panel">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 font-bold text-sm" style={{ color: '#8b5cf6' }}>
            <FilterIcon /> Filters & Selection
          </div>
          <button onClick={resetFilters} className="btn btn-outline-grey" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '6px' }}>
            <RotateCcw size={12} className="mr-1" style={{ display: 'inline' }} /> Reset All
          </button>
        </div>
        <div className="grid-3-col gap-4">
          <div>
            <label className="form-label text-xs font-semibold text-muted uppercase">Project</label>
            <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="form-select" style={{ borderRadius: '8px', padding: '0.6rem 1rem' }}>
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label text-xs font-semibold text-muted uppercase">From Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="form-input" style={{ borderRadius: '8px', padding: '0.6rem 1rem' }} />
          </div>
          <div>
            <label className="form-label text-xs font-semibold text-muted uppercase">To Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="form-input" style={{ borderRadius: '8px', padding: '0.6rem 1rem' }} />
          </div>
        </div>
      </div>

      {/* 5 Premium Metric Cards */}
      <div className="report-metric-grid">
        <div className="report-metric-card">
          <div className="report-metric-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
            <Building2 size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: '#0f172a' }}>{totalProjects}</div>
            <div className="font-bold text-sm" style={{ color: '#0f172a' }}>Projects</div>
            <div className="text-xs text-muted">Total Projects</div>
          </div>
        </div>
        <div className="report-metric-card">
          <div className="report-metric-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <LayoutList size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: '#0f172a' }}>{totalTasks}</div>
            <div className="font-bold text-sm" style={{ color: '#0f172a' }}>Tasks</div>
            <div className="text-xs text-muted">Total Tasks</div>
          </div>
        </div>
        <div className="report-metric-card">
          <div className="report-metric-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: '#0f172a' }}>{totalEstHours}h</div>
            <div className="font-bold text-sm" style={{ color: '#0f172a' }}>Estimated Hours</div>
            <div className="text-xs text-muted">Total Estimated</div>
          </div>
        </div>
        <div className="report-metric-card">
          <div className="report-metric-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: '#0f172a' }}>{totalActHours}h</div>
            <div className="font-bold text-sm" style={{ color: '#0f172a' }}>Actual Hours</div>
            <div className="text-xs text-muted">Total Logged</div>
          </div>
        </div>
        <div className="report-metric-card">
          <div className="report-metric-icon" style={{ background: 'rgba(217, 70, 239, 0.1)', color: '#d946ef' }}>
            <TrendingUp size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="text-2xl font-bold" style={{ color: '#0f172a' }}>{completionPercentage}%</div>
            <div className="font-bold text-sm" style={{ color: '#0f172a' }}>Completion Rate</div>
            <div className="text-xs text-muted">Overall Progress</div>
          </div>
        </div>
      </div>

      {/* Report Summary */}
      <div className="report-summary-panel">
        <h3 className="font-bold flex items-center gap-2 mb-2" style={{ color: '#0f172a' }}>
          <BarChart2 size={18} className="text-primary" /> Report Summary
        </h3>
        <div className="report-summary-grid">
          <div>
            <div className="report-summary-item">
              <Building2 size={18} className="text-muted" style={{ marginTop: '2px' }} />
              <div>
                <div className="text-xs font-semibold text-muted">Projects Count</div>
                <div className="font-bold">{totalProjects} Projects</div>
              </div>
            </div>
            <div className="report-summary-item">
              <LayoutList size={18} className="text-muted" style={{ marginTop: '2px' }} />
              <div>
                <div className="text-xs font-semibold text-muted">Tasks Count</div>
                <div className="font-bold">{totalTasks} Tasks</div>
              </div>
            </div>
            <div className="report-summary-item">
              <CheckCircle2 size={18} className="text-muted" style={{ marginTop: '2px' }} />
              <div>
                <div className="text-xs font-semibold text-muted">Estimated vs Actual Hours</div>
                <div className="font-bold">Est: {totalEstHours}h | Act: {totalActHours}h</div>
              </div>
            </div>
          </div>
          <div>
            <div className="report-summary-item">
              <Clock size={18} className="text-muted" style={{ marginTop: '2px' }} />
              <div>
                <div className="text-xs font-semibold text-muted">Total Estimated Hours</div>
                <div className="font-bold">{totalEstHours}h</div>
              </div>
            </div>
            <div className="report-summary-item">
              <Clock size={18} className="text-muted" style={{ marginTop: '2px' }} />
              <div>
                <div className="text-xs font-semibold text-muted">Total Actual Hours Logged</div>
                <div className="font-bold">{totalActHours}h</div>
              </div>
            </div>
            <div className="report-summary-item">
              <TrendingUp size={18} className="text-muted" style={{ marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <div className="text-xs font-semibold text-muted">Overall Task Completion Rate</div>
                <div className="flex items-center gap-4 mt-1">
                  <div className="progress-container flex-1">
                    <div className="progress-bar-bg" style={{ width: '100%', height: '8px' }}>
                      <div className="progress-bar-fill" style={{ width: `${completionPercentage}%`, background: '#8b5cf6' }}></div>
                    </div>
                  </div>
                  <span className="font-bold text-sm">{completionPercentage}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 font-bold" style={{ color: '#0f172a' }}>
        <FileText size={18} /> Projects, Disciplines & Tasks
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted font-bold">Loading report data...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="p-12 text-center text-muted font-bold border border-dashed rounded-lg" style={{ borderColor: 'var(--border-color)' }}>No work report data available matching criteria.</div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([projectName, wbsGroups], pIdx) => {
            const projectLevelEst = Object.values(wbsGroups).flatMap(r => r).reduce((a, b) => a + Number(b.estimated_hours || 0), 0);
            const projectLevelAct = Object.values(wbsGroups).flatMap(r => r).reduce((a, b) => a + Number(b.actual_hours || 0), 0);
            const pPct = projectLevelEst > 0 ? Math.round((projectLevelAct / projectLevelEst) * 100) : 0;
            
            // Try to extract project code from first row
            const firstRow = Object.values(wbsGroups)[0]?.[0];
            const pCode = firstRow ? (firstRow as any).project_code || 'PRJ-CODE' : 'PRJ-CODE';
            
            // Assign a left border color based on index
            const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#d946ef'];
            const borderColor = colors[pIdx % colors.length];

            const isProjExpanded = expandedProjects[projectName] !== false;

            return (
              <div key={projectName} className="report-project-card" style={{ borderLeft: `4px solid ${borderColor}` }}>
                {/* Project Header */}
                <div className="report-project-header cursor-pointer" onClick={() => toggleProject(projectName)}>
                  <div className="flex items-center gap-4">
                    <div className="report-project-number" style={{ background: `${borderColor}20`, color: borderColor }}>
                      {String(pIdx + 1).padStart(2, '0')}
                    </div>
                    <h2 className="font-bold text-lg" style={{ color: '#0f172a' }}>{projectName}</h2>
                    <span className="badge-level" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>{pCode}</span>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <div>
                      <div className="text-xs text-muted font-semibold">Est. Hours</div>
                      <div className="font-bold">{projectLevelEst}h</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted font-semibold">Act. Hours</div>
                      <div className="font-bold">{projectLevelAct}h</div>
                    </div>
                    <div style={{ width: '120px' }}>
                      <div className="text-xs text-muted font-semibold">Progress</div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{pPct}%</span>
                        <div className="progress-container flex-1">
                          <div className="progress-bar-bg" style={{ width: '100%', height: '6px' }}>
                            <div className="progress-bar-fill" style={{ width: `${Math.min(100, pPct)}%`, background: borderColor }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button className="icon-btn ml-2">
                      {isProjExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>
                </div>

                {/* WBS Groups */}
                {isProjExpanded && Object.entries(wbsGroups).map(([wbsName, rows]) => {
                  const groupKey = `${projectName}_${wbsName}`;
                  const isExpanded = expandedWbs[groupKey] !== false;
                  const totalEst = rows.reduce((acc, r) => acc + Number(r.estimated_hours || 0), 0);
                  const totalAct = rows.reduce((acc, r) => acc + Number(r.actual_hours || 0), 0);

                  return (
                    <div key={groupKey} className="report-wbs-group">
                      <div className="report-wbs-header cursor-pointer" onClick={() => toggleWbsGroup(groupKey)}>
                        <div className="flex items-center gap-3">
                          <Layers size={18} className="text-primary" />
                          <span className="font-bold">{wbsName}</span>
                          <span className="badge-level" style={{ background: '#e2e8f0', color: '#64748b' }}>{rows.length} Task{rows.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-6">
                           <div className="flex items-center gap-2 text-sm font-semibold">
                             <Clock size={14} className="text-muted" /> Est: {totalEst}h
                           </div>
                           <div className="flex items-center gap-2 text-sm font-semibold">
                             <Clock size={14} className="text-muted" /> Act: {totalAct}h
                           </div>
                           {isExpanded ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="overflow-x-auto">
                          <table className="report-table">
                            <thead>
                              <tr>
                                <th>Task Name</th>
                                <th>Assigned Primary Employee</th>
                                <th style={{ textAlign: 'center' }}>Required Workers</th>
                                <th style={{ textAlign: 'right' }}>Est. Hours</th>
                                <th style={{ textAlign: 'right' }}>Actual Hours Logged</th>
                                <th style={{ textAlign: 'center' }}>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rows.map((row) => (
                                <tr key={row.task_id}>
                                  <td className="font-semibold">{row.task_name}</td>
                                  <td>{row.assigned_employee_name || 'Auto-Assigned'}</td>
                                  <td style={{ textAlign: 'center' }}>{row.required_worker_count}</td>
                                  <td style={{ textAlign: 'right' }}>{Number(row.estimated_hours || 0).toFixed(2)}h</td>
                                  <td style={{ textAlign: 'right' }}>{Number(row.actual_hours || 0).toFixed(2)}h</td>
                                  <td style={{ textAlign: 'center' }}>
                                    <span
                                      className="badge-level"
                                      style={{
                                        background: row.task_status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : row.task_status === 'in-progress' || row.task_status === 'in progress' ? 'rgba(59, 130, 246, 0.1)' : row.task_status === 'delayed' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                        color: row.task_status === 'completed' ? '#10b981' : row.task_status === 'in-progress' || row.task_status === 'in progress' ? '#3b82f6' : row.task_status === 'delayed' ? '#ef4444' : '#f59e0b',
                                      }}
                                    >
                                      {row.task_status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
      
      <div className="flex justify-center mt-6 items-center gap-2 text-xs text-muted font-semibold">
        <CheckCircle2 size={14} /> Note: Estimated vs Actual hours are in Hours.
      </div>
    </div>
  );
};

// Filter icon wrapper
const FilterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
  </svg>
);
