import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { DataTable, Column } from '../components/common/DataTable';
import { apiRequest } from '../services/api';
import { DashboardMetrics } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  Users, UserCheck, MapPin, Clock, FolderKanban, 
  IndianRupee, UserPlus, FolderPlus, FilePlus, Receipt, CheckSquare 
} from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, BarChart, Bar, Legend, YAxis } from 'recharts';

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const isEmployee = user?.role_name === 'Employee';

  const [metrics, setMetrics] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const fetchMetrics = async () => {
    setIsLoading(true);
    setMetrics(null); // Clear previous cached state
    const res = await apiRequest<any>(`/dashboard/metrics?date=${selectedDate}`);
    if (res.success && res.data) {
      setMetrics(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMetrics();
  }, [user?.employee_id, user?.role_name, selectedDate]);

  if (isLoading) return <LoadingSpinner />;
  if (!metrics) return <div style={{ color: 'var(--text-primary)', padding: '2rem' }}>Failed to load dashboard metrics.</div>;

  const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
  const ATTENDANCE_COLORS = ['#10b981', '#ef4444', '#f59e0b'];

  const taskData = metrics?.tasks ? [
    { name: 'Completed', value: metrics.tasks.completed || 0 },
    { name: 'In Progress', value: metrics.tasks.in_progress || 0 },
    { name: 'Pending', value: metrics.tasks.pending || 0 },
    { name: 'Delayed', value: metrics.tasks.delayed || 0 },
  ] : [];

  const attendanceData = metrics?.employees ? [
    { name: 'Present', value: metrics.employees.present_today || 0 },
    { name: 'Absent', value: metrics.employees.absent_today || 0 },
    { name: 'On Leave', value: metrics.employees.on_leave || 0 },
  ] : [];

  if (isEmployee) {
    const empMetrics = metrics as any;
    const taskDist = [
      { name: 'Completed', value: empMetrics.my_tasks?.completed || 0 },
      { name: 'In Progress', value: empMetrics.my_tasks?.in_progress || 0 },
      { name: 'Pending', value: empMetrics.my_tasks?.pending || 0 },
      { name: 'Delayed', value: empMetrics.my_tasks?.delayed || 0 },
    ];

    const columns: Column<any>[] = [
      { header: 'Task Name', accessor: 'task_name', sortKey: 'task_name' },
      { header: 'Project Name', accessor: (r) => r.project_name || 'General Site', sortKey: 'project_name' },
      { header: 'WBS / Discipline', accessor: (r) => r.wbs_name || 'General', sortKey: 'wbs_name' },
      {
        header: 'Task Status',
        accessor: (r) => (
          <Badge variant={r.task_status === 'completed' ? 'success' : r.task_status === 'in-progress' ? 'info' : 'warning'}>
            {r.task_status}
          </Badge>
        ),
        sortKey: 'task_status'
      },
      { header: 'Start Date & Time', accessor: (r) => r.start_date ? `${r.start_date} ${r.start_time || ''}` : '-', sortKey: 'start_date' },
      { header: 'End Date & Time', accessor: (r) => r.end_date ? `${r.end_date} ${r.end_time || ''}` : '-', sortKey: 'end_date' },
      { header: 'Worker Count', accessor: (r) => r.required_worker_count || 1, sortKey: 'required_worker_count' },
      { header: 'Working Hours', accessor: (r) => `${r.logged_hours || 0} hrs`, sortKey: 'logged_hours' },
      {
        header: 'Attendance Status',
        accessor: (r) => (
          <Badge variant={r.latest_attendance_status === 'completed' ? 'success' : r.latest_attendance_status === 'open' ? 'info' : 'info'}>
            {r.latest_attendance_status || 'Not Checked-In'}
          </Badge>
        ),
        sortKey: 'latest_attendance_status'
      },
    ];

    return (
      <div>
        <div className="page-header" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h1 className="page-title">Employee Dashboard</h1>
            <p className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
              <span>Welcome back, <strong>{user?.name}</strong> 👋</span>
              <span>•</span>
              <span>Employee ID: <strong>{user?.employee_code || `EMP${user?.employee_id}`}</strong></span>
              <span>•</span>
              <Badge variant="info">Role: Employee / Staff</Badge>
            </p>
          </div>
          <div style={{ background: 'rgba(150,150,150,0.1)', padding: '0.25rem 1rem', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📅 <input 
                 type="date" 
                 value={selectedDate} 
                 onChange={e => setSelectedDate(e.target.value)} 
                 style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem' }} 
               />
          </div>
        </div>

        {/* Top Cards for Employee */}
        <div className="grid-top-metrics">
          <div className="metric-card-sm">
            <div className="metric-header">
              <div className="metric-icon-sm" style={{ background: 'rgba(79, 70, 229, 0.2)', color: '#818cf8' }}>
                <CheckSquare size={18} />
              </div>
              <div className="metric-title-sm">My Assigned Tasks</div>
            </div>
            <div className="metric-value-lg">{empMetrics.my_tasks?.total || 0}</div>
            <div className="metric-trend" style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
              Pending: {empMetrics.my_tasks?.pending || 0} | Done: {empMetrics.my_tasks?.completed || 0}
            </div>
          </div>

          <div className="metric-card-sm">
            <div className="metric-header">
              <div className="metric-icon-sm" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                <UserCheck size={18} />
              </div>
              <div className="metric-title-sm">My Attendance</div>
            </div>
            <div className="metric-value-lg" style={{ fontSize: '1.2rem', color: empMetrics.my_attendance?.is_checked_in ? '#10b981' : 'var(--text-primary)' }}>
              {empMetrics.my_attendance?.today_status || 'Not Checked-In'}
            </div>
            <div className="metric-trend up">
              Present Days: {empMetrics.my_attendance?.present_days || 0}
            </div>
          </div>

          <div className="metric-card-sm">
            <div className="metric-header">
              <div className="metric-icon-sm" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>
                <Clock size={18} />
              </div>
              <div className="metric-title-sm">My Working Hours</div>
            </div>
            <div className="metric-value-lg">{empMetrics.my_attendance?.hours_today || 0} hrs</div>
            <div className="metric-trend" style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
              Week: {empMetrics.my_attendance?.hours_week || 0}h | Month: {empMetrics.my_attendance?.hours_month || 0}h
            </div>
          </div>

          <div className="metric-card-sm">
            <div className="metric-header">
              <div className="metric-icon-sm" style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#22d3ee' }}>
                <FolderKanban size={18} />
              </div>
              <div className="metric-title-sm">My Assigned Projects</div>
            </div>
            <div className="metric-value-lg">{empMetrics.my_projects?.total || 0}</div>
            <div className="metric-trend" style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
              Connected via assigned tasks
            </div>
          </div>
        </div>

        {/* Employee Charts Grid */}
        <div className="grid-main-content" style={{ marginTop: '1.5rem' }}>
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>My Working Hours (7-Day Trend)</h3>
            <div style={{ flex: 1, minHeight: '220px', width: '100%', paddingTop: '1rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={empMetrics.charts?.hours_history || []}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'var(--border-color)', borderRadius: '8px', color: '#f8fafc' }} />
                  <Area type="monotone" dataKey="hours" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>My Task Status Distribution</h3>
            <div style={{ flex: 1, minHeight: '220px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={taskDist} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                    {taskDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'var(--border-color)', borderRadius: '8px', color: '#f8fafc' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* My Activity / My Details Table */}
        <div className="glass-card" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>My Activity & Assigned Details</h3>
          <DataTable
            columns={columns}
            data={empMetrics.my_activity_details || []}
            searchPlaceholder="Search my assigned tasks or projects..."
            exportFilename="my_assigned_tasks"
            isLoading={false}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Executive Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name || 'Administrator'} 👋</p>
        </div>
        <div style={{ background: 'rgba(150,150,150,0.1)', padding: '0.25rem 1rem', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📅 <input 
               type="date" 
               value={selectedDate} 
               onChange={e => setSelectedDate(e.target.value)} 
               style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem' }} 
             />
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid-top-metrics">
        <div className="metric-card-sm">
          <div className="metric-header">
            <div className="metric-icon-sm" style={{ background: 'rgba(79, 70, 229, 0.2)', color: '#818cf8' }}>
              <Users size={18} />
            </div>
            <div className="metric-title-sm">Total Employees</div>
          </div>
          <div className="metric-value-lg">{metrics.employees.total}</div>
          <div className="metric-trend up">↑ 12% from yesterday</div>
        </div>

        <div className="metric-card-sm">
          <div className="metric-header">
            <div className="metric-icon-sm" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
              <UserCheck size={18} />
            </div>
            <div className="metric-title-sm">Present Today</div>
          </div>
          <div className="metric-value-lg">{metrics.employees.present_today}</div>
          <div className="metric-trend up">↑ 8% from yesterday</div>
        </div>

        <div className="metric-card-sm">
          <div className="metric-header">
            <div className="metric-icon-sm" style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#22d3ee' }}>
              <MapPin size={18} />
            </div>
            <div className="metric-title-sm">Checked In</div>
          </div>
          <div className="metric-value-lg">{metrics.employees.checked_in_live}</div>
          <div className="metric-trend" style={{ color: '#94a3b8' }}>↳ Live on sites</div>
        </div>

        <div className="metric-card-sm">
          <div className="metric-header">
            <div className="metric-icon-sm" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>
              <Clock size={18} />
            </div>
            <div className="metric-title-sm">Total Working Hours</div>
          </div>
          <div className="metric-value-lg">{Math.floor(metrics.today_metrics.working_hours)}h {Math.round((metrics.today_metrics.working_hours % 1) * 60)}m</div>
          <div className="metric-trend up">↑ 10% from yesterday</div>
        </div>

        <div className="metric-card-sm">
          <div className="metric-header">
            <div className="metric-icon-sm" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa' }}>
              <FolderKanban size={18} />
            </div>
            <div className="metric-title-sm">Active Projects</div>
          </div>
          <div className="metric-value-lg">{metrics.projects.active}</div>
          <div className="metric-trend" style={{ color: '#94a3b8' }}>Total: {metrics.projects.total}</div>
        </div>

        <div className="metric-card-sm">
          <div className="metric-header">
            <div className="metric-icon-sm" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}>
              <Receipt size={18} />
            </div>
            <div className="metric-title-sm">Quotation Pipeline</div>
          </div>
          <div className="metric-value-lg">₹{metrics.quotations?.pipeline_value?.toLocaleString('en-IN') || 0}</div>
          <div className="metric-trend" style={{ color: '#94a3b8' }}>Count: {metrics.quotations?.pipeline_count || 0} | Total: {metrics.quotations?.total || 0}</div>
        </div>

        <div className="metric-card-sm">
          <div className="metric-header">
            <div className="metric-icon-sm" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
              <FilePlus size={18} />
            </div>
            <div className="metric-title-sm">Pending Invoices</div>
          </div>
          <div className="metric-value-lg">₹{metrics.invoices?.outstanding_amount?.toLocaleString('en-IN') || 0}</div>
          <div className="metric-trend" style={{ color: '#94a3b8' }}>Count: {metrics.invoices?.pending_count || 0}</div>
        </div>

        <div className="metric-card-sm">
          <div className="metric-header">
            <div className="metric-icon-sm" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
              <IndianRupee size={18} />
            </div>
            <div className="metric-title-sm">Project Actual Profit</div>
          </div>
          <div className="metric-value-lg">₹{metrics.financials?.actual_profit?.toLocaleString('en-IN') || 0}</div>
          <div className="metric-trend up">Rev: ₹{metrics.financials?.project_revenue?.toLocaleString('en-IN') || 0} | Cost: ₹{metrics.financials?.project_cost?.toLocaleString('en-IN') || 0}</div>
        </div>
      </div>

      {/* Main Middle Content */}
      <div className="grid-main-content">
        {/* Recharts Area */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Project Progress Overview</h3>
            <select style={{ background: 'rgba(150,150,150,0.1)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', outline: 'none' }}>
              <option>This Week</option>
            </select>
          </div>
          <div style={{ flex: 1, minHeight: '220px', width: '100%', paddingTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.projects.history}>
                <defs>
                  <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} 
                />
                <Area type="monotone" dataKey="progress" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorProgress)" name="Progress %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart Area using Recharts */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>Task Status Distribution</h3>
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '1rem', width: '100%' }}>
            <div style={{ flex: '1 1 140px', height: '180px', minWidth: '130px', maxWidth: '180px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {taskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} 
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{metrics.tasks.total}</div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Total Tasks</div>
              </div>
            </div>
            <div style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: '0.6rem', minWidth: '140px' }}>
              {taskData.map((entry, index) => (
                <div key={entry.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', gap: '0.5rem', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: PIE_COLORS[index], flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{entry.name}</span>
                  </div>
                  <div style={{ color: '#94a3b8', fontWeight: 600 }}>{entry.value} ({Math.round((entry.value / (metrics.tasks.total || 1)) * 100)}%)</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live GPS Attendance */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Live GPS Attendance</h3>
            <span 
              onClick={() => onNavigate?.('attendance')} 
              style={{ color: '#8b5cf6', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
            >
              View All →
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflowY: 'auto' }}>
            {metrics.live_attendance?.map((log: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: idx < metrics.live_attendance.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700 }}>
                    {log.name ? log.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>{log.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{log.role_name} • {log.check_in_time || 'Check-in'}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Badge variant={log.status === 'open' ? 'success' : 'info'}>
                    {log.status === 'open' ? 'Checked In' : 'Completed'}
                  </Badge>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end' }}>
                    <MapPin size={10} /> {log.project_name || 'Site'}
                  </div>
                </div>
              </div>
            ))}
            {(!metrics.live_attendance || metrics.live_attendance.length === 0) && (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', marginTop: '1.5rem', padding: '1rem' }}>No active check-ins right now.</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row Content */}
      <div className="grid-bottom-content" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
        
        {/* System Alerts */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>System Alerts & Notifications</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '300px' }}>
            {metrics.alerts?.map((alert: any, idx: number) => (
              <div key={idx} style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', borderLeft: `3px solid ${alert.type === 'danger' ? '#ef4444' : alert.type === 'warning' ? '#f59e0b' : '#3b82f6'}` }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{alert.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{alert.message}</div>
              </div>
            ))}
            {(!metrics.alerts || metrics.alerts.length === 0) && (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>No new alerts.</div>
            )}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Recent Tasks</h3>
            <span 
              onClick={() => onNavigate?.('tasks')} 
              style={{ color: '#8b5cf6', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
            >
              View All →
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="minimal-table" style={{ width: '100%', minWidth: '500px', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', whiteSpace: 'nowrap' }}>Task</th>
                  <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', whiteSpace: 'nowrap' }}>Project</th>
                  <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', whiteSpace: 'nowrap', minWidth: '120px' }}>Progress</th>
                  <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', whiteSpace: 'nowrap' }}>Due Date</th>
                  <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', whiteSpace: 'nowrap' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recent_tasks?.map((t: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color, rgba(150,150,150,0.1))' }}>
                    <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap' }}>{t.task_name}</td>
                    <td style={{ padding: '0.65rem 0.75rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>{t.project_name}</td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '100px' }}>
                        <div style={{ flex: 1, height: '6px', background: 'rgba(150,150,150,0.2)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${t.progress_percentage}%`, background: '#3b82f6', borderRadius: '3px' }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', minWidth: '35px' }}>{t.progress_percentage}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      {t.due_date ? new Date(t.due_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', whiteSpace: 'nowrap' }}>
                      <Badge variant={t.status === 'completed' ? 'success' : t.status === 'pending' ? 'warning' : t.status === 'delayed' ? 'danger' : 'info'}>
                        {t.status.replace('-', ' ')}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>Today's Attendance Summary</h3>
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '1rem', width: '100%' }}>
            <div style={{ flex: '1 1 140px', height: '180px', minWidth: '130px', maxWidth: '180px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {attendanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={ATTENDANCE_COLORS[index % ATTENDANCE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} 
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{metrics.employees.total}</div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Total</div>
              </div>
            </div>
            <div style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: '0.6rem', minWidth: '140px' }}>
              {attendanceData.map((entry, index) => (
                <div key={entry.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', gap: '0.5rem', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: ATTENDANCE_COLORS[index], flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{entry.name}</span>
                  </div>
                  <div style={{ color: '#94a3b8', fontWeight: 600 }}>{entry.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>Quick Actions</h3>
          <div className="quick-actions-grid grid-3-col">
            <div className="quick-action-btn" onClick={() => onNavigate?.('employees')} style={{ cursor: 'pointer' }}>
              <div style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#8b5cf6', padding: '0.75rem', borderRadius: '12px' }}>
                <UserPlus size={20} />
              </div>
              Add Employee
            </div>
            <div className="quick-action-btn" onClick={() => onNavigate?.('projects')} style={{ cursor: 'pointer' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.75rem', borderRadius: '12px' }}>
                <FolderPlus size={20} />
              </div>
              Add Project
            </div>
            <div className="quick-action-btn" onClick={() => onNavigate?.('tasks')} style={{ cursor: 'pointer' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', padding: '0.75rem', borderRadius: '12px' }}>
                <FilePlus size={20} />
              </div>
              Add Task
            </div>
            <div className="quick-action-btn" onClick={() => onNavigate?.('attendance')} style={{ cursor: 'pointer' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.75rem', borderRadius: '12px' }}>
                <MapPin size={20} />
              </div>
              GPS Check-In
            </div>
            <div className="quick-action-btn" onClick={() => onNavigate?.('reports')} style={{ cursor: 'pointer' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', padding: '0.75rem', borderRadius: '12px' }}>
                <Receipt size={20} />
              </div>
              Attendance Report
            </div>
            <div className="quick-action-btn" onClick={() => onNavigate?.('payments')} style={{ cursor: 'pointer' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', padding: '0.75rem', borderRadius: '12px' }}>
                <IndianRupee size={20} />
              </div>
              Payment Report
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
