import React, { useEffect, useState } from 'react';
import { DataTable, Column } from '../components/common/DataTable';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { apiRequest } from '../services/api';
import { DollarSign, Calendar, Users, FolderKanban, CheckSquare } from 'lucide-react';

import { useAuth } from '../context/AuthContext';

export const Payments: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role_name === 'Admin';

  const [activeTab, setActiveTab] = useState<'employee' | 'daily' | 'project' | 'task'>('employee');
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPaymentData = async (tab: string) => {
    setIsLoading(true);
    let endpoint = '/payments/employee';
    if (tab === 'daily') endpoint = '/payments/daily';
    if (tab === 'project') endpoint = '/payments/project';
    if (tab === 'task') endpoint = '/payments/task';

    const res = await apiRequest<any[]>(endpoint);
    if (res.success && res.data) {
      setData(res.data);
    } else {
      setData([]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPaymentData(activeTab);
  }, [activeTab]);

  const employeeColumns: Column<any>[] = [
    { header: 'Code', accessor: 'employee_code', sortKey: 'employee_code' },
    ...(isAdmin ? [{ header: 'Employee Name', accessor: 'employee_name', sortKey: 'employee_name' }] : []),
    { header: 'Hourly Rate', accessor: (r) => `₹${Number(r.hourly_rate).toFixed(2)}/hr`, csvAccessor: (r) => Number(r.hourly_rate).toFixed(2), sortKey: 'hourly_rate' },
    { header: 'Days Worked', accessor: 'days_worked', sortKey: 'days_worked' },
    { header: 'Total Working Hours', accessor: (r) => `${Number(r.total_hours).toFixed(2)} hrs`, csvAccessor: (r) => Number(r.total_hours).toFixed(2), sortKey: 'total_hours' },
    {
      header: 'Server Calculated Payment',
      accessor: (r) => (
        <span style={{ fontWeight: 800, color: '#10b981', fontSize: '1rem' }}>
          ₹{Number(r.total_payment).toFixed(2)}
        </span>
      ),
      csvAccessor: (r) => Number(r.total_payment).toFixed(2),
      sortKey: 'total_payment'
    },
  ];

  const dailyColumns: Column<any>[] = [
    { header: 'Date', accessor: 'attendance_date', sortKey: 'attendance_date' },
    { header: 'Total Active Workers', accessor: 'total_workers', sortKey: 'total_workers' },
    { header: 'Total Hours Logged', accessor: (r) => `${Number(r.total_hours).toFixed(2)} hrs`, csvAccessor: (r) => Number(r.total_hours).toFixed(2), sortKey: 'total_hours' },
    {
      header: 'Total Daily Payout',
      accessor: (r) => (
        <span style={{ fontWeight: 800, color: '#10b981', fontSize: '1rem' }}>
          ₹{Number(r.total_payment).toFixed(2)}
        </span>
      ),
      csvAccessor: (r) => Number(r.total_payment).toFixed(2),
      sortKey: 'total_payment'
    },
  ];

  const projectColumns: Column<any>[] = [
    { header: 'Project Code', accessor: 'project_code', sortKey: 'project_code' },
    { header: 'Project Name', accessor: 'project_name', sortKey: 'project_name' },
    { header: 'Worker Count', accessor: 'worker_count', sortKey: 'worker_count' },
    { header: 'Total Hours Logged', accessor: (r) => `${Number(r.total_hours).toFixed(2)} hrs`, csvAccessor: (r) => Number(r.total_hours).toFixed(2), sortKey: 'total_hours' },
    {
      header: 'Project Labor Cost',
      accessor: (r) => (
        <span style={{ fontWeight: 800, color: '#ef4444', fontSize: '1rem' }}>
          ₹{Number(r.total_cost).toFixed(2)}
        </span>
      ),
      csvAccessor: (r) => Number(r.total_cost).toFixed(2),
      sortKey: 'total_cost'
    },
  ];

  const taskColumns: Column<any>[] = [
    { header: 'Task Name', accessor: 'task_name', sortKey: 'task_name' },
    { header: 'Project', accessor: 'project_name', sortKey: 'project_name' },
    { header: 'Planned Est. Hours', accessor: (r) => `${Number(r.estimated_hours).toFixed(2)} hrs`, csvAccessor: (r) => Number(r.estimated_hours).toFixed(2), sortKey: 'estimated_hours' },
    { header: 'Actual Logged Hours', accessor: (r) => `${Number(r.actual_hours).toFixed(2)} hrs`, csvAccessor: (r) => Number(r.actual_hours).toFixed(2), sortKey: 'actual_hours' },
    {
      header: 'Task Total Cost',
      accessor: (r) => (
        <span style={{ fontWeight: 800, color: '#10b981', fontSize: '1rem' }}>
          ₹{Number(r.total_cost).toFixed(2)}
        </span>
      ),
      csvAccessor: (r) => Number(r.total_cost).toFixed(2),
      sortKey: 'total_cost'
    },
  ];

  const renderActiveColumns = () => {
    switch (activeTab) {
      case 'employee': return employeeColumns;
      case 'daily': return dailyColumns;
      case 'project': return projectColumns;
      case 'task': return taskColumns;
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Hour-Wise Payment & Payroll</h1>
          <p className="page-subtitle">
            Server-side verified payments computed via <code>payment = hourly_rate × total_working_hours</code>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <Button
          variant={activeTab === 'employee' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('employee')}
        >
          <Users size={16} /> Employee Payments
        </Button>
        <Button
          variant={activeTab === 'daily' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('daily')}
        >
          <Calendar size={16} /> Daily Payouts
        </Button>
        <Button
          variant={activeTab === 'project' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('project')}
        >
          <FolderKanban size={16} /> Project-Wise Cost
        </Button>
        <Button
          variant={activeTab === 'task' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('task')}
        >
          <CheckSquare size={16} /> Task-Wise Cost
        </Button>
      </div>

        <div className="glass-card">
          <DataTable
            columns={renderActiveColumns() || []}
            data={data}
            searchPlaceholder={`Search ${activeTab} payment records...`}
            exportFilename={`${activeTab}_payment_report`}
            isLoading={isLoading}
          />
        </div>
    </div>
  );
};
