import React, { useEffect, useState } from 'react';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { apiRequest, parseApiErrors } from '../services/api';
import { Employee } from '../types';
import { showSuccess, showError } from '../utils/toast';
import { Plus, Edit, Trash2, Eye, UserCheck, Briefcase, Clock, Layers, ShieldCheck, X } from 'lucide-react';
import { RequirePermission } from '../components/common/RequirePermission';
import { ConfirmDeleteModal } from '../components/common/ConfirmDeleteModal';
import { useAuth } from '../context/AuthContext';

export const Employees: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role_name === 'Admin' || user?.role_name === 'Super Admin';

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  // Employee Details Modal State
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsTab, setDetailsTab] = useState<'info' | 'manager' | 'history'>('info');
  const [selectedDetails, setSelectedDetails] = useState<any | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Form State
  const [employeeCode, setEmployeeCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState<number>(3); // 1=Admin, 2=Manager, 3=Employee
  const [reportsToId, setReportsToId] = useState<number | ''>('');
  const [assignedProjectId, setAssignedProjectId] = useState<number | ''>('');
  const [assignedWbsId, setAssignedWbsId] = useState<number | ''>('');
  const [projectOptions, setProjectOptions] = useState<{ id: number; name: string }[]>([]);
  const [wbsOptions, setWbsOptions] = useState<{ id: number; name: string }[]>([]);
  const [hourlyRate, setHourlyRate] = useState<number>(25.0);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingEmp, setDeletingEmp] = useState<{ id: number, name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchEmployees = async () => {
    setIsLoading(true);
    const res = await apiRequest<Employee[]>('/employees');
    if (res.success && res.data) {
      setEmployees(res.data);
    }
    const projRes = await apiRequest<any[]>('/projects');
    if (projRes.success && projRes.data) {
      setProjectOptions(projRes.data.map((p: any) => ({ id: p.project_id, name: p.project_name })));
    }
    const wbsRes = await apiRequest<any[]>('/wbs');
    if (wbsRes.success && wbsRes.data) {
      setWbsOptions(wbsRes.data.map((w: any) => ({ id: w.id, name: w.wbs_name })));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const openViewDetails = async (empId: number) => {
    setIsLoadingDetails(true);
    setIsDetailsOpen(true);
    setDetailsTab('info');
    setSelectedDetails(null);
    const res = await apiRequest<any>(`/employees/${empId}/details`);
    if (res.success && res.data) {
      setSelectedDetails(res.data);
    } else {
      showError(res.message || 'Failed to load employee details');
    }
    setIsLoadingDetails(false);
  };

  const openCreateModal = () => {
    setEditingEmp(null);
    setEmployeeCode(`EMP${Math.floor(100 + Math.random() * 900)}`);
    setName('');
    setEmail('');
    setPassword('Employee@123');
    setRoleId(3);
    setReportsToId('');
    setAssignedProjectId('');
    setAssignedWbsId('');
    setHourlyRate(25.0);
    setStatus('active');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmp(emp);
    setEmployeeCode(emp.employee_code);
    setName(emp.name);
    setEmail(emp.email);
    setPassword('');
    setRoleId(emp.role_id);
    setReportsToId(emp.reporting_to_id || emp.reports_to_id || '');
    setAssignedProjectId(emp.assigned_project_id || '');
    setAssignedWbsId(emp.assigned_wbs_id || '');
    setHourlyRate(Number(emp.hourly_rate));
    setStatus(emp.status);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = (id: number, name: string) => {
    setDeletingEmp({ id, name });
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingEmp) return;
    setIsDeleting(true);
    const res = await apiRequest(`/employees/${deletingEmp.id}`, { method: 'DELETE' });
    setIsDeleting(false);
    if (res.success) {
      showSuccess('Employee deleted successfully.');
      setIsDeleteModalOpen(false);
      fetchEmployees();
    } else {
      showError(res.message || 'Failed to delete employee.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setIsSubmitting(true);

    if (editingEmp) {
      const payload: any = {
        name,
        email,
        role_id: roleId,
        reporting_to_id: reportsToId ? Number(reportsToId) : null,
        assigned_project_id: assignedProjectId ? Number(assignedProjectId) : null,
        assigned_wbs_id: assignedWbsId ? Number(assignedWbsId) : null,
        hourly_rate: hourlyRate,
        status,
      };
      if (password) payload.password = password;
      const res = await apiRequest(`/employees/${editingEmp.employee_id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (res.success) {
        showSuccess('Employee updated successfully.');
        setIsModalOpen(false);
        fetchEmployees();
      } else {
        if (res.errors) setFormErrors(parseApiErrors(res.errors));
        showError(res.message || 'Failed to update employee.');
      }
    } else {
      const res = await apiRequest('/employees', {
        method: 'POST',
        body: JSON.stringify({
          employee_code: employeeCode,
          name,
          email,
          password,
          role_id: roleId,
          reporting_to_id: reportsToId ? Number(reportsToId) : null,
          assigned_project_id: assignedProjectId ? Number(assignedProjectId) : null,
          assigned_wbs_id: assignedWbsId ? Number(assignedWbsId) : null,
          hourly_rate: hourlyRate,
          status,
        }),
      });
      if (res.success) {
        showSuccess('Employee created successfully.');
        setIsModalOpen(false);
        fetchEmployees();
      } else {
        if (res.errors) setFormErrors(parseApiErrors(res.errors));
        showError(res.message || 'Failed to create employee.');
      }
    }
    setIsSubmitting(false);
  };

  // Filter manager options according to role
  const eligibleManagers = employees.filter((emp) => {
    if (roleId === 2) return emp.role_name === 'Admin' || emp.role_name === 'Super Admin';
    if (roleId === 3) return emp.role_name === 'Admin' || emp.role_name === 'Super Admin' || emp.role_name === 'Manager';
    return false;
  });

  const columns: Column<Employee>[] = [
    { header: 'Code', accessor: 'employee_code', sortKey: 'employee_code' },
    { header: 'Name', accessor: 'name', sortKey: 'name' },
    { header: 'Email', accessor: 'email', sortKey: 'email' },
    {
      header: 'Role',
      accessor: (r) => (
        <Badge variant={r.role_name === 'Super Admin' || r.role_name === 'Admin' ? 'danger' : r.role_name === 'Manager' ? 'warning' : 'info'}>
          {r.role_name}
        </Badge>
      ),
      csvAccessor: 'role_name',
      sortKey: 'role_name'
    },
    {
      header: 'Reports To',
      accessor: (r) => r.reporting_to_name || r.manager_name || '-',
      csvAccessor: (r) => r.reporting_to_name || r.manager_name || '-',
    },
    {
      header: 'Assigned Project',
      accessor: (r) => r.assigned_project_name || '-',
      csvAccessor: (r) => r.assigned_project_name || '-',
    },
    {
      header: 'Assigned WBS',
      accessor: (r) => r.assigned_wbs_name || '-',
      csvAccessor: (r) => r.assigned_wbs_name || '-',
    },
    {
      header: 'Status',
      accessor: (r) => <Badge variant={r.status === 'active' ? 'success' : 'danger'}>{r.status}</Badge>,
      csvAccessor: (r) => r.status === 'active' ? 'Active' : 'Inactive',
      sortKey: 'status'
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">Manage system users, roles, and profiles</p>
        </div>
        <RequirePermission module="employees" action="create">
          <Button variant="primary" onClick={openCreateModal}>
            <Plus size={18} /> Add Employee
          </Button>
        </RequirePermission>
      </div>

        <div className="glass-card">
          <DataTable
            columns={columns}
            data={employees}
            searchPlaceholder="Search employees by code, name, or role..."
            exportFilename="employees"
            isLoading={isLoading}
            actions={(row) => (
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <Button 
                  variant="secondary" 
                  onClick={() => openViewDetails(row.employee_id)} 
                  style={{ padding: '0.35rem 0.65rem', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', border: '1px solid rgba(99, 102, 241, 0.3)' }}
                  title="View Employee Details & Reporting Manager"
                >
                  <Eye size={14} /> View Details
                </Button>
                {isAdmin && (
                  <>
                    <Button variant="secondary" onClick={() => openEditModal(row)} style={{ padding: '0.35rem 0.65rem' }}>
                      <Edit size={14} /> Edit
                    </Button>
                    <Button variant="secondary" onClick={() => handleDelete(row.employee_id, row.name)} style={{ padding: '0.35rem 0.65rem', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                      <Trash2 size={14} /> Delete
                    </Button>
                  </>
                )}
              </div>
            )}
          />
        </div>

      {/* Employee Details Modal (3 Tabs: Info, Reporting Manager, Work History) */}
      {isDetailsOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '750px', width: '90%' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700 }}>
                  {selectedDetails?.employee?.name ? selectedDetails.employee.name.charAt(0).toUpperCase() : 'E'}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    {selectedDetails?.employee?.name || 'Employee Details'}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Code: <strong>{selectedDetails?.employee?.employee_code}</strong> • Role: <Badge variant="info">{selectedDetails?.employee?.role_name}</Badge>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsDetailsOpen(false)} className="modal-close-btn"><X size={18} /></button>
            </div>

            {isLoadingDetails ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}><LoadingSpinner /></div>
            ) : selectedDetails ? (
              <div className="modal-body" style={{ paddingTop: '1rem' }}>
                {/* Modal Sub-Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <button
                    onClick={() => setDetailsTab('info')}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      border: 'none',
                      background: detailsTab === 'info' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                      color: detailsTab === 'info' ? '#6366f1' : 'var(--text-secondary)',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <UserCheck size={16} /> Employee Profile
                  </button>
                  <button
                    onClick={() => setDetailsTab('manager')}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      border: 'none',
                      background: detailsTab === 'manager' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                      color: detailsTab === 'manager' ? '#6366f1' : 'var(--text-secondary)',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <ShieldCheck size={16} /> Reporting Manager
                  </button>
                  <button
                    onClick={() => setDetailsTab('history')}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      border: 'none',
                      background: detailsTab === 'history' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                      color: detailsTab === 'history' ? '#6366f1' : 'var(--text-secondary)',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <Clock size={16} /> Work & Timesheet History
                  </button>
                </div>

                {/* Tab 1: Employee Information */}
                {detailsTab === 'info' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Employee Code</span>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedDetails.employee.employee_code}</strong>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Full Name</span>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedDetails.employee.name}</strong>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Email Address</span>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedDetails.employee.email}</strong>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Role</span>
                      <Badge variant="info">{selectedDetails.employee.role_name}</Badge>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Account Status</span>
                      <Badge variant={selectedDetails.employee.status === 'active' ? 'success' : 'danger'}>{selectedDetails.employee.status}</Badge>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Assigned Project</span>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedDetails.employee.assigned_project_name || 'None'}</strong>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Assigned WBS Discipline</span>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedDetails.employee.assigned_wbs_name || 'None'}</strong>
                    </div>
                  </div>
                )}

                {/* Tab 2: Reporting Manager Details */}
                {detailsTab === 'manager' && (
                  <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <ShieldCheck size={18} color="#6366f1" /> Reporting Manager Account Details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>Manager Name</span>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{selectedDetails.reporting_manager.name}</strong>
                      </div>
                      {selectedDetails.reporting_manager.code && (
                        <div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>Manager Employee Code</span>
                          <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{selectedDetails.reporting_manager.code}</strong>
                        </div>
                      )}
                      {selectedDetails.reporting_manager.email && (
                        <div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>Manager Email ID</span>
                          <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{selectedDetails.reporting_manager.email}</strong>
                        </div>
                      )}
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>Manager Role</span>
                        <Badge variant="warning">{selectedDetails.reporting_manager.role}</Badge>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>Manager Login Status</span>
                        <Badge variant="success">{selectedDetails.reporting_manager.status}</Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Work & Timesheet History */}
                {detailsTab === 'history' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Projects */}
                    <div>
                      <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>Assigned Projects ({selectedDetails.assigned_projects?.length || 0})</h5>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {selectedDetails.assigned_projects?.map((p: any) => (
                          <div key={p.project_id} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid var(--border-color)' }}>
                            <strong>{p.project_code || `P0${p.project_id}`}</strong> {p.project_name} ({p.status})
                          </div>
                        ))}
                        {(!selectedDetails.assigned_projects || selectedDetails.assigned_projects.length === 0) && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No active project assignments found.</div>
                        )}
                      </div>
                    </div>

                    {/* Tasks */}
                    <div>
                      <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>Assigned Tasks ({selectedDetails.assigned_tasks?.length || 0})</h5>
                      <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
                        <table className="minimal-table" style={{ width: '100%', fontSize: '0.8rem' }}>
                          <thead>
                            <tr>
                              <th style={{ textAlign: 'left', padding: '0.4rem' }}>Task Name</th>
                              <th style={{ textAlign: 'left', padding: '0.4rem' }}>Project / Discipline</th>
                              <th style={{ textAlign: 'right', padding: '0.4rem' }}>Est. Hours</th>
                              <th style={{ textAlign: 'center', padding: '0.4rem' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedDetails.assigned_tasks?.map((t: any) => (
                              <tr key={t.task_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '0.4rem', color: 'var(--text-primary)', fontWeight: 600 }}>{t.task_name}</td>
                                <td style={{ padding: '0.4rem', color: 'var(--text-secondary)' }}>{t.project_name} ({t.wbs_name || 'General'})</td>
                                <td style={{ padding: '0.4rem', textAlign: 'right', fontWeight: 600 }}>{t.estimated_hours} hrs</td>
                                <td style={{ padding: '0.4rem', textAlign: 'center' }}><Badge variant="info">{t.task_status}</Badge></td>
                              </tr>
                            ))}
                            {(!selectedDetails.assigned_tasks || selectedDetails.assigned_tasks.length === 0) && (
                              <tr><td colSpan={4} style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No assigned tasks found.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Timesheets */}
                    <div>
                      <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>Timesheet Log History ({selectedDetails.timesheet_history?.length || 0})</h5>
                      <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                        <table className="minimal-table" style={{ width: '100%', fontSize: '0.8rem' }}>
                          <thead>
                            <tr>
                              <th style={{ textAlign: 'left', padding: '0.4rem' }}>Log Date</th>
                              <th style={{ textAlign: 'left', padding: '0.4rem' }}>Project / Task</th>
                              <th style={{ textAlign: 'right', padding: '0.4rem' }}>Logged HRs</th>
                              <th style={{ textAlign: 'center', padding: '0.4rem' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedDetails.timesheet_history?.map((ts: any) => (
                              <tr key={ts.timesheet_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '0.4rem', color: 'var(--text-primary)' }}>{ts.log_date}</td>
                                <td style={{ padding: '0.4rem', color: 'var(--text-secondary)' }}>{ts.project_name} ({ts.task_name || ts.wbs_name || 'General Log'})</td>
                                <td style={{ padding: '0.4rem', textAlign: 'right', fontWeight: 700, color: '#10b981' }}>{ts.working_hours} hrs</td>
                                <td style={{ padding: '0.4rem', textAlign: 'center' }}><Badge variant="success">{ts.status || 'Approved'}</Badge></td>
                              </tr>
                            ))}
                            {(!selectedDetails.timesheet_history || selectedDetails.timesheet_history.length === 0) && (
                              <tr><td colSpan={4} style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No timesheet logs found for this employee.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <Button variant="secondary" onClick={() => setIsDetailsOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingEmp ? 'Edit Employee' : 'Add New Employee'}>
        <form noValidate onSubmit={handleSubmit}>
          {!editingEmp && (
            <FormInput
              label="Employee Code (Unique)"
              type="text"
              value={employeeCode}
              onChange={(e) => { setEmployeeCode(e.target.value); setFormErrors(prev => ({...prev, employee_code: ''})); }}
              required
              error={formErrors.employee_code}
            />
          )}

          <FormInput label="Full Name" type="text" value={name} onChange={(e) => { setName(e.target.value); setFormErrors(prev => ({...prev, name: ''})); }} required error={formErrors.name} />
          <FormInput label="Email Address" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setFormErrors(prev => ({...prev, email: ''})); }} required error={formErrors.email} />

          <FormInput
            label={editingEmp ? 'New Password (leave blank to keep current)' : 'Password'}
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setFormErrors(prev => ({...prev, password: ''})); }}
            required={!editingEmp}
            error={formErrors.password}
          />

          <div className="grid-2-col">
            <FormSelect
              label="Role"
              value={roleId}
              onChange={(e) => setRoleId(parseInt(e.target.value, 10))}
              options={[
                { value: 1, label: 'Admin' },
                { value: 2, label: 'Manager' },
                { value: 3, label: 'Employee' },
              ]}
              error={formErrors.role_id}
            />

            <FormSelect
              label="Reporting Manager"
              value={reportsToId}
              onChange={(e) => setReportsToId(e.target.value ? parseInt(e.target.value, 10) : '')}
              options={[
                { value: '', label: '-- None (Direct Admin) --' },
                ...eligibleManagers.map((m) => ({ value: m.employee_id, label: `${m.name} (${m.role_name})` })),
              ]}
              error={formErrors.reports_to_id}
            />
          </div>

          <div className="grid-2-col">
            <FormSelect
              label="Assigned Project"
              value={assignedProjectId}
              onChange={(e) => setAssignedProjectId(e.target.value ? parseInt(e.target.value, 10) : '')}
              options={[
                { value: '', label: '-- None --' },
                ...projectOptions.map((p) => ({ value: p.id, label: p.name })),
              ]}
              error={formErrors.assigned_project_id}
            />

            <FormSelect
              label="Assigned WBS Discipline"
              value={assignedWbsId}
              onChange={(e) => setAssignedWbsId(e.target.value ? parseInt(e.target.value, 10) : '')}
              options={[
                { value: '', label: '-- None --' },
                ...wbsOptions.map((w) => ({ value: w.id, label: w.name })),
              ]}
              error={formErrors.assigned_wbs_id}
            />
          </div>

          <div className="form-group mb-3">
            <FormSelect
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              error={formErrors.status}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (editingEmp ? 'Save Changes' : 'Create Employee')}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        recordName={deletingEmp?.name || 'this employee'}
        isLoading={isDeleting}
      />
    </div>
  );
};
