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
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const isEmployee = user?.role_name === 'Employee';

  const [metrics, setMetrics] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = async () => {
    setIsLoading(true);
    setMetrics(null); // Clear previous cached state
    const res = await apiRequest<any>('/dashboard/metrics');
    if (res.success && res.data) {
      setMetrics(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMetrics();
  }, [user?.employee_id, user?.role_name]);

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
          <div style={{ background: 'rgba(150,150,150,0.1)', padding: '0.5rem 1rem', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
            📅 {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
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
        <div style={{ background: 'rgba(150,150,150,0.1)', padding: '0.5rem 1rem', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
          📅 {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
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
          <div className="metric-trend" style={{ color: '#94a3b8' }}>↳ 3 nearing completion</div>
        </div>

        <div className="metric-card-sm">
          <div className="metric-header">
            <div className="metric-icon-sm" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
              <IndianRupee size={18} />
            </div>
            <div className="metric-title-sm">Today's Labor Cost</div>
          </div>
          <div className="metric-value-lg">₹{metrics.today_metrics.worker_cost.toLocaleString('en-IN')}</div>
          <div className="metric-trend down">↓ 5% from yesterday</div>
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
          <div style={{ display: 'flex', flex: 1, alignItems: 'center' }}>
            <div style={{ width: '50%', height: '180px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
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
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{metrics.tasks.total}</div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Total Tasks</div>
              </div>
            </div>
            <div style={{ width: '50%', paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {taskData.map((entry, index) => (
                <div key={entry.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: PIE_COLORS[index] }} />
                    <span style={{ color: 'var(--text-primary)' }}>{entry.name}</span>
                  </div>
                  <div style={{ color: '#94a3b8' }}>{entry.value} ({Math.round((entry.value / (metrics.tasks.total || 1)) * 100)}%)</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live GPS Attendance */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Live GPS Attendance</h3>
            <span style={{ color: '#8b5cf6', fontSize: '0.75rem', cursor: 'pointer' }}>View All</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflowY: 'auto' }}>
            {metrics.live_attendance?.map((log: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>
                    {log.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>{log.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{log.role_name}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Badge variant="success">Checked In</Badge>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end' }}>
                    <MapPin size={10} /> {log.project_name || 'Site'}
                  </div>
                </div>
              </div>
            ))}
            {(!metrics.live_attendance || metrics.live_attendance.length === 0) && (
              <div style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center', marginTop: '1rem' }}>No active check-ins right now.</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row Content */}
      <div className="grid-bottom-content">
        {/* Recent Tasks */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Recent Tasks</h3>
            <span style={{ color: '#8b5cf6', fontSize: '0.75rem', cursor: 'pointer' }}>View All</span>
          </div>
          <table className="minimal-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Progress</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {metrics.recent_tasks?.map((t: any, idx: number) => (
                <tr key={idx}>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{t.task_name}</td>
                  <td style={{ color: '#94a3b8' }}>{t.project_name}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ flex: 1, height: '4px', background: 'rgba(150,150,150,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${t.progress_percentage}%`, background: '#3b82f6' }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>{t.progress_percentage}%</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-primary)' }}>{new Date(t.due_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td>
                    <Badge variant={t.status === 'completed' ? 'success' : t.status === 'pending' ? 'warning' : t.status === 'delayed' ? 'danger' : 'info'}>
                      {t.status.replace('-', ' ')}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Attendance Summary */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>Today's Attendance Summary</h3>
          <div style={{ display: 'flex', flex: 1, alignItems: 'center' }}>
            <div style={{ width: '50%', height: '180px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
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
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{metrics.employees.total}</div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Total</div>
              </div>
            </div>
            <div style={{ width: '50%', paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {attendanceData.map((entry, index) => (
                <div key={entry.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: ATTENDANCE_COLORS[index] }} />
                    <span style={{ color: 'var(--text-primary)' }}>{entry.name}</span>
                  </div>
                  <div style={{ color: '#94a3b8' }}>{entry.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>Quick Actions</h3>
          <div className="quick-actions-grid grid-3-col">
            <div className="quick-action-btn">
              <div style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#8b5cf6', padding: '0.75rem', borderRadius: '12px' }}>
                <UserPlus size={20} />
              </div>
              Add Employee
            </div>
            <div className="quick-action-btn">
              <div style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.75rem', borderRadius: '12px' }}>
                <FolderPlus size={20} />
              </div>
              Add Project
            </div>
            <div className="quick-action-btn">
              <div style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', padding: '0.75rem', borderRadius: '12px' }}>
                <FilePlus size={20} />
              </div>
              Add Task
            </div>
            <div className="quick-action-btn">
              <div style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.75rem', borderRadius: '12px' }}>
                <MapPin size={20} />
              </div>
              GPS Check-In
            </div>
            <div className="quick-action-btn">
              <div style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', padding: '0.75rem', borderRadius: '12px' }}>
                <Receipt size={20} />
              </div>
              Attendance Report
            </div>
            <div className="quick-action-btn">
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
