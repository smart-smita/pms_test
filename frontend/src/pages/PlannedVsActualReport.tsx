import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Scale,
  Clock,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Building2,
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
  Legend,
} from 'recharts';

interface PlannedVsActualRow {
  project_id?: number;
  project_name: string;
  wbs_name: string;
  task_id?: number;
  task_name: string;
  planned_labour_hours: number;
  actual_labour_hours: number;
  hour_variance: number;
  planned_labour_cost: number;
  actual_labour_cost: number;
  labour_cost_variance: number;
  planned_material_cost: number;
  actual_material_cost: number;
  material_cost_variance: number;
  planned_total_cost: number;
  actual_total_cost: number;
  total_variance: number;
}

export const PlannedVsActualReport: React.FC = () => {
  const [data, setData] = useState<PlannedVsActualRow[]>([]);
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [varianceFilter, setVarianceFilter] = useState<string>('');
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

      const res = await apiService.get<PlannedVsActualRow[]>('/reports/planned-vs-actual', {
        project_id: selectedProject || undefined,
      });

      if (res.data) {
        setData(res.data);
      }
    } catch (error) {
      console.error('Error fetching planned vs actual report:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setSelectedProject('');
    setVarianceFilter('');
  };

  // Filter by variance status if chosen
  const filteredData = useMemo(() => {
    if (!varianceFilter) return data;
    return data.filter((r) => {
      const variance = Number(r.total_variance || 0);
      if (varianceFilter === 'overrun') return variance < 0;
      if (varianceFilter === 'savings') return variance > 0;
      if (varianceFilter === 'on_budget') return variance === 0;
      return true;
    });
  }, [data, varianceFilter]);

  // Executive summary calculations
  const totalPlannedCost = useMemo(() => filteredData.reduce((acc, r) => acc + Number(r.planned_total_cost || 0), 0), [filteredData]);
  const totalActualCost = useMemo(() => filteredData.reduce((acc, r) => acc + Number(r.actual_total_cost || 0), 0), [filteredData]);
  const totalCostVariance = totalPlannedCost - totalActualCost; // positive = savings, negative = overrun
  const totalPlannedHours = useMemo(() => filteredData.reduce((acc, r) => acc + Number(r.planned_labour_hours || 0), 0), [filteredData]);
  const totalActualHours = useMemo(() => filteredData.reduce((acc, r) => acc + Number(r.actual_labour_hours || 0), 0), [filteredData]);
  const totalHourVariance = totalPlannedHours - totalActualHours;

  // Chart data: Group by WBS / Discipline for high-level comparison
  const chartData = useMemo(() => {
    const wbsMap: Record<string, { planned: number; actual: number }> = {};
    filteredData.forEach((r) => {
      const name = r.wbs_name || 'General';
      if (!wbsMap[name]) wbsMap[name] = { planned: 0, actual: 0 };
      wbsMap[name].planned += Number(r.planned_total_cost || 0);
      wbsMap[name].actual += Number(r.actual_total_cost || 0);
    });

    return Object.entries(wbsMap).map(([name, val]) => ({
      name: name.length > 16 ? `${name.substring(0, 14)}...` : name,
      Planned: Math.round(val.planned),
      Actual: Math.round(val.actual),
    }));
  }, [filteredData]);

  // Overrun items for alert analysis
  const overrunItems = filteredData.filter((r) => Number(r.total_variance || 0) < 0 || Number(r.hour_variance || 0) < 0);

  // Export handlers
  const handleExportCsv = () => {
    const exportColumns = [
      { label: 'Project Name', key: 'project_name' },
      { label: 'WBS Discipline', key: 'wbs_name' },
      { label: 'Task Name', key: 'task_name' },
      { label: 'Planned Labour Hours', key: 'planned_labour_hours' },
      { label: 'Actual Labour Hours', key: 'actual_labour_hours' },
      { label: 'Hour Variance', key: 'hour_variance' },
      { label: 'Planned Cost (₹)', key: 'planned_total_cost' },
      { label: 'Actual Cost (₹)', key: 'actual_total_cost' },
      { label: 'Cost Variance (₹)', key: 'total_variance' },
    ];

    exportReportToCSV({
      title: 'Planned vs Actual Cost & Hours Report',
      subtitle: 'Execution variance analysis at project, WBS, and task level',
      filename: 'planned_vs_actual_report',
      columns: exportColumns,
      data: filteredData,
      summaryMetrics: [
        { label: 'Total Planned Cost', value: `₹${totalPlannedCost.toLocaleString('en-IN')}` },
        { label: 'Total Actual Cost', value: `₹${totalActualCost.toLocaleString('en-IN')}` },
        { label: 'Total Variance', value: `₹${totalCostVariance.toLocaleString('en-IN')}` },
        { label: 'Planned Hours', value: `${totalPlannedHours}h` },
        { label: 'Actual Hours', value: `${totalActualHours}h` },
      ],
      filtersApplied: {
        Project: projects.find((p) => String(p.id) === String(selectedProject))?.name || 'All Projects',
        Variance: varianceFilter || 'All Records',
      },
    });
  };

  const handlePrintPdf = () => {
    const printColumns = [
      { label: 'Project', key: 'project_name' },
      { label: 'Discipline', key: 'wbs_name' },
      { label: 'Task', key: 'task_name' },
      { label: 'Plan Hrs', key: 'planned_labour_hours' },
      { label: 'Act Hrs', key: 'actual_labour_hours' },
      { label: 'Plan Cost (₹)', accessor: (r: any) => `₹${Number(r.planned_total_cost || 0).toLocaleString('en-IN')}` },
      { label: 'Act Cost (₹)', accessor: (r: any) => `₹${Number(r.actual_total_cost || 0).toLocaleString('en-IN')}` },
      { label: 'Variance (₹)', accessor: (r: any) => `₹${Number(r.total_variance || 0).toLocaleString('en-IN')}` },
    ];

    printReport({
      title: 'Planned vs Actual Execution Variance Report',
      subtitle: 'Generated from PMS Real-Time Database',
      filename: 'planned_vs_actual_report',
      columns: printColumns,
      data: filteredData,
      summaryMetrics: [
        { label: 'Planned Cost', value: `₹${totalPlannedCost.toLocaleString('en-IN')}` },
        { label: 'Actual Cost', value: `₹${totalActualCost.toLocaleString('en-IN')}` },
        { label: 'Cost Variance', value: `₹${totalCostVariance.toLocaleString('en-IN')}` },
      ],
    });
  };

  return (
    <div className="page-body">
      {/* 1. Header with Filters & Working Export Actions */}
      <ReportHeader
        title="Planned vs. Actual Budget Report"
        subtitle="Task-level budget execution, labor hour variances, and material cost discrepancies."
        icon={Layers}
        badgeText="Budget Variance"
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
            key: 'variance',
            label: 'Variance Status',
            type: 'select',
            value: varianceFilter,
            onChange: setVarianceFilter,
            options: [
              { value: '', label: 'All Tasks' },
              { value: 'overrun', label: 'Over Budget / Negative Variance' },
              { value: 'savings', label: 'Under Budget / Savings' },
              { value: 'on_budget', label: 'Exact Match' },
            ],
          },
        ]}
      />

      {/* 2. 5 Key Summary Metric Cards */}
      <ReportSummaryCards
        cards={[
          {
            title: 'Planned Budget Cost',
            value: `₹${totalPlannedCost.toLocaleString('en-IN')}`,
            subtitle: `${filteredData.length} tasks analyzed`,
            icon: Scale,
            variant: 'primary',
          },
          {
            title: 'Actual Executed Cost',
            value: `₹${totalActualCost.toLocaleString('en-IN')}`,
            subtitle: 'Labour + Materials recognized',
            icon: Building2,
            variant: 'info',
          },
          {
            title: 'Cost Variance',
            value: `${totalCostVariance >= 0 ? '+' : ''}₹${totalCostVariance.toLocaleString('en-IN')}`,
            subtitle: totalCostVariance >= 0 ? 'Cost savings against plan' : 'Budget overrun detected',
            icon: totalCostVariance >= 0 ? TrendingUp : TrendingDown,
            variant: totalCostVariance >= 0 ? 'success' : 'danger',
            trendText: totalCostVariance >= 0 ? 'Under budget' : 'Over budget',
            trendType: totalCostVariance >= 0 ? 'positive' : 'negative',
          },
          {
            title: 'Planned Labour Effort',
            value: `${totalPlannedHours} hrs`,
            subtitle: 'Baseline estimated hours',
            icon: Clock,
            variant: 'neutral',
          },
          {
            title: 'Actual Hours Logged',
            value: `${totalActualHours} hrs`,
            subtitle: `Variance: ${totalHourVariance >= 0 ? `-${totalHourVariance}h saved` : `+${Math.abs(totalHourVariance)}h excess`}`,
            icon: Clock,
            variant: totalHourVariance >= 0 ? 'success' : 'warning',
            trendText: totalHourVariance >= 0 ? 'Within hours plan' : 'Excess hours',
            trendType: totalHourVariance >= 0 ? 'positive' : 'negative',
          },
        ]}
      />

      {/* 3. Purposeful Visual Variance Chart */}
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
              Discipline Cost Execution: Planned vs. Actual
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              High-level comparison across WBS packages in the selected project(s)
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
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="Planned" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Actual" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 4. Detailed Variance Table */}
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
              Task-Level Cost & Labour Variance Audit
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Identifies exact variance source (hours vs materials)
            </p>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {filteredData.length} task records
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading variance records...
          </div>
        ) : filteredData.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No task records match the current filters.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Project Name</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', color: 'var(--text-secondary)' }}>WBS / Discipline</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Task Name</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Plan Hrs</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Act Hrs</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Hour Var</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Plan Cost (₹)</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Act Cost (₹)</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Cost Var (₹)</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((r, idx) => {
                  const costVar = Number(r.total_variance || 0);
                  const isOver = costVar < 0;
                  const isUnder = costVar > 0;

                  return (
                    <tr
                      key={idx}
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
                        {r.wbs_name}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-primary)' }}>
                        {r.task_name}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {r.planned_labour_hours}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-primary)' }}>
                        {r.actual_labour_hours}
                      </td>
                      <td
                        style={{
                          padding: '0.75rem 0.5rem',
                          textAlign: 'right',
                          fontWeight: 600,
                          color: Number(r.hour_variance || 0) < 0 ? '#ef4444' : '#10b981',
                        }}
                      >
                        {r.hour_variance}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-primary)' }}>
                        ₹{Number(r.planned_total_cost || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-primary)' }}>
                        ₹{Number(r.actual_total_cost || 0).toLocaleString('en-IN')}
                      </td>
                      <td
                        style={{
                          padding: '0.75rem 0.5rem',
                          textAlign: 'right',
                          fontWeight: 700,
                          color: isOver ? '#ef4444' : isUnder ? '#10b981' : 'var(--text-primary)',
                        }}
                      >
                        {isUnder ? '+' : ''}₹{costVar.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                        <Badge variant={isOver ? 'danger' : isUnder ? 'success' : 'info'}>
                          {isOver ? 'Over Budget' : isUnder ? 'Under Budget' : 'On Plan'}
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
        situation={`Audited ${filteredData.length} tasks. Planned budget is ₹${totalPlannedCost.toLocaleString('en-IN')}, and actual recognized cost is ₹${totalActualCost.toLocaleString('en-IN')}, resulting in a net variance of ${totalCostVariance >= 0 ? '+' : ''}₹${totalCostVariance.toLocaleString('en-IN')}.`}
        completedSummary={`${filteredData.filter((r) => Number(r.total_variance || 0) >= 0).length} tasks executed at or below allocated budget.`}
        pendingSummary={`${filteredData.filter((r) => Number(r.total_variance || 0) < 0).length} tasks exceeding baseline cost estimates.`}
        alerts={
          overrunItems.length > 0
            ? [
                {
                  text: `${overrunItems.length} tasks show negative cost or hour variances.`,
                  severity: 'warning',
                },
              ]
            : []
        }
        recommendations={[
          overrunItems.length > 0
            ? 'Investigate whether cost overruns are caused by overtime labor or unbudgeted materials consumption.'
            : 'Execution is closely tracking initial quotation and budget baselines.',
          'Review resource utilization with project leads during the weekly PMS review meeting.',
        ]}
      />
    </div>
  );
};
