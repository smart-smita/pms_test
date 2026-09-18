import React, { useState, useEffect } from 'react';
import { Clock, Plus, Edit2, Trash2 } from 'lucide-react';
import { FilterBar } from '../components/common/FilterBar';
import { DataTable, Column } from '../components/common/DataTable';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { showSuccess, showError } from '../utils/toast';
import { TaskCombobox } from '../components/common/TaskCombobox';

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
  const [wbsList, setWbsList] = useState<{ id: number; name: string; project_id?: number }[]>([]);
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

  const [filterWbsList, setFilterWbsList] = useState<{ id: number; name: string; project_id?: number }[]>([]);
  const [modalWbsList, setModalWbsList] = useState<{ id: number; name: string; project_id?: number }[]>([]);

  useEffect(() => {
    fetchMasterData();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      apiService.get<any[]>(`/projects/${selectedProject}/wbs`).then((res) => {
        if (res.success && res.data) {
          setFilterWbsList(res.data.map((w: any) => ({
            id: w.id || w.wbs_id,
            name: w.wbs_name,
            project_id: Number(selectedProject),
          })));
        } else {
          setFilterWbsList([]);
        }
      });
    } else {
      setFilterWbsList(wbsList);
    }
  }, [selectedProject, wbsList]);

  useEffect(() => {
    if (form.project_id) {
      apiService.get<any[]>(`/projects/${form.project_id}/wbs`).then((res) => {
        if (res.success && res.data) {
          setModalWbsList(res.data.map((w: any) => ({
            id: w.id || w.wbs_id,
            name: w.wbs_name,
            project_id: Number(form.project_id),
          })));
        } else {
          setModalWbsList([]);
        }
      });
    } else {
      setModalWbsList(wbsList);
    }
  }, [form.project_id, wbsList]);

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
      if (wbsRes.data) setWbsList(wbsRes.data.map((w) => ({ id: w.id, name: w.wbs_name, project_id: w.project_id })));
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
    if (!form.task_id && !form.project_id) return showError('Please select a project or a task');
    if (!form.employee_id) return showError('Employee is required');
    setIsSubmitting(true);

    try {
      const payload = {
        project_id: form.project_id ? Number(form.project_id) : undefined,
        wbs_id: form.wbs_id ? Number(form.wbs_id) : undefined,
        task_id: form.task_id ? Number(form.task_id) : undefined,
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

  // Filter WBS based on selected modal project
  const availableFormWbs = React.useMemo(() => {
    if (!wbsList) return [];
    if (!form.project_id) return wbsList;
    const pid = Number(form.project_id);
    return wbsList.filter((w) => !w.project_id || Number(w.project_id) === pid);
  }, [wbsList, form.project_id]);

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
    { header: 'WBS', accessor: (i) => i.wbs_name || '-', sortKey: 'wbs_name' },
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
    <div className="page-body">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={22} style={{ color: '#6366f1', flexShrink: 0 }} />
            Employee Timesheet Management
          </h1>
          <p className="page-subtitle">
            Log time sheets for assigned project tasks and maintain actual working hours logs.
          </p>
        </div>

        {hasPermission('timesheets', 'create') && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="btn btn-primary"
          >
            <Plus size={16} />
            Log Time Sheet
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
        wbsList={filterWbsList}
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
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <DataTable
          data={timesheets}
          columns={columns}
          isLoading={loading}
          searchPlaceholder="Search timesheet logs..."
          exportFilename="Employee_Timesheets_Report"
          actions={(item) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end' }}>
              {hasPermission('timesheets', 'update') && (
                <button
                  onClick={() => handleOpenEdit(item)}
                  className="action-btn edit"
                  title="Edit timesheet"
                >
                  <Edit2 size={14} />
                </button>
              )}
              {hasPermission('timesheets', 'delete') && (
                <button
                  onClick={() => handleDelete(item.timesheet_id)}
                  className="action-btn delete"
                  title="Delete timesheet"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )}
        />
      </div>

      {/* Log / Edit Time Sheet Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{ maxWidth: '560px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.1rem', margin: 0 }}>
                <span style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Clock size={16} />
                </span>
                {editingTs ? 'Edit Time Sheet Entry' : 'Log New Time Sheet'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="modal-close-btn"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body" style={{ padding: '1.25rem 1.5rem' }}>
              <form onSubmit={handleSubmit}>

                {/* Row 1: Project + WBS */}
                <div className="grid-2-col" style={{ marginBottom: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Project</label>
                    <select
                      value={form.project_id}
                      onChange={(e) => {
                        const newPid = e.target.value;
                        const pidNum = Number(newPid);
                        const isWbsValid = form.wbs_id && wbsList.some((w) => String(w.id) === String(form.wbs_id) && (!w.project_id || !pidNum || Number(w.project_id) === pidNum));
                        setForm({
                          ...form,
                          project_id: newPid,
                          wbs_id: isWbsValid ? form.wbs_id : '',
                          task_id: '',
                        });
                      }}
                      className="form-select"
                    >
                      <option value="">-- All Projects --</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">WBS</label>
                    <select
                      value={form.wbs_id}
                      onChange={(e) => setForm({ ...form, wbs_id: e.target.value, task_id: '' })}
                      className="form-select"
                    >
                      <option value="">-- All WBS --</option>
                      {modalWbsList.map((w) => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 2: Task */}
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">
                    Select Task <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.78rem' }}>(optional — auto-links to WBS)</span>
                  </label>
                  <TaskCombobox
                    projectId={form.project_id}
                    wbsId={form.wbs_id}
                    selectedTaskId={form.task_id}
                    tasks={availableFormTasks}
                    onSelectTask={(selected) => {
                      if (!selected) {
                        setForm({ ...form, task_id: '' });
                      } else {
                        setForm({
                          ...form,
                          task_id: String(selected.id),
                          project_id: selected.project_id ? String(selected.project_id) : form.project_id,
                          wbs_id: selected.wbs_id ? String(selected.wbs_id) : form.wbs_id,
                        });
                      }
                    }}
                    onTaskCreated={(newTask) => {
                      setTasks((prev) => [...prev, { id: newTask.id, name: newTask.name, project_id: newTask.project_id || (form.project_id ? Number(form.project_id) : 0), wbs_id: newTask.wbs_id }]);
                      setForm({
                        ...form,
                        task_id: String(newTask.id),
                        project_id: newTask.project_id ? String(newTask.project_id) : form.project_id,
                        wbs_id: newTask.wbs_id ? String(newTask.wbs_id) : form.wbs_id,
                      });
                    }}
                    placeholder="Choose task or type to create new..."
                  />
                </div>

                {/* Row 3: Employee (admin/manager only) */}
                {!isEmployee && (
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Employee <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <select
                      required
                      value={form.employee_id}
                      onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                      className="form-select"
                    >
                      <option value="">-- Choose Employee --</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Row 4: Log Date + Working Hours */}
                <div className="grid-2-col" style={{ marginBottom: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Log Date <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <input
                      type="date"
                      required
                      value={form.log_date}
                      onChange={(e) => setForm({ ...form, log_date: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Working Hours <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max="24"
                      required
                      value={form.working_hours}
                      onChange={(e) => setForm({ ...form, working_hours: Number(e.target.value) })}
                      className="form-input"
                      placeholder="e.g. 8"
                    />
                  </div>
                </div>

                {/* Row 5: Comment */}
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Work Description / Comments</label>
                  <textarea
                    rows={2}
                    value={form.comment}
                    onChange={(e) => setForm({ ...form, comment: e.target.value })}
                    className="form-input"
                    placeholder="Enter work details or progress notes…"
                    style={{ resize: 'vertical', minHeight: '60px' }}
                  />
                </div>

                {/* Footer Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary"
                    style={{ minWidth: '140px' }}
                  >
                    {isSubmitting ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                        Saving…
                      </span>
                    ) : editingTs ? (
                      'Save Changes'
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Clock size={14} />
                        Log Time Sheet
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
