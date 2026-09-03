import React, { useState, useEffect } from 'react';
import { Clock, Plus, Edit2, Trash2, Calendar, FileText } from 'lucide-react';
import { FilterBar } from '../components/common/FilterBar';
import { DataTable, Column } from '../components/common/DataTable';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { showSuccess, showError } from '../utils/toast';

export interface Timesheet {
  timesheet_id: number;
  project_id: number;
  project_name: string;
  wbs_id?: number | null;
  wbs_name?: string | null;
  task_id: number;
  task_name: string;
  employee_id: number;
  employee_name: string;
  employee_code: string;
  log_date: string;
  working_hours: number;
  comment?: string | null;
  created_at: string;
}

export const Timesheets: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const isEmployee = user?.role_name === 'Employee';

  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);
  const [wbsList, setWbsList] = useState<{ id: number; name: string }[]>([]);
  const [tasks, setTasks] = useState<{ id: number; name: string; project_id: number; wbs_id?: number }[]>([]);
  const [employees, setEmployees] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedWbs, setSelectedWbs] = useState('');
  const [selectedTask, setSelectedTask] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingTs, setEditingTs] = useState<Timesheet | null>(null);
  const [form, setForm] = useState({
    project_id: '',
    wbs_id: '',
    task_id: '',
    employee_id: isEmployee && user ? String(user.employee_id) : '',
    log_date: new Date().toISOString().split('T')[0],
    working_hours: 8,
    comment: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchMasterData();
  }, []);

  useEffect(() => {
    fetchTimesheets();
  }, [selectedProject, selectedWbs, selectedTask, selectedEmployee, startDate, endDate]);

  const fetchMasterData = async () => {
    try {
      const [projRes, wbsRes, taskRes, empRes] = await Promise.all([
        apiService.get<any[]>('/projects'),
        apiService.get<any[]>('/wbs'),
        apiService.get<any[]>('/tasks'),
        apiService.get<any[]>('/employees'),
      ]);

      if (projRes.data) setProjects(projRes.data.map((p) => ({ id: p.project_id, name: p.project_name })));
      if (wbsRes.data) setWbsList(wbsRes.data.map((w) => ({ id: w.id, name: w.wbs_name })));
      if (taskRes.data) setTasks(taskRes.data.map((t) => ({ id: t.task_id, name: t.task_name, project_id: t.project_id, wbs_id: t.wbs_id })));
      if (empRes.data) setEmployees(empRes.data.map((e) => ({ id: e.employee_id, name: e.name })));
    } catch (err) {
      console.error('Error fetching master data:', err);
    }
  };

  const fetchTimesheets = async () => {
    setLoading(true);
    try {
      const res = await apiService.get<Timesheet[]>('/timesheets', {
        project_id: selectedProject,
        wbs_id: selectedWbs,
        task_id: selectedTask,
        employee_id: selectedEmployee,
        start_date: startDate,
        end_date: endDate,
      });
      if (res.data) setTimesheets(res.data);
    } catch (err) {
      console.error('Error fetching timesheets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingTs(null);
    setForm({
      project_id: '',
      wbs_id: '',
      task_id: '',
      employee_id: isEmployee && user ? String(user.employee_id) : '',
      log_date: new Date().toISOString().split('T')[0],
      working_hours: 8,
      comment: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (ts: Timesheet) => {
    setEditingTs(ts);
    setForm({
      project_id: String(ts.project_id),
      wbs_id: ts.wbs_id ? String(ts.wbs_id) : '',
      task_id: String(ts.task_id),
      employee_id: String(ts.employee_id),
      log_date: ts.log_date,
      working_hours: Number(ts.working_hours),
      comment: ts.comment || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.task_id) return showError('Task selection is required');
    if (!form.employee_id) return showError('Employee is required');
    setIsSubmitting(true);

    try {
      const payload = {
        project_id: form.project_id ? Number(form.project_id) : undefined,
        wbs_id: form.wbs_id ? Number(form.wbs_id) : undefined,
        task_id: Number(form.task_id),
        employee_id: Number(form.employee_id),
        log_date: form.log_date,
        working_hours: Number(form.working_hours),
        comment: form.comment,
      };

      if (editingTs) {
        const res = await apiService.put(`/timesheets/${editingTs.timesheet_id}`, payload);
        if (res.success) {
          showSuccess('Timesheet updated successfully');
          setShowModal(false);
          fetchTimesheets();
        } else {
          showError(res.message || 'Update failed');
        }
      } else {
        const res = await apiService.post('/timesheets', payload);
        if (res.success) {
          showSuccess('Timesheet logged successfully');
          setShowModal(false);
          fetchTimesheets();
        } else {
          showError(res.message || 'Log failed');
        }
      }
    } catch (err: any) {
      showError(err.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this timesheet entry?')) return;
    try {
      const res = await apiService.delete(`/timesheets/${id}`);
      if (res.success) {
        showSuccess('Timesheet deleted successfully');
        fetchTimesheets();
      } else {
        showError(res.message || 'Delete failed');
      }
    } catch (err: any) {
      showError(err.message || 'Delete failed');
    }
  };

  // Filter tasks based on selected modal project & WBS
  const availableFormTasks = tasks.filter((t) => {
    if (form.project_id && Number(t.project_id) !== Number(form.project_id)) return false;
    if (form.wbs_id && Number(t.wbs_id) !== Number(form.wbs_id)) return false;
    return true;
  });

  const columns: Column<Timesheet>[] = [
    { header: 'Log Date', accessor: 'log_date', sortKey: 'log_date' },
    { header: 'Employee', accessor: (i) => `${i.employee_name} (${i.employee_code})`, sortKey: 'employee_name' },
    { header: 'Project', accessor: (i) => i.project_name || '-', sortKey: 'project_name' },
    { header: 'WBS Discipline', accessor: (i) => i.wbs_name || '-', sortKey: 'wbs_name' },
    { header: 'Task Name', accessor: 'task_name', sortKey: 'task_name' },
    {
      header: 'Working Hours',
      accessor: (i) => <span style={{ fontWeight: 700, color: '#10b981' }}>{Number(i.working_hours).toFixed(2)} hrs</span>,
      csvAccessor: (i) => `${Number(i.working_hours).toFixed(2)} hrs`,
      sortKey: 'working_hours',
    },
    { header: 'Notes / Comments', accessor: (i) => i.comment || '-', csvAccessor: (i) => i.comment || '-' },
  ];

  return (
    <div className="p-6 space-y-6" style={{ color: 'var(--text-primary)' }}>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Clock className="w-7 h-7 text-indigo-500" />
            Employee Timesheet Management
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Log time sheets for assigned project tasks and maintain actual working hours logs.
          </p>
        </div>

        {hasPermission('timesheets', 'create') && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Log Time Sheet</span>
          </button>
        )}
      </div>

      {/* Cascading Filter Bar */}
      <FilterBar
        selectedProject={selectedProject}
        selectedWbs={selectedWbs}
        selectedEmployee={selectedEmployee}
        startDate={startDate}
        endDate={endDate}
        projects={projects}
        wbsList={wbsList}
        employees={!isEmployee ? employees : undefined}
        onFilterChange={(f) => {
          if (f.projectId !== undefined) setSelectedProject(String(f.projectId));
          if (f.wbsId !== undefined) setSelectedWbs(String(f.wbsId));
          if (f.employeeId !== undefined) setSelectedEmployee(String(f.employeeId));
          if (f.startDate !== undefined) setStartDate(f.startDate);
          if (f.endDate !== undefined) setEndDate(f.endDate);
        }}
        onReset={() => {
          setSelectedProject('');
          setSelectedWbs('');
          setSelectedTask('');
          setSelectedEmployee('');
          setStartDate('');
          setEndDate('');
        }}
      />

      {/* Timesheet Data Table */}
      <DataTable
        data={timesheets}
        columns={columns}
        isLoading={loading}
        searchPlaceholder="Search timesheet logs..."
        exportFilename="Employee_Timesheets_Report"
        actions={(item) => (
          <div className="flex items-center gap-2">
            {hasPermission('timesheets', 'update') && (
              <button onClick={() => handleOpenEdit(item)} className="p-1 text-slate-400 hover:text-emerald-400 transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {hasPermission('timesheets', 'delete') && (
              <button onClick={() => handleDelete(item.timesheet_id)} className="p-1 text-slate-400 hover:text-rose-400 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      />

      {/* Log / Edit Time Sheet Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            className="rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Clock className="w-5 h-5 text-indigo-500" />
              {editingTs ? 'Edit Time Sheet Entry' : 'Log New Time Sheet'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Project</label>
                  <select
                    value={form.project_id}
                    onChange={(e) => setForm({ ...form, project_id: e.target.value, task_id: '' })}
                    className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      border: '1px solid var(--input-border)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="">-- All Projects --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>WBS Discipline</label>
                  <select
                    value={form.wbs_id}
                    onChange={(e) => setForm({ ...form, wbs_id: e.target.value, task_id: '' })}
                    className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      border: '1px solid var(--input-border)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="">-- All WBS --</option>
                    {wbsList.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Select Task (Required)</label>
                <select
                  required
                  value={form.task_id}
                  onChange={(e) => {
                    const tId = e.target.value;
                    const selected = tasks.find((t) => Number(t.id) === Number(tId));
                    setForm({
                      ...form,
                      task_id: tId,
                      project_id: selected ? String(selected.project_id) : form.project_id,
                      wbs_id: selected && selected.wbs_id ? String(selected.wbs_id) : form.wbs_id,
                    });
                  }}
                  className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="">-- Choose Task --</option>
                  {availableFormTasks.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {!isEmployee && (
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Employee</label>
                  <select
                    required
                    value={form.employee_id}
                    onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                    className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      border: '1px solid var(--input-border)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="">-- Choose Employee --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Log Date</label>
                  <input
                    type="date"
                    required
                    value={form.log_date}
                    onChange={(e) => setForm({ ...form, log_date: e.target.value })}
                    className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      border: '1px solid var(--input-border)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Working Hours (hrs)</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.1"
                    max="24"
                    required
                    value={form.working_hours}
                    onChange={(e) => setForm({ ...form, working_hours: Number(e.target.value) })}
                    className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      border: '1px solid var(--input-border)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Work Description / Comments</label>
                <textarea
                  rows={2}
                  value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                  className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-semibold transition-all shadow-lg"
                >
                  {isSubmitting ? 'Saving...' : (editingTs ? 'Save Changes' : 'Log Time Sheet')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
