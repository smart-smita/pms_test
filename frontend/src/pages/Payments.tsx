import React, { useEffect, useState } from 'react';
import { DataTable, Column } from '../components/common/DataTable';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { apiRequest, apiService } from '../services/api';
import { DollarSign, Calendar, Users, FolderKanban, CheckSquare, Filter, RotateCcw, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { showSuccess, showError } from '../utils/toast';

export const Payments: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role_name === 'Admin' || user?.role_name === 'Super Admin';

  const [activeTab, setActiveTab] = useState<'daily' | 'labour' | 'project' | 'task' | 'vouchers'>('daily');
  const [data, setData] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiRequest<any[]>('/projects').then((res) => {
      if (res.success && res.data) {
        setProjects(res.data);
      }
    });
  }, []);

  const fetchPaymentData = async (tab: string, projectIdFilter?: string) => {
    setIsLoading(true);
    let endpoint = '/payments/daily';
    if (tab === 'labour') endpoint = '/payments/labour';
    if (tab === 'project') endpoint = '/payments/project';
    if (tab === 'task') endpoint = '/payments/task';
    if (tab === 'vouchers') endpoint = '/labour-payments';

    const params = new URLSearchParams();
    if (projectIdFilter) params.append('project_id', projectIdFilter);

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
    fetchPaymentData(activeTab, selectedProjectId);
  }, [activeTab, selectedProjectId]);

  const handleUpdatePaymentStatus = async (paymentId: number, status: 'approved' | 'paid' | 'cancelled') => {
    try {
      const res = await apiService.put(`/labour-payments/${paymentId}/status`, { status });
      if (res.success) {
        showSuccess(`Payment voucher status updated to ${status}`);
        fetchPaymentData(activeTab, selectedProjectId);
      } else {
        showError(res.message || 'Status update failed');
      }
    } catch (err: any) {
      showError(err.message || 'Status update failed');
    }
  };

  const dailyColumns: Column<any>[] = [
    { header: 'Date', accessor: 'attendance_date', sortKey: 'attendance_date' },
    { header: 'Total Active Workers', accessor: 'total_workers', sortKey: 'total_workers' },
    { header: 'Total Work Logs', accessor: 'total_work_logs', sortKey: 'total_work_logs' },
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

  const labourColumns: Column<any>[] = [
    { header: 'ID', accessor: 'labour_id', sortKey: 'labour_id' },
    { header: 'Labour Name', accessor: 'labour_name', sortKey: 'labour_name' },
    { header: 'Type', accessor: 'labour_type', sortKey: 'labour_type' },
    { header: 'Days Worked', accessor: 'days_worked', sortKey: 'days_worked' },
    { header: 'Total Work Logs', accessor: 'total_work_logs', sortKey: 'total_work_logs' },
    { header: 'Total Hours', accessor: (r) => `${Number(r.total_hours).toFixed(2)} hrs`, csvAccessor: (r) => Number(r.total_hours).toFixed(2), sortKey: 'total_hours' },
    {
      header: 'Total Labour Payout',
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
    { header: 'Work Logs Count', accessor: 'total_work_logs', sortKey: 'total_work_logs' },
    { header: 'Total Hours Logged', accessor: (r) => `${Number(r.total_hours).toFixed(2)} hrs`, csvAccessor: (r) => Number(r.total_hours).toFixed(2), sortKey: 'total_hours' },
    {
      header: 'Project Labour Cost',
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
    { header: 'WBS Discipline', accessor: (r) => r.wbs_name || '-', sortKey: 'wbs_name' },
    { header: 'Planned Est. Hours', accessor: (r) => `${Number(r.estimated_hours || 0).toFixed(2)} hrs`, csvAccessor: (r) => Number(r.estimated_hours || 0).toFixed(2), sortKey: 'estimated_hours' },
    { header: 'Actual Logged Hours', accessor: (r) => `${Number(r.actual_hours || 0).toFixed(2)} hrs`, csvAccessor: (r) => Number(r.actual_hours || 0).toFixed(2), sortKey: 'actual_hours' },
    {
      header: 'Task Total Cost',
      accessor: (r) => (
        <span style={{ fontWeight: 800, color: '#10b981', fontSize: '1rem' }}>
          ₹{Number(r.total_cost || 0).toFixed(2)}
        </span>
      ),
      csvAccessor: (r) => Number(r.total_cost || 0).toFixed(2),
      sortKey: 'total_cost'
    },
  ];

  const voucherColumns: Column<any>[] = [
    { header: 'Voucher Code', accessor: 'payment_code', sortKey: 'payment_code' },
    { header: 'Labour Name', accessor: 'labour_name', sortKey: 'labour_name' },
    { header: 'Payment Date', accessor: 'payment_date', sortKey: 'payment_date' },
    { header: 'Method', accessor: 'payment_method', sortKey: 'payment_method' },
    { header: 'Total Hours', accessor: (r) => `${Number(r.total_hours).toFixed(2)} hrs`, csvAccessor: (r) => Number(r.total_hours).toFixed(2), sortKey: 'total_hours' },
    {
      header: 'Voucher Amount',
      accessor: (r) => (
        <span style={{ fontWeight: 800, color: '#10b981', fontSize: '1rem' }}>
          ₹{Number(r.total_amount).toFixed(2)}
        </span>
      ),
      csvAccessor: (r) => Number(r.total_amount).toFixed(2),
      sortKey: 'total_amount'
    },
    {
      header: 'Status',
      accessor: (r) => (
        <span
          className="badge"
          style={{
            background: r.status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : r.status === 'approved' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            color: r.status === 'paid' ? '#10b981' : r.status === 'approved' ? '#3b82f6' : '#f59e0b',
            textTransform: 'capitalize',
            padding: '0.25rem 0.6rem',
            borderRadius: '4px',
            fontWeight: 600
          }}
        >
          {r.status}
        </span>
      ),
      sortKey: 'status'
    },
    {
      header: 'Actions',
      accessor: (r) => (
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {r.status === 'pending' && (
            <button
              onClick={() => handleUpdatePaymentStatus(r.payment_id, 'approved')}
              className="btn btn-outline"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#3b82f6' }}
            >
              Approve
            </button>
          )}
          {r.status !== 'paid' && r.status !== 'cancelled' && (
            <button
              onClick={() => handleUpdatePaymentStatus(r.payment_id, 'paid')}
              className="btn btn-primary"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
            >
              Mark Paid
            </button>
          )}
        </div>
      )
    }
  ];

  const renderActiveColumns = () => {
    switch (activeTab) {
      case 'daily': return dailyColumns;
      case 'labour': return labourColumns;
      case 'project': return projectColumns;
      case 'task': return taskColumns;
      case 'vouchers': return voucherColumns;
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Labour & Contractor Payments</h1>
          <p className="page-subtitle">
            Day-wise, Labour-wise, and Task-wise payout management computed strictly from Labour Work Logs.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <Button
          variant={activeTab === 'daily' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('daily')}
        >
          <Calendar size={16} /> Daily Payouts
        </Button>
        <Button
          variant={activeTab === 'labour' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('labour')}
        >
          <Users size={16} /> Labour-Wise Payments
        </Button>
        <Button
          variant={activeTab === 'project' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('project')}
        >
          <FolderKanban size={16} /> Project Labour Cost
        </Button>
        <Button
          variant={activeTab === 'task' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('task')}
        >
          <CheckSquare size={16} /> Task Labour Cost
        </Button>
        <Button
          variant={activeTab === 'vouchers' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('vouchers')}
        >
          <FileText size={16} /> Payment Vouchers
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>
            <Filter size={16} style={{ color: '#6366f1' }} /> Filter Payments:
          </div>

          <div style={{ minWidth: '220px' }}>
            <select
              className="form-input"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.875rem' }}
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.project_id} value={p.project_id}>
                  {p.project_name}
                </option>
              ))}
            </select>
          </div>

          {selectedProjectId !== '' && (
            <Button
              variant="secondary"
              onClick={() => setSelectedProjectId('')}
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
            >
              <RotateCcw size={14} /> Reset Filter
            </Button>
          )}

          <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing <strong>{data.length}</strong> payment records
          </div>
        </div>
      </div>

      <div className="glass-card">
        <DataTable
          columns={renderActiveColumns() || []}
          data={data}
          searchPlaceholder={`Search ${activeTab} payment records...`}
          exportFilename={`labour_${activeTab}_payment_report`}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};
