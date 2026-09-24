import React, { useState, useEffect } from 'react';
import { FileText, Download, Building2, TrendingUp, TrendingDown, Layers } from 'lucide-react';
import { apiService } from '../services/api';
import { DataTable, Column } from '../components/common/DataTable';
import { Button } from '../components/common/Button';
import { FormSelect } from '../components/forms/FormSelect';

export const PlannedVsActualReport: React.FC = () => {
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

      const res = await apiService.get<any[]>('/reports/planned-vs-actual', {
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
      'Project', 'WBS', 'Task', 
      'Planned Labour Hours', 'Actual Labour Hours', 'Hour Variance',
      'Planned Labour Cost', 'Actual Labour Cost', 'Labour Cost Variance',
      'Planned Material Cost', 'Actual Material Cost', 'Material Cost Variance',
      'Planned Total Cost', 'Actual Total Cost', 'Total Variance'
    ];
    
    const csvContent = [
      headers.join(','),
      ...data.map(r => [
        `"${r.project_name || ''}"`,
        `"${r.wbs_name || ''}"`,
        `"${r.task_name || ''}"`,
        r.planned_labour_hours || 0,
        r.actual_labour_hours || 0,
        r.hour_variance || 0,
        r.planned_labour_cost || 0,
        r.actual_labour_cost || 0,
        r.labour_cost_variance || 0,
        r.planned_material_cost || 0,
        r.actual_material_cost || 0,
        r.material_cost_variance || 0,
        r.planned_total_cost || 0,
        r.actual_total_cost || 0,
        r.total_variance || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `planned_vs_actual_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const columns: Column<any>[] = [
    { header: 'Project Name', accessor: 'project_name' },
    { header: 'WBS', accessor: 'wbs_name' },
    { header: 'Task', accessor: 'task_name' },
    { header: 'Planned Hrs', accessor: 'planned_labour_hours' },
    { header: 'Actual Hrs', accessor: 'actual_labour_hours' },
    { 
      header: 'Hour Variance', 
      accessor: (r) => (
        <span style={{ color: r.hour_variance < 0 ? 'var(--error-color)' : 'inherit', fontWeight: r.hour_variance < 0 ? 'bold' : 'normal' }}>
          {r.hour_variance}
        </span>
      )
    },
    { header: 'Planned Cost (₹)', accessor: (r) => r.planned_total_cost.toLocaleString() },
    { header: 'Actual Cost (₹)', accessor: (r) => r.actual_total_cost.toLocaleString() },
    { 
      header: 'Cost Variance (₹)', 
      accessor: (r) => (
        <span style={{ color: r.total_variance < 0 ? 'var(--error-color)' : 'inherit', fontWeight: r.total_variance < 0 ? 'bold' : 'normal' }}>
          {r.total_variance.toLocaleString()}
        </span>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Layers className="text-primary-600" size={28} />
            Planned vs Actual Report
          </h1>
          <p className="text-gray-500">Compare planned vs actual hours and cost execution at task level.</p>
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
            label="Filter by Project"
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
          keyField="task_name"
          isLoading={loading}
          emptyMessage="No planned vs actual data available."
        />
      </div>
    </div>
  );
};
