import React, { useEffect, useState } from 'react';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { apiRequest } from '../services/api';
import { Employee } from '../types';
import { UserPlus, Edit, Shield } from 'lucide-react';
import { RequirePermission } from '../components/common/RequirePermission';

export const Employees: React.FC = () => {
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
  const [hourlyRate, setHourlyRate] = useState<number>(25.0);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = async () => {
    setIsLoading(true);
    const res = await apiRequest<Employee[]>('/employees');
    if (res.success && res.data) {
      setEmployees(res.data);
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
    setHourlyRate(25.0);
    setStatus('active');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmp(emp);
    setEmployeeCode(emp.employee_code);
    setName(emp.name);
    setEmail(emp.email);
    setPassword('');
    setRoleId(emp.role_id);
    setHourlyRate(Number(emp.hourly_rate));
    setStatus(emp.status);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (editingEmp) {
      const payload: any = { name, email, role_id: roleId, hourly_rate: hourlyRate, status };
      if (password) payload.password = password;
      const res = await apiRequest(`/employees/${editingEmp.employee_id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (res.success) {
        setIsModalOpen(false);
        fetchEmployees();
      } else {
        setError(res.message || 'Failed to update employee');
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
          hourly_rate: hourlyRate,
          status,
        }),
      });
      if (res.success) {
        setIsModalOpen(false);
        fetchEmployees();
      } else {
        setError(res.message || 'Failed to create employee');
      }
    }
  };

  const columns: Column<Employee>[] = [
    { header: 'Code', accessor: 'employee_code' },
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    {
      header: 'Role',
      accessor: (r) => (
        <Badge variant={r.role_name === 'Admin' ? 'danger' : r.role_name === 'Manager' ? 'warning' : 'info'}>
          {r.role_name}
        </Badge>
      ),
    },
    {
      header: 'Hourly Rate',
      accessor: (r) => `₹${Number(r.hourly_rate).toFixed(2)}/hr`,
    },
    {
      header: 'Status',
      accessor: (r) => <Badge variant={r.status === 'active' ? 'success' : 'danger'}>{r.status}</Badge>,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Employee Management</h1>
          <p className="page-subtitle">Manage worker profiles, hourly rates, and system role access</p>
        </div>
        <RequirePermission module="employees" action="create">
          <Button variant="primary" onClick={openCreateModal}>
            <UserPlus size={18} /> Add Employee
          </Button>
        </RequirePermission>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="glass-card">
          <DataTable
            columns={columns}
            data={employees}
            searchPlaceholder="Search employees by name, code, or email..."
            exportFilename="employees_list.csv"
            actions={(row) => (
              <RequirePermission module="employees" action="update">
                <Button variant="secondary" onClick={() => openEditModal(row)} style={{ padding: '0.35rem 0.65rem' }}>
                  <Edit size={14} /> Edit
                </Button>
              </RequirePermission>
            )}
          />
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingEmp ? 'Edit Employee' : 'Add New Employee'}>
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!editingEmp && (
            <FormInput
              label="Employee Code (Unique)"
              type="text"
              value={employeeCode}
              onChange={(e) => setEmployeeCode(e.target.value)}
              required
            />
          )}

          <FormInput label="Full Name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          <FormInput label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

          <FormInput
            label={editingEmp ? 'New Password (leave blank to keep current)' : 'Password'}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={!editingEmp}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormSelect
              label="Role"
              value={roleId}
              onChange={(e) => setRoleId(parseInt(e.target.value, 10))}
              options={[
                { value: 1, label: 'Admin' },
                { value: 2, label: 'Manager' },
                { value: 3, label: 'Employee' },
              ]}
            />

            <FormInput
              label="Hourly Rate (₹/hr)"
              type="number"
              step="0.50"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(parseFloat(e.target.value))}
              required
            />
          </div>

          <FormSelect
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingEmp ? 'Save Changes' : 'Create Employee'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
