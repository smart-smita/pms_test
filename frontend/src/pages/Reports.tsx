import React, { useEffect, useState, useMemo } from 'react';
import { DataTable, Column } from '../components/common/DataTable';
import { Button } from '../components/common/Button';
import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';
import { apiRequest } from '../services/api';
import { showSuccess, showError } from '../utils/toast';
import { 
  Users, FolderKanban, Clock, Calendar, Calculator, FileText, Filter, HardHat, ShieldCheck, Download, ChevronLeft, ChevronRight, TableProperties
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';

type TabType = 'employee' | 'labour';
type ReportType = 
  | 'emp-details' | 'emp-discipline' | 'emp-attendance-1' | 'emp-attendance-3' | 'emp-daywise-2'
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

  // Day-wise View 2 specific filters (separate state to avoid cross-report bleed)
  const [dw2EmployeeId, setDw2EmployeeId] = useState('');
  const [dw2StartDate, setDw2StartDate] = useState('');
  const [dw2EndDate, setDw2EndDate] = useState('');

  // Attendance Report 3 Summary Matrix specific filters
  const [att3EmployeeId, setAtt3EmployeeId] = useState('');
  const [att3StartDate, setAtt3StartDate] = useState('');
  const [att3EndDate, setAtt3EndDate] = useState('');

  // Dropdown options
  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [labours, setLabours] = useState<any[]>([]);

  // Day-wise report filters for Attendance 1
  const [att1EmployeeId, setAtt1EmployeeId] = useState('');
  const [att1StartDate, setAtt1StartDate] = useState('');
  const [att1EndDate, setAtt1EndDate] = useState('');

  // Unified Labour Reports filters (for 1, 2, 3)
  const [labStartDate, setLabStartDate] = useState('');
  const [labEndDate, setLabEndDate] = useState('');
  const [labLabourId, setLabLabourId] = useState('');
  const [labProjectId, setLabProjectId] = useState('');
  const [labDisciplineId, setLabDisciplineId] = useState('');
  const [labTaskId, setLabTaskId] = useState('');
  
  const [disciplines, setDisciplines] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

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
      
      const wRes = await apiRequest<any[]>('/wbs');
      if (wRes.success && wRes.data) setDisciplines(wRes.data);
      
      const tRes = await apiRequest<any[]>('/tasks');
      if (tRes.success && tRes.data) setTasks(tRes.data);
    };
    loadOptions();
  }, [isAdmin, user?.role_name]);

  const [projectDisciplines, setProjectDisciplines] = useState<any[]>([]);

  useEffect(() => {
    if (labProjectId) {
      apiRequest<any[]>(`/projects/${labProjectId}/wbs`).then((res) => {
        if (res.success && res.data) {
          setProjectDisciplines(res.data);
        } else {
          setProjectDisciplines([]);
        }
      });
    } else {
      setProjectDisciplines(disciplines);
    }
  }, [labProjectId, disciplines]);

  const filteredReportDisciplines = useMemo(() => {
    return projectDisciplines;
  }, [projectDisciplines]);

  const filteredReportTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((t) => {
      if (labProjectId && Number(t.project_id) !== Number(labProjectId)) return false;
      if (labDisciplineId && Number(t.wbs_id) !== Number(labDisciplineId)) return false;
      return true;
    });
  }, [tasks, labProjectId, labDisciplineId]);

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
      case 'emp-attendance-3': endpoint = '/reports/employee-attendance-3'; break;

      case 'lab-details': endpoint = '/reports/labour-details'; break;
      case 'lab-discipline': endpoint = '/reports/discipline-details'; break;
      case 'lab-cost': endpoint = '/reports/labour-cost-payment'; break;
      default: break;
    }

    if (!endpoint) { setIsLoading(false); return; }
    if (params.toString()) endpoint += `?${params.toString()}`;

    const res = await apiRequest<any[]>(endpoint);
    if (res.success && res.data) {
      setData(res.data);
    } else {
      setData([]);
    }
    setIsLoading(false);
  };

  const fetchDw2Data = async () => {
    if (!dw2StartDate || !dw2EndDate) {
      setData([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const params = new URLSearchParams();
    params.append('start_date', dw2StartDate);
    params.append('end_date', dw2EndDate);
    if (dw2EmployeeId) params.append('employee_id', dw2EmployeeId);
    const res = await apiRequest<any[]>(`/reports/employee-attendance-daywise-2?${params.toString()}`);
    if (res.success && res.data) {
      setData(res.data);
    } else {
      setData([]);
    }
    setIsLoading(false);
  };

  const fetchAtt3MatrixData = async () => {
    if (!att3StartDate || !att3EndDate) {
      setData([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const params = new URLSearchParams();
    params.append('start_date', att3StartDate);
    params.append('end_date', att3EndDate);
    if (att3EmployeeId) params.append('employee_id', att3EmployeeId);
    const res = await apiRequest<any[]>(`/reports/employee-attendance-summary-matrix?${params.toString()}`);
    if (res.success && res.data) {
      setData(res.data);
    } else {
      setData([]);
    }
    setIsLoading(false);
  };

  const fetchAtt1MatrixData = async () => {
    if (!att1StartDate || !att1EndDate) {
      setData([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const params = new URLSearchParams();
    params.append('start_date', att1StartDate);
    params.append('end_date', att1EndDate);
    if (att1EmployeeId) params.append('employee_id', att1EmployeeId);
    const res = await apiRequest<any[]>(`/reports/employee-attendance-1?${params.toString()}`);
    if (res.success && res.data) {
      setData(res.data);
    } else {
      setData([]);
    }
    setIsLoading(false);
  };

  const fetchLabReport = async () => {
    if (!labStartDate || !labEndDate) { 
      setData([]); 
      return; 
    }
    setIsLoading(true);
    const params = new URLSearchParams();
    params.append('start_date', labStartDate);
    params.append('end_date', labEndDate);
    if (labLabourId) params.append('labour_id', labLabourId);
    if (labProjectId) params.append('project_id', labProjectId);
    if (labDisciplineId) params.append('wbs_id', labDisciplineId);
    if (labTaskId) params.append('task_id', labTaskId);

    let endpoint = '';
    if (activeReport === 'lab-attendance-1') endpoint = '/reports/labour-attendance-1';
    else if (activeReport === 'lab-attendance-2') endpoint = '/reports/labour-attendance-2';
    else if (activeReport === 'lab-attendance-3') endpoint = '/reports/labour-attendance-3';
    
    if (endpoint) {
      const res = await apiRequest<any[]>(`${endpoint}?${params.toString()}`);
      if (res.success && res.data) setData(res.data);
      else setData([]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (
      activeReport === 'emp-daywise-2' || 
      activeReport === 'emp-attendance-3' || 
      activeReport === 'emp-attendance-1' ||
      activeReport === 'lab-attendance-1' ||
      activeReport === 'lab-attendance-2' ||
      activeReport === 'lab-attendance-3'
    ) {
      setData([]);
      return;
    }
    fetchReportData();
  }, [activeReport]);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReportData();
  };

  const handleLabFilter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!labStartDate || !labEndDate) {
      showError('From Date and To Date are required for this report.');
      return;
    }
    if (new Date(labStartDate) > new Date(labEndDate)) {
      showError('From Date cannot be greater than To Date.');
      return;
    }
    fetchLabReport();
  };

  const handleLabReset = () => {
    setLabStartDate('');
    setLabEndDate('');
    setLabLabourId('');
    setLabProjectId('');
    setLabDisciplineId('');
    setLabTaskId('');
    setData([]);
  };

  const handleDw2Filter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dw2StartDate || !dw2EndDate) {
      showError('From Date and To Date are required for this report.');
      return;
    }
    if (new Date(dw2StartDate) > new Date(dw2EndDate)) {
      showError('From Date cannot be greater than To Date.');
      return;
    }
    fetchDw2Data();
  };

  const handleDw2Reset = () => {
    setDw2EmployeeId('');
    setDw2StartDate('');
    setDw2EndDate('');
    setData([]);
  };

  const handleAtt1Filter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!att1StartDate || !att1EndDate) {
      showError('From Date and To Date are required for this report.');
      return;
    }
    if (new Date(att1StartDate) > new Date(att1EndDate)) {
      showError('From Date cannot be greater than To Date.');
      return;
    }
    fetchAtt1MatrixData();
  };

  const handleAtt1Reset = () => {
    setAtt1EmployeeId('');
    setAtt1StartDate('');
    setAtt1EndDate('');
    setData([]);
  };

  const handleAtt3Filter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!att3StartDate || !att3EndDate) {
      showError('From Date and To Date are required for this report.');
      return;
    }
    if (new Date(att3StartDate) > new Date(att3EndDate)) {
      showError('From Date cannot be greater than To Date.');
      return;
    }
    fetchAtt3MatrixData();
  };

  const handleAtt3Reset = () => {
    setAtt3EmployeeId('');
    setAtt3StartDate('');
    setAtt3EndDate('');
    setData([]);
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
      case 'emp-attendance-3': return empAtt3Cols;

      case 'lab-details': return labDetailsCols;
      case 'lab-discipline': return disciplineDetailsCols;
      case 'lab-cost': return labCostCols;
      default: return empDetailsCols;
    }
  };

  // ─── Shared date utilities ────────────────────────────────────────────────
  const generateDateRange = (from: string, to: string): string[] => {
    if (!from || !to) return [];
    const start = new Date(from);
    const end = new Date(to);
    const dates: string[] = [];
    if (start > end) return dates;
    const cur = new Date(start);
    while (cur <= end) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${d}`);
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  };

  const formatDateHeader = (ymd: string): string => {
    if (!ymd || !ymd.includes('-')) return '';
    const parts = ymd.split('-');
    if (parts.length < 3) return ymd;
    const [, m, d] = parts;
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const mi = parseInt(m, 10) - 1;
    const monthName = mi >= 0 && mi < 12 ? months[mi] : '';
    return `${parseInt(d, 10)} ${monthName}`.trim();
  };

  // ─── Attendance Report 1 (Day Wise Hrs) pivot ────────────────────────────
  const pivotAtt1 = useMemo(() => {
    if (activeReport !== 'emp-attendance-1') return { employeeSections: [], dateRange: [] };
    const dateRange = generateDateRange(att1StartDate, att1EndDate);
    const byEmp = new Map<number, { employee_code: string; employee_name: string; dates: Map<string, any[]> }>();
    data.forEach((row) => {
      const eid: number = row.employee_id;
      const dt: string = row.attendance_date;
      if (!byEmp.has(eid)) {
        byEmp.set(eid, {
          employee_code: row.employee_code,
          employee_name: row.employee_name,
          dates: new Map<string, any[]>(),
        });
      }
      const section = byEmp.get(eid)!;
      if (!section.dates.has(dt)) section.dates.set(dt, []);
      section.dates.get(dt)!.push(row);
    });
    const employeeSections = Array.from(byEmp.values()).sort((a, b) =>
      a.employee_name.localeCompare(b.employee_name)
    );
    return { employeeSections, dateRange };
  }, [data, activeReport, att1StartDate, att1EndDate]);

  const joinCellValues = (records: any[], key: 'in_time_short' | 'out_time_short' | 'total_working_hours' | 'in_address' | 'out_address' | 'project_address'): string => {
    if (!records || records.length === 0) return '-';
    const parts: string[] = [];
    records
      .slice()
      .sort((a, b) => String(a.check_in_time || '').localeCompare(String(b.check_in_time || '')))
      .forEach((r) => {
        // For address fields, always use project_address (clean human-readable)
        let v: any;
        if (key === 'in_address' || key === 'out_address' || key === 'project_address') {
          // Always use project_address (clean human-readable). Do not fallback to GPS coords.
          v = r.project_address || '';
        } else {
          v = r[key];
        }
        if (v === null || v === undefined || v === '') return;
        if (key === 'total_working_hours') {
          const n = Number(v);
          if (n === 0 && !r.check_out_time) return;
          v = n.toFixed(2);
        }
        const s = String(v).trim();
        if (s) parts.push(s);
      });
    return parts.length === 0 ? '-' : parts.join('\n');
  };

  // ─── Day Wise View 2 pivot ────────────────────────────────────────────────
  const pivotDw2 = useMemo(() => {
    if (activeReport !== 'emp-daywise-2') return { employeeSections: [], dateRange: [] };
    const dateRange = generateDateRange(dw2StartDate, dw2EndDate);

    const byEmp = new Map<number, {
      employee_id: number;
      employee_code: string;
      employee_name: string;
      dates: Map<string, any[]>;
    }>();

    data.forEach((row) => {
      const eid: number = row.employee_id;
      const dt: string = row.attendance_date;
      if (!byEmp.has(eid)) {
        byEmp.set(eid, {
          employee_id: eid,
          employee_code: row.employee_code,
          employee_name: row.employee_name,
          dates: new Map<string, any[]>(),
        });
      }
      const section = byEmp.get(eid)!;
      if (!section.dates.has(dt)) section.dates.set(dt, []);
      section.dates.get(dt)!.push(row);
    });

    const employeeSections = Array.from(byEmp.values()).sort((a, b) =>
      a.employee_name.localeCompare(b.employee_name)
    );

    return { employeeSections, dateRange };
  }, [data, activeReport, dw2StartDate, dw2EndDate]);

  // In/Out cell value for View 2
  const getDw2InOut = (records: any[]): string => {
    if (!records || records.length === 0) return '-';
    const sorted = records
      .slice()
      .sort((a, b) => String(a.check_in_time || '').localeCompare(String(b.check_in_time || '')));
    const parts = sorted.map((r) => {
      const inT = r.in_time_short || '';
      const outT = r.out_time_short || '';
      if (!inT) return null;
      return outT ? `${inT} / ${outT}` : `${inT} / -`;
    }).filter(Boolean);
    return parts.length === 0 ? '-' : parts.join('\n');
  };

  // Hours cell value for View 2
  const getDw2Hours = (records: any[]): string => {
    if (!records || records.length === 0) return '-';
    let total = 0;
    let hasData = false;
    records.forEach((r) => {
      const h = Number(r.total_working_hours || 0);
      if (h > 0 || r.check_out_time) {
        total += h;
        hasData = true;
      }
    });
    if (!hasData) return '-';
    return `${total.toFixed(2)} hrs`;
  };

  // Total hours for an employee section
  const totalDw2Hours = (sec: { dates: Map<string, any[]> }): number => {
    let total = 0;
    sec.dates.forEach((recs) => {
      recs.forEach((r: any) => { total += Number(r.total_working_hours || 0); });
    });
    return Math.round(total * 100) / 100;
  };

  // Days present for View 2
  const daysPresent = (sec: { dates: Map<string, any[]> }, dateRange: string[]): number =>
    dateRange.filter((d) => (sec.dates.get(d) || []).length > 0).length;

  // ─── Excel/CSV export for View 2 ─────────────────────────────────────────
  const exportDw2CSV = () => {
    const { employeeSections, dateRange } = pivotDw2;
    if (employeeSections.length === 0) {
      showError('No data to export.');
      return;
    }
    const rows: string[][] = [];
    const dateHeaders = dateRange.map(formatDateHeader);

    // Header row
    const headerRow = ['Employee Name', 'Employee Code'];
    dateHeaders.forEach((dh) => {
      headerRow.push(`${dh} In/Out`);
      headerRow.push(`${dh} Hrs`);
    });
    rows.push(headerRow);

    employeeSections.forEach((sec) => {
      const row = [sec.employee_name, sec.employee_code];
      dateRange.forEach((dt) => {
        const recs = sec.dates.get(dt) || [];
        const inOut = getDw2InOut(recs).replace(/\n/g, ' | ');
        const hrs = getDw2Hours(recs);
        row.push(inOut);
        row.push(hrs);
      });
      rows.push(row);
    });

    const csvLines = rows.map((r) =>
      r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = csvLines.join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `HTCO_Employee_Attendance_DayWise_View2_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showSuccess('Report exported to Excel/CSV successfully.');
  };

  // ─── Attendance Report 1 export ──────────────────────────────────────────
  const exportAtt1CSV = () => {
    const { employeeSections, dateRange } = pivotAtt1;
    if (employeeSections.length === 0) {
      showError('No data to export.');
      return;
    }
    const rows: string[][] = [];
    const dateHeaders = dateRange.map(formatDateHeader);
    const fieldRows: [string, 'in_time_short' | 'out_time_short' | 'total_working_hours' | 'in_address' | 'out_address' | 'project_address'][] = [
      ['In Time', 'in_time_short'],
      ['Out Time', 'out_time_short'],
      ['Working Hrs', 'total_working_hours'],
      ['In Address (Site)', 'project_address'],
      ['Out Address (Site)', 'project_address'],
    ];

    // Header row
    const headerRow = ['Employee Name', 'Employee Code', 'Details'];
    dateHeaders.forEach((dh) => headerRow.push(dh));
    rows.push(headerRow);

    employeeSections.forEach((sec) => {
      fieldRows.forEach(([label, key], idx) => {
        const row = idx === 0 ? [sec.employee_name, sec.employee_code, label] : ['', '', label];
        dateRange.forEach((dt) => {
          const recs = sec.dates.get(dt) || [];
          let cell = joinCellValues(recs, key);
          if (cell.includes('\n')) cell = cell.replace(/\n/g, ' | ');
          row.push(cell);
        });
        rows.push(row);
      });
    });

    const csvLines = rows.map((r) =>
      r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = csvLines.join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `HTCO_Employee_Attendance_DayWise_Hrs_Report_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess('Report exported to CSV successfully.');
  };

  const [viewportW, setViewportW] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1280);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setViewportW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const totalEmpHours = (sec: { dates: Map<string, any[]> }): number => {
    let total = 0;
    sec.dates.forEach((recs) => {
      recs.forEach((r: any) => { total += Number(r.total_working_hours || 0); });
    });
    return Math.round(total * 100) / 100;
  };



  // ─── Attendance Report 3 – Summary Matrix pivot ───────────────────────────
  const pivotAtt3 = useMemo(() => {
    if (activeReport !== 'emp-attendance-3') return { employeeSections: [], dateRange: [] };
    const dateRange = generateDateRange(att3StartDate, att3EndDate);

    const byEmp = new Map<number, {
      employee_id: number;
      employee_code: string;
      employee_name: string;
      dates: Map<string, any[]>; // date → records (may be [null] if absent)
    }>();

    data.forEach((row) => {
      const eid: number = row.employee_id;
      if (!byEmp.has(eid)) {
        byEmp.set(eid, {
          employee_id: eid,
          employee_code: row.employee_code || '',
          employee_name: row.employee_name || '',
          dates: new Map<string, any[]>(),
        });
      }
      // Only push rows that have an actual attendance record (attendance_date not null)
      if (row.attendance_date) {
        const sec = byEmp.get(eid)!;
        const dt: string = row.attendance_date;
        if (!sec.dates.has(dt)) sec.dates.set(dt, []);
        sec.dates.get(dt)!.push(row);
      }
    });

    const employeeSections = Array.from(byEmp.values()).sort((a, b) =>
      a.employee_name.localeCompare(b.employee_name)
    );
    return { employeeSections, dateRange };
  }, [data, activeReport, att3StartDate, att3EndDate]);

  // Status label/badge for the matrix cell
  const getAtt3Status = (records: any[]): { label: string; color: string; bg: string } => {
    if (!records || records.length === 0) return { label: '-', color: 'var(--text-muted)', bg: 'transparent' };
    const statuses = records.map((r: any) => r.status).filter(Boolean);
    if (statuses.includes('completed')) return { label: 'P', color: '#10b981', bg: 'rgba(16,185,129,0.12)' };
    if (statuses.includes('open')) return { label: 'P', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' };
    if (statuses.includes('outside_area')) return { label: 'P', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' };
    if (statuses.includes('missing_checkout')) return { label: 'MC', color: '#f97316', bg: 'rgba(249,115,22,0.12)' };
    return { label: 'P', color: '#10b981', bg: 'rgba(16,185,129,0.12)' };
  };

  // Att3 summary totals
  const calcAtt3Totals = (sections: typeof pivotAtt3.employeeSections, dateRange: string[]) => {
    let totalPresentDays = 0;
    let totalAbsentDays = 0;
    let totalWorkingHours = 0;
    sections.forEach((sec) => {
      dateRange.forEach((dt) => {
        const recs = sec.dates.get(dt) || [];
        if (recs.length > 0) {
          totalPresentDays++;
          recs.forEach((r: any) => { totalWorkingHours += Number(r.total_working_hours || 0); });
        } else {
          totalAbsentDays++;
        }
      });
    });
    return { totalPresentDays, totalAbsentDays, totalWorkingHours: Math.round(totalWorkingHours * 100) / 100 };
  };

  // Export att3 CSV
  const exportAtt3CSV = () => {
    const { employeeSections, dateRange } = pivotAtt3;
    if (employeeSections.length === 0) { showError('No data to export.'); return; }
    const rows: string[][] = [];
    const dateHeaders = dateRange.map(formatDateHeader);
    const headerRow = ['Employee Name', 'Employee Code', ...dateHeaders];
    rows.push(headerRow);
    employeeSections.forEach((sec) => {
      const row = [sec.employee_name, sec.employee_code];
      dateRange.forEach((dt) => {
        const recs = sec.dates.get(dt) || [];
        
        let dailyHours = 0;
        recs.forEach((r: any) => { dailyHours += Number(r.total_working_hours || 0); });
        
        let timeStr = '-';
        if (recs.length > 0 && dailyHours > 0) {
          const h = Math.floor(dailyHours);
          const m = Math.round((dailyHours - h) * 60);
          timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        } else if (recs.length > 0) {
          timeStr = '00:00';
        }

        row.push(timeStr);
      });
      rows.push(row);
    });
    const { totalPresentDays, totalAbsentDays, totalWorkingHours } = calcAtt3Totals(employeeSections, dateRange);
    rows.push([]);
    rows.push(['TOTALS']);
    rows.push(['Total Employees', String(employeeSections.length), 'Present Days', String(totalPresentDays), 'Absent Days', String(totalAbsentDays), 'Total Hours', totalWorkingHours.toFixed(2)]);
    const csvLines = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','));
    const csvContent = csvLines.join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `HTCO_Attendance_Report3_Summary_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showSuccess('Report 3 Summary exported to Excel/CSV successfully.');
  };

  // ─── Render Attendance Report 1 – Day Wise Hrs ────────────────────────────
  const renderAtt1Matrix = () => {
    const { employeeSections, dateRange } = pivotAtt1;
    const hasData = employeeSections.length > 0 && dateRange.length > 0;

    return (
      <div className="page-body" style={{ paddingTop: 0 }}>
        {/* ── Report Header ── */}
        <div style={{
          background: 'linear-gradient(135deg, #1e2d5f 0%, #312e81 50%, #4c1d95 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: viewportW < 576 ? '1rem' : '1.25rem 1.5rem',
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          boxShadow: '0 4px 20px rgba(79,70,229,0.35)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Calendar size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: viewportW < 576 ? '0.95rem' : '1.1rem', color: '#fff' }}>
                Employee Attendance Day Wise Hrs Report
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.15rem' }}>
                HTCO Construction • Day-by-day attendance showing In/Out time, working hours, and addresses
              </div>
            </div>
          </div>
          <button
            onClick={exportAtt1CSV}
            disabled={!hasData}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.55rem 1.15rem',
              background: hasData ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.1)',
              color: '#fff', border: 'none', borderRadius: '8px',
              fontWeight: 600, fontSize: '0.85rem',
              cursor: hasData ? 'pointer' : 'not-allowed',
              opacity: !hasData ? 0.5 : 1, transition: 'all 0.2s',
              boxShadow: hasData ? '0 2px 12px rgba(16,185,129,0.4)' : 'none',
            }}
          >
            <Download size={15} /> Export to Excel
          </button>
        </div>

        {/* ── Filter Section ── */}
        <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={15} /> Filter Report
          </div>
          <form onSubmit={handleAtt1Filter}>
            <div style={{ display: 'grid', gridTemplateColumns: viewportW < 640 ? '1fr' : 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Employee Name</label>
                <select
                  id="att1-employee-select"
                  className="form-select"
                  value={att1EmployeeId}
                  onChange={(e) => setAtt1EmployeeId(e.target.value)}
                >
                  <option value="">All Employees</option>
                  {employees.map((emp) => (
                    <option key={emp.employee_id} value={emp.employee_id.toString()}>
                      {emp.employee_code ? `${emp.employee_code} - ${emp.name}` : emp.name}
                    </option>
                  ))}
                </select>
              </div>
              <FormInput label="Start Date" type="date" id="att1-start-date" value={att1StartDate} onChange={(e) => setAtt1StartDate(e.target.value)} />
              <FormInput label="End Date" type="date" id="att1-end-date" value={att1EndDate} onChange={(e) => setAtt1EndDate(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <Button type="button" variant="secondary" onClick={handleAtt1Reset}>Reset</Button>
              <Button type="submit"><Filter size={14} /> Filter</Button>
            </div>
          </form>
        </div>

        {/* ── Matrix Table Card ── */}
        <div className="glass-card" style={{ padding: viewportW < 576 ? '1rem' : '1.25rem' }}>
          {isLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              {[200, '90%', '90%', '90%'].map((w, i) => (
                <div key={i} className="datatable-skeleton-line" style={{ width: typeof w === 'number' ? `${w}px` : w, height: i === 0 ? '22px' : '40px', margin: '0.5rem auto' }} />
              ))}
            </div>
          ) : employeeSections.length === 0 ? (
            <div className="datatable-state-container" style={{ padding: '3rem 1.5rem' }}>
              <Calendar size={44} style={{ opacity: 0.4, color: 'var(--text-secondary)' }} />
              {att1StartDate && att1EndDate ? (
                <>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.75rem', fontWeight: 600 }}>No attendance records found for the selected filters.</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.25rem' }}>Try adjusting the Employee or Date Range and click <strong>Filter</strong> again.</div>
                </>
              ) : (
                <>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.75rem', fontWeight: 600 }}>Select a Date Range to generate the report</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.25rem', maxWidth: '480px', textAlign: 'center' }}>
                    Choose <strong>Start Date</strong> and <strong>End Date</strong> above (and optionally an Employee), then click <strong>Filter</strong>.
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              {/* ── Matrix Table ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                {employeeSections.map((sec, sIdx) => {
                  return (
                    <div key={`emp-section-${sIdx}`} style={{ width: '100%' }}>
                      
                      {/* Header for each Employee Block */}
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Employees Name</div>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 600 }}>
                          {sec.employee_code} - {sec.employee_name}
                        </h3>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.6 }}>
                          <div>From Date : {att1StartDate || 'All Time'}</div>
                          <div>To Date : {att1EndDate || 'All Time'}</div>
                        </div>
                      </div>

                      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: '0.5rem' }}>
                        <table className="custom-table" style={{ width: 'max-content', minWidth: '100%', borderCollapse: 'collapse', border: '1px solid var(--border-color)' }}>
                          <thead>
                            <tr>
                              <th style={{
                                padding: '0.5rem',
                                textAlign: 'left',
                                border: '1px solid var(--border-color)',
                                whiteSpace: 'nowrap',
                                fontWeight: 600,
                                color: 'var(--text-secondary)',
                                fontSize: '0.85rem',
                                position: 'sticky',
                                left: 0,
                                zIndex: 2,
                                background: 'var(--bg-card)'
                              }}>
                                Date
                              </th>
                              {dateRange.map((dt) => {
                                const parts = formatDateHeader(dt).split(' ');
                                const day = parts[0] || '';
                                const month = parts[1] || '';
                                return (
                                  <th key={dt} style={{
                                    padding: '0.4rem',
                                    textAlign: 'center',
                                    border: '1px solid var(--border-color)',
                                    whiteSpace: 'nowrap',
                                    fontWeight: 600,
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.85rem',
                                    minWidth: '50px',
                                    background: 'var(--bg-card)'
                                  }}>
                                    <div>{day}</div>
                                    <div>{month}</div>
                                  </th>
                                );
                              })}
                            </tr>
                          </thead>
                          <tbody>
                            {/* Rows */}
                            {[
                              { label: 'In', key: 'in_time_short', dataKey: 'in_time_short' },
                              { label: 'Out', key: 'out_time_short', dataKey: 'out_time_short' },
                              { label: 'Hrs', key: 'total_working_hours', dataKey: 'total_working_hours' },
                              { label: 'In\nAddress', key: 'in_address_row', dataKey: 'project_address' },
                              { label: 'Out\nAddress', key: 'out_address_row', dataKey: 'project_address' },
                            ].map((rowDef) => (
                              <tr key={rowDef.key} style={{ background: 'var(--bg-card)' }}>
                                <td style={{
                                  padding: '0.5rem',
                                  fontWeight: 600,
                                  color: 'var(--text-primary)',
                                  fontSize: '0.85rem',
                                  border: '1px solid var(--border-color)',
                                  position: 'sticky',
                                  left: 0,
                                  zIndex: 1,
                                  background: 'var(--bg-card)',
                                  whiteSpace: 'pre-line'
                                }}>
                                  {rowDef.label}
                                </td>
                                {dateRange.map((dt) => {
                                  const recs = sec.dates.get(dt) || [];
                                  let val = joinCellValues(recs, rowDef.dataKey as any);
                                  const isHrs = rowDef.dataKey === 'total_working_hours';
                                  const isDash = val === '-';
                                  
                                  return (
                                    <td key={dt} style={{ 
                                      textAlign: 'center', 
                                      padding: '0.5rem', 
                                      border: '1px solid var(--border-color)', 
                                      color: isDash ? 'var(--text-muted)' : (isHrs ? 'var(--text-primary)' : 'var(--text-secondary)'),
                                      fontWeight: isDash ? 'normal' : (isHrs ? 600 : 400),
                                      verticalAlign: 'top',
                                      whiteSpace: 'pre-line',
                                      fontSize: '0.8rem',
                                      background: 'var(--bg-card)'
                                    }}>
                                      {val}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Employee Summary */}
                      {(() => {
                        const totalDays = dateRange.length;
                        let presentDays = 0;
                        let totalHours = 0;
                        dateRange.forEach(dt => {
                           const recs = sec.dates.get(dt) || [];
                           if (recs.length > 0) presentDays++;
                           recs.forEach((r:any) => totalHours += Number(r.total_working_hours || 0));
                        });
                        const absentDays = totalDays - presentDays;
                        const avgHours = presentDays > 0 ? (totalHours / presentDays) : 0;
                        return (
                          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '0.5rem 0' }}>
                            <span>Total Days: <strong style={{ color: 'var(--text-primary)' }}>{totalDays}</strong></span>
                            <span>Present Days: <strong style={{ color: 'var(--text-primary)' }}>{presentDays}</strong></span>
                            <span>Absent Days: <strong style={{ color: 'var(--text-primary)' }}>{absentDays}</strong></span>
                            <span>Total Working Hours: <strong style={{ color: 'var(--text-primary)' }}>{totalHours.toFixed(2)}</strong></span>
                            <span>Average Working Hours: <strong style={{ color: 'var(--text-primary)' }}>{avgHours.toFixed(2)}</strong></span>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // ─── Render Attendance Report 3 – Summary Matrix ──────────────────────────
  const renderAtt3Matrix = () => {
    const { employeeSections, dateRange } = pivotAtt3;
    const hasData = employeeSections.length > 0 && dateRange.length > 0;
    const totals = hasData ? calcAtt3Totals(employeeSections, dateRange) : null;

    const nameColW = viewportW < 576 ? 130 : 170;
    const codeColW = viewportW < 576 ? 80 : 100;
    const dateColW = viewportW < 576 ? 46 : 52;

    return (
      <div className="page-body" style={{ paddingTop: 0 }}>
        {/* ── Report Header ── */}
        <div style={{
          background: 'linear-gradient(135deg, #1e2d5f 0%, #312e81 50%, #4c1d95 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: viewportW < 576 ? '1rem' : '1.25rem 1.5rem',
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          boxShadow: '0 4px 20px rgba(79,70,229,0.35)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Calendar size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: viewportW < 576 ? '0.95rem' : '1.1rem', color: '#fff' }}>
                Attendance Report 3 (Summary)
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.15rem' }}>
                HTCO Construction • Employee-wise day-wise attendance status matrix
              </div>
            </div>
          </div>
          <button
            onClick={exportAtt3CSV}
            disabled={!hasData}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.55rem 1.15rem',
              background: hasData ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.1)',
              color: '#fff', border: 'none', borderRadius: '8px',
              fontWeight: 600, fontSize: '0.85rem',
              cursor: hasData ? 'pointer' : 'not-allowed',
              opacity: !hasData ? 0.5 : 1, transition: 'all 0.2s',
              boxShadow: hasData ? '0 2px 12px rgba(16,185,129,0.4)' : 'none',
            }}
          >
            <Download size={15} /> Export to Excel
          </button>
        </div>

        {/* ── Filter Section ── */}
        <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={15} /> Filter Report
          </div>
          <form onSubmit={handleAtt3Filter}>
            <div style={{ display: 'grid', gridTemplateColumns: viewportW < 640 ? '1fr' : 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
              {/* Employee Dropdown */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Employee Name</label>
                <select
                  id="att3-employee-select"
                  className="form-select"
                  value={att3EmployeeId}
                  onChange={(e) => setAtt3EmployeeId(e.target.value)}
                >
                  <option value="">All Employees</option>
                  {employees.map((emp) => (
                    <option key={emp.employee_id} value={emp.employee_id.toString()}>
                      {emp.employee_code ? `${emp.employee_code} - ${emp.name}` : emp.name}
                    </option>
                  ))}
                </select>
              </div>
              <FormInput label="Start Date" type="date" id="att3-start-date" value={att3StartDate} onChange={(e) => setAtt3StartDate(e.target.value)} />
              <FormInput label="End Date" type="date" id="att3-end-date" value={att3EndDate} onChange={(e) => setAtt3EndDate(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <Button type="button" variant="secondary" onClick={handleAtt3Reset}>Reset</Button>
              <Button type="submit"><Filter size={14} /> Filter</Button>
            </div>
          </form>
        </div>

        {/* ── Matrix Table Card ── */}
        <div className="glass-card" style={{ padding: viewportW < 576 ? '1rem' : '1.25rem' }}>
          {isLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              {[200, '90%', '90%', '90%'].map((w, i) => (
                <div key={i} className="datatable-skeleton-line" style={{ width: typeof w === 'number' ? `${w}px` : w, height: i === 0 ? '22px' : '40px', margin: '0.5rem auto' }} />
              ))}
            </div>
          ) : employeeSections.length === 0 ? (
            <div className="datatable-state-container" style={{ padding: '3rem 1.5rem' }}>
              <Calendar size={44} style={{ opacity: 0.4, color: 'var(--text-secondary)' }} />
              {att3StartDate && att3EndDate ? (
                <>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.75rem', fontWeight: 600 }}>No attendance records found for the selected filters.</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.25rem' }}>Try adjusting the Employee or Date Range and click <strong>Filter</strong> again.</div>
                </>
              ) : (
                <>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.75rem', fontWeight: 600 }}>Select a Date Range to generate the report</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.25rem', maxWidth: '480px', textAlign: 'center' }}>
                    Choose <strong>Start Date</strong> and <strong>End Date</strong> above (and optionally an Employee), then click <strong>Filter</strong>.
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              {/* ── Matrix Table ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ width: '100%' }}>
                  
                  {/* Header */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.6 }}>
                      <div>From Date : {att3StartDate || 'All Time'}</div>
                      <div>To Date : {att3EndDate || 'All Time'}</div>
                    </div>
                  </div>

                  <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: '0.5rem' }}>
                    <table className="custom-table" style={{ borderCollapse: 'collapse', border: '1px solid var(--border-color)', width: 'max-content', minWidth: '100%' }}>
                      <thead>
                        <tr>
                          <th style={{
                            padding: '0.65rem 0.5rem', textAlign: 'left', border: '1px solid var(--border-color)',
                            whiteSpace: 'normal', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem',
                            position: 'sticky', left: 0, zIndex: 3, background: 'var(--bg-card)', minWidth: '150px'
                          }}>
                            Name
                          </th>
                          <th style={{
                            padding: '0.65rem 0.5rem', textAlign: 'left', border: '1px solid var(--border-color)',
                            whiteSpace: 'nowrap', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem',
                            position: 'sticky', left: '150px', zIndex: 3, background: 'var(--bg-card)'
                          }}>
                            Code
                          </th>
                          {dateRange.map((dt) => {
                            const parts = formatDateHeader(dt).split(' ');
                            return (
                              <th key={`hdr-${dt}`} style={{
                                padding: '0.4rem', textAlign: 'center', border: '1px solid var(--border-color)',
                                whiteSpace: 'nowrap', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem',
                                background: 'var(--bg-card)', minWidth: '40px'
                              }}>
                                <div>{parts[0]}</div>
                                <div>{parts[1] || ''}</div>
                              </th>
                            );
                          })}
                          <th style={{
                            padding: '0.65rem 0.5rem', textAlign: 'center', border: '1px solid var(--border-color)',
                            whiteSpace: 'nowrap', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem',
                            background: 'var(--bg-card)'
                          }}>
                            Days P
                          </th>
                          <th style={{
                            padding: '0.65rem 0.5rem', textAlign: 'center', border: '1px solid var(--border-color)',
                            whiteSpace: 'nowrap', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem',
                            background: 'var(--bg-card)'
                          }}>
                            Hrs
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {employeeSections.map((sec, sIdx) => {
                          let empPresent = 0;
                          let empHours = 0;
                          sec.dates.forEach((recs) => {
                            if (recs.length > 0) {
                              empPresent++;
                              recs.forEach((r: any) => { empHours += Number(r.total_working_hours || 0); });
                            }
                          });
                          return (
                            <tr key={`att3-emp-${sec.employee_id}`} style={{ background: 'var(--bg-card)' }}>
                              <td style={{
                                padding: '0.5rem', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem',
                                border: '1px solid var(--border-color)', position: 'sticky', left: 0, zIndex: 1,
                                background: 'var(--bg-card)', whiteSpace: 'normal', minWidth: '150px', maxWidth: '200px'
                              }}>
                                {sec.employee_name}
                              </td>
                              <td style={{
                                padding: '0.5rem', fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.8rem',
                                border: '1px solid var(--border-color)', position: 'sticky', left: '150px', zIndex: 1,
                                background: 'var(--bg-card)', whiteSpace: 'nowrap'
                              }}>
                                {sec.employee_code || '-'}
                              </td>
                              {dateRange.map((dt) => {
                                const recs = sec.dates.get(dt) || [];
                                
                                // Calculate total hours for the day
                                let dailyHours = 0;
                                recs.forEach((r: any) => { dailyHours += Number(r.total_working_hours || 0); });
                                
                                // Format as HH:MM
                                let timeStr = '-';
                                if (recs.length > 0 && dailyHours > 0) {
                                  const h = Math.floor(dailyHours);
                                  const m = Math.round((dailyHours - h) * 60);
                                  timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                                } else if (recs.length > 0) {
                                  // Present but 0 hours (e.g. missing checkout)
                                  timeStr = '00:00';
                                }

                                const isDash = timeStr === '-';
                                return (
                                  <td key={`att3-cell-${sIdx}-${dt}`} style={{
                                    textAlign: 'center', padding: '0.5rem', border: '1px solid var(--border-color)',
                                    color: isDash ? 'var(--text-muted)' : 'var(--text-primary)',
                                    fontWeight: isDash ? 400 : 600, fontSize: '0.8rem', background: 'var(--bg-card)'
                                  }}>
                                    {timeStr}
                                  </td>
                                );
                              })}
                              <td style={{
                                textAlign: 'center', padding: '0.5rem', border: '1px solid var(--border-color)',
                                color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem', background: 'var(--bg-card)'
                              }}>
                                {empPresent}
                              </td>
                              <td style={{
                                textAlign: 'center', padding: '0.5rem', border: '1px solid var(--border-color)',
                                color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.8rem', background: 'var(--bg-card)'
                              }}>
                                {empHours > 0 ? empHours.toFixed(1) : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>

                      {/* ── Summary Totals Row ── */}
                      {totals && (
                        <tfoot>
                          <tr style={{ background: 'var(--bg-card)' }}>
                            <td colSpan={2} style={{
                              position: 'sticky', left: 0, zIndex: 3,
                              background: 'var(--bg-card)', fontWeight: 700, color: 'var(--text-primary)',
                              fontSize: '0.85rem', padding: '0.75rem 0.5rem', border: '1px solid var(--border-color)',
                              textAlign: 'right'
                            }}>
                              TOTALS
                            </td>
                            {dateRange.map((dt) => {
                              const presentCount = employeeSections.filter((s) => (s.dates.get(dt) || []).length > 0).length;
                              return (
                                <td key={`tot-${dt}`} style={{
                                  textAlign: 'center', padding: '0.5rem', border: '1px solid var(--border-color)',
                                  color: presentCount > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                                  fontWeight: presentCount > 0 ? 700 : 400, fontSize: '0.8rem', background: 'var(--bg-card)'
                                }}>
                                  {presentCount > 0 ? presentCount : '-'}
                                </td>
                              );
                            })}
                            <td style={{
                              textAlign: 'center', padding: '0.5rem', border: '1px solid var(--border-color)',
                              color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.85rem', background: 'var(--bg-card)'
                            }}>
                              {totals.totalPresentDays}
                            </td>
                            <td style={{
                              textAlign: 'center', padding: '0.5rem', border: '1px solid var(--border-color)',
                              color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.85rem', background: 'var(--bg-card)'
                            }}>
                              {totals.totalWorkingHours.toFixed(1)}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                  
                  {/* Summary Stats Row */}
                  {totals && (
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '0.5rem 0' }}>
                      <span>Total Employees: <strong style={{ color: 'var(--text-primary)' }}>{employeeSections.length}</strong></span>
                      <span>Total Present Days: <strong style={{ color: 'var(--text-primary)' }}>{totals.totalPresentDays}</strong></span>
                      <span>Total Absent Days: <strong style={{ color: 'var(--text-primary)' }}>{totals.totalAbsentDays}</strong></span>
                      <span>Total Working Hours: <strong style={{ color: 'var(--text-primary)' }}>{totals.totalWorkingHours.toFixed(2)}</strong></span>
                    </div>
                  )}
                  
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // ─── Render Day Wise View 2 ───────────────────────────────────────────────
  const renderDw2Report = () => {
    const { employeeSections, dateRange } = pivotDw2;

    return (
      <div className="page-body" style={{ paddingTop: 0 }}>
        {/* ── Report Header ── */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3a5f 0%, #0f4c75 50%, #1a6b8a 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: viewportW < 576 ? '1rem' : '1.25rem 1.5rem',
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          boxShadow: '0 4px 20px rgba(15, 76, 117, 0.4)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TableProperties size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: viewportW < 576 ? '0.95rem' : '1.1rem', color: '#fff' }}>
                Employee Attendance Day Wise Report View 2
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.15rem' }}>
                HTCO Construction • Day-wise In/Out &amp; Hours Matrix
              </div>
            </div>
          </div>
          <button
            onClick={exportDw2CSV}
            disabled={employeeSections.length === 0}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.55rem 1.15rem',
              background: employeeSections.length > 0 ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: 'none', borderRadius: '8px',
              fontWeight: 600, fontSize: '0.85rem',
              cursor: employeeSections.length > 0 ? 'pointer' : 'not-allowed',
              opacity: employeeSections.length === 0 ? 0.5 : 1,
              transition: 'all 0.2s',
              boxShadow: employeeSections.length > 0 ? '0 2px 12px rgba(16,185,129,0.4)' : 'none',
            }}
          >
            <Download size={15} /> Export to Excel
          </button>
        </div>

        {/* ── Filter Section ── */}
        <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={15} /> Filter Report
          </div>
          <form onSubmit={handleDw2Filter}>
            <div style={{ display: 'grid', gridTemplateColumns: viewportW < 640 ? '1fr' : 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
              {/* Employee dropdown */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Employee</label>
                <select
                  id="dw2-employee-select"
                  className="form-select"
                  value={dw2EmployeeId}
                  onChange={(e) => setDw2EmployeeId(e.target.value)}
                >
                  <option value="">All Employees</option>
                  {employees.map((emp) => (
                    <option key={emp.employee_id} value={emp.employee_id.toString()}>
                      {emp.employee_code ? `${emp.employee_code} - ${emp.name}` : emp.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* From Date */}
              <FormInput
                label="From Date"
                type="date"
                id="dw2-from-date"
                value={dw2StartDate}
                onChange={(e) => setDw2StartDate(e.target.value)}
              />

              {/* To Date */}
              <FormInput
                label="To Date"
                type="date"
                id="dw2-to-date"
                value={dw2EndDate}
                onChange={(e) => setDw2EndDate(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <Button type="button" variant="secondary" onClick={handleDw2Reset}>
                Reset
              </Button>
              <Button type="submit">
                <Filter size={14} /> Filter
              </Button>
            </div>
          </form>
        </div>

        {/* ── Report Matrix ── */}
        <div className="glass-card" style={{ padding: viewportW < 576 ? '1rem' : '1.25rem' }}>
          {isLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <div className="datatable-skeleton-line" style={{ width: '200px', height: '22px', margin: '0 auto 1rem' }} />
              <div className="datatable-skeleton-line" style={{ width: '90%', height: '48px', margin: '0.5rem auto' }} />
              <div className="datatable-skeleton-line" style={{ width: '90%', height: '40px', margin: '0.5rem auto' }} />
              <div className="datatable-skeleton-line" style={{ width: '90%', height: '40px', margin: '0.5rem auto' }} />
            </div>
          ) : employeeSections.length === 0 ? (
            <div className="datatable-state-container" style={{ padding: '3rem 1.5rem' }}>
              <TableProperties size={44} style={{ opacity: 0.4, color: 'var(--text-secondary)' }} />
              {dw2StartDate && dw2EndDate ? (
                <>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.75rem', fontWeight: 600 }}>
                    No attendance records found
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.25rem' }}>
                    Try adjusting the Employee or Date Range and click <strong>Filter</strong> again.
                  </div>
                </>
              ) : (
                <>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.75rem', fontWeight: 600 }}>
                    Select a Date Range to view the report
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.25rem', maxWidth: '480px', textAlign: 'center' }}>
                    Choose a <strong>From Date</strong> and <strong>To Date</strong> above, select an Employee (optional), then click <strong>Filter</strong> to generate the attendance matrix.
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Summary bar */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem',
              }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: viewportW < 576 ? '0.95rem' : '1rem' }}>
                    Day Wise Attendance Matrix
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    {formatDateHeader(dw2StartDate)} – {formatDateHeader(dw2EndDate)}
                    &nbsp;•&nbsp;{dateRange.length} day(s)
                    &nbsp;•&nbsp;{employeeSections.length} employee(s)
                  </div>
                </div>
              </div>

              {/* ── Matrix Table ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ width: '100%' }}>
                  
                  {/* Header */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Employees Name</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.6 }}>
                      <div>From Date : {dw2StartDate || 'All Time'}</div>
                      <div>To Date : {dw2EndDate || 'All Time'}</div>
                    </div>
                  </div>

                  <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: '0.5rem' }}>
                    <table className="custom-table" style={{ width: 'max-content', minWidth: '100%', borderCollapse: 'collapse', border: '1px solid var(--border-color)' }}>
                      <thead>
                        <tr>
                          <th rowSpan={2} style={{
                            padding: '0.5rem', textAlign: 'left', border: '1px solid var(--border-color)',
                            whiteSpace: 'normal', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem',
                            position: 'sticky', left: 0, zIndex: 3, background: 'var(--bg-card)', minWidth: '150px'
                          }}>
                            Name
                          </th>
                          <th rowSpan={2} style={{
                            padding: '0.5rem', textAlign: 'left', border: '1px solid var(--border-color)',
                            whiteSpace: 'nowrap', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem',
                            position: 'sticky', left: '150px', zIndex: 3, background: 'var(--bg-card)'
                          }}>
                            Code
                          </th>
                          {dateRange.map((dt) => {
                            const parts = formatDateHeader(dt).split(' ');
                            return (
                              <th key={dt} colSpan={2} style={{
                                padding: '0.4rem', textAlign: 'center', border: '1px solid var(--border-color)',
                                whiteSpace: 'nowrap', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem',
                                background: 'var(--bg-card)'
                              }}>
                                {parts[0]} {parts[1] || ''}
                              </th>
                            );
                          })}
                        </tr>
                        <tr>
                          {dateRange.map((dt) => (
                            <React.Fragment key={`sub-${dt}`}>
                              <th style={{
                                padding: '0.4rem', textAlign: 'center', border: '1px solid var(--border-color)',
                                whiteSpace: 'nowrap', fontWeight: 500, color: 'var(--text-secondary)', fontSize: '0.8rem',
                                background: 'var(--bg-card)'
                              }}>
                                In/Out
                              </th>
                              <th style={{
                                padding: '0.4rem', textAlign: 'center', border: '1px solid var(--border-color)',
                                whiteSpace: 'nowrap', fontWeight: 500, color: 'var(--text-secondary)', fontSize: '0.8rem',
                                background: 'var(--bg-card)'
                              }}>
                                Hrs
                              </th>
                            </React.Fragment>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {employeeSections.map((sec, sIdx) => {
                          return (
                            <tr key={`emp-row-${sIdx}`} style={{ background: 'var(--bg-card)' }}>
                              <td style={{
                                padding: '0.5rem', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem',
                                border: '1px solid var(--border-color)', position: 'sticky', left: 0, zIndex: 1,
                                background: 'var(--bg-card)', whiteSpace: 'normal', minWidth: '150px', maxWidth: '200px'
                              }}>
                                {sec.employee_name}
                              </td>
                              <td style={{
                                padding: '0.5rem', fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.8rem',
                                border: '1px solid var(--border-color)', position: 'sticky', left: '150px', zIndex: 1,
                                background: 'var(--bg-card)', whiteSpace: 'nowrap'
                              }}>
                                {sec.employee_code || '-'}
                              </td>
                              {dateRange.map((dt) => {
                                const recs = sec.dates.get(dt) || [];
                                const inOut = getDw2InOut(recs);
                                const hrs = getDw2Hours(recs);
                                const isDash = inOut === '-';
                                
                                return (
                                  <React.Fragment key={`cell-${dt}`}>
                                    <td style={{ 
                                      textAlign: 'center', padding: '0.5rem', border: '1px solid var(--border-color)', 
                                      color: isDash ? 'var(--text-muted)' : 'var(--text-secondary)',
                                      fontWeight: 400, whiteSpace: 'pre-line', fontSize: '0.8rem', background: 'var(--bg-card)'
                                    }}>
                                      {inOut}
                                    </td>
                                    <td style={{ 
                                      textAlign: 'center', padding: '0.5rem', border: '1px solid var(--border-color)', 
                                      color: isDash ? 'var(--text-muted)' : 'var(--text-primary)',
                                      fontWeight: isDash ? 'normal' : 600, whiteSpace: 'pre-line', fontSize: '0.8rem', background: 'var(--bg-card)'
                                    }}>
                                      {hrs}
                                    </td>
                                  </React.Fragment>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div style={{ marginTop: '1rem', display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#10b981', display: 'inline-block' }} />
                  Hours worked
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.85rem' }}>-</span>
                  No attendance record
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  Format: HH:MM / HH:MM (In / Out)
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // ─── Grouped Labour Data (for Lab Reports 1, 2, 3) ────────────────────────
  const labPivot = useMemo(() => {
    if (!['lab-attendance-1', 'lab-attendance-2', 'lab-attendance-3'].includes(activeReport)) return { sections: [], dateRange: [] };
    
    const dateSet = new Set<string>();
    const byLab = new Map<string, any>();

    data.forEach((row) => {
      const dt = row.attendance_date || row.work_date || row.created_date || 'N/A';
      if (dt !== 'N/A') dateSet.add(dt);

      const lid = String(row.labour_id || 'unknown');
      if (!byLab.has(lid)) {
        byLab.set(lid, {
          labour_id: lid,
          labour_name: row.labour_name || 'Unknown',
          labour_type: row.labour_type || '',
          contractor_name: row.contractor_name || '-',
          dates: new Map<string, any[]>(),
        });
      }
      const sec = byLab.get(lid)!;
      if (!sec.dates.has(dt)) sec.dates.set(dt, []);
      sec.dates.get(dt)!.push(row);
    });

    let dateRange: string[] = [];
    if (labStartDate && labEndDate) {
      dateRange = generateDateRange(labStartDate, labEndDate);
    } else {
      dateRange = Array.from(dateSet).sort();
    }
    const sections = Array.from(byLab.values()).sort((a, b) => a.labour_name.localeCompare(b.labour_name));

    return { sections, dateRange };
  }, [data, activeReport, labStartDate, labEndDate]);

  // ─── Export Lab Reports to CSV ──────────────────────────────────────────
  const exportLabCSV = () => {
    const { sections, dateRange } = labPivot;
    if (sections.length === 0) {
      showError('No data to export.');
      return;
    }

    const rows: string[][] = [];
    let reportName = 'Labour_Report';
    if (activeReport === 'lab-attendance-1') reportName = 'Labour_Work_Log_Report_1';
    else if (activeReport === 'lab-attendance-2') reportName = 'Labour_Work_Log_Report_2';
    else if (activeReport === 'lab-attendance-3') reportName = 'Labour_Work_Log_Summary_3';

    // Headers
    rows.push(['Labour Name', 'Type', 'Contractor', 'Field', ...dateRange]);

    const fields = activeReport === 'lab-attendance-1' 
      ? ['In Address', 'Out Address', 'Task', 'Amount (₹)', 'Pay Amount (₹)']
      : [
          'Project & Discipline',
          'Task',
          (activeReport as string) !== 'lab-attendance-3' ? 'In/Out' : null,
          (activeReport as string) !== 'lab-attendance-3' ? 'Hrs' : null,
          null,
          'Pay Amount',
          'Status',
          (activeReport as string) !== 'lab-attendance-2' ? 'Remarks' : null,
        ].filter(Boolean) as string[];

    sections.forEach((sec) => {
      fields.forEach((field, fIdx) => {
        const row = fIdx === 0 
          ? [sec.labour_name, sec.labour_type, sec.contractor_name, field]
          : ['', '', '', field];
        
        dateRange.forEach((dt) => {
          const recs = sec.dates.get(dt) || [];
          if (recs.length === 0) {
            row.push('-');
            return;
          }
          const vals = recs.map((r: any) => {
            if (field === 'Project & Discipline') return `${r.project_name || '-'} | ${r.wbs_name || r.discipline_name || '-'}`;
            if (field === 'Task') return r.task_name || '-';
            if (field === 'In/Out') return r.in_time && r.out_time ? `${r.in_time} - ${r.out_time}` : '-';
            if (field === 'Hrs') return r.total_working_hours || '-';
            if (field === 'Rate') return r.rate || '-';
            if (field === 'Pay Amount (₹)' || field === 'Pay Amount') return `₹${Number(r.calculated_payment || r.daily_pay_amount || r.total_payment || 0).toFixed(2)}`;
            if (field === 'Status') return r.payment_status || '-';
            if (field === 'Remarks') return r.comment || '-';
            if (field === 'In Address') return r.in_address || '-';
            if (field === 'Out Address') return r.out_address || '-';
            if (field === 'Amount (₹)') return r.rate ? `₹${Number(r.rate).toFixed(2)}` : '-';
            return '-';
          });
          row.push(vals.join(' / '));
        });
        rows.push(row);
      });
      rows.push([]); // spacer between labours
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.map(String).map(s => `"${s.replace(/"/g, '""')}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─── Render Labour Reports (1, 2, 3) Horizontal Layout ──────────────────────
  const renderLabReport = () => {
    const { sections, dateRange } = labPivot;
    const hasData = sections.length > 0;
    const title = activeReport === 'lab-attendance-1' ? 'Labour Work Log Report 1 (Logs & Rates)' : 
                  activeReport === 'lab-attendance-2' ? 'Labour Work Log Report 2 (In/Out & Hours)' :
                  'Labour Work Log Summary (Report 3)';

    const fields = activeReport === 'lab-attendance-1' 
      ? [
          'In Address',
          'Out Address',
          'Task',
          'Amount (₹)',
          'Pay Amount (₹)'
        ]
      : [
          'Project & Discipline',
          'Task',
          (activeReport as string) !== 'lab-attendance-3' ? 'In/Out' : null,
          (activeReport as string) !== 'lab-attendance-3' ? 'Hrs' : null,
          null,
          'Pay Amount (₹)',
          'Status',
          (activeReport as string) !== 'lab-attendance-2' ? 'Remarks' : null,
        ].filter(Boolean) as string[];

    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>{title}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Horizontal Date-Wise Grouped Report</p>
          </div>
          <Button onClick={exportLabCSV} disabled={!hasData} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
            <Download size={16} /> Export CSV
          </Button>
        </div>

        <div className="glass-card mb-6" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <FormInput label="Start Date" type="date" value={labStartDate} onChange={(e) => setLabStartDate(e.target.value)} />
          <FormInput label="End Date" type="date" value={labEndDate} onChange={(e) => setLabEndDate(e.target.value)} />
          <FormSelect
            label="Project"
            value={labProjectId}
            onChange={(e) => {
              setLabProjectId(e.target.value);
              setLabDisciplineId('');
              setLabTaskId('');
            }}
            options={[{ value: '', label: 'All Projects' }, ...projects.map(p => ({ value: p.project_id.toString(), label: p.project_name }))]}
          />
          <FormSelect
            label="Discipline"
            value={labDisciplineId}
            onChange={(e) => {
              setLabDisciplineId(e.target.value);
              setLabTaskId('');
            }}
            options={[{ value: '', label: 'All Disciplines' }, ...filteredReportDisciplines.map(d => ({ value: d.id?.toString() || d.wbs_id?.toString() || '', label: d.wbs_name }))]}
          />
          <FormSelect
            label="Task"
            value={labTaskId}
            onChange={(e) => setLabTaskId(e.target.value)}
            options={[{ value: '', label: 'All Tasks' }, ...filteredReportTasks.map(t => ({ value: t.task_id.toString(), label: t.task_name }))]}
          />
          <FormSelect
            label="Labour / Contractor"
            value={labLabourId}
            onChange={(e) => setLabLabourId(e.target.value)}
            options={[{ value: '', label: 'All Labours' }, ...labours.map(l => ({ value: l.labour_id.toString(), label: `${l.name} (${l.labour_type === 'contractor' ? 'Contractor' : 'Direct Labour'})` }))]}
          />
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Button variant="secondary" onClick={handleLabReset}>Reset</Button>
            <Button onClick={handleLabFilter}><Filter size={16} /> Filter</Button>
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading report data...</div>
        ) : !hasData ? (
          <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <HardHat size={48} style={{ margin: '0 auto 1rem', color: 'rgba(255,255,255,0.1)' }} />
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>No data available</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Adjust your filters to see results.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {sections.map((sec, sIdx) => (
              <div key={`lab-${sIdx}`} style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
                
                {/* Header for each Labour Block */}
                <div style={{
                  padding: '1rem',
                  background: '#fff',
                  borderBottom: '1px solid #ddd',
                }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#d9534f', fontSize: '1.25rem', fontWeight: 600 }}>
                    {sec.labour_id} - {sec.labour_name} <span style={{ color: '#777', fontSize: '1rem', fontWeight: 400 }}>({sec.labour_type === 'contractor_labour' ? `Contractor Labour - ${sec.contractor_name}` : 'Direct Labour'})</span>
                  </h3>
                  <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.95rem', color: '#555', fontWeight: 600 }}>
                    <span>From Date : {labStartDate || 'All Time'}</span>
                    <span>|</span>
                    <span>To Date : {labEndDate || 'All Time'}</span>
                  </div>
                </div>

                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <table className="custom-table" style={{ width: 'max-content', minWidth: '100%', borderCollapse: 'collapse', border: 'none' }}>
                    <thead style={{ background: '#f1f5f9' }}>
                      <tr>
                        <th style={{
                          padding: '0.75rem 0.6rem',
                          textAlign: 'left',
                          borderRight: '1px solid #ddd',
                          borderBottom: '1px solid #ddd',
                          whiteSpace: 'nowrap',
                          fontWeight: 600,
                          color: '#334155',
                          fontSize: '0.95rem',
                          position: 'sticky',
                          left: 0,
                          zIndex: 2,
                          background: '#f1f5f9'
                        }}>
                          Details
                        </th>
                        {dateRange.map((dt) => (
                          <th key={dt} style={{
                            padding: '0.75rem 0.6rem',
                            textAlign: 'center',
                            borderRight: '1px solid #ddd',
                            borderBottom: '1px solid #ddd',
                            whiteSpace: 'nowrap',
                            fontWeight: 600,
                            color: '#334155',
                            fontSize: '0.95rem',
                            minWidth: '100px'
                          }}>
                            {formatDateHeader(dt)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {fields.map((field, fIdx) => (
                        <tr key={field} style={{ background: '#fff' }}>
                          <td style={{
                            padding: '0.7rem 0.6rem',
                            fontWeight: 600,
                            color: '#333',
                            fontSize: '0.9rem',
                            borderRight: '1px solid #ddd',
                            borderBottom: '1px solid #ddd',
                            position: 'sticky',
                            left: 0,
                            zIndex: 1,
                            background: '#fff',
                          }}>
                            {field}
                          </td>
                          {dateRange.map((dt) => {
                            const recs = sec.dates.get(dt) || [];
                            if (recs.length === 0) {
                              return <td key={dt} style={{ textAlign: 'center', padding: '0.7rem 0.6rem', borderRight: '1px solid #ddd', borderBottom: '1px solid #ddd', color: '#999' }}>-</td>;
                            }
                            
                            return (
                              <td key={dt} style={{ textAlign: 'center', padding: 0, borderRight: '1px solid #ddd', borderBottom: '1px solid #ddd', verticalAlign: 'top' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                  {recs.map((r: any, rIdx: number) => {
                                    let val: React.ReactNode = '-';
                                    if (field === 'Project & Discipline') {
                                      val = <>{r.project_name || '-'}<br/><span style={{ color: '#777', fontSize: '0.8rem' }}>{r.wbs_name || r.discipline_name || '-'}</span></>;
                                    } else if (field === 'Task') val = r.task_name ? `${r.task_name} (${r.project_name || '-'} - ${r.wbs_name || r.discipline_name || '-'})` : '-';
                                    else if (field === 'In/Out') val = r.in_time && r.out_time ? `${r.in_time} - ${r.out_time}` : '-';
                                    else if (field === 'Hrs') val = r.total_working_hours || '-';
                                    else if (field === 'Rate') val = r.rate || '-';
                                    else if (field === 'Pay Amount (₹)' || field === 'Pay Amount') val = <span style={{ color: '#10b981', fontWeight: 600 }}>{Number(r.calculated_payment || r.daily_pay_amount || r.total_payment || 0).toFixed(2)}</span>;
                                    else if (field === 'Status') val = <Badge variant={r.payment_status === 'paid' ? 'success' : 'warning'}>{r.payment_status || 'pending'}</Badge>;
                                    else if (field === 'Remarks') val = r.comment || '-';
                                    else if (field === 'In Address') val = r.in_address || '-';
                                    else if (field === 'Out Address') val = r.out_address || '-';
                                    else if (field === 'Amount (₹)') val = r.rate ? `₹${Number(r.rate).toFixed(2)}` : '-';
                                    
                                    return (
                                      <div key={rIdx} style={{ 
                                        padding: '0.7rem 0.6rem', 
                                        borderTop: rIdx > 0 ? '1px solid #ddd' : 'none',
                                        fontSize: '0.9rem',
                                        color: '#333',
                                        whiteSpace: 'nowrap',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minHeight: '44px'
                                      }}>
                                        {val}
                                      </div>
                                    );
                                  })}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  // ─── If Attendance Report 1 is active, render its matrix layout ──────────
  if (activeReport === 'emp-attendance-1') {
    return (
      <div className="page-body">
        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setActiveReport('emp-details'); setData([]); }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.45rem 0.9rem',
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '0.82rem',
              fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <ChevronLeft size={14} /> Back to Reports
          </button>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Employee Reports &rsaquo; Attendance Report 1 (Day Wise Hrs)
          </span>
        </div>
        {renderAtt1Matrix()}
      </div>
    );
  }

  // ─── If Labour Reports 1, 2, or 3 are active, render the custom vertical layout ───
  if (activeReport === 'lab-attendance-1' || activeReport === 'lab-attendance-2' || activeReport === 'lab-attendance-3') {
    return (
      <div className="page-body">
        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setActiveReport('lab-details'); setData([]); }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.45rem 0.9rem',
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '0.82rem',
              fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <ChevronLeft size={14} /> Back to Reports
          </button>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Labour / Contractor Reports &rsaquo; {activeReport === 'lab-attendance-1' ? 'Report 1' : activeReport === 'lab-attendance-2' ? 'Report 2' : 'Report 3'}
          </span>
        </div>
        {renderLabReport()}
      </div>
    );
  }

  // ─── If Attendance Report 3 is active, render its matrix layout ──────────
  if (activeReport === 'emp-attendance-3') {
    return (
      <div className="page-body">
        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setActiveReport('emp-details'); setData([]); }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.45rem 0.9rem',
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '0.82rem',
              fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <ChevronLeft size={14} /> Back to Reports
          </button>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Employee Reports &rsaquo; Attendance Report 3 (Summary)
          </span>
        </div>
        {renderAtt3Matrix()}
      </div>
    );
  }

  // ─── If View 2 is active, render its dedicated layout ────────────────────
  if (activeReport === 'emp-daywise-2') {
    return (
      <div className="page-body">
        {/* Back navigation */}
        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setActiveReport('emp-details'); setData([]); }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.45rem 0.9rem',
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '0.82rem',
              fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <ChevronLeft size={14} /> Back to Reports
          </button>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Employee Reports &rsaquo; Day Wise View 2
          </span>
        </div>

        {renderDw2Report()}
      </div>
    );
  }

  // ─── Standard reports layout ──────────────────────────────────────────────
  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics &amp; Custom Reports</h1>
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
            <ReportCard 
              title="Employee Attendance Day Wise Hrs Report" 
              desc="Day-wise matrix showing In/Out time, working hours, and addresses per date column for each employee." 
              icon={<Calendar size={20} />} 
              active={(activeReport as string) === 'emp-attendance-1'} 
              onClick={() => { setActiveReport('emp-attendance-1'); setData([]); }} 
              highlight
            />
            <ReportCard
              title="Employee Attendance Day Wise Report View 2"
              desc="Day-wise matrix showing In/Out times and working hours per date column for each employee."
              icon={<TableProperties size={20} />}
              active={(activeReport as string) === 'emp-daywise-2'}
              onClick={() => { setActiveReport('emp-daywise-2'); setData([]); }}
              highlight
            />
            <ReportCard
              title="Attendance Report 3 (Summary)"
              desc="Day-wise matrix showing P/A attendance status per date column with summary totals — days present, absent, and working hours."
              icon={<FileText size={20} />}
              active={(activeReport as string) === 'emp-attendance-3'}
              onClick={() => { setActiveReport('emp-attendance-3'); setData([]); }}
              highlight
            />
          </>
        ) : (
          <>
            <ReportCard title="Labour Details" desc="List of contractors and direct workers with contact & Aadhaar verification." icon={<Users size={20} />} active={activeReport === 'lab-details'} onClick={() => setActiveReport('lab-details')} />
            <ReportCard title="Discipline Details" desc="Discipline allocations and sub-task status." icon={<FolderKanban size={20} />} active={activeReport === 'lab-discipline'} onClick={() => setActiveReport('lab-discipline')} />
            <ReportCard title="Labour Work Log Report 1 (Logs & Rates)" desc="Day-wise worker Check-In/Out times, hours, rate, and amount." icon={<Calendar size={20} />} active={(activeReport as string) === 'lab-attendance-1'} onClick={() => setActiveReport('lab-attendance-1')} highlight />
            <ReportCard title="Labour Work Log Report 2 (In/Out & Hours)" desc="Day-wise In/Out times and working hours." icon={<Clock size={20} />} active={(activeReport as string) === 'lab-attendance-2'} onClick={() => setActiveReport('lab-attendance-2')} highlight />
            <ReportCard title="Labour Work Log Summary" desc="Worker days worked, total work logs, hours, and payout summary." icon={<FileText size={20} />} active={(activeReport as string) === 'lab-attendance-3'} onClick={() => setActiveReport('lab-attendance-3')} highlight />
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
          <Button variant="secondary" onClick={() => {
            setStartDate('');
            setEndDate('');
            setProjectId('');
            setEmployeeId('');
            setLabourId('');
            fetchReportData();
          }}>
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

const ReportCard = ({ title, desc, icon, active, onClick, highlight }: { title: string, desc: string, icon: any, active: boolean, onClick: () => void, highlight?: boolean }) => (
  <div 
    onClick={onClick}
    style={{
      padding: '1.25rem',
      borderRadius: 'var(--radius-lg)',
      background: active
        ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)'
        : highlight
          ? 'linear-gradient(135deg, rgba(15,76,117,0.12) 0%, rgba(26,107,138,0.12) 100%)'
          : 'var(--bg-card)',
      border: `1px solid ${active ? '#6366f1' : highlight ? 'rgba(125,211,252,0.25)' : 'var(--border-color)'}`,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    {highlight && !active && (
      <div style={{
        position: 'absolute', top: '8px', right: '8px',
        background: 'linear-gradient(135deg, #0f4c75, #1a6b8a)',
        color: '#7dd3fc', fontSize: '0.6rem', fontWeight: 700,
        padding: '0.15rem 0.45rem', borderRadius: '4px',
        letterSpacing: '0.05em', textTransform: 'uppercase',
      }}>
        View 2
      </div>
    )}
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
      <div style={{ color: active ? '#6366f1' : highlight ? '#7dd3fc' : 'var(--text-secondary)' }}>{icon}</div>
      <div style={{ fontWeight: 600, color: active ? 'var(--text-primary)' : 'var(--text-main)', fontSize: '0.95rem' }}>{title}</div>
    </div>
    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{desc}</div>
  </div>
);
