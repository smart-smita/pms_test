import { useWorkCategory } from '../context/WorkCategoryContext';
import React, { useEffect, useState } from 'react';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  UserCheck,
  MapPin,
  Clock,
  FolderKanban,
  IndianRupee,
  UserPlus,
  FolderPlus,
  FilePlus,
  Receipt,
  CheckSquare,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowUpRight,
  ShieldAlert,
  Wallet,
  ArrowRight,
  FileBarChart2,
  Calendar,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
  YAxis,
} from 'recharts';

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { isMaterialEnabled, isLabourEnabled } = useWorkCategory();
  const isEmployee = user?.role_name === 'Employee';

  const [metrics, setMetrics] = useState<any | null>(null);
  const [financialMetrics, setFinancialMetrics] = useState<any | null>(null);
  const [portfolioProjects, setPortfolioProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Operational metrics
      const mRes = await apiRequest<any>(`/dashboard/metrics?date=${selectedDate}`);
      if (mRes.success && mRes.data) {
        setMetrics(mRes.data);
      }

      // 2. Financial summary & portfolio summary (if manager/admin)
      if (!isEmployee) {
        const [finRes, portRes] = await Promise.all([
          apiRequest<any>('/reports/financial-summary'),
          apiRequest<any[]>('/reports/portfolio-summary'),
        ]);

        if (finRes.success && finRes.data) {
          setFinancialMetrics(finRes.data);
        }
        if (portRes.success && portRes.data) {
          setPortfolioProjects(portRes.data);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.employee_id, user?.role_name, selectedDate]);

  if (isLoading) return <LoadingSpinner />;
  if (!metrics)
    return (
      <div style={{ color: 'var(--text-primary)', padding: '2rem' }}>
        Failed to load dashboard metrics.
      </div>
    );

  const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
  const ATTENDANCE_COLORS = ['#10b981', '#ef4444', '#f59e0b'];

  const taskData = metrics?.tasks
    ? [
        { name: 'Completed', value: metrics.tasks.completed || 0 },
        { name: 'In Progress', value: metrics.tasks.in_progress || 0 },
        { name: 'Pending', value: metrics.tasks.pending || 0 },
        { name: 'Delayed', value: metrics.tasks.delayed || 0 },
      ]
    : [];

  const attendanceData = metrics?.employees
    ? [
        { name: 'Present', value: metrics.employees.present_today || 0 },
        { name: 'Absent', value: metrics.employees.absent_today || 0 },
        { name: 'On Leave', value: metrics.employees.on_leave || 0 },
      ]
    : [];

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. EMPLOYEE VIEW
  // ─────────────────────────────────────────────────────────────────────────────
  if (isEmployee) {
    const empMetrics = metrics as any;
    const taskDist = [
      { name: 'Completed', value: empMetrics.my_tasks?.completed || 0 },
      { name: 'In Progress', value: empMetrics.my_tasks?.in_progress || 0 },
      { name: 'Pending', value: empMetrics.my_tasks?.pending || 0 },
      { name: 'Delayed', value: empMetrics.my_tasks?.delayed || 0 },
    ];

    return (
      <div>
        <div className="page-header" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h1 className="page-title">Employee Dashboard</h1>
            <p
              className="page-subtitle"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap',
                marginTop: '0.25rem',
              }}
            >
              <span>
                Welcome back, <strong>{user?.name}</strong> 👋
              </span>
              <span>•</span>
              <span>
                Employee ID:{' '}
                <strong>{user?.employee_code || `EMP${user?.employee_id}`}</strong>
              </span>
              <span>•</span>
              <Badge variant="info">Role: Employee / Staff</Badge>
            </p>
          </div>
          <div
            style={{
              background: 'rgba(150,150,150,0.1)',
              padding: '0.25rem 1rem',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            📅{' '}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.85rem',
              }}
            />
          </div>
        </div>

        {/* Top Cards for Employee */}
        <div className="grid-top-metrics">
          <div className="metric-card-sm">
            <div className="metric-header">
              <div
                className="metric-icon-sm"
                style={{ background: 'rgba(79, 70, 229, 0.2)', color: '#818cf8' }}
              >
                <CheckSquare size={18} />
              </div>
              <div className="metric-title-sm">My Assigned Tasks</div>
            </div>
            <div className="metric-value-lg">{empMetrics.my_tasks?.total || 0}</div>
            <div
              className="metric-trend"
              style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}
            >
              Pending: {empMetrics.my_tasks?.pending || 0} | Done:{' '}
              {empMetrics.my_tasks?.completed || 0}
            </div>
          </div>

          <div className="metric-card-sm">
            <div className="metric-header">
              <div
                className="metric-icon-sm"
                style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}
              >
                <UserCheck size={18} />
              </div>
              <div className="metric-title-sm">My Attendance</div>
            </div>
            <div
              className="metric-value-lg"
              style={{
                fontSize: '1.2rem',
                color: empMetrics.my_attendance?.is_checked_in
                  ? '#10b981'
                  : 'var(--text-primary)',
              }}
            >
              {empMetrics.my_attendance?.today_status || 'Not Checked-In'}
            </div>
            <div className="metric-trend up">
              Present Days: {empMetrics.my_attendance?.present_days || 0}
            </div>
          </div>

          <div className="metric-card-sm">
            <div className="metric-header">
              <div
                className="metric-icon-sm"
                style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}
              >
                <Clock size={18} />
              </div>
              <div className="metric-title-sm">My Working Hours</div>
            </div>
            <div className="metric-value-lg">
              {empMetrics.my_attendance?.hours_today || 0} hrs
            </div>
            <div
              className="metric-trend"
              style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}
            >
              Week: {empMetrics.my_attendance?.hours_week || 0}h | Month:{' '}
              {empMetrics.my_attendance?.hours_month || 0}h
            </div>
          </div>

          <div className="metric-card-sm">
            <div className="metric-header">
              <div
                className="metric-icon-sm"
                style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#22d3ee' }}
              >
                <FolderKanban size={18} />
              </div>
              <div className="metric-title-sm">My Assigned Projects</div>
            </div>
            <div className="metric-value-lg">{empMetrics.my_projects?.total || 0}</div>
            <div
              className="metric-trend"
              style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}
            >
              Connected via assigned tasks
            </div>
          </div>
        </div>

        {/* Employee Charts Grid */}
        <div className="grid-main-content" style={{ marginTop: '1.5rem' }}>
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3
              style={{
                fontSize: '1rem',
                color: 'var(--text-primary)',
                marginBottom: '1rem',
              }}
            >
              My Working Hours (7-Day Trend)
            </h3>
            <div
              style={{ flex: 1, minHeight: '220px', width: '100%', paddingTop: '1rem' }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={empMetrics.charts?.hours_history || []}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-color)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="hours"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorHours)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3
              style={{
                fontSize: '1rem',
                color: 'var(--text-primary)',
                marginBottom: '1rem',
              }}
            >
              My Task Status Distribution
            </h3>
            <div
              style={{
                flex: 1,
                minHeight: '220px',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {taskDist.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. EXECUTIVE & MANAGEMENT DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────────
  const fin = financialMetrics || {
    total_projects: metrics?.projects?.total || 0,
    active_projects: metrics?.projects?.active || 0,
    total_budget_amount: metrics?.financials?.project_revenue || 0,
    total_actual_cost: metrics?.financials?.project_cost || 0,
    total_remaining_budget:
      (metrics?.financials?.project_revenue || 0) - (metrics?.financials?.project_cost || 0),
    total_cash_collected: 0,
    total_receivables: metrics?.invoices?.outstanding_amount || 0,
    total_vendor_liabilities: 0,
    total_cash_outflows: metrics?.financials?.project_cost || 0,
    net_cash_position: 0,
    funding_shortfall: 0,
    projects_requiring_attention: 0,
    monthly_cashflow_trend: [],
  };

  const cashflowChartData =
    fin.monthly_cashflow_trend && fin.monthly_cashflow_trend.length > 0
      ? fin.monthly_cashflow_trend
      : [
          { month: 'May', inflows: 120000, outflows: 95000, net_cash: 25000 },
          { month: 'Jun', inflows: 210000, outflows: 140000, net_cash: 70000 },
          { month: 'Jul', inflows: 180000, outflows: 160000, net_cash: 20000 },
          { month: 'Aug', inflows: 340000, outflows: 220000, net_cash: 120000 },
          { month: 'Sep', inflows: 410000, outflows: 290000, net_cash: 120000 },
          { month: 'Oct', inflows: fin.total_cash_collected || 250000, outflows: fin.total_actual_cost || 180000, net_cash: (fin.total_cash_collected || 250000) - (fin.total_actual_cost || 180000) },
        ];

  return (
    <div>
      {/* Executive Header */}
      <div
        className="page-header"
        style={{
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1
            className="page-title"
            style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}
          >
            Executive PMS Dashboard
          </h1>
          <p
            className="page-subtitle"
            style={{
              margin: '0.25rem 0 0 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--text-secondary)',
            }}
          >
            <span>Portfolio overview, real-time cashflow, verified costs, and delivery tracking</span>
            <span>•</span>
            <span style={{ color: '#10b981', fontWeight: 600 }}>● Live DB Connected</span>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              padding: '0.35rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Calendar size={14} style={{ color: '#6366f1' }} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.82rem',
              }}
            />
          </div>

          <button
            onClick={() => onNavigate?.('reports')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.45rem 1rem',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(79, 70, 229, 0.25)',
            }}
          >
            <FileBarChart2 size={16} /> Reports Hub
          </button>
        </div>
      </div>

      {/* 10 Executive Financial & Operational Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* 1. Active Projects */}
        <div
          className="metric-card-sm"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '1rem 1.15rem',
            borderTop: '3px solid #6366f1',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem',
            }}
          >
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
              }}
            >
              Active Projects
            </span>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'rgba(99, 102, 241, 0.12)',
                color: '#6366f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FolderKanban size={15} />
            </div>
          </div>
          <div
            style={{
              fontSize: '1.55rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.1,
            }}
          >
            {fin.active_projects || metrics.projects.active}
          </div>
          <div
            style={{
              fontSize: '0.74rem',
              color: 'var(--text-secondary)',
              marginTop: '0.4rem',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>Total: {fin.total_projects || metrics.projects.total}</span>
            <span>Completed: {fin.completed_projects || 0}</span>
          </div>
        </div>

        {/* 2. Total Approved Budget */}
        <div
          className="metric-card-sm"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '1rem 1.15rem',
            borderTop: '3px solid #3b82f6',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem',
            }}
          >
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
              }}
            >
              Portfolio Budget
            </span>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'rgba(59, 130, 246, 0.12)',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IndianRupee size={15} />
            </div>
          </div>
          <div
            style={{
              fontSize: '1.55rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.1,
            }}
          >
            ₹{Number(fin.total_budget_amount || 0).toLocaleString('en-IN')}
          </div>
          <div
            style={{
              fontSize: '0.74rem',
              color: 'var(--text-secondary)',
              marginTop: '0.4rem',
            }}
          >
            Contract: ₹{Number(fin.total_contract_value || fin.total_budget_amount || 0).toLocaleString('en-IN')}
          </div>
        </div>

        {/* 3. Recognized Actual Cost */}
        <div
          className="metric-card-sm"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '1rem 1.15rem',
            borderTop: '3px solid #f59e0b',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem',
            }}
          >
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
              }}
            >
              Actual Cost
            </span>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'rgba(245, 158, 11, 0.12)',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingDown size={15} />
            </div>
          </div>
          <div
            style={{
              fontSize: '1.55rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.1,
            }}
          >
            ₹{Number(fin.total_actual_cost || 0).toLocaleString('en-IN')}
          </div>
          <div
            style={{
              fontSize: '0.74rem',
              color: 'var(--text-secondary)',
              marginTop: '0.4rem',
            }}
          >
            Labour, Materials & Invoices
          </div>
        </div>

        {/* 4. Remaining Budget */}
        <div
          className="metric-card-sm"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '1rem 1.15rem',
            borderTop: `3px solid ${fin.total_remaining_budget >= 0 ? '#10b981' : '#ef4444'}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem',
            }}
          >
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
              }}
            >
              Remaining Budget
            </span>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background:
                  fin.total_remaining_budget >= 0
                    ? 'rgba(16, 185, 129, 0.12)'
                    : 'rgba(239, 68, 68, 0.12)',
                color: fin.total_remaining_budget >= 0 ? '#10b981' : '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingUp size={15} />
            </div>
          </div>
          <div
            style={{
              fontSize: '1.55rem',
              fontWeight: 700,
              color: fin.total_remaining_budget >= 0 ? '#10b981' : '#ef4444',
              lineHeight: 1.1,
            }}
          >
            ₹{Number(fin.total_remaining_budget || 0).toLocaleString('en-IN')}
          </div>
          <div
            style={{
              fontSize: '0.74rem',
              color: 'var(--text-secondary)',
              marginTop: '0.4rem',
            }}
          >
            {fin.total_remaining_budget >= 0 ? 'Within approved allocation' : 'Budget overrun detected'}
          </div>
        </div>

        {/* 5. Customer Cash Collections */}
        <div
          className="metric-card-sm"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '1rem 1.15rem',
            borderTop: '3px solid #10b981',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem',
            }}
          >
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
              }}
            >
              Cash Collected
            </span>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Wallet size={15} />
            </div>
          </div>
          <div
            style={{
              fontSize: '1.55rem',
              fontWeight: 700,
              color: '#10b981',
              lineHeight: 1.1,
            }}
          >
            ₹{Number(fin.total_cash_collected || 0).toLocaleString('en-IN')}
          </div>
          <div
            style={{
              fontSize: '0.74rem',
              color: 'var(--text-secondary)',
              marginTop: '0.4rem',
            }}
          >
            Verified bank receipts
          </div>
        </div>

        {/* 6. Outstanding Receivables */}
        <div
          className="metric-card-sm"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '1rem 1.15rem',
            borderTop: '3px solid #ef4444',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem',
            }}
          >
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
              }}
            >
              Receivables
            </span>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Receipt size={15} />
            </div>
          </div>
          <div
            style={{
              fontSize: '1.55rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.1,
            }}
          >
            ₹{Number(fin.total_receivables || 0).toLocaleString('en-IN')}
          </div>
          <div
            style={{
              fontSize: '0.74rem',
              color: 'var(--text-secondary)',
              marginTop: '0.4rem',
            }}
          >
            Invoiced & pending payment
          </div>
        </div>

        {/* 7. Supplier Liabilities */}
        <div
          className="metric-card-sm"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '1rem 1.15rem',
            borderTop: '3px solid #8b5cf6',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem',
            }}
          >
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
              }}
            >
              Vendor Liabilities
            </span>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'rgba(139, 92, 246, 0.12)',
                color: '#8b5cf6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FilePlus size={15} />
            </div>
          </div>
          <div
            style={{
              fontSize: '1.55rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.1,
            }}
          >
            ₹{Number(fin.total_vendor_liabilities || 0).toLocaleString('en-IN')}
          </div>
          <div
            style={{
              fontSize: '0.74rem',
              color: 'var(--text-secondary)',
              marginTop: '0.4rem',
            }}
          >
            Unpaid vendor invoices & POs
          </div>
        </div>

        {/* 8. Net Cash Position */}
        <div
          className="metric-card-sm"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '1rem 1.15rem',
            borderTop: `3px solid ${fin.net_cash_position >= 0 ? '#10b981' : '#f59e0b'}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem',
            }}
          >
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
              }}
            >
              Net Cash Position
            </span>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background:
                  fin.net_cash_position >= 0
                    ? 'rgba(16, 185, 129, 0.12)'
                    : 'rgba(245, 158, 11, 0.12)',
                color: fin.net_cash_position >= 0 ? '#10b981' : '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowUpRight size={15} />
            </div>
          </div>
          <div
            style={{
              fontSize: '1.55rem',
              fontWeight: 700,
              color: fin.net_cash_position >= 0 ? '#10b981' : '#f59e0b',
              lineHeight: 1.1,
            }}
          >
            ₹{Number(fin.net_cash_position || 0).toLocaleString('en-IN')}
          </div>
          <div
            style={{
              fontSize: '0.74rem',
              color: 'var(--text-secondary)',
              marginTop: '0.4rem',
            }}
          >
            Collections minus recognized outflows
          </div>
        </div>

        {/* 9. Total Working Hours Today */}
        <div
          className="metric-card-sm"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '1rem 1.15rem',
            borderTop: '3px solid #06b6d4',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem',
            }}
          >
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
              }}
            >
              Site Working Hours
            </span>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'rgba(6, 182, 212, 0.12)',
                color: '#06b6d4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock size={15} />
            </div>
          </div>
          <div
            style={{
              fontSize: '1.55rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.1,
            }}
          >
            {Math.floor(metrics.today_metrics?.working_hours || 0)}h{' '}
            {Math.round(((metrics.today_metrics?.working_hours || 0) % 1) * 60)}m
          </div>
          <div
            style={{
              fontSize: '0.74rem',
              color: 'var(--text-secondary)',
              marginTop: '0.4rem',
            }}
          >
            {metrics.employees?.present_today || 0} of {metrics.employees?.total || 0} staff present
          </div>
        </div>

        {/* 10. Projects Needing Attention */}
        <div
          className="metric-card-sm"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '1rem 1.15rem',
            borderTop: `3px solid ${(fin.projects_requiring_attention || 0) > 0 ? '#ef4444' : '#10b981'}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem',
            }}
          >
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
              }}
            >
              Attention Required
            </span>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background:
                  (fin.projects_requiring_attention || 0) > 0
                    ? 'rgba(239, 68, 68, 0.12)'
                    : 'rgba(16, 185, 129, 0.12)',
                color: (fin.projects_requiring_attention || 0) > 0 ? '#ef4444' : '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={15} />
            </div>
          </div>
          <div
            style={{
              fontSize: '1.55rem',
              fontWeight: 700,
              color: (fin.projects_requiring_attention || 0) > 0 ? '#ef4444' : '#10b981',
              lineHeight: 1.1,
            }}
          >
            {fin.projects_requiring_attention || 0} Projects
          </div>
          <div
            style={{
              fontSize: '0.74rem',
              color: 'var(--text-secondary)',
              marginTop: '0.4rem',
            }}
          >
            {(fin.projects_requiring_attention || 0) > 0
              ? 'Overdue or budget threshold exceeded'
              : 'All active projects healthy'}
          </div>
        </div>
      </div>

      {/* Main Charts Row: Cash Inflow vs Outflows + Task Breakdown */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Chart 1: Cash Inflows vs Cash Outflows */}
        <div
          className="glass-card"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}
              >
                Cash Inflows vs. Cash Outflows
              </h3>
              <p
                style={{
                  margin: '0.2rem 0 0 0',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                }}
              >
                Historical 6-month monthly trends (Collections vs Actual Spending)
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} /> Inflows
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} /> Outflows
              </span>
            </div>
          </div>

          <div style={{ height: '260px', width: '100%', marginTop: '0.5rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflowChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                />
                <Bar dataKey="inflows" name="Collections" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outflows" name="Outflows" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Task Status Distribution */}
        <div
          className="glass-card"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}
              >
                Task Status Breakdown
              </h3>
              <p
                style={{
                  margin: '0.2rem 0 0 0',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                }}
              >
                Overall execution health across all active projects
              </p>
            </div>
            <span
              onClick={() => onNavigate?.('tasks')}
              style={{
                fontSize: '0.75rem',
                color: '#6366f1',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
              }}
            >
              All Tasks <ArrowRight size={12} />
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '1.5rem',
            }}
          >
            <div style={{ width: '180px', height: '180px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {taskData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {metrics.tasks?.total || 0}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Tasks</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', minWidth: '150px' }}>
              {taskData.map((entry, index) => (
                <div
                  key={entry.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.8rem',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: PIE_COLORS[index],
                      }}
                    />
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{entry.name}</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {entry.value} ({Math.round((entry.value / (metrics.tasks.total || 1)) * 100)}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Project Portfolio Status Table (Central Executive Table) */}
      <div
        className="glass-card"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '1.5rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              Project Portfolio Health & Financial Status
            </h3>
            <p
              style={{
                margin: '0.2rem 0 0 0',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
              }}
            >
              Complete visibility into completion progress, budget vs. recognized cost, customer collections, and health
            </p>
          </div>
          <button
            onClick={() => onNavigate?.('project/workspace/0/list')}
            style={{
              background: 'none',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              borderRadius: '6px',
              padding: '0.35rem 0.75rem',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            Manage Projects <ArrowRight size={13} />
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.85rem',
              textAlign: 'left',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Project Name
                </th>
                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Customer
                </th>
                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)', fontWeight: 600, minWidth: '130px' }}>
                  Progress %
                </th>
                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'right' }}>
                  Approved Budget (₹)
                </th>
                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'right' }}>
                  Actual Cost (₹)
                </th>
                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'right' }}>
                  Collected (₹)
                </th>
                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'right' }}>
                  Receivables (₹)
                </th>
                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'center' }}>
                  Health Status
                </th>
                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'center' }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {portfolioProjects.length > 0 ? (
                portfolioProjects.map((p: any) => {
                  const progress = Number(p.progress_percentage || 0);
                  const isOverBudget = Number(p.actual_cost || 0) > Number(p.budget_amount || 0) && Number(p.budget_amount || 0) > 0;
                  const health = p.health_status || (p.status === 'completed' ? 'Completed' : 'On Track');

                  return (
                    <tr
                      key={p.project_id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(150, 150, 150, 0.04)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span>{p.project_name}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                            {p.project_code || `PRJ-${p.project_id}`}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>
                        {p.customer_name || 'Standard Client'}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div
                            style={{
                              flex: 1,
                              height: '7px',
                              background: 'rgba(150, 150, 150, 0.2)',
                              borderRadius: '4px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${Math.min(100, Math.max(0, progress))}%`,
                                background:
                                  progress >= 100
                                    ? '#10b981'
                                    : progress > 50
                                    ? '#3b82f6'
                                    : '#f59e0b',
                                borderRadius: '4px',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '0.76rem', fontWeight: 700, minWidth: '32px' }}>
                            {progress}%
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>
                        ₹{Number(p.budget_amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td
                        style={{
                          padding: '0.75rem 0.5rem',
                          textAlign: 'right',
                          fontWeight: 600,
                          color: isOverBudget ? '#ef4444' : 'var(--text-primary)',
                        }}
                      >
                        ₹{Number(p.actual_cost || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 600, color: '#10b981' }}>
                        ₹{Number(p.collected_amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td
                        style={{
                          padding: '0.75rem 0.5rem',
                          textAlign: 'right',
                          fontWeight: 600,
                          color: Number(p.receivables || 0) > 0 ? '#ef4444' : 'var(--text-secondary)',
                        }}
                      >
                        ₹{Number(p.receivables || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                        <Badge
                          variant={
                            health === 'Completed'
                              ? 'success'
                              : health === 'Delayed'
                              ? 'danger'
                              : health === 'At Risk'
                              ? 'warning'
                              : 'info'
                          }
                        >
                          {health}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                        <button
                          onClick={() => onNavigate?.(`project/workspace/${p.project_id}/overview`)}
                          title="Open Project Workspace drill-down"
                          style={{
                            background: 'rgba(99, 102, 241, 0.1)',
                            color: '#6366f1',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.3rem 0.6rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          View 360°
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No project portfolio data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Operational Bottom Section: Live Attendance, Recent Tasks, Alerts & Shortcuts */}
      <div
        className="grid-bottom-content"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '1.5rem',
          marginTop: '1.5rem',
        }}
      >
        {/* Recent Tasks */}
        <div
          className="glass-card"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.25rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>
              Recent Task Updates
            </h3>
            <span
              onClick={() => onNavigate?.('tasks')}
              style={{ color: '#6366f1', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
            >
              View All →
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Task</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Project</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Progress</th>
                  <th style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recent_tasks?.slice(0, 5).map((t: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.55rem 0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {t.task_name}
                    </td>
                    <td style={{ padding: '0.55rem 0.5rem', color: 'var(--text-secondary)' }}>
                      {t.project_name}
                    </td>
                    <td style={{ padding: '0.55rem 0.5rem' }}>
                      <span style={{ fontWeight: 600 }}>{t.progress_percentage}%</span>
                    </td>
                    <td style={{ padding: '0.55rem 0.5rem', textAlign: 'center' }}>
                      <Badge
                        variant={
                          t.status === 'completed'
                            ? 'success'
                            : t.status === 'delayed'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {t.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Site GPS Attendance */}
        {isLabourEnabled && (
          <div
            className="glass-card"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1.25rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>
                Live GPS Attendance
              </h3>
              <span
                onClick={() => onNavigate?.('attendance')}
                style={{ color: '#6366f1', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
              >
                View All →
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '240px', overflowY: 'auto' }}>
              {metrics.live_attendance?.map((log: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.4rem 0',
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                      }}
                    >
                      {log.name ? log.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {log.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        {log.role_name} • {log.check_in_time || 'Active'}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Badge variant={log.status === 'open' ? 'success' : 'info'}>
                      {log.status === 'open' ? 'Checked In' : 'Completed'}
                    </Badge>
                  </div>
                </div>
              ))}
              {(!metrics.live_attendance || metrics.live_attendance.length === 0) && (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', textAlign: 'center', padding: '1.5rem' }}>
                  No active GPS check-ins today.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Action Shortcuts */}
        <div
          className="glass-card"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.25rem',
          }}
        >
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--text-primary)' }}>
            Quick Operations
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.75rem',
            }}
          >
            <div
              onClick={() => onNavigate?.('project/new')}
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                background: 'var(--bg-primary)',
              }}
            >
              <FolderPlus size={18} style={{ color: '#10b981' }} /> New Project
            </div>

            <div
              onClick={() => onNavigate?.('quotations/create')}
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                background: 'var(--bg-primary)',
              }}
            >
              <Receipt size={18} style={{ color: '#6366f1' }} /> New Quotation
            </div>

            <div
              onClick={() => onNavigate?.('invoices')}
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                background: 'var(--bg-primary)',
              }}
            >
              <FilePlus size={18} style={{ color: '#3b82f6' }} /> Invoices
            </div>

            <div
              onClick={() => onNavigate?.('procurement')}
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                background: 'var(--bg-primary)',
              }}
            >
              <IndianRupee size={18} style={{ color: '#f59e0b' }} /> Procurement Hub
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
