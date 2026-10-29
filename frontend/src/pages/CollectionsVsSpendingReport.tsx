import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Receipt,
  FilePlus,
  AlertTriangle,
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
  Legend,
} from 'recharts';

export const CollectionsVsSpendingReport: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedProject, startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const projRes = await apiService.get<any[]>('/projects');
      if (projRes.data) {
        setProjects(projRes.data.map((p) => ({ id: p.project_id, name: p.project_name })));
      }

      const res = await apiService.get<any>('/reports/collections-vs-spending', {
        project_id: selectedProject || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });

      if (res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Error fetching collections vs spending:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setSelectedProject('');
    setStartDate('');
    setEndDate('');
  };

  const inflows = data?.inflows || { total_collected: 0, payments: [] };
  const outflows = data?.outflows || { total_outflow: 0, labour_paid: 0, materials_used: 0, equipment_cost: 0, vendor_invoices_paid: 0 };
  const netCash = Number(inflows.total_collected || 0) - Number(outflows.total_outflow || 0);
  const liabilities = Number(data?.liabilities?.unpaid_vendor_invoices || 0);

  // Chart data
  const chartData = [
    { name: 'Customer Collections', Amount: Number(inflows.total_collected || 0), fill: '#10b981' },
    { name: 'Recognized Outflows', Amount: Number(outflows.total_outflow || 0), fill: '#f59e0b' },
    { name: 'Vendor Liabilities', Amount: liabilities, fill: '#ef4444' },
    { name: 'Net Cash Position', Amount: netCash, fill: netCash >= 0 ? '#6366f1' : '#ec4899' },
  ];

  // Export handlers
  const handleExportCsv = () => {
    const paymentRows = inflows.payments || [];
    const exportColumns = [
      { label: 'Payment ID', key: 'payment_id' },
      { label: 'Payment Date', key: 'payment_date' },
      { label: 'Project Name', key: 'project_name' },
      { label: 'Customer Name', key: 'customer_name' },
      { label: 'Amount (₹)', key: 'amount' },
      { label: 'Payment Method', key: 'payment_method' },
      { label: 'Reference Number', key: 'reference_number' },
    ];

    exportReportToCSV({
      title: 'Customer Collections vs. Spending Report',
      subtitle: 'Realized cash inflows, categorized spending, and net liquidity analysis',
      filename: 'collections_vs_spending_report',
      columns: exportColumns,
      data: paymentRows,
      summaryMetrics: [
        { label: 'Verified Collections', value: `₹${Number(inflows.total_collected || 0).toLocaleString('en-IN')}` },
        { label: 'Total Spending', value: `₹${Number(outflows.total_outflow || 0).toLocaleString('en-IN')}` },
        { label: 'Net Cash Position', value: `₹${netCash.toLocaleString('en-IN')}` },
        { label: 'Vendor Liabilities', value: `₹${liabilities.toLocaleString('en-IN')}` },
      ],
      filtersApplied: {
        Project: projects.find((p) => String(p.id) === String(selectedProject))?.name || 'All Projects',
        'Date Range': startDate && endDate ? `${startDate} to ${endDate}` : 'All Dates',
      },
    });
  };

  const handlePrintPdf = () => {
    printReport({
      title: 'Customer Collections vs. Spending Report',
      subtitle: 'Generated from PMS Real-Time Database',
      filename: 'collections_vs_spending_report',
      columns: [
        { label: 'Date', key: 'payment_date' },
        { label: 'Project', key: 'project_name' },
        { label: 'Customer', key: 'customer_name' },
        { label: 'Amount (₹)', accessor: (r: any) => `₹${Number(r.amount || 0).toLocaleString('en-IN')}` },
        { label: 'Method', key: 'payment_method' },
        { label: 'Ref #', key: 'reference_number' },
      ],
      data: inflows.payments || [],
      summaryMetrics: [
        { label: 'Collections', value: `₹${Number(inflows.total_collected || 0).toLocaleString('en-IN')}` },
        { label: 'Spending', value: `₹${Number(outflows.total_outflow || 0).toLocaleString('en-IN')}` },
        { label: 'Net Cash', value: `₹${netCash.toLocaleString('en-IN')}` },
      ],
    });
  };

  return (
    <div className="page-body">
      {/* 1. Header with Filters & Working Export Actions */}
      <ReportHeader
        title="Customer Collections vs. Spending Report"
        subtitle="Audited cash inflows from verified receipts against actual labor, material, and vendor disbursements."
        icon={Wallet}
        badgeText="Cashflow & Liquidity"
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
            key: 'from',
            label: 'From Date',
            type: 'date',
            value: startDate,
            onChange: setStartDate,
          },
          {
            key: 'to',
            label: 'To Date',
            type: 'date',
            value: endDate,
            onChange: setEndDate,
          },
        ]}
      />

      {/* 2. 5 Key Summary Metric Cards */}
      <ReportSummaryCards
        cards={[
          {
            title: 'Verified Inflows',
            value: `₹${Number(inflows.total_collected || 0).toLocaleString('en-IN')}`,
            subtitle: `${(inflows.payments || []).length} payment receipts cleared`,
            icon: ArrowDownRight,
            variant: 'success',
          },
          {
            title: 'Recognized Outflows',
            value: `₹${Number(outflows.total_outflow || 0).toLocaleString('en-IN')}`,
            subtitle: 'Labour, materials, and vendor payments',
            icon: ArrowUpRight,
            variant: 'warning',
          },
          {
            title: 'Net Cash Position',
            value: `${netCash >= 0 ? '+' : ''}₹${netCash.toLocaleString('en-IN')}`,
            subtitle: netCash >= 0 ? 'Surplus cash available' : 'Funding deficit detected',
            icon: netCash >= 0 ? TrendingUp : TrendingDown,
            variant: netCash >= 0 ? 'success' : 'danger',
            trendText: netCash >= 0 ? 'Cash Positive' : 'Deficit',
            trendType: netCash >= 0 ? 'positive' : 'negative',
          },
          {
            title: 'Pending Supplier Liabilities',
            value: `₹${liabilities.toLocaleString('en-IN')}`,
            subtitle: 'Unpaid vendor invoices & commitments',
            icon: FilePlus,
            variant: liabilities > 0 ? 'danger' : 'neutral',
          },
          {
            title: 'Net Funding Health',
            value: netCash - liabilities >= 0 ? 'Fully Funded' : 'Shortfall',
            subtitle: `Net buffer: ₹${(netCash - liabilities).toLocaleString('en-IN')}`,
            icon: Building2,
            variant: netCash - liabilities >= 0 ? 'primary' : 'danger',
          },
        ]}
      />

      {/* 3. Purposeful Comparison Chart */}
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
            Cashflow & Liquidity Balance Breakdown
          </h3>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Collections received vs. Recognized disbursements vs. Outstanding vendor commitments
          </p>
        </div>
        <div style={{ height: '260px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
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
                formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']}
              />
              <Bar dataKey="Amount" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Detailed Recent Payment Inflow Register */}
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
              Verified Customer Payment Inflow Register
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Individual receipts credited to projects
            </p>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {(inflows.payments || []).length} receipts
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading receipts data...
          </div>
        ) : (inflows.payments || []).length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No customer payment receipts recorded for the selected period.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Payment Date</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Project Name</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Customer</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Amount (₹)</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Method</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Reference #</th>
                </tr>
              </thead>
              <tbody>
                {(inflows.payments || []).map((p: any) => (
                  <tr
                    key={p.payment_id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(150, 150, 150, 0.04)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-primary)' }}>
                      {p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '-'}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {p.project_name || 'Project'}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>
                      {p.customer_name || 'Customer'}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 700, color: '#10b981' }}>
                      ₹{Number(p.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                      <Badge variant="info">{p.payment_method || 'Bank Transfer'}</Badge>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>
                      {p.reference_number || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Summary & Recommended Next Actions */}
      <ReportActionFooter
        situation={`Realized cash inflows stand at ₹${Number(inflows.total_collected || 0).toLocaleString('en-IN')}, against recognized project disbursements of ₹${Number(outflows.total_outflow || 0).toLocaleString('en-IN')}. Net cash balance is ${netCash >= 0 ? '+' : ''}₹${netCash.toLocaleString('en-IN')}.`}
        completedSummary={`₹${Number(inflows.total_collected || 0).toLocaleString('en-IN')} collected and verified across ${(inflows.payments || []).length} payment receipts.`}
        pendingSummary={`₹${liabilities.toLocaleString('en-IN')} in unpaid vendor liabilities committed on active purchase orders.`}
        alerts={
          netCash < 0
            ? [
                {
                  text: `Cashflow deficit of ₹${Math.abs(netCash).toLocaleString('en-IN')}. Inflows have not caught up with project expenditures.`,
                  severity: 'danger',
                },
              ]
            : liabilities > netCash
            ? [
                {
                  text: `Supplier liabilities (₹${liabilities.toLocaleString('en-IN')}) exceed current net cash buffer (₹${netCash.toLocaleString('en-IN')}).`,
                  severity: 'warning',
                },
              ]
            : []
        }
        recommendations={[
          netCash < 0
            ? 'Expedite overdue invoice collections to cover operational disbursements.'
            : 'Liquidity is healthy and sufficient to meet operational requirements.',
          'Schedule payments for verified GRNs according to agreed vendor payment terms.',
        ]}
      />
    </div>
  );
};
