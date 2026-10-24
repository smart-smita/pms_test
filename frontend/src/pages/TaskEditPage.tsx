import React, { useState, useEffect } from 'react';
import { FormPageLayout } from '../components/common/FormPageLayout';
import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';
import { FormTextarea } from '../components/forms/FormTextarea';
import { WbsTypeBadge } from '../components/common/WbsTypeBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { apiRequest } from '../services/api';
import { showSuccess, showError } from '../utils/toast';
import { Wbs, Employee, Labour, Project, Task } from '../types';
import { CheckSquare, Users } from 'lucide-react';

interface TaskEditPageProps {
  projectId: number;
  taskId?: number;
  onNavigate: (page: string) => void;
}

const getTodayStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const TaskEditPage: React.FC<TaskEditPageProps> = ({
  projectId,
  taskId,
  onNavigate,
}) => {
  const [project, setProject] = useState<Project | null>(null);
  const [wbsList, setWbsList] = useState<Wbs[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [labours, setLabours] = useState<Labour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [taskCode, setTaskCode] = useState('');
  const [taskName, setTaskName] = useState('');
  const [selectedWbsId, setSelectedWbsId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed' | 'delayed'>('in_progress');
  const [progressPercentage, setProgressPercentage] = useState<number>(0);
  const [assignedEmployeeId, setAssignedEmployeeId] = useState('');
  const [assignedLabourId, setAssignedLabourId] = useState('');
  const [plannedHours, setPlannedHours] = useState<number | string>(8.0);
  const [actualHours, setActualHours] = useState<number>(0.0);
  const [description, setDescription] = useState('');

  const selectedWbs = wbsList.find((w) => String(w.id || w.wbs_id) === selectedWbsId);
  const wbsType = selectedWbs?.wbs_type || 'labour_material';

  const numPlanned = typeof plannedHours === 'string' ? (parseFloat(plannedHours) || 0) : (Number(plannedHours) || 0);
  const numActual = typeof actualHours === 'string' ? (parseFloat(actualHours) || 0) : (Number(actualHours) || 0);

  const remainingHours = Math.max(numPlanned - numActual, 0);
  const extraHours = Math.max(numActual - numPlanned, 0);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const reqs: Promise<any>[] = [
        apiRequest<Project>(`/projects/${projectId}`),
        apiRequest<Wbs[]>(`/projects/${projectId}/wbs`),
        apiRequest<Employee[]>('/employees'),
        apiRequest<Labour[]>('/labours'),
      ];
      if (taskId) {
        reqs.unshift(apiRequest<Task>(`/tasks/${taskId}`));
      }

      const results = await Promise.all(reqs);
      let tRes: any = null;
      let pRes: any, wRes: any, eRes: any, lRes: any;
      if (taskId) {
        [tRes, pRes, wRes, eRes, lRes] = results;
      } else {
        [pRes, wRes, eRes, lRes] = results;
      }

      if (pRes.success && pRes.data) setProject(pRes.data);
      if (wRes.success && wRes.data) {
        setWbsList(wRes.data);
        if (!taskId && wRes.data.length > 0) {
          const firstLabourWbs = wRes.data.find((w: any) => w.wbs_type !== 'material') || wRes.data[0];
          setSelectedWbsId(String(firstLabourWbs.id || firstLabourWbs.wbs_id));
        }
      }
      if (eRes.success && eRes.data) setEmployees(eRes.data);
      if (lRes.success && lRes.data) setLabours(lRes.data);

      if (taskId && tRes?.success && tRes?.data) {
        const t = tRes.data;
        setTaskCode(t.task_code || '');
        setTaskName(t.task_name || '');
        setSelectedWbsId(String(t.wbs_id || ''));
        setStartDate(t.start_date ? t.start_date.split('T')[0] : '');
        const target = t.target_date || (t as any).end_date || '';
        setEndDate(target ? target.split('T')[0] : '');
        setStatus((t.status as any) || 'in_progress');
        setProgressPercentage(t.progress_percentage || 0);
        setAssignedEmployeeId(t.assigned_employee_id ? String(t.assigned_employee_id) : (t.assigned_employees?.[0]?.employee_id ? String(t.assigned_employees[0].employee_id) : ''));
        const assignedLabId = t.assigned_labour_id 
          ? String(t.assigned_labour_id) 
          : (t.assigned_labours?.[0]?.labour_id 
              ? String(t.assigned_labours[0].labour_id) 
              : (t.allocations?.[0]?.labour_id 
                  ? String(t.allocations[0].labour_id) 
                  : ''));
        setAssignedLabourId(assignedLabId);

        // Map planned hours from planned_hours or estimated_hours
        const rawPlanned = t.planned_hours !== undefined && t.planned_hours !== null 
          ? t.planned_hours 
          : t.estimated_hours;
        const parsedPlanned = Number(rawPlanned);
        setPlannedHours(!isNaN(parsedPlanned) ? parsedPlanned : 0);

        // Map actual hours from actual_hours
        const rawActual = t.actual_hours !== undefined && t.actual_hours !== null 
          ? t.actual_hours 
          : 0;
        const parsedActual = Number(rawActual);
        setActualHours(!isNaN(parsedActual) ? parsedActual : 0);

        setDescription(t.description || '');
      } else if (taskId && (!tRes?.success || !tRes?.data)) {
        showError(tRes?.message || 'Failed to load task details.');
      } else if (!taskId) {
        setStartDate(getTodayStr());
        setEndDate(getTodayStr());
        setStatus('pending');
        setTaskCode(`TSK-${String(Date.now()).slice(-4)}`);
        setPlannedHours(8.0);
        setActualHours(0.0);
      }
      setIsLoading(false);
    };

    if (projectId) loadData();
  }, [taskId, projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) {
      showError('Please enter a valid task name.');
      return;
    }
    if (!selectedWbsId) {
      showError('Please select a valid WBS discipline.');
      return;
    }
    if (startDate && endDate && endDate < startDate) {
      showError('End date cannot be earlier than start date.');
      return;
    }

    setIsSubmitting(true);
    const wbsNum = Number(selectedWbsId);
    const empIdNum = Number(assignedEmployeeId);
    const labIdNum = Number(assignedLabourId);

    const payload: any = {
      project_id: projectId,
      task_code: taskCode,
      task_name: taskName,
      start_date: startDate || undefined,
      target_date: endDate || undefined,
      end_date: endDate || undefined,
      status: status,
      progress_percentage: Number(progressPercentage) || 0,
      estimated_hours: numPlanned,
      planned_hours: numPlanned,
      description: description,
    };

    if (wbsNum > 0) {
      payload.wbs_id = wbsNum;
    }
    if (empIdNum > 0) {
      payload.assigned_employee_ids = [empIdNum];
    } else {
      payload.assigned_employee_ids = [];
    }
    if (labIdNum > 0) {
      payload.allocations = [{
        labour_id: labIdNum,
        work_date: startDate || endDate || getTodayStr()
      }];
    } else {
      payload.allocations = [];
    }

    let res: any;
    if (taskId) {
      res = await apiRequest(`/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    } else {
      res = await apiRequest('/tasks', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }
    setIsSubmitting(false);

    if (res.success) {
      showSuccess(taskId ? 'Task updated successfully.' : 'Task created successfully.');
      onNavigate(`project/workspace/${projectId}/tasks`);
    } else {
      showError(res.message || (taskId ? 'Failed to update task.' : 'Failed to create task.'));
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
        <LoadingSpinner />
        <span style={{ color: 'var(--text-secondary)' }}>Loading task...</span>
      </div>
    );
  }

  const breadcrumbs = [
    { label: 'Project', onClick: () => onNavigate('project/workspace') },
    { label: project?.project_name || 'Project Workspace', onClick: () => onNavigate(`project/workspace/${projectId}/tasks`) },
    { label: 'Task Management', onClick: () => onNavigate(`project/workspace/${projectId}/tasks`) },
    { label: taskId ? (taskCode || 'Edit Task') : 'Add Task' },
  ];

  return (
    <FormPageLayout
      breadcrumbs={breadcrumbs}
      title={taskId ? `Edit Task: ${taskCode || 'Details'}` : 'Add Task'}
      subtitle={taskId ? 'Update task details, schedule, and assignees' : 'Create a new project task, schedule, and assignees'}
      onCancel={() => onNavigate(`project/workspace/${projectId}/tasks`)}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      saveButtonText={isSubmitting ? 'Saving...' : taskId ? 'Save Changes' : 'Create Task'}
    >
      {/* 1. Task Details Card */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          padding: '1.5rem',
        }}
      >
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckSquare size={18} color="#6366f1" />
          <span>Task Details</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          <div>
            <FormInput
              label="Task Code"
              value={taskCode}
              onChange={(e) => setTaskCode(e.target.value)}
              required
            />
          </div>

          <div>
            <FormInput
              label="Task Name"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="Enter task name..."
              required
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>WBS *</label>
              {selectedWbs && <WbsTypeBadge type={wbsType} size="sm" />}
            </div>
            <select
              value={selectedWbsId}
              onChange={(e) => setSelectedWbsId(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
              }}
            >
              <option value="">Select WBS...</option>
              {wbsList.map((w) => (
                <option 
                  key={w.id || w.wbs_id} 
                  value={String(w.id || w.wbs_id)}
                  disabled={w.wbs_type === 'material'}
                >
                  {w.wbs_code} - {w.wbs_name} {w.wbs_type === 'material' ? '(Material Only)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <FormInput
              label="Start Date"
              type="date"
              value={startDate}
              min={startDate && startDate < getTodayStr() ? startDate : getTodayStr()}
              onChange={(e) => {
                const val = e.target.value;
                setStartDate(val);
                if (endDate && endDate < val) {
                  setEndDate(val);
                }
              }}
              required
            />
          </div>

          <div>
            <FormInput
              label="End Date"
              type="date"
              value={endDate}
              min={startDate ? startDate : getTodayStr()}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <div>
            <FormSelect
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              options={[
                { value: 'in_progress', label: 'In Progress' },
                { value: 'pending', label: 'Pending' },
                { value: 'completed', label: 'Completed' },
                { value: 'delayed', label: 'Delayed' },
              ]}
              required
            />
          </div>

          <div>
            <FormInput
              label="Progress % (0 - 100)"
              type="number"
              min="0"
              max="100"
              value={progressPercentage}
              onChange={(e) => setProgressPercentage(parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      {/* 2. Assignment Card */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          padding: '1.5rem',
        }}
      >
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={18} color="#22c55e" />
          <span>Assignment & Resources</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Assign Employee
            </label>
            <select
              value={assignedEmployeeId}
              onChange={(e) => setAssignedEmployeeId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
              }}
            >
              <option value="">Search employee...</option>
              {employees.map((emp) => (
                <option key={emp.employee_id} value={String(emp.employee_id)}>
                  {emp.name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim()} ({emp.employee_code}) - {emp.role_name || 'Staff'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Assign Labour / Contractor
            </label>
            <select
              value={assignedLabourId}
              onChange={(e) => setAssignedLabourId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
              }}
            >
              <option value="">-- Select Labour / Contractor --</option>
              {labours.map((lab) => {
                const displayName = lab.name || lab.labour_name || 'Labour';
                const typeLabel = lab.labour_type === 'contractor' ? 'Contractor' : 'Direct Labour';
                const contractorInfo = lab.contractor_name ? ` (via ${lab.contractor_name})` : '';
                return (
                  <option key={lab.labour_id} value={String(lab.labour_id)}>
                    {displayName} ({typeLabel}){contractorInfo}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Hours Breakdown */}
        <div
          style={{
            marginTop: '1.5rem',
            padding: '1rem',
            borderRadius: '10px',
            background: 'var(--border-color)',
            border: '1px solid var(--border-color)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
          }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>
              PLANNED HOURS
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={plannedHours}
              onChange={(e) => setPlannedHours(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>
              ACTUAL HOURS (FROM LOGS)
            </label>
            <input
              type="number"
              value={actualHours}
              readOnly
              tabIndex={-1}
              title="Actual hours are automatically calculated from employee timesheets and labour work logs."
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'not-allowed',
                opacity: 0.85,
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>
              REMAINING HOURS
            </label>
            <div style={{ padding: '0.55rem 0.75rem', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.08)', color: '#818cf8', fontWeight: 700, fontSize: '0.9rem' }}>
              {remainingHours.toFixed(2)}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>
              EXTRA HOURS
            </label>
            <div style={{ padding: '0.55rem 0.75rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', fontWeight: 700, fontSize: '0.9rem' }}>
              {extraHours.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Description Card */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          padding: '1.5rem',
        }}
      >
        <FormTextarea
          label="Description & Scope of Work"
          value={description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
          rows={4}
        />
      </div>
    </FormPageLayout>
  );
};
