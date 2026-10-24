import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, Check, Users, ChevronDown, CheckSquare, Square } from 'lucide-react';
import { Employee } from '../../types';

interface EmployeeMultiSelectProps {
  employees: Employee[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

export const EmployeeMultiSelect: React.FC<EmployeeMultiSelectProps> = ({
  employees,
  selectedIds,
  onChange,
  label = 'Assign Employee(s) (Task Manager / Lead)',
  placeholder = 'Select employee(s)...',
  error,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered employees by search
  const filteredEmployees = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return employees;
    return employees.filter((emp) => {
      const name = (emp.name || '').toLowerCase();
      const code = (emp.employee_code || '').toLowerCase();
      const role = (emp.role_name || '').toLowerCase();
      const email = (emp.email || '').toLowerCase();
      return name.includes(term) || code.includes(term) || role.includes(term) || email.includes(term);
    });
  }, [employees, searchTerm]);

  // Selected employee objects
  const selectedEmployees = useMemo(() => {
    const idSet = new Set(selectedIds.map(String));
    return employees.filter((e) => idSet.has(String(e.employee_id)));
  }, [employees, selectedIds]);

  const toggleEmployee = (empId: number) => {
    const strId = String(empId);
    if (selectedIds.includes(strId)) {
      onChange(selectedIds.filter((id) => id !== strId));
    } else {
      onChange([...selectedIds, strId]);
    }
  };

  const removeEmployee = (empId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const strId = String(empId);
    onChange(selectedIds.filter((id) => id !== strId));
  };

  const selectAll = () => {
    const filteredIds = filteredEmployees.map((e) => String(e.employee_id));
    const combined = Array.from(new Set([...selectedIds, ...filteredIds]));
    onChange(combined);
  };

  const clearAll = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onChange([]);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', marginBottom: '1rem' }}>
      {label && (
        <label
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.85rem',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            marginBottom: '0.4rem',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Users size={15} style={{ color: '#6366f1' }} />
            {label}
          </span>
          {selectedIds.length > 0 && (
            <span style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 600 }}>
              {selectedIds.length} {selectedIds.length === 1 ? 'selected' : 'selected'}
            </span>
          )}
        </label>
      )}

      {/* Main Select Box / Container */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          minHeight: '44px',
          padding: '0.4rem 0.6rem',
          borderRadius: '8px',
          border: `1px solid ${error ? 'var(--error-color, #ef4444)' : isOpen ? '#6366f1' : 'var(--border-color, #cbd5e1)'}`,
          background: disabled ? 'var(--bg-secondary, #f1f5f9)' : 'var(--input-bg, #ffffff)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.4rem',
          boxShadow: isOpen ? '0 0 0 2px rgba(99, 102, 241, 0.2)' : 'none',
          transition: 'all 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', flex: 1, alignItems: 'center' }}>
          {selectedEmployees.length === 0 ? (
            <span style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.875rem' }}>{placeholder}</span>
          ) : (
            selectedEmployees.map((emp) => (
              <span
                key={emp.employee_id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  background: 'rgba(99, 102, 241, 0.1)',
                  color: '#4f46e5',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  borderRadius: '16px',
                  padding: '0.2rem 0.55rem',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                }}
              >
                <span>{emp.name}</span>
                <button
                  type="button"
                  onClick={(e) => removeEmployee(emp.employee_id, e)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    margin: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#6366f1',
                  }}
                  title="Remove employee"
                >
                  <X size={13} />
                </button>
              </span>
            ))
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          {selectedIds.length > 0 && !disabled && (
            <button
              type="button"
              onClick={clearAll}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted, #94a3b8)',
                cursor: 'pointer',
                padding: '0.2rem',
                fontSize: '0.75rem',
              }}
              title="Clear all selections"
            >
              <X size={15} />
            </button>
          )}
          <ChevronDown
            size={16}
            style={{
              color: 'var(--text-secondary, #64748b)',
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
            }}
          />
        </div>
      </div>

      {error && (
        <div style={{ color: 'var(--error-color, #ef4444)', fontSize: '0.8rem', marginTop: '0.25rem' }}>{error}</div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 100,
            background: 'var(--bg-primary, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
          }}
        >
          {/* Search Bar & Quick Actions */}
          <div
            style={{
              padding: '0.6rem',
              background: 'var(--bg-secondary, #f8fafc)',
              borderBottom: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <div style={{ position: 'relative', width: '100%' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '0.6rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted, #94a3b8)',
                }}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, role, code..."
                autoFocus
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.6rem 0.45rem 2rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  fontSize: '0.85rem',
                  background: 'var(--input-bg, #ffffff)',
                  color: 'var(--text-primary, #0f172a)',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
                Showing {filteredEmployees.length} employee{filteredEmployees.length === 1 ? '' : 's'}
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={selectAll}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#4f46e5',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Select All
                </button>
                <span style={{ color: 'var(--border-color, #cbd5e1)' }}>|</span>
                <button
                  type="button"
                  onClick={() => onChange([])}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>

          {/* Employee List */}
          <div style={{ maxHeight: '220px', overflowY: 'auto', padding: '0.35rem 0' }}>
            {filteredEmployees.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted, #94a3b8)', fontSize: '0.85rem' }}>
                No employees match your search.
              </div>
            ) : (
              filteredEmployees.map((emp) => {
                const isSelected = selectedIds.includes(String(emp.employee_id));
                return (
                  <div
                    key={emp.employee_id}
                    onClick={() => toggleEmployee(emp.employee_id)}
                    style={{
                      padding: '0.55rem 0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                      borderLeft: isSelected ? '3px solid #6366f1' : '3px solid transparent',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--bg-secondary, #f8fafc)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ color: isSelected ? '#6366f1' : 'var(--text-muted, #94a3b8)', display: 'flex', alignItems: 'center' }}>
                      {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                    </div>

                    {/* Avatar Initials */}
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: isSelected ? '#6366f1' : '#e2e8f0',
                        color: isSelected ? '#ffffff' : '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {(emp.name || 'E').slice(0, 2).toUpperCase()}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>
                        {emp.name}
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted, #64748b)' }}>
                        <span style={{ background: '#f1f5f9', padding: '0.1rem 0.35rem', borderRadius: '4px', color: '#475569', fontWeight: 500 }}>
                          {emp.role_name || 'Employee'}
                        </span>
                        {emp.employee_code && <span>#{emp.employee_code}</span>}
                      </div>
                    </div>

                    {isSelected && (
                      <Check size={16} style={{ color: '#6366f1', flexShrink: 0 }} />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
