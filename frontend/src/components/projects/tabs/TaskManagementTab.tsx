import React, { useState, useEffect } from 'react';
import { Task, Wbs } from '../../../types';
import { apiRequest } from '../../../services/api';
import { Button } from '../../common/Button';
import { Badge } from '../../common/Badge';
import { ProgressBar } from '../../common/ProgressBar';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { WbsTypeBadge } from '../../common/WbsTypeBadge';
import { exportToExcel } from '../../../utils/excelExport';
import { 
  Search, RotateCcw, Plus, Download, Eye, Edit, 
  User, CheckSquare, Calendar, ChevronLeft, ChevronRight 
} from 'lucide-react';

import { Tasks } from '../../../pages/Tasks';

interface TaskManagementTabProps {
  projectId: number;
  onNavigate: (page: string) => void;
}

export const TaskManagementTab: React.FC<TaskManagementTabProps> = ({
  projectId,
  onNavigate,
}) => {
  if (!projectId) {
    return <Tasks projectId={0} />;
  }

  const [tasks, setTasks] = useState<Task[]>([]);
  const [wbsList, setWbsList] = useState<Wbs[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filterSearch, setFilterSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterWbs, setFilterWbs] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const fetchTasks = async () => {
    setIsLoading(true);
    const taskUrl = projectId ? `/tasks?project_id=${projectId}` : '/tasks';
    const wbsUrl = projectId ? `/projects/${projectId}/wbs` : '/wbs'; // Assuming /wbs gets all WBS if global, or just omit if no endpoint
    
    // Instead of failing if /wbs doesn't exist globally, we handle gracefully.
    try {
      const [tRes, wRes] = await Promise.all([
        apiRequest<Task[]>(taskUrl),
        projectId ? apiRequest<Wbs[]>(wbsUrl) : Promise.resolve({ success: true, data: [] }),
      ]);
      if (tRes.success && tRes.data) setTasks(tRes.data);
      if (wRes.success && wRes.data) setWbsList(wRes.data);
    } catch (e) {}
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const handleClearFilters = () => {
    setFilterSearch('');
    setAppliedSearch('');
    setFilterStatus('');
    setFilterWbs('');
    setCurrentPage(1);
  };

  const handleApplySearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedSearch(filterSearch.trim());
    setCurrentPage(1);
  };

  // Filtered Task records
  const filteredTasks = tasks.filter((t: any) => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterWbs && String(t.wbs_id) !== filterWbs) return false;
    if (appliedSearch) {
      const q = appliedSearch.toLowerCase();
      const code = String(t.task_code || '').toLowerCase();
      const name = String(t.task_name || '').toLowerCase();
      const assignee = String(t.assigned_employee_name || t.assigned_labour_name || '').toLowerCase();
      if (!code.includes(q) && !name.includes(q) && !assignee.includes(q)) {
        return false;
      }
    }
    return true;
  });

  const totalRecords = filteredTasks.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const paginatedTasks = filteredTasks.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleExportExcel = () => {
    exportToExcel({
      filename: `project_${projectId}_tasks`,
      sheetName: 'Tasks',
      columns: [
        { label: 'Task Code', key: 'task_code' },
        { label: 'Task Name', key: 'task_name' },
        { label: 'WBS', accessor: (r) => r.wbs_name || 'N/A' },
        { label: 'Assignee', accessor: (r) => r.assigned_employee_name || r.assigned_labour_name || 'Unassigned' },
        { label: 'Start Date', key: 'start_date', type: 'date' },
        { label: 'End Date', key: 'end_date', type: 'date' },
        { label: 'Planned Hours', key: 'planned_hours', type: 'number' },
        { label: 'Actual Hours', key: 'actual_hours', type: 'number' },
        { label: 'Progress %', key: 'progress_percentage', type: 'number' },
        { label: 'Status', key: 'status' },
      ],
      data: filteredTasks,
    });
  };

  const formatDate = (d?: string) => {
    if (!d) return 'N/A';
    try {
      return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return d;
    }
  };

  const getStatusBadge = (status?: string) => {
    const s = String(status).toLowerCase();
    if (s === 'completed') return <Badge variant="success">Completed</Badge>;
    if (s === 'in_progress' || s === 'in progress') return <Badge variant="warning">In Progress</Badge>;
    if (s === 'pending') return <Badge variant="secondary">Pending</Badge>;
    if (s === 'delayed' || s === 'cancelled') return <Badge variant="danger">Delayed</Badge>;
    return <Badge variant="info">{status || 'Planning'}</Badge>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Task Management
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
            Manage project tasks, assign resources and track progress
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Button
            variant="secondary"
            onClick={handleExportExcel}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.84rem' }}
          >
            <Download size={15} />
            <span>Export Excel</span>
          </Button>

          <Button
            variant="primary"
            onClick={() => onNavigate(`project/workspace/${projectId}/tasks/new`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: '#4f46e5',
              color: '#ffffff',
              borderRadius: '8px',
              padding: '0.55rem 1.15rem',
              fontWeight: 600,
              fontSize: '0.86rem',
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
            }}
          >
            <Plus size={16} />
            <span>Add Task</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <form
        onSubmit={handleApplySearch}
        style={{
          background: 'var(--bg-card)',
          padding: '0.85rem 1.25rem',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: '240px', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search by name, code or assignee..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 1rem 0.5rem 2.25rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--input-bg)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          />
        </div>

        {/* Status Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Status</span>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--input-bg)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
            }}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="delayed">Delayed</option>
          </select>
        </div>

        {/* WBS Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>WBS</span>
          <select
            value={filterWbs}
            onChange={(e) => { setFilterWbs(e.target.value); setCurrentPage(1); }}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--input-bg)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              maxWidth: '200px',
            }}
          >
            <option value="">All WBS</option>
            {wbsList.map((w) => (
              <option key={w.id || w.wbs_id} value={String(w.id || w.wbs_id)}>
                {w.wbs_code} - {w.wbs_name}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Button */}
        <button
          type="button"
          onClick={handleClearFilters}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 0.95rem',
            borderRadius: '8px',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            color: '#f59e0b',
            background: 'rgba(245, 158, 11, 0.06)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={14} />
          <span>Clear</span>
        </button>

        {/* Search Button */}
        <button
          type="submit"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            background: '#f59e0b',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)',
          }}
        >
          <Search size={14} />
          <span>Search</span>
        </button>
      </form>

      {/* Task Data Table */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
        }}
      >
        {isLoading ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <LoadingSpinner />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Loading tasks...</span>
          </div>
        ) : paginatedTasks.length === 0 ? (
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <CheckSquare size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem auto' }} />
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>No tasks found</div>
            <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Click &quot;Add Task&quot; above to create a new task for this project.</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.74rem', letterSpacing: '0.04em' }}>TASK CODE</th>
                <th style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.74rem', letterSpacing: '0.04em' }}>TASK NAME</th>
                <th style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.74rem', letterSpacing: '0.04em' }}>WBS</th>
                <th style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.74rem', letterSpacing: '0.04em' }}>ASSIGNEE</th>
                <th style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.74rem', letterSpacing: '0.04em' }}>START DATE</th>
                <th style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.74rem', letterSpacing: '0.04em' }}>END DATE</th>
                <th style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.74rem', letterSpacing: '0.04em', width: '120px' }}>PROGRESS</th>
                <th style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.74rem', letterSpacing: '0.04em' }}>STATUS</th>
                <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.74rem', letterSpacing: '0.04em', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTasks.map((t: any) => (
                <tr
                  key={t.task_id}
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--border-color)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '0.9rem 1.25rem' }}>
                    <button
                      onClick={() => onNavigate(`project/workspace/${projectId}/tasks/${t.task_id}`)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        color: '#6366f1',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                      title="View Task Details"
                    >
                      {t.task_code}
                    </button>
                  </td>

                  <td style={{ padding: '0.9rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {t.task_name}
                  </td>

                  <td style={{ padding: '0.9rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {t.wbs_name || t.wbs_code || 'WBS-01'}
                      </span>
                      {t.wbs_type && <WbsTypeBadge type={t.wbs_type} size="sm" />}
                    </div>
                  </td>

                  <td style={{ padding: '0.9rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                      <User size={13} color="#4ade80" />
                      <span>{t.assigned_employee_name || t.assigned_labour_name || 'Unassigned'}</span>
                    </div>
                  </td>

                  <td style={{ padding: '0.9rem 1rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {formatDate(t.start_date)}
                  </td>

                  <td style={{ padding: '0.9rem 1rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {formatDate(t.end_date)}
                  </td>

                  <td style={{ padding: '0.9rem 1rem' }}>
                    <ProgressBar progress={t.progress_percentage || 0} />
                  </td>

                  <td style={{ padding: '0.9rem 1rem' }}>
                    {getStatusBadge(t.status)}
                  </td>

                  <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <button
                        onClick={() => onNavigate(`project/workspace/${projectId}/tasks/${t.task_id}`)}
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          padding: '0.35rem 0.45rem',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                        title="View Task Details"
                      >
                        <Eye size={14} />
                      </button>

                      <button
                        onClick={() => onNavigate(`project/workspace/${projectId}/tasks/${t.task_id}/edit`)}
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          padding: '0.35rem 0.45rem',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                        title="Edit Task"
                      >
                        <Edit size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Footer Pagination Toolbar */}
        {!isLoading && filteredTasks.length > 0 && (
          <div
            style={{
              padding: '0.85rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid var(--border-color)',
              flexWrap: 'wrap',
              gap: '1rem',
              fontSize: '0.84rem',
              color: 'var(--text-secondary)',
            }}
          >
            <div>
              Showing {Math.min((safePage - 1) * pageSize + 1, totalRecords)} to {Math.min(safePage * pageSize, totalRecords)} of {totalRecords} records
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                style={{
                  padding: '0.3rem 0.5rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                }}
              >
                <option value={10}>10 per page</option>
                <option value={15}>15 per page</option>
                <option value={25}>25 per page</option>
              </select>

              <button
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'transparent',
                  color: safePage <= 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                  cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
                }}
              >
                <ChevronLeft size={14} />
              </button>

              <span
                style={{
                  padding: '0.3rem 0.75rem',
                  borderRadius: '6px',
                  background: '#4f46e5',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                }}
              >
                {safePage}
              </span>

              <button
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'transparent',
                  color: safePage >= totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                  cursor: safePage >= totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
