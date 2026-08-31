import React, { useEffect, useState } from 'react';
import { DataTable, Column } from '../components/common/DataTable';
import { Button } from '../components/common/Button';
import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { apiRequest } from '../services/api';
import { FileBarChart, MapPin, FolderKanban, CheckSquare, DollarSign, Download, Filter } from 'lucide-react';
import { Badge } from '../components/common/Badge';

import { useAuth } from '../context/AuthContext';

export const Reports: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role_name === 'Admin';

  const [reportCategory, setReportCategory] = useState<'attendance' | 'project' | 'task' | 'payment'>('attendance');
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentType, setPaymentType] = useState('employee');

  const fetchReportData = async () => {
    setIsLoading(true);
    let endpoint = `/reports/${reportCategory}`;
    const params = new URLSearchParams();

    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (reportCategory === 'payment') params.append('type', paymentType);

    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    const res = await apiRequest<any[]>(endpoint);
    if (res.success && res.data) {
      setData(res.data);
    } else {
      setData([]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReportData();
  }, [reportCategory, paymentType]);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReportData();
  };

  // 1. Attendance Columns
  const attendanceColumns: Column<any>[] = [
    { header: 'Date', accessor: 'attendance_date', sortKey: 'attendance_date' },
    ...(isAdmin ? [{ header: 'Employee', accessor: (r: any) => `${r.employee_name} (${r.employee_code})`, csvAccessor: (r: any) => `${r.employee_name} (${r.employee_code})`, sortKey: 'employee_name' }] : []),
    { header: 'Project / Task', accessor: (r) => r.task_name ? `${r.task_name} (${r.project_name || ''})` : 'General Duty', csvAccessor: (r) => r.task_name ? `${r.task_name} (${r.project_name || ''})` : 'General Duty', sortKey: (r) => r.task_name || '' },
    { header: 'Check In', accessor: (r) => new Date(r.check_in_time).toLocaleTimeString(), csvAccessor: (r) => new Date(r.check_in_time).toLocaleTimeString(), sortKey: 'check_in_time' },
    { header: 'Check Out', accessor: (r) => r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString() : '-', csvAccessor: (r) => r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString() : '-', sortKey: 'check_out_time' },
    { header: 'GPS Address', accessor: (r) => r.in_address || 'GPS Logged', csvAccessor: (r) => r.in_address || 'GPS Logged', sortKey: 'in_address' },
    { header: 'Working Hours', accessor: (r) => `${Number(r.total_working_hours).toFixed(2)} hrs`, csvAccessor: (r) => Number(r.total_working_hours).toFixed(2), sortKey: 'total_working_hours' },
    {
      header: 'Status',
      accessor: (r) => (
        <Badge variant={r.status === 'completed' ? 'success' : r.status === 'open' ? 'info' : 'danger'}>
          {r.status}
        </Badge>
      ),
      csvAccessor: (r) => r.status.charAt(0).toUpperCase() + r.status.slice(1),
      sortKey: 'status'
    },
  ];

  // 2. Project Columns
  const projectColumns: Column<any>[] = [
    { header: 'Code', accessor: 'project_code', sortKey: 'project_code' },
    { header: 'Project Name', accessor: 'project_name', sortKey: 'project_name' },
    { header: 'Client', accessor: (r) => r.client_name || '-', csvAccessor: (r) => r.client_name || '-', sortKey: 'client_name' },
    { header: 'Total Tasks', accessor: 'total_tasks', sortKey: 'total_tasks' },
    { header: 'Pending', accessor: 'pending_tasks', sortKey: 'pending_tasks' },
    { header: 'In Progress', accessor: 'in_progress_tasks', sortKey: 'in_progress_tasks' },
    { header: 'Completed', accessor: 'completed_tasks', sortKey: 'completed_tasks' },
    { header: 'Delayed', accessor: 'delayed_tasks', sortKey: 'delayed_tasks' },
    { header: 'Est. Hours', accessor: (r) => `${Number(r.total_estimated_hours).toFixed(2)}h`, csvAccessor: (r) => Number(r.total_estimated_hours).toFixed(2), sortKey: 'total_estimated_hours' },
    { header: 'Actual Hours', accessor: (r) => `${Number(r.total_actual_hours).toFixed(2)}h`, csvAccessor: (r) => Number(r.total_actual_hours).toFixed(2), sortKey: 'total_actual_hours' },
    {
      header: 'Progress %',
      accessor: (r) => <span style={{ fontWeight: 800, color: '#6366f1' }}>{r.progress_percentage}%</span>,
      csvAccessor: (r) => `${r.progress_percentage}%`,
      sortKey: 'progress_percentage'
    },
  ];

  // 3. Task Columns
  const taskColumns: Column<any>[] = [
    { header: 'Task Name', accessor: 'task_name', sortKey: 'task_name' },
    { header: 'Project', accessor: 'project_name', sortKey: 'project_name' },
    { header: 'Workers (Assigned / Req)', accessor: (r) => `${r.assigned_worker_count} / ${r.required_worker_count}`, csvAccessor: (r) => `${r.assigned_worker_count} / ${r.required_worker_count}`, sortKey: 'assigned_worker_count' },
    { header: 'Estimated Hours', accessor: (r) => `${Number(r.estimated_hours).toFixed(2)}h`, csvAccessor: (r) => Number(r.estimated_hours).toFixed(2), sortKey: 'estimated_hours' },
    { header: 'Actual Logged Hours', accessor: (r) => `${Number(r.actual_hours).toFixed(2)}h`, csvAccessor: (r) => Number(r.actual_hours).toFixed(2), sortKey: 'actual_hours' },
    { header: 'Start Date', accessor: (r) => r.start_date || '-', csvAccessor: (r) => r.start_date || '-', sortKey: 'start_date' },
    { header: 'Target Date', accessor: (r) => r.target_date || '-', csvAccessor: (r) => r.target_date || '-', sortKey: 'target_date' },
    {
      header: 'Status',
      accessor: (r) => (
        <Badge variant={r.task_status === 'completed' ? 'success' : r.task_status === 'in-progress' ? 'info' : 'warning'}>
          {r.task_status}
        </Badge>
      ),
      csvAccessor: (r) => r.task_status.charAt(0).toUpperCase() + r.task_status.slice(1),
      sortKey: 'task_status'
    },
  ];

  // 4. Payment Columns
  const paymentColumns: Column<any>[] = [
    { header: 'Identifier / Name', accessor: (r) => r.employee_name || r.project_name || r.task_name || r.attendance_date, csvAccessor: (r) => r.employee_name || r.project_name || r.task_name || r.attendance_date, sortKey: (r) => r.employee_name || r.project_name || r.task_name || r.attendance_date },
    { header: 'Hours Logged', accessor: (r) => `${Number(r.total_hours || r.actual_hours || 0).toFixed(2)} hrs`, csvAccessor: (r) => Number(r.total_hours || r.actual_hours || 0).toFixed(2), sortKey: (r) => Number(r.total_hours || r.actual_hours || 0) },
    {
      header: 'Total Cost / Payout',
      accessor: (r) => (
        <span style={{ fontWeight: 800, color: '#10b981', fontSize: '1rem' }}>
          ₹{Number(r.total_payment || r.total_cost || 0).toFixed(2)}
        </span>
      ),
      csvAccessor: (r) => Number(r.total_payment || r.total_cost || 0).toFixed(2),
      sortKey: (r) => Number(r.total_payment || r.total_cost || 0)
    },
  ];

  const getReportColumns = () => {
    switch (reportCategory) {
      case 'attendance': return attendanceColumns;
      case 'project': return projectColumns;
      case 'task': return taskColumns;
      case 'payment': return paymentColumns;
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{!isAdmin ? 'My Reports' : 'Analytics & Custom Reports'}</h1>
          <p className="page-subtitle">{!isAdmin ? 'View and export your personal attendance and task reports' : 'Generate, filter, and export detailed analytical reports for operational management'}</p>
        </div>
      </div>

      {/* Category Selection */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <Button
          variant={reportCategory === 'attendance' ? 'primary' : 'secondary'}
          onClick={() => setReportCategory('attendance')}
        >
          <MapPin size={16} /> Attendance Reports
        </Button>
        <Button
          variant={reportCategory === 'project' ? 'primary' : 'secondary'}
          onClick={() => setReportCategory('project')}
        >
          <FolderKanban size={16} /> Project Reports
        </Button>
        <Button
          variant={reportCategory === 'task' ? 'primary' : 'secondary'}
          onClick={() => setReportCategory('task')}
        >
          <CheckSquare size={16} /> Task Reports
        </Button>
        <Button
          variant={reportCategory === 'payment' ? 'primary' : 'secondary'}
          onClick={() => setReportCategory('payment')}
        >
          <DollarSign size={16} /> Payment Reports
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <form onSubmit={handleApplyFilter} style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '160px' }}>
            <FormInput label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: '160px' }}>
            <FormInput label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>

          {reportCategory === 'payment' && (
            <div style={{ flex: 1, minWidth: '160px' }}>
              <FormSelect
                label="Payment Grouping"
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                options={[
                  { value: 'employee', label: 'By Employee' },
                  { value: 'daily', label: 'By Date' },
                  { value: 'project', label: 'By Project' },
                  { value: 'task', label: 'By Task' },
                ]}
              />
            </div>
          )}

          <Button type="submit" variant="primary" style={{ marginBottom: '1.25rem' }}>
            <Filter size={16} /> Apply Filters
          </Button>
        </form>
      </div>

      <div className="glass-card">
        <DataTable
          columns={getReportColumns() || []}
          data={data}
          searchPlaceholder={`Filter ${reportCategory} report records...`}
          exportFilename={`${reportCategory}_report`}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};
