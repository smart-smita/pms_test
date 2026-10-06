import React, { useState, useEffect } from 'react';
import { Project, ProjectType, Customer } from '../../../types';
import { apiRequest } from '../../../services/api';
import { Button } from '../../common/Button';
import { Badge } from '../../common/Badge';
import { ProgressBar } from '../../common/ProgressBar';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { exportToExcel } from '../../../utils/excelExport';
import { 
  Search, RotateCcw, Plus, Download, Eye, Edit, MoreHorizontal,
  Building2, MapPin, FolderKanban, ChevronLeft, ChevronRight
} from 'lucide-react';

interface ProjectListTabProps {
  onSelectProject: (projectId: number) => void;
  onNavigate: (page: string) => void;
}

export const ProjectListTab: React.FC<ProjectListTabProps> = ({
  onSelectProject,
  onNavigate,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filterSearch, setFilterSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const fetchInitialData = async () => {
    setIsLoading(true);
    const [pRes, ptRes, cRes] = await Promise.all([
      apiRequest<Project[]>('/projects'),
      apiRequest<ProjectType[]>('/masters/project-types'),
      apiRequest<Customer[]>('/customers'),
    ]);
    if (pRes.success && pRes.data) setProjects(pRes.data);
    if (ptRes.success && ptRes.data) setProjectTypes(ptRes.data);
    if (cRes.success && cRes.data) setCustomers(cRes.data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleClearFilters = () => {
    setFilterSearch('');
    setAppliedSearch('');
    setFilterStatus('');
    setFilterType('');
    setCurrentPage(1);
  };

  const handleApplySearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedSearch(filterSearch.trim());
    setCurrentPage(1);
  };

  // Filter projects
  const filteredProjects = projects.filter((p: any) => {
    if (filterStatus && p.status !== filterStatus) return false;
    if (filterType && String(p.project_type_id) !== filterType) return false;
    if (appliedSearch) {
      const q = appliedSearch.toLowerCase();
      const code = String(p.project_code || '').toLowerCase();
      const name = String(p.project_name || '').toLowerCase();
      const client = String(p.customer_name || p.client_name || '').toLowerCase();
      const loc = String(p.project_address || p.community_name || p.country_name || '').toLowerCase();
      if (!code.includes(q) && !name.includes(q) && !client.includes(q) && !loc.includes(q)) {
        return false;
      }
    }
    return true;
  });

  const totalRecords = filteredProjects.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProjects = filteredProjects.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleExportExcel = () => {
    exportToExcel({
      filename: 'projects_list',
      sheetName: 'Projects',
      columns: [
        { label: 'Code', key: 'project_code' },
        { label: 'Project Name', key: 'project_name' },
        { label: 'Client', accessor: (r) => r.customer_name || r.client_name || 'N/A' },
        { label: 'Project Type', key: 'project_type_name' },
        { label: 'Location', accessor: (r) => r.country_name || r.project_address || 'N/A' },
        { label: 'Start Date', key: 'start_date', type: 'date' },
        { label: 'End Date', key: 'end_date', type: 'date' },
        { label: 'Budget Amount', key: 'budget_amount', type: 'currency' },
        { label: 'Progress %', key: 'progress_percentage', type: 'number' },
        { label: 'Status', key: 'status' },
      ],
      data: filteredProjects,
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
    if (s === 'active' || s === 'in progress' || s === 'in_progress') {
      return <Badge variant="warning">In Progress</Badge>;
    }
    if (s === 'planning') {
      return <Badge variant="info">Planning</Badge>;
    }
    if (s === 'completed') {
      return <Badge variant="success">Completed</Badge>;
    }
    if (s === 'on track' || s === 'on_track') {
      return <Badge variant="success">On Track</Badge>;
    }
    if (s === 'delayed' || s === 'cancelled') {
      return <Badge variant="danger">Delayed</Badge>;
    }
    return <Badge variant="secondary">{status || 'Active'}</Badge>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Project List
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
            Manage all projects and view their details
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
            onClick={() => onNavigate('project/new')}
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
            <span>Add Project</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar (Matching Mockup exactly) */}
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
        {/* Search Input */}
        <div style={{ flex: 1, minWidth: '240px', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search projects by name, code, client or location..."
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
            <option value="active">In Progress</option>
            <option value="planning">Planning</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Delayed</option>
          </select>
        </div>

        {/* Project Type Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Project Type</span>
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--input-bg)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
            }}
          >
            <option value="">All Types</option>
            {projectTypes.map((pt) => (
              <option key={pt.type_id} value={String(pt.type_id)}>
                {pt.type_name}
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
            transition: 'all 0.15s ease',
          }}
        >
          <RotateCcw size={14} />
          <span>Clear</span>
        </button>

        {/* Search Button (Orange #f59e0b) */}
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

      {/* Projects Data Table */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        {isLoading ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <LoadingSpinner />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Loading projects...</span>
          </div>
        ) : paginatedProjects.length === 0 ? (
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FolderKanban size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem auto' }} />
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>No projects found</div>
            <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Try adjusting your search criteria or add a new project.</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.74rem', letterSpacing: '0.04em' }}>CODE</th>
                <th style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.74rem', letterSpacing: '0.04em' }}>PROJECT NAME & CLIENT</th>
                <th style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.74rem', letterSpacing: '0.04em' }}>LOCATION</th>
                <th style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.74rem', letterSpacing: '0.04em' }}>START DATE</th>
                <th style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.74rem', letterSpacing: '0.04em' }}>END DATE</th>
                <th style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.74rem', letterSpacing: '0.04em' }}>BUDGET AMOUNT</th>
                <th style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.74rem', letterSpacing: '0.04em', width: '130px' }}>PROGRESS</th>
                <th style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.74rem', letterSpacing: '0.04em' }}>STATUS</th>
                <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.74rem', letterSpacing: '0.04em', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProjects.map((proj: any) => (
                <tr
                  key={proj.project_id}
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--border-color)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Code Link */}
                  <td style={{ padding: '0.9rem 1.25rem' }}>
                    <button
                      onClick={() => onSelectProject(proj.project_id)}
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
                      title="Open Project Workspace"
                    >
                      {proj.project_code}
                    </button>
                  </td>

                  {/* Project Name & Client */}
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                      {proj.project_name}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                      <Building2 size={12} color="#6366f1" />
                      <span>{proj.customer_name || proj.client_name || 'N/A'}</span>
                    </div>
                  </td>

                  {/* Location */}
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                      <MapPin size={13} color="#38bdf8" />
                      <span>{proj.country_name || proj.community_name || proj.project_address || 'Global'}</span>
                    </div>
                  </td>

                  {/* Start Date */}
                  <td style={{ padding: '0.9rem 1rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {formatDate(proj.start_date)}
                  </td>

                  {/* End Date */}
                  <td style={{ padding: '0.9rem 1rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {formatDate(proj.end_date)}
                  </td>

                  {/* Budget Amount */}
                  <td style={{ padding: '0.9rem 1rem', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                    ₹ {Number(proj.budget_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                  </td>

                  {/* Progress */}
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <ProgressBar
                      progress={proj.progress_percentage || 0}
                      totalTasks={proj.task_count}
                      completedTasks={proj.completed_task_count}
                    />
                  </td>

                  {/* Status */}
                  <td style={{ padding: '0.9rem 1rem' }}>
                    {getStatusBadge(proj.status)}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <button
                        onClick={() => onSelectProject(proj.project_id)}
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          padding: '0.35rem 0.45rem',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                        title="Open Workspace"
                      >
                        <Eye size={14} />
                      </button>

                      <button
                        onClick={() => onNavigate(`project/${proj.project_id}/edit`)}
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          padding: '0.35rem 0.45rem',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                        title="Edit Project"
                      >
                        <Edit size={14} />
                      </button>

                      <button
                        onClick={() => onSelectProject(proj.project_id)}
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          padding: '0.35rem 0.45rem',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                        title="More Options"
                      >
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Footer Pagination Toolbar */}
        {!isLoading && filteredProjects.length > 0 && (
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
                <option value={50}>50 per page</option>
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
