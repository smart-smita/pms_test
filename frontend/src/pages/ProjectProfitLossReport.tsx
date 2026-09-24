import React, { useState, useEffect } from 'react';
import { FileText, Download, Building2, TrendingUp, TrendingDown, IndianRupee } from 'lucide-react';
import { apiService } from '../services/api';
import { DataTable, Column } from '../components/common/DataTable';
import { Button } from '../components/common/Button';
import { FormSelect } from '../components/forms/FormSelect';

export const ProjectProfitLossReport: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
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

      const res = await apiService.get<any[]>('/reports/project-profit-loss', {
        project_id: selectedProject || undefined,
      });
      if (res.data) {
        setData(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (data.length === 0) return;
    const headers = [
      'Project', 'Customer', 'Contract Value', 'Invoice Value', 'Collected Value',
      'Planned Cost', 'Actual Labour Cost', 'Actual Material Cost', 'Total Actual Cost',
      'Profit/Loss', 'Margin %'
    ];
    
    const csvContent = [
      headers.join(','),
      ...data.map(r => [
        `"${r.project_name || ''}"`,
        `"${r.customer_name || ''}"`,
        r.contract_value || 0,
        r.invoice_value || 0,
        r.collected_value || 0,
        r.planned_cost || 0,
        r.actual_labour_cost || 0,
        r.actual_material_cost || 0,
        r.total_actual_cost || 0,
        r.profit_loss || 0,
        r.profit_margin_percentage || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `profit_loss_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const columns: Column<any>[] = [
    { header: 'Project Name', accessor: 'project_name' },
    { header: 'Customer', accessor: 'customer_name' },
    { header: 'Contract Value (₹)', accessor: (r) => r.contract_value.toLocaleString() },
    { header: 'Invoiced (₹)', accessor: (r) => r.invoice_value.toLocaleString() },
    { header: 'Labour Cost (₹)', accessor: (r) => r.actual_labour_cost.toLocaleString() },
    { header: 'Material Cost (₹)', accessor: (r) => r.actual_material_cost.toLocaleString() },
    { header: 'Total Cost (₹)', accessor: (r) => r.total_actual_cost.toLocaleString() },
    { 
      header: 'Profit/Loss (₹)', 
      accessor: (r) => (
        <span style={{ color: r.profit_loss >= 0 ? 'var(--success-color)' : 'var(--error-color)', fontWeight: 'bold' }}>
          {r.profit_loss >= 0 ? <TrendingUp size={16} style={{display:'inline', marginRight:4}} /> : <TrendingDown size={16} style={{display:'inline', marginRight:4}} />}
          {Math.abs(r.profit_loss).toLocaleString()}
        </span>
      )
    },
    { header: 'Margin %', accessor: (r) => `${r.profit_margin_percentage}%` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <IndianRupee className="text-primary-600" size={28} />
            Profit & Loss Report
          </h1>
          <p className="text-gray-500">Project financial performance overview.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExport} icon={Download}>
            Export CSV
          </Button>
        </div>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <FormSelect
            label="Project"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            options={[
              { value: '', label: 'All Projects' },
              ...projects.map((p) => ({ value: String(p.id), label: p.name })),
            ]}
          />
        </div>

        <DataTable
          columns={columns}
          data={data}
          keyField="project_id"
          isLoading={loading}
          emptyMessage="No financial data available for the selected filters."
        />
      </div>
    </div>
  );
};
