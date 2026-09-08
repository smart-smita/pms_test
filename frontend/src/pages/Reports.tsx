import React, { useEffect, useState, useMemo } from 'react';
import { DataTable, Column } from '../components/common/DataTable';
import { Button } from '../components/common/Button';
import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';
import { apiRequest } from '../services/api';
import { 
  Users, FolderKanban, Clock, Calendar, Calculator, FileText, ChevronRight, Filter, HardHat, ShieldCheck
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';

type TabType = 'employee' | 'labour';
type ReportType = 
  | 'emp-details' | 'emp-discipline' | 'emp-attendance-1' | 'emp-attendance-2' | 'emp-attendance-3'
  | 'lab-details' | 'lab-discipline' | 'lab-attendance-1' | 'lab-attendance-2' | 'lab-attendance-3' | 'lab-cost';

export const Reports: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role_name === 'Admin' || user?.role_name === 'Super Admin';

  const [activeTab, setActiveTab] = useState<TabType>('employee');
  const [activeReport, setActiveReport] = useState<ReportType>('emp-details');
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAadhaar, setShowAadhaar] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [projectId, setProjectId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [labourId, setLabourId] = useState('');

  // Dropdown options
  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [labours, setLabours] = useState<any[]>([]);

  useEffect(() => {
    const loadOptions = async () => {
      const pRes = await apiRequest<any[]>('/projects');
      if (pRes.success && pRes.data) setProjects(pRes.data);
      
      const isManagerOrAdmin = isAdmin || user?.role_name === 'Manager';
      if (isManagerOrAdmin) {
        const eRes = await apiRequest<any[]>('/employees');
        if (eRes.success && eRes.data) setEmployees(eRes.data);
        const lRes = await apiRequest<any[]>('/labours');
        if (lRes.success && lRes.data) setLabours(lRes.data);
      }
    };
    loadOptions();
  }, [isAdmin, user?.role_name]);

  const fetchReportData = async () => {
    setIsLoading(true);
    let endpoint = '';
    const params = new URLSearchParams();

    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (projectId) params.append('project_id', projectId);
    if (employeeId) params.append('employee_id', employeeId);
    if (labourId) params.append('labour_id', labourId);

    switch (activeReport) {
      case 'emp-details': endpoint = '/reports/employee-details'; break;
      case 'emp-discipline': endpoint = '/reports/discipline-details'; break;
      case 'emp-attendance-1': endpoint = '/reports/employee-attendance-1'; break;
      case 'emp-attendance-2': endpoint = '/reports/employee-attendance-2'; break;
      case 'emp-attendance-3': endpoint = '/reports/employee-attendance-3'; break;

      case 'lab-details': endpoint = '/reports/labour-details'; break;
      case 'lab-discipline': endpoint = '/reports/discipline-details'; break;
      case 'lab-attendance-1': endpoint = '/reports/labour-attendance-1'; break;
      case 'lab-attendance-2': endpoint = '/reports/labour-attendance-2'; break;
      case 'lab-attendance-3': endpoint = '/reports/labour-attendance-3'; break;
      case 'lab-cost': endpoint = '/reports/labour-cost-payment'; break;
    }

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
  }, [activeReport]);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReportData();
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'employee') setActiveReport('emp-details');
    if (tab === 'labour') setActiveReport('lab-details');
    setData([]);
  };

  // --- COLUMN DEFINITIONS ---
  const empDetailsCols: Column<any>[] = [
    { header: 'Employee Code', accessor: 'employee_code', sortKey: 'employee_code' },
    { header: 'Employee Name', accessor: 'employee_name', sortKey: 'employee_name' },
    { header: 'Email ID', accessor: 'email', sortKey: 'email' },
    { header: 'Role', accessor: 'role_name', sortKey: 'role_name' },
    { header: 'Reporting Manager', accessor: (r) => r.manager_name || 'Direct Admin', sortKey: 'manager_name' },
    { header: 'Assigned Project', accessor: (r) => r.assigned_project_name || '-', sortKey: 'assigned_project_name' },
    { header: 'Discipline', accessor: (r) => r.assigned_wbs_name || '-', sortKey: 'assigned_wbs_name' },
  ];

  const disciplineDetailsCols: Column<any>[] = [
    { header: 'Project Name', accessor: 'project_name', sortKey: 'project_name' },
    { header: 'WBS Code', accessor: 'wbs_code', sortKey: 'wbs_code' },
    { header: 'WBS Discipline', accessor: 'wbs_name', sortKey: 'wbs_name' },
    { header: 'Parent Category', accessor: (r) => r.parent_name || 'Root Category', sortKey: 'parent_name' },
    { header: 'Plan Hours', accessor: 'total_hours', sortKey: 'total_hours' },
  ];

  const empAtt1Cols: Column<any>[] = [
    { header: 'Date', accessor: 'attendance_date', sortKey: 'attendance_date' },
    { header: 'Employee Code', accessor: 'employee_code', sortKey: 'employee_code' },
    { header: 'Employee Name', accessor: 'employee_name', sortKey: 'employee_name' },
    { header: 'Project Name', accessor: (r) => r.project_name || '-', sortKey: 'project_name' },
    { header: 'Discipline', accessor: (r) => r.wbs_name || '-', sortKey: 'wbs_name' },
    { header: 'Task', accessor: (r) => r.task_name || '-', sortKey: 'task_name' },
    { header: 'Check In', accessor: (r) => r.in_time ? `${r.in_time} (${r.in_status || 'site'})` : '-', sortKey: 'in_time' },
    { header: 'Check Out', accessor: (r) => r.out_time ? `${r.out_time} (${r.out_status || 'site'})` : '-', sortKey: 'out_time' },
    { header: 'Hours', accessor: (r) => `${Number(r.total_working_hours || 0).toFixed(2)} hrs`, sortKey: 'total_working_hours' },
    { header: 'Status', accessor: (r) => <Badge variant={r.status === 'completed' ? 'success' : 'warning'}>{r.status}</Badge>, sortKey: 'status' },
  ];

  const empAtt2Cols: Column<any>[] = [
    { header: 'Date', accessor: 'attendance_date', sortKey: 'attendance_date' },
    { header: 'Employee Code', accessor: 'employee_code', sortKey: 'employee_code' },
    { header: 'Employee Name', accessor: 'employee_name', sortKey: 'employee_name' },
    { header: 'In Time', accessor: 'in_time', sortKey: 'in_time' },
    { header: 'Out Time', accessor: 'out_time', sortKey: 'out_time' },
    { header: 'Hours Logged', accessor: (r) => `${Number(r.total_working_hours || 0).toFixed(2)} hrs`, sortKey: 'total_working_hours' },
  ];

  const empAtt3Cols: Column<any>[] = [
    { header: 'Employee Code', accessor: 'employee_code', sortKey: 'employee_code' },
    { header: 'Employee Name', accessor: 'employee_name', sortKey: 'employee_name' },
    { header: 'Days Present', accessor: 'days_present', sortKey: 'days_present' },
    { header: 'Total Hours', accessor: (r) => `${Number(r.total_hours || 0).toFixed(2)} hrs`, sortKey: 'total_hours' },
    { header: 'Avg Daily Hours', accessor: (r) => `${Number(r.avg_daily_hours || 0).toFixed(2)} hrs`, sortKey: 'avg_daily_hours' },
  ];

  const labDetailsCols: Column<any>[] = [
    { header: 'ID', accessor: 'labour_id', sortKey: 'labour_id' },
    { header: 'Labour Name', accessor: 'name', sortKey: 'name' },
    { header: 'Type', accessor: 'labour_type', sortKey: 'labour_type' },
    { header: 'Contact Number', accessor: (r) => r.contact_number || '-', sortKey: 'contact_number' },
    { 
      header: 'Aadhaar ID', 
      accessor: (r) => showAadhaar ? (r.aadhar_id || '-') : (r.aadhar_id ? r.aadhar_id.replace(/^.*(\d{4})$/, 'XXXX-XXXX-$1') : '-'),
      sortKey: 'aadhar_id'
    },
    { header: 'Parent Contractor', accessor: (r) => r.contractor_name || '-', sortKey: 'contractor_name' },
  ];

  const labAtt1Cols: Column<any>[] = [
    { header: 'Date', accessor: 'attendance_date', sortKey: 'attendance_date' },
    { header: 'Labour Name', accessor: 'labour_name', sortKey: 'labour_name' },
    { header: 'Type', accessor: 'labour_type', sortKey: 'labour_type' },
    { header: 'Project Name', accessor: (r) => r.project_name || '-', sortKey: 'project_name' },
    { header: 'WBS Discipline', accessor: (r) => r.wbs_name || '-', sortKey: 'wbs_name' },
    { header: 'Task Name', accessor: (r) => r.task_name || '-', sortKey: 'task_name' },
    { header: 'In Time', accessor: (r) => r.in_time || '-', sortKey: 'in_time' },
    { header: 'Out Time', accessor: (r) => r.out_time || '-', sortKey: 'out_time' },
    { header: 'Hours Logged', accessor: (r) => `${Number(r.total_working_hours || 0).toFixed(2)} hrs`, sortKey: 'total_working_hours' },
    { header: 'Rate', accessor: (r) => `₹${Number(r.rate || 0).toFixed(2)}/${r.rate_type || 'hr'}`, sortKey: 'rate' },
    { header: 'Log Amount', accessor: (r) => `₹${Number(r.calculated_payment || 0).toFixed(2)}`, sortKey: 'calculated_payment' },
    { header: 'Payment Status', accessor: (r) => <Badge variant={r.payment_status === 'paid' ? 'success' : 'warning'}>{r.payment_status || 'pending'}</Badge>, sortKey: 'payment_status' },
  ];

  const labAtt2Cols: Column<any>[] = [
    { header: 'Date', accessor: 'attendance_date', sortKey: 'attendance_date' },
    { header: 'Labour Name', accessor: 'labour_name', sortKey: 'labour_name' },
    { header: 'Project', accessor: (r) => r.project_name || '-', sortKey: 'project_name' },
    { header: 'Discipline', accessor: (r) => r.discipline_name || '-', sortKey: 'discipline_name' },
    { header: 'Task Name', accessor: (r) => r.task_name || '-', sortKey: 'task_name' },
    { header: 'In Time', accessor: 'in_time', sortKey: 'in_time' },
    { header: 'Out Time', accessor: 'out_time', sortKey: 'out_time' },
    { header: 'Hours', accessor: (r) => `${Number(r.total_working_hours || 0).toFixed(2)} hrs`, sortKey: 'total_working_hours' },
    { header: 'Pay Amount', accessor: (r) => `₹${Number(r.daily_pay_amount || 0).toFixed(2)}`, sortKey: 'daily_pay_amount' },
  ];

  const labAtt3Cols: Column<any>[] = [
    { header: 'Labour Name', accessor: 'labour_name', sortKey: 'labour_name' },
    { header: 'Type', accessor: 'labour_type', sortKey: 'labour_type' },
    { header: 'Project Name', accessor: (r) => r.project_name || '-', sortKey: 'project_name' },
    { header: 'Discipline', accessor: (r) => r.discipline_name || '-', sortKey: 'discipline_name' },
    { header: 'Days Worked', accessor: 'days_worked', sortKey: 'days_worked' },
    { header: 'Total Work Logs', accessor: 'total_work_logs', sortKey: 'total_work_logs' },
    { header: 'Total Hours', accessor: (r) => `${Number(r.total_hours || 0).toFixed(2)} hrs`, sortKey: 'total_hours' },
    { header: 'Total Payout', accessor: (r) => `₹${Number(r.total_payment || 0).toFixed(2)}`, sortKey: 'total_payment' },
  ];

  const labCostCols: Column<any>[] = [
    { header: 'Date', accessor: 'attendance_date', sortKey: 'attendance_date' },
    { header: 'Labour Name', accessor: 'labour_name', sortKey: 'labour_name' },
    { header: 'Project Name', accessor: (r) => r.project_name || '-', sortKey: 'project_name' },
    { header: 'Discipline', accessor: (r) => r.discipline_name || '-', sortKey: 'discipline_name' },
    { header: 'Task Name', accessor: (r) => r.task_name || '-', sortKey: 'task_name' },
    { header: 'Hours', accessor: (r) => `${Number(r.total_working_hours || 0).toFixed(2)} hrs`, sortKey: 'total_working_hours' },
    { header: 'Rate', accessor: (r) => `₹${Number(r.rate || 0).toFixed(2)}/${r.rate_type || 'hr'}`, sortKey: 'rate' },
    { 
      header: 'Total Cost', 
      accessor: (r) => <span style={{ fontWeight: 800, color: '#10b981' }}>₹{Number(r.calculated_payment || 0).toFixed(2)}</span>, 
      sortKey: 'calculated_payment' 
    },
    { header: 'Payment Status', accessor: (r) => <Badge variant={r.payment_status === 'paid' ? 'success' : 'warning'}>{r.payment_status || 'pending'}</Badge>, sortKey: 'payment_status' },
  ];

  const getColumns = () => {
    switch (activeReport) {
      case 'emp-details': return empDetailsCols;
      case 'emp-discipline': return disciplineDetailsCols;
      case 'emp-attendance-1': return empAtt1Cols;
      case 'emp-attendance-2': return empAtt2Cols;
      case 'emp-attendance-3': return empAtt3Cols;

      case 'lab-details': return labDetailsCols;
      case 'lab-discipline': return disciplineDetailsCols;
      case 'lab-attendance-1': return labAtt1Cols;
      case 'lab-attendance-2': return labAtt2Cols;
      case 'lab-attendance-3': return labAtt3Cols;
      case 'lab-cost': return labCostCols;
      default: return empDetailsCols;
    }
  };

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics & Custom Reports</h1>
          <p className="page-subtitle">
            Generate and export custom project, employee, and labour payment reports.
          </p>
        </div>
      </div>

      {/* Primary Category Selector */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button 
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'employee' ? 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' : 'rgba(255,255,255,0.05)',
            color: activeTab === 'employee' ? '#fff' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
          onClick={() => handleTabChange('employee')}
        >
          <Users size={18} /> Employee Reports
        </button>
        <button 
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'labour' ? 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' : 'rgba(255,255,255,0.05)',
            color: activeTab === 'labour' ? '#fff' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
          onClick={() => handleTabChange('labour')}
        >
          <HardHat size={18} /> Labour / Contractor Reports
        </button>
      </div>

      {/* Report Cards Grid */}
      <div className="report-module-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {activeTab === 'employee' ? (
          <>
            <ReportCard title="Employee Details" desc="Complete list of employees with roles, status, and reporting hierarchy." icon={<Users size={20} />} active={activeReport === 'emp-details'} onClick={() => setActiveReport('emp-details')} />
            <ReportCard title="Discipline Details" desc="List of all WBS disciplines and allocated projects." icon={<FolderKanban size={20} />} active={activeReport === 'emp-discipline'} onClick={() => setActiveReport('emp-discipline')} />
            <ReportCard title="Attendance Report 1 (Hrs & Address)" desc="Detailed day-wise Check-In/Out times and GPS site addresses." icon={<Calendar size={20} />} active={activeReport === 'emp-attendance-1'} onClick={() => setActiveReport('emp-attendance-1')} />
            <ReportCard title="Attendance Report 2 (In/Out & Hours)" desc="Simple day-wise In/Out times and working hours." icon={<Clock size={20} />} active={activeReport === 'emp-attendance-2'} onClick={() => setActiveReport('emp-attendance-2')} />
            <ReportCard title="Attendance Report 3 (Summary)" desc="Employee-wise attendance days present, total hours, and daily average." icon={<FileText size={20} />} active={activeReport === 'emp-attendance-3'} onClick={() => setActiveReport('emp-attendance-3')} />
          </>
        ) : (
          <>
            <ReportCard title="Labour Details" desc="List of contractors and direct workers with contact & Aadhaar verification." icon={<Users size={20} />} active={activeReport === 'lab-details'} onClick={() => setActiveReport('lab-details')} />
            <ReportCard title="Discipline Details" desc="Discipline allocations and sub-task status." icon={<FolderKanban size={20} />} active={activeReport === 'lab-discipline'} onClick={() => setActiveReport('lab-discipline')} />
            <ReportCard title="Labour Work Log Report 1 (Logs & Rates)" desc="Day-wise worker Check-In/Out times, hours, rate, and amount." icon={<Calendar size={20} />} active={activeReport === 'lab-attendance-1'} onClick={() => setActiveReport('lab-attendance-1')} />
            <ReportCard title="Labour Work Log Report 2 (In/Out & Hours)" desc="Day-wise In/Out times and working hours." icon={<Clock size={20} />} active={activeReport === 'lab-attendance-2'} onClick={() => setActiveReport('lab-attendance-2')} />
            <ReportCard title="Labour Work Log Summary" desc="Worker days worked, total work logs, hours, and payout summary." icon={<FileText size={20} />} active={activeReport === 'lab-attendance-3'} onClick={() => setActiveReport('lab-attendance-3')} />
            <ReportCard title="Labour Cost / Payment Report" desc="Work log-wise cost, rates, and payment status breakdown." icon={<Calculator size={20} />} active={activeReport === 'lab-cost'} onClick={() => setActiveReport('lab-cost')} />
          </>
        )}
      </div>

      {/* Filter Bar */}
      <div className="glass-card mb-6" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <FormInput label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <FormInput label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <FormSelect
          label="Project"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          options={[
            { value: '', label: 'All Projects' },
            ...projects.map(p => ({ value: p.project_id.toString(), label: p.project_name }))
          ]}
        />
        {activeTab === 'employee' ? (
          <FormSelect
            label="Employee"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            options={[
              { value: '', label: 'All Employees' },
              ...employees.map(e => ({ value: e.employee_id.toString(), label: e.name }))
            ]}
          />
        ) : (
          <FormSelect
            label="Labour / Contractor"
            value={labourId}
            onChange={(e) => setLabourId(e.target.value)}
            options={[
              { value: '', label: 'All Labours' },
              ...labours.map(l => ({ value: l.labour_id.toString(), label: `${l.name} (${l.labour_type})` }))
            ]}
          />
        )}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <Button variant="secondary" onClick={() => { setStartDate(''); setEndDate(''); setProjectId(''); setEmployeeId(''); setLabourId(''); fetchReportData(); }}>
            Reset
          </Button>
          <Button onClick={handleApplyFilter}>
            <Filter size={16} /> Filter
          </Button>
          {activeReport === 'lab-details' && (
            <Button variant="secondary" onClick={() => setShowAadhaar(!showAadhaar)}>
              <ShieldCheck size={16} /> {showAadhaar ? 'Hide Aadhaar' : 'Show Aadhaar'}
            </Button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-card">
        <DataTable
          columns={getColumns()}
          data={data}
          isLoading={isLoading}
          searchPlaceholder={`Search ${activeReport} records...`}
          exportFilename={`HTCO_Report_${activeReport}_${new Date().toISOString().split('T')[0]}`}
        />
      </div>
    </div>
  );
};

const ReportCard = ({ title, desc, icon, active, onClick }: { title: string, desc: string, icon: any, active: boolean, onClick: () => void }) => (
  <div 
    onClick={onClick}
    style={{
      padding: '1.25rem',
      borderRadius: 'var(--radius-lg)',
      background: active ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)' : 'var(--bg-card)',
      border: `1px solid ${active ? '#6366f1' : 'var(--border-color)'}`,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
      <div style={{ color: active ? '#6366f1' : 'var(--text-secondary)' }}>{icon}</div>
      <div style={{ fontWeight: 600, color: active ? 'var(--text-primary)' : 'var(--text-main)', fontSize: '0.95rem' }}>{title}</div>
    </div>
    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{desc}</div>
  </div>
);
