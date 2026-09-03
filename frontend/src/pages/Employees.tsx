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
import { Plus, Edit, Trash2 } from 'lucide-react';
import { RequirePermission } from '../components/common/RequirePermission';
import { ConfirmDeleteModal } from '../components/common/ConfirmDeleteModal';
import { useAuth } from '../context/AuthContext';

export const Employees: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role_name === 'Admin';

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

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
      header: 'Hourly Rate',
      accessor: (r) => `₹${Number(r.hourly_rate).toFixed(2)}/hr`,
      csvAccessor: (r) => Number(r.hourly_rate).toFixed(2),
      sortKey: 'hourly_rate'
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
            searchPlaceholder="Search employees..."
            exportFilename="employees"
            isLoading={isLoading}
            actions={isAdmin ? (row) => (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button variant="secondary" onClick={() => openEditModal(row)} style={{ padding: '0.35rem 0.65rem' }}>
                  <Edit size={14} /> Edit
                </Button>
                <Button variant="secondary" onClick={() => handleDelete(row.employee_id, row.name)} style={{ padding: '0.35rem 0.65rem', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  <Trash2 size={14} /> Delete
                </Button>
              </div>
            ) : undefined}
          />
        </div>

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

          <div className="grid-2-col">
            <FormInput
              label="Hourly Rate (₹/hr)"
              type="number"
              step="0.50"
              value={hourlyRate}
              onChange={(e) => { setHourlyRate(parseFloat(e.target.value)); setFormErrors(prev => ({...prev, hourly_rate: ''})); }}
              required
              error={formErrors.hourly_rate}
            />

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
