import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { apiService } from '../services/api';
import { showSuccess, showError } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { TaskCombobox } from '../components/common/TaskCombobox';

interface TimesheetFormPageProps {
  projectId: number;
  timesheetId?: number; // if present, it's edit mode
  onNavigate: (page: string) => void;
}

export const TimesheetFormPage: React.FC<TimesheetFormPageProps> = ({ projectId, timesheetId, onNavigate }) => {
  const { user } = useAuth();
  const isEmployee = user?.role_name === 'Employee';

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [wbsList, setWbsList] = useState<{ id: number; name: string }[]>([]);
  const [tasks, setTasks] = useState<{ id: number; name: string; wbs_id?: number }[]>([]);
  const [employees, setEmployees] = useState<{ id: number; name: string }[]>([]);

  const [form, setForm] = useState({
    wbs_id: '',
    task_id: '',
    employee_id: isEmployee && user ? String(user.employee_id) : '',
    log_date: new Date().toISOString().split('T')[0],
    working_hours: 8,
    comment: '',
  });

  useEffect(() => {
    fetchMasterData();
    if (timesheetId) {
      fetchTimesheetDetails();
    }
  }, [projectId, timesheetId]);

  const fetchMasterData = async () => {
    try {
      const [wbsRes, taskRes, empRes] = await Promise.all([
        apiService.get<any[]>(`/projects/${projectId}/wbs`),
        apiService.get<any[]>(`/tasks`, { project_id: projectId }),
        apiService.get<any[]>('/employees'),
      ]);
      if (wbsRes.success && wbsRes.data) {
        setWbsList(wbsRes.data.map(w => ({ id: w.id || w.wbs_id, name: w.wbs_name })));
      }
      if (taskRes.success && taskRes.data) {
        setTasks(taskRes.data.map(t => ({ id: t.task_id, name: t.task_name, wbs_id: t.wbs_id })));
      }
      if (empRes.success && empRes.data) {
        setEmployees(empRes.data.map(e => ({ id: e.employee_id, name: e.name })));
      }
    } catch (err) {
      console.error('Error fetching master data:', err);
    }
  };

  const fetchTimesheetDetails = async () => {
    setLoading(true);
    try {
      // Since there's no single timesheet endpoint right now, we can fetch all for project and filter
      const res = await apiService.get<any[]>('/timesheets', { project_id: projectId });
      if (res.data) {
        const ts = res.data.find(t => t.timesheet_id === timesheetId);
        if (ts) {
          setForm({
            wbs_id: ts.wbs_id ? String(ts.wbs_id) : '',
            task_id: String(ts.task_id),
            employee_id: String(ts.employee_id),
            log_date: ts.log_date,
            working_hours: Number(ts.working_hours),
            comment: ts.comment || '',
          });
        } else {
          showError('Timesheet not found');
          handleBack();
        }
      }
    } catch (err) {
      console.error('Error fetching timesheet:', err);
    } finally {
      setLoading(false);
    }
  };

  const availableTasks = tasks.filter((t) => {
    if (form.wbs_id && Number(t.wbs_id) !== Number(form.wbs_id)) return false;
    return true;
  });

  const handleBack = () => {
    onNavigate(`project/workspace/${projectId}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.task_id) return showError('Please select a task');
    if (!form.employee_id) return showError('Employee is required');
    
    setIsSubmitting(true);
    try {
      const payload = {
        project_id: projectId,
        wbs_id: form.wbs_id ? Number(form.wbs_id) : undefined,
        task_id: Number(form.task_id),
        employee_id: Number(form.employee_id),
        log_date: form.log_date,
        working_hours: Number(form.working_hours),
        comment: form.comment,
      };

      let res;
      if (timesheetId) {
        res = await apiService.put(`/timesheets/${timesheetId}`, payload);
      } else {
        res = await apiService.post('/timesheets', payload);
      }
      
      if (res.success) {
        showSuccess(`Timesheet ${timesheetId ? 'updated' : 'logged'} successfully`);
        handleBack();
      } else {
        showError(res.message || 'Operation failed');
      }
    } catch (err: any) {
      showError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <Loader2 className="spin" size={32} style={{ color: '#4f46e5' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={handleBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
            {timesheetId ? 'Edit Timesheet Log' : 'Log Timesheet'}
          </h1>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>
            Record actual hours worked on project tasks
          </p>
        </div>
      </div>

      <div style={{ background: '#ffffff', borderRadius: '12px', padding: '2rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="form-group">
            <label className="form-label">WBS Discipline (Optional)</label>
            <select
              className="form-control"
              value={form.wbs_id}
              onChange={(e) => setForm({ ...form, wbs_id: e.target.value, task_id: '' })}
            >
              <option value="">-- All WBS Disciplines --</option>
              {wbsList.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label required">Task</label>
            <TaskCombobox
              projectId={projectId}
              wbsId={form.wbs_id}
              tasks={availableTasks as any}
              selectedTaskId={form.task_id}
              onSelectTask={(task) => setForm({ ...form, task_id: task ? String(task.id) : '' })}
              placeholder="Search & select task..."
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Employee</label>
            <select
              className="form-control"
              required
              value={form.employee_id}
              onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
              disabled={isEmployee}
            >
              <option value="">-- Select Employee --</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label required">Log Date</label>
              <input
                type="date"
                className="form-control"
                required
                value={form.log_date}
                onChange={(e) => setForm({ ...form, log_date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Working Hours</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                className="form-control"
                required
                value={form.working_hours}
                onChange={(e) => setForm({ ...form, working_hours: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes / Comments</label>
            <textarea
              className="form-control"
              rows={3}
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              placeholder="Enter work details..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={handleBack} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isSubmitting ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
              {timesheetId ? 'Update Log' : 'Save Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
