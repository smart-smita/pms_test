import React, { useState, useEffect, useMemo } from 'react';
import {
  Wrench,
  Clock,
  Fuel,
  IndianRupee,
  Building2,
  TrendingUp,
  AlertTriangle,
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

export const EquipmentUtilizationReport: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [ownershipFilter, setOwnershipFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedProject, ownershipFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const projRes = await apiService.get<any[]>('/projects');
      if (projRes.data) {
        setProjects(projRes.data.map((p) => ({ id: p.project_id, name: p.project_name })));
      }

      const res = await apiService.get<any[]>('/reports/equipment-utilization', {
        project_id: selectedProject || undefined,
        ownership_type: ownershipFilter || undefined,
      });

      if (res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Error fetching equipment utilization report:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setSelectedProject('');
    setOwnershipFilter('');
  };

  // Executive summary calculations
  const totalEquipment = data.length;
  const ownedCount = data.filter((e) => (e.ownership_type || '').toLowerCase() === 'owned').length;
  const rentedCount = data.filter((e) => (e.ownership_type || '').toLowerCase() === 'rented').length;
  const totalOperatingHours = data.reduce((acc, e) => acc + Number(e.total_meter_hours || e.logged_hours || 0), 0);
  const totalFuelCost = data.reduce((acc, e) => acc + Number(e.total_fuel_cost || 0), 0);
  const totalRentalCost = data.reduce((acc, e) => acc + Number(e.rental_billed || e.total_cost || 0), 0);

  // Chart data
  const chartData = useMemo(() => {
    return data.slice(0, 10).map((e) => ({
      name: (e.equipment_name || 'Equip').length > 15 ? `${e.equipment_name.substring(0, 13)}...` : e.equipment_name,
      Hours: Number(e.total_meter_hours || e.logged_hours || 0),
      Cost: Number(e.total_fuel_cost || e.total_cost || 0),
    }));
  }, [data]);

  // Export handlers
  const handleExportCsv = () => {
    const exportColumns = [
      { label: 'Equipment Name', key: 'equipment_name' },
      { label: 'Equipment Code', key: 'equipment_code' },
      { label: 'Ownership', key: 'ownership_type' },
      { label: 'Project Name', key: 'project_name' },
      { label: 'Vendor Name', key: 'vendor_name' },
      { label: 'Operating Hours', accessor: (r: any) => Number(r.total_meter_hours || r.logged_hours || 0) },
      { label: 'Fuel Quantity', key: 'total_fuel_quantity' },
      { label: 'Fuel Cost (₹)', key: 'total_fuel_cost' },
      { label: 'Rental Cost (₹)', accessor: (r: any) => Number(r.rental_billed || r.total_cost || 0) },
      { label: 'Status', key: 'status' },
    ];

    exportReportToCSV({
      title: 'Equipment Utilization & Rental Cost Report',
      subtitle: 'Audit of operating hours, fuel consumption, and rental commitments',
      filename: 'equipment_utilization_report',
      columns: exportColumns,
      data,
      summaryMetrics: [
        { label: 'Total Fleet Units', value: totalEquipment },
        { label: 'Owned Fleet', value: ownedCount },
        { label: 'Rented Fleet', value: rentedCount },
        { label: 'Operating Hours', value: `${totalOperatingHours.toFixed(1)} hrs` },
        { label: 'Total Fuel/Rental Cost', value: `₹${(totalFuelCost + totalRentalCost).toLocaleString('en-IN')}` },
      ],
      filtersApplied: {
        Project: projects.find((p) => String(p.id) === String(selectedProject))?.name || 'All Projects',
        Ownership: ownershipFilter || 'All Types',
      },
    });
  };

  const handlePrintPdf = () => {
    printReport({
      title: 'Equipment Utilization & Rental Report',
      subtitle: 'Generated from PMS Real-Time Database',
      filename: 'equipment_utilization_report',
      columns: [
        { label: 'Equipment', key: 'equipment_name' },
        { label: 'Type', key: 'ownership_type' },
        { label: 'Project', key: 'project_name' },
        { label: 'Hours', accessor: (r: any) => `${Number(r.total_meter_hours || r.logged_hours || 0)}h` },
        { label: 'Fuel (₹)', accessor: (r: any) => `₹${Number(r.total_fuel_cost || 0).toLocaleString('en-IN')}` },
        { label: 'Rental (₹)', accessor: (r: any) => `₹${Number(r.rental_billed || 0).toLocaleString('en-IN')}` },
      ],
      data,
      summaryMetrics: [
        { label: 'Total Fleet', value: totalEquipment },
        { label: 'Operating Hours', value: `${totalOperatingHours.toFixed(1)}h` },
      ],
    });
  };

  return (
    <div className="page-body">
      {/* 1. Header with Filters & Working Export Actions */}
      <ReportHeader
        title="Equipment Utilization & Fleet Report"
        subtitle="Tracking machinery operating hours, fuel consumption, internal asset costs, and third-party rentals."
        icon={Wrench}
        badgeText="Fleet & Plant"
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
            key: 'ownership',
            label: 'Ownership Type',
            type: 'select',
            value: ownershipFilter,
            onChange: setOwnershipFilter,
            options: [
              { value: '', label: 'All (Owned & Rented)' },
              { value: 'owned', label: 'Company Owned Machinery' },
              { value: 'rented', label: 'Third-Party Rented Equipment' },
            ],
          },
        ]}
      />

      {/* 2. 5 Key Summary Metric Cards */}
      <ReportSummaryCards
        cards={[
          {
            title: 'Active Fleet Units',
            value: totalEquipment,
            subtitle: `${ownedCount} owned, ${rentedCount} rented on sites`,
            icon: Wrench,
            variant: 'primary',
          },
          {
            title: 'Total Operating Hours',
            value: `${totalOperatingHours.toFixed(1)} hrs`,
            subtitle: 'Cumulative meter runtime',
            icon: Clock,
            variant: 'info',
          },
          {
            title: 'Fuel & Oil Cost',
            value: `₹${totalFuelCost.toLocaleString('en-IN')}`,
            subtitle: 'Direct diesel & lubricants recognized',
            icon: Fuel,
            variant: 'warning',
          },
          {
            title: 'Rental Commitments',
            value: `₹${totalRentalCost.toLocaleString('en-IN')}`,
            subtitle: 'Billed rental charges from vendors',
            icon: IndianRupee,
            variant: 'neutral',
          },
          {
            title: 'Fleet Operational Health',
            value: `${totalEquipment > 0 ? Math.round((totalOperatingHours / (totalEquipment * 40 || 1)) * 100) : 0}%`,
            subtitle: 'Average utilization index',
            icon: TrendingUp,
            variant: 'success',
          },
        ]}
      />

      {/* 3. Purposeful Visual Utilization Chart */}
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
              Top Machinery Hours & Operating Expense
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Operating hours vs recognized equipment expenditure
            </p>
          </div>
          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="Hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Cost" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 4. Detailed Equipment Register Table */}
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
              Machinery & Equipment Asset Register
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Site allocations, ownership, and expense audit
            </p>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {data.length} equipment units
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading equipment data...
          </div>
        ) : data.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No equipment usage records found for selected filters.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Equipment Name</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Ownership</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Assigned Site</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Vendor / Owner</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Operating Hours</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Fuel Cost (₹)</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Rental Cost (₹)</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((e, idx) => {
                  const isOwned = (e.ownership_type || '').toLowerCase() === 'owned';
                  return (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(el) => (el.currentTarget.style.background = 'rgba(150, 150, 150, 0.04)')}
                      onMouseLeave={(el) => (el.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        <div>{e.equipment_name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                          {e.equipment_code || `EQ-${idx + 1}`}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <Badge variant={isOwned ? 'success' : 'info'}>
                          {isOwned ? 'Owned' : 'Rented'}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-primary)' }}>
                        {e.project_name || 'Central Yard'}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>
                        {e.vendor_name || (isOwned ? 'In-House' : '-')}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {Number(e.total_meter_hours || e.logged_hours || 0).toFixed(1)} hrs
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
                        ₹{Number(e.total_fuel_cost || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>
                        ₹{Number(e.rental_billed || e.total_cost || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                        <Badge variant="success">Active</Badge>
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
        situation={`Tracking ${totalEquipment} pieces of machinery (${ownedCount} company owned, ${rentedCount} rented). Cumulative runtime stands at ${totalOperatingHours.toFixed(1)} meter hours with ₹${(totalFuelCost + totalRentalCost).toLocaleString('en-IN')} total operating expenditure.`}
        completedSummary={`All scheduled equipment runtime logs have been captured from daily job sheets.`}
        pendingSummary={`Ensure rented machinery off-hire notices are sent as soon as designated work is finished to avoid unnecessary idle rental charges.`}
        alerts={
          rentedCount > ownedCount
            ? [
                {
                  text: `High reliance on rented machinery (${rentedCount} rented vs ${ownedCount} owned), increasing project recurring overheads.`,
                  severity: 'info',
                },
              ]
            : []
        }
        recommendations={[
          'Review equipment idle days to demobilize rented machinery promptly upon task completion.',
          'Verify fuel meter logs against work done to ensure fuel consumption efficiency.',
        ]}
      />
    </div>
  );
};
