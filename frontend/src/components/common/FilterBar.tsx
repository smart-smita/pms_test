import React from 'react';
import { Search, Filter, RotateCcw, Calendar } from 'lucide-react';

export interface FilterBarProps {
  projects?: { id: number; name: string }[];
  wbsList?: { id: number; name: string }[];
  employees?: { id: number; name: string }[];
  labourTypes?: { value: string; label: string }[];
  statuses?: { value: string; label: string }[];
  selectedProject?: string | number;
  selectedWbs?: string | number;
  selectedEmployee?: string | number;
  selectedLabourType?: string;
  selectedStatus?: string;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
  onFilterChange: (filters: {
    projectId?: string | number;
    wbsId?: string | number;
    employeeId?: string | number;
    labourType?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) => void;
  onReset?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  projects,
  wbsList,
  employees,
  labourTypes,
  statuses,
  selectedProject = '',
  selectedWbs = '',
  selectedEmployee = '',
  selectedLabourType = '',
  selectedStatus = '',
  startDate = '',
  endDate = '',
  searchTerm,
  onFilterChange,
  onReset,
}) => {
  // Compute active filters count
  let activeFilterCount = 0;
  if (selectedProject) activeFilterCount++;
  if (selectedWbs) activeFilterCount++;
  if (selectedEmployee) activeFilterCount++;
  if (selectedLabourType) activeFilterCount++;
  if (selectedStatus) activeFilterCount++;
  if (startDate) activeFilterCount++;
  if (endDate) activeFilterCount++;
  if (searchTerm) activeFilterCount++;

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--input-bg)',
    border: '1px solid var(--input-border)',
    color: 'var(--text-primary)',
    borderRadius: '12px',
    padding: '0.55rem 0.85rem',
    fontSize: '0.825rem',
    outline: 'none',
    width: '100%',
    boxShadow: 'var(--shadow-sm)',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.7rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'var(--text-secondary)',
    marginBottom: '0.35rem',
    display: 'block',
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(79, 70, 229, 0.15)', color: '#6366f1' }}>
            <Filter size={16} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Filters & Selection
          </span>
          {activeFilterCount > 0 && (
            <span
              style={{
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
              }}
            >
              {activeFilterCount} active
            </span>
          )}
        </div>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              padding: '0.4rem 0.85rem',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.borderColor = '#6366f1';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            <RotateCcw size={13} />
            <span>Reset All</span>
          </button>
        )}
      </div>

      {/* Grid Inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {/* Search Input */}
        {searchTerm !== undefined && (
          <div>
            <label style={labelStyle}>Search Keyword</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => onFilterChange({ search: e.target.value })}
                style={{ ...inputStyle, paddingLeft: '2.25rem' }}
              />
            </div>
          </div>
        )}

        {/* Project Selector */}
        {projects && (
          <div>
            <label style={labelStyle}>Project</label>
            <select
              value={selectedProject}
              onChange={(e) => onFilterChange({ projectId: e.target.value })}
              style={inputStyle}
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* WBS Discipline Selector */}
        {wbsList && (
          <div>
            <label style={labelStyle}>WBS Discipline</label>
            <select
              value={selectedWbs}
              onChange={(e) => onFilterChange({ wbsId: e.target.value })}
              style={inputStyle}
            >
              <option value="">All WBS Disciplines</option>
              {wbsList.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Employee Selector */}
        {employees && (
          <div>
            <label style={labelStyle}>Employee</label>
            <select
              value={selectedEmployee}
              onChange={(e) => onFilterChange({ employeeId: e.target.value })}
              style={inputStyle}
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Labour Type Selector */}
        {labourTypes && (
          <div>
            <label style={labelStyle}>Labour Type</label>
            <select
              value={selectedLabourType}
              onChange={(e) => onFilterChange({ labourType: e.target.value })}
              style={inputStyle}
            >
              <option value="">All Labour Types</option>
              {labourTypes.map((lt) => (
                <option key={lt.value} value={lt.value}>
                  {lt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Status Selector */}
        {statuses && (
          <div>
            <label style={labelStyle}>Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => onFilterChange({ status: e.target.value })}
              style={inputStyle}
            >
              <option value="">All Statuses</option>
              {statuses.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date Range Start */}
        {startDate !== undefined && (
          <div>
            <label style={labelStyle}>From Date</label>
            <div style={{ position: 'relative' }}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => onFilterChange({ startDate: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>
        )}

        {/* Date Range End */}
        {endDate !== undefined && (
          <div>
            <label style={labelStyle}>To Date</label>
            <div style={{ position: 'relative' }}>
              <input
                type="date"
                value={endDate}
                onChange={(e) => onFilterChange({ endDate: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

