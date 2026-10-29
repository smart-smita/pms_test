import React, { useState, useEffect, useMemo } from 'react';
import {
  Briefcase,
  Layers,
  Clock,
  CheckCircle2,
  TrendingUp,
  BarChart2,
  ChevronDown,
  ChevronUp,
  Building2,
  LayoutList,
  AlertTriangle,
} from 'lucide-react';
import { apiService } from '../services/api';
import { ProjectWorkRow } from '../types';
import { ReportHeader, ReportSummaryCards, ReportActionFooter } from '../components/reports';
import { exportReportToCSV, printReport } from '../utils/reportExport';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

type ReportRow = ProjectWorkRow;

export const ProjectWorkReport: React.FC = () => {
  const [reportData, setReportData] = useState<ReportRow[]>([]);
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);

  // Filter state
  const [selectedProject, setSelectedProject] = useState<string | number>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

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

  // Filter data by status if specified
  const filteredData = useMemo(() => {
    if (!statusFilter) return reportData;
    return reportData.filter((r) => {
      const s = (r.task_status || '').toLowerCase();
      if (statusFilter === 'completed') return s === 'completed';
      if (statusFilter === 'in_progress') return s.includes('progress');
      if (statusFilter === 'delayed') return s.includes('delayed');
      if (statusFilter === 'pending') return s.includes('pending') || s === 'open';
      return true;
    });
  }, [reportData, statusFilter]);

  // Group data by Project -> WBS Discipline
  const grouped: Record<string, Record<string, ReportRow[]>> = useMemo(() => {
    const map: Record<string, Record<string, ReportRow[]>> = {};
    filteredData.forEach((row) => {
      const projName = row.project_name || 'Unassigned Project';
      const wbsName = row.wbs_name || 'General / Unallocated WBS';
      if (!map[projName]) map[projName] = {};
      if (!map[projName][wbsName]) map[projName][wbsName] = [];
      map[projName][wbsName].push(row);
    });
    return map;
  }, [filteredData]);

  const toggleWbsGroup = (key: string) => setExpandedWbs((p) => ({ ...p, [key]: !p[key] }));
  const toggleProject = (key: string) => setExpandedProjects((p) => ({ ...p, [key]: !p[key] }));

  const resetFilters = () => {
    setSelectedProject('');
    setStartDate('');
    setEndDate('');
    setStatusFilter('');
  };

  // Calculate executive metrics
  const totalProjects = Object.keys(grouped).length;
  const totalTasks = filteredData.length;
  const totalEstHours = filteredData.reduce((acc, r) => acc + Number(r.estimated_hours || 0), 0);
  const totalActHours = filteredData.reduce((acc, r) => acc + Number(r.actual_hours || 0), 0);
  const completedTasksCount = filteredData.filter((r) => r.task_status === 'completed').length;
  const inProgressTasksCount = filteredData.filter((r) => (r.task_status || '').includes('progress')).length;
  const delayedTasksCount = filteredData.filter((r) => (r.task_status || '').includes('delayed')).length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

  // Chart data: Project-level estimated vs actual hours
  const chartData = useMemo(() => {
    return Object.entries(grouped).map(([projName, wbsDict]) => {
      const allRows = Object.values(wbsDict).flat();
      const est = allRows.reduce((sum, r) => sum + Number(r.estimated_hours || 0), 0);
      const act = allRows.reduce((sum, r) => sum + Number(r.actual_hours || 0), 0);
      return {
        name: projName.length > 18 ? `${projName.substring(0, 16)}...` : projName,
        'Est. Hours': Number(est.toFixed(1)),
        'Act. Hours': Number(act.toFixed(1)),
      };
    });
  }, [grouped]);

  // Export handlers
  const handleExportCsv = () => {
    const exportColumns = [
      { label: 'Project Name', key: 'project_name' },
      { label: 'WBS / Discipline', key: 'wbs_name' },
      { label: 'Task Name', key: 'task_name' },
      { label: 'Primary Employee', key: 'assigned_employee_name' },
      { label: 'Required Workers', key: 'required_worker_count' },
      { label: 'Estimated Hours', accessor: (r: any) => Number(r.estimated_hours || 0).toFixed(2) },
      { label: 'Actual Hours', accessor: (r: any) => Number(r.actual_hours || 0).toFixed(2) },
      { label: 'Status', key: 'task_status' },
    ];

    exportReportToCSV({
      title: 'Project Work & Discipline Progress Report',
      subtitle: 'Task-level tracking, labor hours and delivery progress',
      filename: 'project_work_report',
      columns: exportColumns,
      data: filteredData,
      summaryMetrics: [
        { label: 'Total Projects', value: totalProjects },
        { label: 'Total Tasks', value: totalTasks },
        { label: 'Completion Rate', value: `${completionPercentage}%` },
        { label: 'Total Estimated Hours', value: `${totalEstHours.toFixed(1)} hrs` },
        { label: 'Total Actual Hours', value: `${totalActHours.toFixed(1)} hrs` },
      ],
      filtersApplied: {
        Project: projects.find((p) => String(p.id) === String(selectedProject))?.name || 'All Projects',
        'Date Range': startDate && endDate ? `${startDate} to ${endDate}` : 'All Dates',
        Status: statusFilter || 'All Statuses',
      },
    });
  };

  const handlePrintPdf = () => {
    const printColumns = [
      { label: 'Project', key: 'project_name' },
      { label: 'Discipline', key: 'wbs_name' },
      { label: 'Task', key: 'task_name' },
      { label: 'Assigned Staff', key: 'assigned_employee_name' },
      { label: 'Est. Hours', accessor: (r: any) => Number(r.estimated_hours || 0).toFixed(1) },
      { label: 'Act. Hours', accessor: (r: any) => Number(r.actual_hours || 0).toFixed(1) },
      { label: 'Status', key: 'task_status' },
    ];

    printReport({
      title: 'Project Work & Discipline Progress Report',
      subtitle: 'Generated from PMS Real-Time Database',
      filename: 'project_work_report',
      columns: printColumns,
      data: filteredData,
      summaryMetrics: [
        { label: 'Projects', value: totalProjects },
        { label: 'Total Tasks', value: totalTasks },
        { label: 'Completion', value: `${completionPercentage}%` },
        { label: 'Est. Hours', value: `${totalEstHours.toFixed(1)}h` },
        { label: 'Act. Hours', value: `${totalActHours.toFixed(1)}h` },
      ],
    });
  };

  // Identify overrun tasks for alerts
  const overrunTasks = filteredData.filter(
    (t) => Number(t.actual_hours || 0) > Number(t.estimated_hours || 0) && Number(t.estimated_hours || 0) > 0
  );

  return (
    <div className="page-body">
      {/* 1. Header with Filters & Working Export Buttons */}
      <ReportHeader
        title="Project Work & Progress Report"
        subtitle="Comprehensive breakdown by project, discipline, tasks, and estimated vs. actual hours logged."
        icon={Briefcase}
        badgeText="Progress & Timesheets"
        onResetFilters={resetFilters}
        onExportCsv={handleExportCsv}
        onPrintPdf={handlePrintPdf}
        filters={[
          {
            key: 'project',
            label: 'Project',
            type: 'select',
            value: selectedProject,
            onChange: setSelectedProject,
            options: [
              { value: '', label: 'All Projects' },
              ...projects.map((p) => ({ value: p.id, label: p.name })),
            ],
          },
          {
            key: 'status',
            label: 'Task Status',
            type: 'select',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: '', label: 'All Statuses' },
              { value: 'completed', label: 'Completed' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'pending', label: 'Pending / Open' },
              { value: 'delayed', label: 'Delayed' },
            ],
          },
          {
            key: 'from',
            label: 'From Date',
            type: 'date',
            value: startDate,
            onChange: setStartDate,
          },
          {
            key: 'to',
            label: 'To Date',
            type: 'date',
            value: endDate,
            onChange: setEndDate,
          },
        ]}
      />

      {/* 2. 5 Key Summary Metric Cards */}
      <ReportSummaryCards
        cards={[
          {
            title: 'Active Projects',
            value: totalProjects,
            subtitle: 'Across selected filters',
            icon: Building2,
            variant: 'primary',
          },
          {
            title: 'Total Tasks',
            value: totalTasks,
            subtitle: `${completedTasksCount} done, ${inProgressTasksCount} in progress`,
            icon: LayoutList,
            variant: 'info',
          },
          {
            title: 'Completion Rate',
            value: `${completionPercentage}%`,
            subtitle: `${completedTasksCount} of ${totalTasks} completed`,
            icon: TrendingUp,
            variant: completionPercentage >= 75 ? 'success' : 'warning',
            trendText: `${delayedTasksCount} delayed`,
            trendType: delayedTasksCount > 0 ? 'negative' : 'positive',
          },
          {
            title: 'Estimated Hours',
            value: `${Math.round(totalEstHours)}h`,
            subtitle: 'Total planned effort',
            icon: Clock,
            variant: 'neutral',
          },
          {
            title: 'Actual Hours Logged',
            value: `${Math.round(totalActHours)}h`,
            subtitle:
              totalActHours > totalEstHours
                ? `+${Math.round(totalActHours - totalEstHours)}h over plan`
                : `${Math.round(totalEstHours - totalActHours)}h remaining`,
            icon: Clock,
            variant: totalActHours > totalEstHours ? 'danger' : 'success',
            trendText: totalActHours > totalEstHours ? 'Over budget' : 'On schedule',
            trendType: totalActHours > totalEstHours ? 'negative' : 'positive',
          },
        ]}
      />

      {/* 3. Purposeful Visual Progress Chart */}
      {chartData.length > 0 && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Project Effort: Estimated vs. Actual Hours Logged
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Visual audit of resource consumption against baseline work estimates
            </p>
          </div>
          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="Est. Hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Act. Hours" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 4. Detailed Data Table (Project -> WBS -> Task Drill-Down) */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.75rem',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: '1.05rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Layers size={18} style={{ color: '#6366f1' }} /> Projects, Disciplines & Tasks Breakdown
          </h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Showing {filteredData.length} total tasks
          </span>
        </div>

        {loading ? (
          <div
            style={{
              padding: '3rem',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              background: 'var(--bg-card)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
            }}
          >
            Loading report data...
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div
            style={{
              padding: '3rem',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              background: 'var(--bg-card)',
              borderRadius: '8px',
              border: '1px dashed var(--border-color)',
            }}
          >
            No work report data available matching current filters.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Object.entries(grouped).map(([projectName, wbsGroups], pIdx) => {
              const allProjectRows = Object.values(wbsGroups).flat();
              const projectLevelEst = allProjectRows.reduce((a, b) => a + Number(b.estimated_hours || 0), 0);
              const projectLevelAct = allProjectRows.reduce((a, b) => a + Number(b.actual_hours || 0), 0);
              const pPct = projectLevelEst > 0 ? Math.round((projectLevelAct / projectLevelEst) * 100) : 0;
              const isProjExpanded = expandedProjects[projectName] !== false;

              const colors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];
              const accentColor = colors[pIdx % colors.length];

              return (
                <div
                  key={projectName}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderLeft: `4px solid ${accentColor}`,
                    borderRadius: '10px',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  {/* Project Header Row */}
                  <div
                    onClick={() => toggleProject(projectName)}
                    style={{
                      padding: '0.9rem 1.25rem',
                      background: 'var(--bg-primary)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      borderBottom: isProjExpanded ? '1px solid var(--border-color)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          background: `${accentColor}20`,
                          color: accentColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                        }}
                      >
                        {String(pIdx + 1).padStart(2, '0')}
                      </div>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {projectName}
                      </h4>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '999px',
                          background: `${accentColor}15`,
                          color: accentColor,
                          fontWeight: 600,
                        }}
                      >
                        {allProjectRows.length} tasks
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.82rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Est: </span>
                        <strong style={{ color: 'var(--text-primary)' }}>{projectLevelEst.toFixed(1)}h</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Act: </span>
                        <strong style={{ color: projectLevelAct > projectLevelEst ? '#ef4444' : '#10b981' }}>
                          {projectLevelAct.toFixed(1)}h
                        </strong>
                      </div>
                      <div style={{ minWidth: '100px' }}>
                        <div
                          style={{
                            height: '6px',
                            background: 'rgba(150,150,150,0.2)',
                            borderRadius: '3px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${Math.min(100, pPct)}%`,
                              background: accentColor,
                            }}
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                      >
                        {isProjExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* WBS Subsections */}
                  {isProjExpanded && (
                    <div style={{ padding: '0.75rem 1.25rem' }}>
                      {Object.entries(wbsGroups).map(([wbsName, rows]) => {
                        const groupKey = `${projectName}_${wbsName}`;
                        const isExpanded = expandedWbs[groupKey] !== false;
                        const totalEst = rows.reduce((acc, r) => acc + Number(r.estimated_hours || 0), 0);
                        const totalAct = rows.reduce((acc, r) => acc + Number(r.actual_hours || 0), 0);

                        return (
                          <div
                            key={groupKey}
                            style={{
                              marginBottom: '0.75rem',
                              border: '1px solid var(--border-color)',
                              borderRadius: '8px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              onClick={() => toggleWbsGroup(groupKey)}
                              style={{
                                padding: '0.6rem 1rem',
                                background: 'var(--bg-card)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                                borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Layers size={15} style={{ color: '#6366f1' }} />
                                <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                                  {wbsName}
                                </span>
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    padding: '0.1rem 0.4rem',
                                    borderRadius: '4px',
                                    background: 'var(--bg-primary)',
                                    color: 'var(--text-secondary)',
                                  }}
                                >
                                  {rows.length} tasks
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.78rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>
                                  Est: <strong>{totalEst.toFixed(1)}h</strong> | Act: <strong>{totalAct.toFixed(1)}h</strong>
                                </span>
                                {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                              </div>
                            </div>

                            {isExpanded && (
                              <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                                  <thead>
                                    <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
                                      <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Task Name</th>
                                      <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Assigned Employee</th>
                                      <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Workers</th>
                                      <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Est. Hours</th>
                                      <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Actual Logged</th>
                                      <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {rows.map((row) => (
                                      <tr
                                        key={row.task_id}
                                        style={{ borderBottom: '1px solid var(--border-color)' }}
                                      >
                                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                          {row.task_name}
                                        </td>
                                        <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)' }}>
                                          {row.assigned_employee_name || 'Unassigned'}
                                        </td>
                                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                          {row.required_worker_count || 1}
                                        </td>
                                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: 'var(--text-primary)' }}>
                                          {Number(row.estimated_hours || 0).toFixed(2)}h
                                        </td>
                                        <td
                                          style={{
                                            padding: '0.5rem 0.75rem',
                                            textAlign: 'right',
                                            fontWeight: 600,
                                            color:
                                              Number(row.actual_hours || 0) > Number(row.estimated_hours || 0) &&
                                              Number(row.estimated_hours || 0) > 0
                                                ? '#ef4444'
                                                : 'var(--text-primary)',
                                          }}
                                        >
                                          {Number(row.actual_hours || 0).toFixed(2)}h
                                        </td>
                                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                                          <span
                                            style={{
                                              fontSize: '0.72rem',
                                              padding: '0.15rem 0.5rem',
                                              borderRadius: '999px',
                                              fontWeight: 600,
                                              background:
                                                row.task_status === 'completed'
                                                  ? 'rgba(16, 185, 129, 0.12)'
                                                  : (row.task_status || '').includes('progress')
                                                  ? 'rgba(59, 130, 246, 0.12)'
                                                  : (row.task_status || '').includes('delayed')
                                                  ? 'rgba(239, 68, 68, 0.12)'
                                                  : 'rgba(245, 158, 11, 0.12)',
                                              color:
                                                row.task_status === 'completed'
                                                  ? '#10b981'
                                                  : (row.task_status || '').includes('progress')
                                                  ? '#3b82f6'
                                                  : (row.task_status || '').includes('delayed')
                                                  ? '#ef4444'
                                                  : '#f59e0b',
                                            }}
                                          >
                                            {row.task_status || 'Pending'}
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
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Summary & Recommended Next Actions */}
      <ReportActionFooter
        situation={`Tracking ${totalTasks} tasks across ${totalProjects} projects. Overall progress is at ${completionPercentage}%, with ${Math.round(totalActHours)} actual work hours logged against ${Math.round(totalEstHours)} planned estimated hours.`}
        completedSummary={`${completedTasksCount} tasks fully completed and signed off.`}
        pendingSummary={`${inProgressTasksCount} tasks actively underway, ${delayedTasksCount} tasks currently behind schedule.`}
        alerts={
          overrunTasks.length > 0
            ? [
                {
                  text: `${overrunTasks.length} tasks have exceeded estimated labor hours (e.g. ${overrunTasks.slice(0, 2).map((t) => `"${t.task_name}"`).join(', ')}).`,
                  severity: 'warning',
                },
                ...(delayedTasksCount > 0
                  ? [{ text: `${delayedTasksCount} tasks are marked as delayed past their milestone dates.`, severity: 'danger' as const }]
                  : []),
              ]
            : []
        }
        recommendations={[
          delayedTasksCount > 0
            ? 'Reallocate labor and site supervisors to the delayed tasks to recover scheduled milestones.'
            : 'Continue milestone execution according to the active work baseline.',
          overrunTasks.length > 0
            ? 'Review productivity and timesheet logs on tasks exceeding planned hours to avoid margin erosion.'
            : 'Timesheet logging is aligned with planned budget hours.',
          'Export weekly CSV progress summary for customer progress billing meetings.',
        ]}
      />
    </div>
  );
};
