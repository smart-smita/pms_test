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
  | 'emp-details' | 'emp-discipline' | 'emp-attendance-1' | 'emp-attendance-2' | 'emp-attendance-3' | 'emp-cost'
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
      
      if (isAdmin) {
        const eRes = await apiRequest<any[]>('/employees');
        if (eRes.success && eRes.data) setEmployees(eRes.data);
        const lRes = await apiRequest<any[]>('/labours');
        if (lRes.success && lRes.data) setLabours(lRes.data);
      }
    };
    loadOptions();
  }, [isAdmin]);

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
      case 'emp-cost': endpoint = '/reports/cost-payment'; break;

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
    { header: 'Hourly Rate', accessor: (r) => `₹${Number(r.hourly_rate || 0).toFixed(2)}`, sortKey: 'hourly_rate' },
    { header: 'Status', accessor: (r) => <Badge variant={r.status === 'active' ? 'success' : 'danger'}>{r.status}</Badge>, sortKey: 'status' },
  ];

  const discDetailsCols: Column<any>[] = [
    { header: 'Discipline Code', accessor: 'wbs_code', sortKey: 'wbs_code' },
    { header: 'Discipline Name', accessor: 'wbs_name', sortKey: 'wbs_name' },
    { header: 'Description', accessor: (r) => r.description || '-' },
    { header: 'Allocated Projects', accessor: (r) => r.allocated_projects_count || 0, sortKey: 'allocated_projects_count' },
    { header: 'Planned Hours', accessor: (r) => `${Number(r.total_planned_hours || 0).toFixed(1)} hrs`, sortKey: 'total_planned_hours' },
    { header: 'Status', accessor: (r) => <Badge variant={r.status === 1 ? 'success' : 'danger'}>{r.status === 1 ? 'Active' : 'Inactive'}</Badge>, sortKey: 'status' },
  ];

  const empAtt1Cols: Column<any>[] = [
    { header: 'Date', accessor: 'attendance_date', sortKey: 'attendance_date' },
    { header: 'Employee Code', accessor: 'employee_code', sortKey: 'employee_code' },
    { header: 'Employee Name', accessor: 'employee_name', sortKey: 'employee_name' },
    { header: 'Project / Task', accessor: (r) => r.task_name ? `${r.task_name} (${r.project_name || ''})` : 'General Site Work', sortKey: 'task_name' },
    { header: 'Check In Time', accessor: (r) => r.in_time || '-', sortKey: 'in_time' },
    { header: 'Check Out Time', accessor: (r) => r.out_time || '-', sortKey: 'out_time' },
    { header: 'Total Working Hours', accessor: (r) => `${Number(r.total_working_hours || 0).toFixed(2)} hrs`, sortKey: 'total_working_hours' },
    { header: 'Check In Address', accessor: (r) => r.in_address || '-', sortKey: 'in_address' },
    { header: 'Check Out Address', accessor: (r) => r.out_address || '-', sortKey: 'out_address' },
  ];

  const empAtt2Cols: Column<any>[] = [
    { header: 'Date', accessor: 'attendance_date', sortKey: 'attendance_date' },
    { header: 'Employee Code', accessor: 'employee_code', sortKey: 'employee_code' },
    { header: 'Employee Name', accessor: 'employee_name', sortKey: 'employee_name' },
    { header: 'Check In Time', accessor: (r) => r.in_time || '-', sortKey: 'in_time' },
    { header: 'Check Out Time', accessor: (r) => r.out_time || '-', sortKey: 'out_time' },
    { header: 'Working Hours', accessor: (r) => `${Number(r.total_working_hours || 0).toFixed(2)} hrs`, sortKey: 'total_working_hours' },
  ];

  const empAtt3Cols: Column<any>[] = [
    { header: 'Employee Code', accessor: 'employee_code', sortKey: 'employee_code' },
    { header: 'Employee Name', accessor: 'employee_name', sortKey: 'employee_name' },
    { header: 'Days Present', accessor: 'days_present', sortKey: 'days_present' },
    { header: 'Total Working Hours', accessor: (r) => `${Number(r.total_working_hours || 0).toFixed(2)} hrs`, sortKey: 'total_working_hours' },
    { header: 'Avg Hours / Day', accessor: (r) => `${Number(r.avg_hours_per_day || 0).toFixed(2)} hrs`, sortKey: 'avg_hours_per_day' },
  ];

  const labDetailsCols: Column<any>[] = [
    { header: 'Labour Name', accessor: 'labour_name', sortKey: 'labour_name' },
    { header: 'Type', accessor: (r) => <Badge variant={r.labour_type === 'contractor' ? 'info' : 'success'}>{r.labour_type}</Badge>, sortKey: 'labour_type' },
    { header: 'Contact Number', accessor: (r) => r.contact_number || '-', sortKey: 'contact_number' },
    { 
      header: 'Aadhaar ID', 
      accessor: (r) => showAadhaar ? (r.aadhar_id || '-') : (r.aadhar_id ? `XXXX-XXXX-${r.aadhar_id.slice(-4)}` : '-'),
      sortKey: 'aadhar_id' 
    },
    { header: 'Contractor Name', accessor: (r) => r.contractor_name || 'Direct Entry', sortKey: 'contractor_name' },
    { header: 'Created Date', accessor: 'created_date', sortKey: 'created_date' },
  ];

  const labAtt1Cols: Column<any>[] = [
    { header: 'Date', accessor: 'attendance_date', sortKey: 'attendance_date' },
    { header: 'Labour Name', accessor: 'labour_name', sortKey: 'labour_name' },
    { header: 'Project / Discipline', accessor: (r) => `${r.project_name || '-'} / ${r.wbs_name || '-'}`, sortKey: 'project_name' },
    { header: 'Task Name', accessor: (r) => r.task_name || '-', sortKey: 'task_name' },
    { header: 'In Time', accessor: (r) => r.in_time || '-', sortKey: 'in_time' },
    { header: 'Out Time', accessor: (r) => r.out_time || '-', sortKey: 'out_time' },
    { header: 'In Address', accessor: (r) => r.in_address || '-', sortKey: 'in_address' },
    { header: 'Out Address', accessor: (r) => r.out_address || '-', sortKey: 'out_address' },
    { header: 'Worker Count', accessor: 'worker_count', sortKey: 'worker_count' },
  ];

  const labAtt2Cols: Column<any>[] = [
    { header: 'Date', accessor: 'attendance_date', sortKey: 'attendance_date' },
    { header: 'Labour Name', accessor: 'labour_name', sortKey: 'labour_name' },
    { header: 'In Time', accessor: (r) => r.in_time || '-', sortKey: 'in_time' },
    { header: 'Out Time', accessor: (r) => r.out_time || '-', sortKey: 'out_time' },
    { header: 'Worker Count', accessor: 'worker_count', sortKey: 'worker_count' },
  ];

  const labAtt3Cols: Column<any>[] = [
    { header: 'Labour Name', accessor: 'labour_name', sortKey: 'labour_name' },
    { header: 'Labour Type', accessor: 'labour_type', sortKey: 'labour_type' },
    { header: 'Days Worked', accessor: 'days_worked', sortKey: 'days_worked' },
    { header: 'Total Worker Shifts', accessor: 'total_worker_shifts', sortKey: 'total_worker_shifts' },
    { header: 'Total Payment (₹)', accessor: (r) => `₹${Number(r.total_payment || 0).toFixed(2)}`, sortKey: 'total_payment' },
  ];

  const labCostCols: Column<any>[] = [
    { header: 'Date', accessor: 'attendance_date', sortKey: 'attendance_date' },
    { header: 'Labour Name', accessor: 'labour_name', sortKey: 'labour_name' },
    { header: 'Contractor', accessor: (r) => r.contractor_name || 'Direct', sortKey: 'contractor_name' },
    { header: 'Project / Task', accessor: (r) => r.task_name ? `${r.task_name} (${r.project_name || ''})` : r.project_name || '-', sortKey: 'project_name' },
    { header: 'In / Out Time', accessor: (r) => `${r.in_time || '-'} / ${r.out_time || '-'}`, sortKey: 'in_time' },
    { header: 'Worker Count', accessor: 'worker_count', sortKey: 'worker_count' },
    { header: 'Flat Daily Pay', accessor: (r) => `₹${Number(r.daily_pay_amount || 0).toFixed(2)}`, sortKey: 'daily_pay_amount' },
    { header: 'Calculated Payment', accessor: (r) => `₹${Number(r.calculated_payment || 0).toFixed(2)}`, sortKey: 'calculated_payment' },
    { header: 'Total Payment', accessor: (r) => <strong style={{ color: '#10b981' }}>₹{Number(r.total_payment || 0).toFixed(2)}</strong>, sortKey: 'total_payment' },
    { header: 'Status', accessor: (r) => <Badge variant="success">{r.payment_status || 'Processed'}</Badge>, sortKey: 'payment_status' },
  ];

  const getColumns = () => {
    switch (activeReport) {
      case 'emp-details': return empDetailsCols;
      case 'emp-discipline': return discDetailsCols;
      case 'emp-attendance-1': return empAtt1Cols;
      case 'emp-attendance-2': return empAtt2Cols;
      case 'emp-attendance-3': return empAtt3Cols;
      case 'emp-cost': return empAtt1Cols;

      case 'lab-details': return labDetailsCols;
      case 'lab-discipline': return discDetailsCols;
      case 'lab-attendance-1': return labAtt1Cols;
      case 'lab-attendance-2': return labAtt2Cols;
      case 'lab-attendance-3': return labAtt3Cols;
      case 'lab-cost': return labCostCols;
      default: return [];
    }
  };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics & Custom Reports</h1>
          <p className="page-subtitle">Generate, view, filter and export operational reports for employees and labours.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="report-tabs-header" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
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
            <ReportCard title="Labour Attendance Report 1 (Hrs & Address)" desc="Day-wise worker Check-In/Out times and site location address." icon={<Calendar size={20} />} active={activeReport === 'lab-attendance-1'} onClick={() => setActiveReport('lab-attendance-1')} />
            <ReportCard title="Labour Attendance Report 2 (In/Out & Hours)" desc="Day-wise In/Out times and shift worker counts." icon={<Clock size={20} />} active={activeReport === 'lab-attendance-2'} onClick={() => setActiveReport('lab-attendance-2')} />
            <ReportCard title="Labour Attendance Report 3 (Summary)" desc="Worker days worked, total shifts, and payout summary." icon={<FileText size={20} />} active={activeReport === 'lab-attendance-3'} onClick={() => setActiveReport('lab-attendance-3')} />
            <ReportCard title="Labour Cost / Payment Report" desc="Attendance-wise flat daily payouts and calculated payment breakdown." icon={<Calculator size={20} />} active={activeReport === 'lab-cost'} onClick={() => setActiveReport('lab-cost')} />
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
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}
  >
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
          {icon}
        </div>
        <ChevronRight size={18} color={active ? '#6366f1' : 'var(--text-secondary)'} />
      </div>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.35rem 0' }}>{title}</h3>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>{desc}</p>
    </div>
  </div>
);
