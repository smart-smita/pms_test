import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  AlertTriangle,
  Clock,
  Calendar,
  DollarSign,
  Building2,
  Receipt,
  CheckCircle2,
} from 'lucide-react';
import { apiService } from '../services/api';
import { ReportHeader, ReportSummaryCards, ReportActionFooter } from '../components/reports';
import { exportReportToCSV, printReport } from '../utils/reportExport';
import { Badge } from '../components/common/Badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export const InvoiceAgingReport: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);
  const [customers, setCustomers] = useState<{ id: number; name: string }[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedAgingBracket, setSelectedAgingBracket] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedProject, selectedCustomer]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes, custRes, agingRes] = await Promise.all([
        apiService.get<any[]>('/projects'),
        apiService.get<any[]>('/customers'),
        apiService.get<any>('/reports/invoice-aging', {
          project_id: selectedProject || undefined,
          customer_id: selectedCustomer || undefined,
        }),
      ]);

      if (projRes.data) setProjects(projRes.data.map((p) => ({ id: p.project_id, name: p.project_name })));
      if (custRes.data) setCustomers(custRes.data.map((c) => ({ id: c.customer_id, name: c.customer_name })));
      if (agingRes.data) setData(agingRes.data);
    } catch (err) {
      console.error('Error fetching invoice aging report:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setSelectedProject('');
    setSelectedCustomer('');
    setSelectedAgingBracket('');
  };

  const invoices: any[] = data?.invoices || [];
  const agingSummary = data?.aging_summary || {
    current: 0,
    days_1_30: 0,
    days_31_60: 0,
    days_61_90: 0,
    days_over_90: 0,
    total_outstanding: 0,
  };

  const filteredInvoices = useMemo(() => {
    if (!selectedAgingBracket) return invoices;
    return invoices.filter((inv) => {
      const days = Number(inv.days_overdue || 0);
      if (selectedAgingBracket === 'current') return days <= 0;
      if (selectedAgingBracket === '1-30') return days > 0 && days <= 30;
      if (selectedAgingBracket === '31-60') return days > 30 && days <= 60;
      if (selectedAgingBracket === '61-90') return days > 60 && days <= 90;
      if (selectedAgingBracket === '90+') return days > 90;
      return true;
    });
  }, [invoices, selectedAgingBracket]);

  // Chart data
  const chartData = [
    { bracket: 'Current (< Due)', amount: Number(agingSummary.current || 0), fill: '#10b981' },
    { bracket: '1–30 Days', amount: Number(agingSummary.days_1_30 || 0), fill: '#3b82f6' },
    { bracket: '31–60 Days', amount: Number(agingSummary.days_31_60 || 0), fill: '#f59e0b' },
    { bracket: '61–90 Days', amount: Number(agingSummary.days_61_90 || 0), fill: '#f97316' },
    { bracket: '90+ Days (Critical)', amount: Number(agingSummary.days_over_90 || 0), fill: '#ef4444' },
  ];

  // Export handlers
  const handleExportCsv = () => {
    const exportColumns = [
      { label: 'Invoice Number', key: 'invoice_number' },
      { label: 'Invoice Date', key: 'invoice_date' },
      { label: 'Due Date', key: 'due_date' },
      { label: 'Project Name', key: 'project_name' },
      { label: 'Customer Name', key: 'customer_name' },
      { label: 'Total Amount (₹)', key: 'total_amount' },
      { label: 'Paid Amount (₹)', key: 'paid_amount' },
      { label: 'Balance Due (₹)', key: 'balance_due' },
      { label: 'Days Overdue', key: 'days_overdue' },
      { label: 'Status', key: 'status' },
    ];

    exportReportToCSV({
      title: 'Accounts Receivable Invoice Register & Aging Report',
      subtitle: 'Outstanding customer receivables categorised by age brackets',
      filename: 'invoice_aging_report',
      columns: exportColumns,
      data: filteredInvoices,
      summaryMetrics: [
        { label: 'Total Receivables', value: `₹${Number(agingSummary.total_outstanding || 0).toLocaleString('en-IN')}` },
        { label: 'Current / Not Due', value: `₹${Number(agingSummary.current || 0).toLocaleString('en-IN')}` },
        { label: '1–30 Days Overdue', value: `₹${Number(agingSummary.days_1_30 || 0).toLocaleString('en-IN')}` },
        { label: '31–60 Days Overdue', value: `₹${Number(agingSummary.days_31_60 || 0).toLocaleString('en-IN')}` },
        { label: '90+ Days Critical', value: `₹${Number(agingSummary.days_over_90 || 0).toLocaleString('en-IN')}` },
      ],
      filtersApplied: {
        Project: projects.find((p) => String(p.id) === String(selectedProject))?.name || 'All Projects',
        Customer: customers.find((c) => String(c.id) === String(selectedCustomer))?.name || 'All Customers',
        'Aging Bracket': selectedAgingBracket || 'All Aging Brackets',
      },
    });
  };

  const handlePrintPdf = () => {
    printReport({
      title: 'Invoice Aging & Receivables Report',
      subtitle: 'Generated from PMS Real-Time Database',
      filename: 'invoice_aging_report',
      columns: [
        { label: 'Invoice #', key: 'invoice_number' },
        { label: 'Customer', key: 'customer_name' },
        { label: 'Project', key: 'project_name' },
        { label: 'Due Date', key: 'due_date' },
        { label: 'Total (₹)', accessor: (r: any) => `₹${Number(r.total_amount || 0).toLocaleString('en-IN')}` },
        { label: 'Balance (₹)', accessor: (r: any) => `₹${Number(r.balance_due || 0).toLocaleString('en-IN')}` },
        { label: 'Days Overdue', key: 'days_overdue' },
      ],
      data: filteredInvoices,
      summaryMetrics: [
        { label: 'Total Outstanding', value: `₹${Number(agingSummary.total_outstanding || 0).toLocaleString('en-IN')}` },
        { label: 'Critical 90+', value: `₹${Number(agingSummary.days_over_90 || 0).toLocaleString('en-IN')}` },
      ],
    });
  };

  const criticalOverdue = Number(agingSummary.days_over_90 || 0) + Number(agingSummary.days_61_90 || 0);

  return (
    <div className="page-body">
      {/* 1. Header with Filters & Working Export Actions */}
      <ReportHeader
        title="Invoice Register & Aging Report"
        subtitle="Accounts receivable aging schedule, payment collection velocity, and overdue invoice tracking."
        icon={Receipt}
        badgeText="Receivables Aging"
        onResetFilters={resetFilters}
        onExportCsv={handleExportCsv}
        onPrintPdf={handlePrintPdf}
        filters={[
          {
            key: 'project',
            label: 'Filter by Project',
            type: 'select',
            value: selectedProject,
            onChange: setSelectedProject,
            options: [
              { value: '', label: 'All Projects' },
              ...projects.map((p) => ({ value: String(p.id), label: p.name })),
            ],
          },
          {
            key: 'customer',
            label: 'Filter by Customer',
            type: 'select',
            value: selectedCustomer,
            onChange: setSelectedCustomer,
            options: [
              { value: '', label: 'All Customers' },
              ...customers.map((c) => ({ value: String(c.id), label: c.name })),
            ],
          },
          {
            key: 'bracket',
            label: 'Aging Bracket',
            type: 'select',
            value: selectedAgingBracket,
            onChange: setSelectedAgingBracket,
            options: [
              { value: '', label: 'All Brackets' },
              { value: 'current', label: 'Current (< Due Date)' },
              { value: '1-30', label: '1–30 Days Overdue' },
              { value: '31-60', label: '31–60 Days Overdue' },
              { value: '61-90', label: '61–90 Days Overdue' },
              { value: '90+', label: '90+ Days (Critical)' },
            ],
          },
        ]}
      />

      {/* 2. 5 Key Summary Metric Cards */}
      <ReportSummaryCards
        cards={[
          {
            title: 'Total Receivables',
            value: `₹${Number(agingSummary.total_outstanding || 0).toLocaleString('en-IN')}`,
            subtitle: `${invoices.length} outstanding invoices`,
            icon: Receipt,
            variant: 'primary',
          },
          {
            title: 'Current (Not Due)',
            value: `₹${Number(agingSummary.current || 0).toLocaleString('en-IN')}`,
            subtitle: 'Within agreed credit terms',
            icon: CheckCircle2,
            variant: 'success',
          },
          {
            title: '1–30 Days Overdue',
            value: `₹${Number(agingSummary.days_1_30 || 0).toLocaleString('en-IN')}`,
            subtitle: 'Standard follow-up window',
            icon: Clock,
            variant: 'info',
          },
          {
            title: '31–60 Days Overdue',
            value: `₹${Number(agingSummary.days_31_60 || 0).toLocaleString('en-IN')}`,
            subtitle: 'Requires active escalation',
            icon: AlertTriangle,
            variant: 'warning',
          },
          {
            title: '90+ Days Critical',
            value: `₹${Number(agingSummary.days_over_90 || 0).toLocaleString('en-IN')}`,
            subtitle: 'High collection risk',
            icon: AlertTriangle,
            variant: Number(agingSummary.days_over_90 || 0) > 0 ? 'danger' : 'neutral',
            trendText: Number(agingSummary.days_over_90 || 0) > 0 ? 'High Risk' : 'Zero Critical',
            trendType: Number(agingSummary.days_over_90 || 0) > 0 ? 'negative' : 'positive',
          },
        ]}
      />

      {/* 3. Purposeful Aging Distribution Chart */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Receivables Aging Schedule Breakdown
          </h3>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Distribution of pending balances by days elapsed since invoice due date
          </p>
        </div>
        <div style={{ height: '260px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis dataKey="bracket" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
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
                formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Outstanding']}
              />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Detailed Invoice Register Table */}
      <div
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
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Outstanding Customer Invoices
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Individual invoices with payment progress and days overdue
            </p>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {filteredInvoices.length} invoices
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading invoices...
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No invoices matching the selected aging criteria.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Invoice #</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Customer</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Project</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Due Date</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Total (₹)</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Paid (₹)</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Balance (₹)</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Aging Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => {
                  const days = Number(inv.days_overdue || 0);
                  const isCritical = days > 60;
                  const isOverdue = days > 0;

                  return (
                    <tr
                      key={inv.invoice_id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(150, 150, 150, 0.04)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {inv.invoice_number || `INV-${inv.invoice_id}`}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-primary)' }}>
                        {inv.customer_name || 'Customer'}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>
                        {inv.project_name || 'Project'}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>
                        {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '-'}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-primary)' }}>
                        ₹{Number(inv.total_amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: '#10b981' }}>
                        ₹{Number(inv.paid_amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 700, color: '#ef4444' }}>
                        ₹{Number(inv.balance_due || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                        <Badge variant={isCritical ? 'danger' : isOverdue ? 'warning' : 'success'}>
                          {isOverdue ? `${days}d Overdue` : 'Current'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Summary & Recommended Next Actions */}
      <ReportActionFooter
        situation={`Total accounts receivable balance is ₹${Number(agingSummary.total_outstanding || 0).toLocaleString('en-IN')} across ${invoices.length} invoices. Of this, ₹${Number(agingSummary.current || 0).toLocaleString('en-IN')} is within normal credit terms, and ₹${(Number(agingSummary.total_outstanding || 0) - Number(agingSummary.current || 0)).toLocaleString('en-IN')} is overdue.`}
        completedSummary={`Invoices in current status are being honored within the agreed credit cycle.`}
        pendingSummary={`₹${criticalOverdue.toLocaleString('en-IN')} in invoices overdue beyond 60 days.`}
        alerts={
          criticalOverdue > 0
            ? [
                {
                  text: `₹${criticalOverdue.toLocaleString('en-IN')} is severely overdue (>60 days), presenting cashflow recovery risk.`,
                  severity: 'danger',
                },
              ]
            : []
        }
        recommendations={[
          criticalOverdue > 0
            ? 'Prioritize collection calls and formal payment demand notices for accounts with >60-day aging balances.'
            : 'Receivables aging is well managed with low overdue exposure.',
          'Verify with clients if any deductions, TDS certificates, or retention milestones affect invoice clearance.',
        ]}
      />
    </div>
  );
};
