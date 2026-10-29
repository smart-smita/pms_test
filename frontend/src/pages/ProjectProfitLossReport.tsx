import React, { useState, useEffect, useMemo } from 'react';
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Building2,
  DollarSign,
  Wallet,
  Receipt,
  Scale,
  ArrowRight,
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

interface ProjectProfitLossRow {
  project_id: number;
  project_name: string;
  customer_name?: string;
  contract_value: number;
  invoice_value: number;
  collected_value: number;
  planned_cost: number;
  actual_labour_cost: number;
  actual_material_cost: number;
  actual_equipment_cost?: number;
  actual_vendor_cost?: number;
  total_actual_cost: number;
  profit_loss: number;
  profit_margin_percentage: number;
}

export const ProjectProfitLossReport: React.FC = () => {
  const [data, setData] = useState<ProjectProfitLossRow[]>([]);
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedProject]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const projRes = await apiService.get<any[]>('/projects');
      if (projRes.data) {
        setProjects(projRes.data.map((p) => ({ id: p.project_id, name: p.project_name })));
      }

      const res = await apiService.get<ProjectProfitLossRow[]>('/reports/project-profit-loss', {
        project_id: selectedProject || undefined,
      });

      if (res.data) {
        setData(res.data);
      }
    } catch (error) {
      console.error('Error fetching P&L report:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setSelectedProject('');
  };

  // Executive summary calculations
  const totalContract = useMemo(() => data.reduce((acc, r) => acc + Number(r.contract_value || 0), 0), [data]);
  const totalInvoiced = useMemo(() => data.reduce((acc, r) => acc + Number(r.invoice_value || 0), 0), [data]);
  const totalCollected = useMemo(() => data.reduce((acc, r) => acc + Number(r.collected_value || 0), 0), [data]);
  const totalCost = useMemo(() => data.reduce((acc, r) => acc + Number(r.total_actual_cost || 0), 0), [data]);
  const totalProfit = useMemo(() => data.reduce((acc, r) => acc + Number(r.profit_loss || 0), 0), [data]);
  const overallMargin = totalInvoiced > 0 ? Math.round((totalProfit / totalInvoiced) * 100) : 0;

  // Visual chart data
  const chartData = useMemo(() => {
    return data.map((r) => ({
      name: (r.project_name || 'Project').length > 15 ? `${r.project_name.substring(0, 13)}...` : r.project_name,
      Invoiced: Number(r.invoice_value || 0),
      Collected: Number(r.collected_value || 0),
      Cost: Number(r.total_actual_cost || 0),
      Margin: Number(r.profit_loss || 0),
    }));
  }, [data]);

  // Export handlers
  const handleExportCsv = () => {
    const exportColumns = [
      { label: 'Project Name', key: 'project_name' },
      { label: 'Customer', key: 'customer_name' },
      { label: 'Contract Value (₹)', accessor: (r: any) => Number(r.contract_value || 0) },
      { label: 'Invoiced Value (₹)', accessor: (r: any) => Number(r.invoice_value || 0) },
      { label: 'Cash Collected (₹)', accessor: (r: any) => Number(r.collected_value || 0) },
      { label: 'Labour Cost (₹)', accessor: (r: any) => Number(r.actual_labour_cost || 0) },
      { label: 'Material Cost (₹)', accessor: (r: any) => Number(r.actual_material_cost || 0) },
      { label: 'Total Recognized Cost (₹)', accessor: (r: any) => Number(r.total_actual_cost || 0) },
      { label: 'Net Profit/Loss (₹)', accessor: (r: any) => Number(r.profit_loss || 0) },
      { label: 'Margin %', accessor: (r: any) => `${r.profit_margin_percentage || 0}%` },
    ];

    exportReportToCSV({
      title: 'Project Profit & Loss Report',
      subtitle: 'Complete revenue, recognized costs, and net margin analytics',
      filename: 'project_profit_loss_report',
      columns: exportColumns,
      data,
      summaryMetrics: [
        { label: 'Total Contract Value', value: `₹${totalContract.toLocaleString('en-IN')}` },
        { label: 'Total Invoiced', value: `₹${totalInvoiced.toLocaleString('en-IN')}` },
        { label: 'Cash Collected', value: `₹${totalCollected.toLocaleString('en-IN')}` },
        { label: 'Total Cost Recognized', value: `₹${totalCost.toLocaleString('en-IN')}` },
        { label: 'Net Profit/Loss', value: `₹${totalProfit.toLocaleString('en-IN')} (${overallMargin}%)` },
      ],
      filtersApplied: {
        Project: projects.find((p) => String(p.id) === String(selectedProject))?.name || 'All Projects',
      },
    });
  };

  const handlePrintPdf = () => {
    const printColumns = [
      { label: 'Project', key: 'project_name' },
      { label: 'Customer', key: 'customer_name' },
      { label: 'Contract (₹)', accessor: (r: any) => `₹${Number(r.contract_value || 0).toLocaleString('en-IN')}` },
      { label: 'Invoiced (₹)', accessor: (r: any) => `₹${Number(r.invoice_value || 0).toLocaleString('en-IN')}` },
      { label: 'Collected (₹)', accessor: (r: any) => `₹${Number(r.collected_value || 0).toLocaleString('en-IN')}` },
      { label: 'Cost (₹)', accessor: (r: any) => `₹${Number(r.total_actual_cost || 0).toLocaleString('en-IN')}` },
      { label: 'Margin (₹)', accessor: (r: any) => `₹${Number(r.profit_loss || 0).toLocaleString('en-IN')} (${r.profit_margin_percentage}%)` },
    ];

    printReport({
      title: 'Project Profit & Loss Report',
      subtitle: 'Generated from PMS Real-Time Database',
      filename: 'project_profit_loss_report',
      columns: printColumns,
      data,
      summaryMetrics: [
        { label: 'Contract Value', value: `₹${totalContract.toLocaleString('en-IN')}` },
        { label: 'Total Invoiced', value: `₹${totalInvoiced.toLocaleString('en-IN')}` },
        { label: 'Cash Collected', value: `₹${totalCollected.toLocaleString('en-IN')}` },
        { label: 'Total Cost', value: `₹${totalCost.toLocaleString('en-IN')}` },
        { label: 'Net Profit', value: `₹${totalProfit.toLocaleString('en-IN')}` },
      ],
    });
  };

  // Flag loss-making projects
  const lossMaking = data.filter((r) => Number(r.profit_loss || 0) < 0);
  const uncollected = totalInvoiced - totalCollected;

  return (
    <div className="page-body">
      {/* 1. Header with Filters & Working Export Actions */}
      <ReportHeader
        title="Project Profit & Loss Report"
        subtitle="Audited financial margins based on verified invoice payments and full labor & material costs."
        icon={IndianRupee}
        badgeText="Financial Health"
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
        ]}
      />

      {/* 2. 5 Key Summary Metric Cards */}
      <ReportSummaryCards
        cards={[
          {
            title: 'Total Contract Value',
            value: `₹${totalContract.toLocaleString('en-IN')}`,
            subtitle: `${data.length} projects analyzed`,
            icon: Building2,
            variant: 'primary',
          },
          {
            title: 'Billed Invoices',
            value: `₹${totalInvoiced.toLocaleString('en-IN')}`,
            subtitle: `${totalContract > 0 ? Math.round((totalInvoiced / totalContract) * 100) : 0}% of contract value billed`,
            icon: Receipt,
            variant: 'info',
          },
          {
            title: 'Verified Collections',
            value: `₹${totalCollected.toLocaleString('en-IN')}`,
            subtitle: `₹${Math.max(0, uncollected).toLocaleString('en-IN')} uncollected receivables`,
            icon: Wallet,
            variant: 'success',
            trendText: uncollected > 0 ? `₹${(uncollected / 1000).toFixed(0)}k pending` : 'Fully collected',
            trendType: uncollected > 0 ? 'negative' : 'positive',
          },
          {
            title: 'Total Recognized Cost',
            value: `₹${totalCost.toLocaleString('en-IN')}`,
            subtitle: 'Labour, Materials, Equipment & Vendors',
            icon: Scale,
            variant: 'warning',
          },
          {
            title: 'Net Profit / Loss',
            value: `₹${totalProfit.toLocaleString('en-IN')}`,
            subtitle: `Overall margin: ${overallMargin}%`,
            icon: totalProfit >= 0 ? TrendingUp : TrendingDown,
            variant: totalProfit >= 0 ? 'success' : 'danger',
            trendText: totalProfit >= 0 ? 'Profitable' : 'Loss Position',
            trendType: totalProfit >= 0 ? 'positive' : 'negative',
          },
        ]}
      />

      {/* 3. Purposeful Financial Comparison Chart */}
      {chartData.length > 0 && (
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
              Revenue Realization vs. Recognized Cost Breakdown
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Project-by-project comparison of billed revenue, collected cash, actual expenses, and net profit
            </p>
          </div>
          <div style={{ height: '280px', width: '100%' }}>
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
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="Invoiced" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Collected" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Cost" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Margin" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 4. Detailed Financial Table */}
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
              Project Financial Ledger & Margin Performance
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Detailed audit trail per project
            </p>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {data.length} records found
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading financial records...
          </div>
        ) : data.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No financial records available for the selected project.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Project Name</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Customer</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Contract (₹)</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Invoiced (₹)</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Collected (₹)</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Labour (₹)</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Material (₹)</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Total Cost (₹)</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Net Profit (₹)</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Margin %</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r) => {
                  const isProfit = Number(r.profit_loss || 0) >= 0;
                  return (
                    <tr
                      key={r.project_id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(150, 150, 150, 0.04)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {r.project_name}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>
                        {r.customer_name || 'Standard Client'}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 600 }}>
                        ₹{Number(r.contract_value || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-primary)' }}>
                        ₹{Number(r.invoice_value || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: '#10b981', fontWeight: 600 }}>
                        ₹{Number(r.collected_value || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
                        ₹{Number(r.actual_labour_cost || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
                        ₹{Number(r.actual_material_cost || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 600 }}>
                        ₹{Number(r.total_actual_cost || 0).toLocaleString('en-IN')}
                      </td>
                      <td
                        style={{
                          padding: '0.75rem 0.5rem',
                          textAlign: 'right',
                          fontWeight: 700,
                          color: isProfit ? '#10b981' : '#ef4444',
                        }}
                      >
                        {isProfit ? '+' : ''}₹{Number(r.profit_loss || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                        <Badge variant={isProfit ? 'success' : 'danger'}>
                          {r.profit_margin_percentage || 0}%
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
        situation={`Portfolio contract value is ₹${totalContract.toLocaleString('en-IN')} across ${data.length} projects. Total billed revenue is ₹${totalInvoiced.toLocaleString('en-IN')}, with verified collections of ₹${totalCollected.toLocaleString('en-IN')} against recognized actual costs of ₹${totalCost.toLocaleString('en-IN')}.`}
        completedSummary={`₹${totalCollected.toLocaleString('en-IN')} successfully collected and cleared in bank ledger.`}
        pendingSummary={`₹${Math.max(0, uncollected).toLocaleString('en-IN')} in outstanding receivables awaiting collection from customers.`}
        alerts={
          lossMaking.length > 0
            ? [
                {
                  text: `${lossMaking.length} project(s) are currently operating at a financial loss (e.g. ${lossMaking.map((p) => `"${p.project_name}"`).join(', ')}).`,
                  severity: 'danger',
                },
                ...(uncollected > 0
                  ? [{ text: `High outstanding receivables of ₹${uncollected.toLocaleString('en-IN')}.`, severity: 'warning' as const }]
                  : []),
              ]
            : uncollected > 0
            ? [{ text: `Receivables of ₹${uncollected.toLocaleString('en-IN')} are awaiting follow-up.`, severity: 'info' as const }]
            : []
        }
        recommendations={[
          uncollected > 0
            ? 'Issue payment reminders and follow up on pending customer invoices to reduce DSO.'
            : 'Maintain current invoicing cadence on ongoing project milestones.',
          lossMaking.length > 0
            ? 'Audit labor overtime and material requisition logs for projects with negative margins.'
            : 'Project margins are currently within expected profitability targets.',
          'Review upcoming procurement commitments before issuing further purchase orders.',
        ]}
      />
    </div>
  );
};
