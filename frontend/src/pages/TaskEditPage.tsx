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
  taskId: number;
  onNavigate: (page: string) => void;
}

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
  const [plannedHours, setPlannedHours] = useState<number>(8.0);
  const [actualHours, setActualHours] = useState<number>(0.0);
  const [description, setDescription] = useState('');

  const selectedWbs = wbsList.find((w) => String(w.id || w.wbs_id) === selectedWbsId);
  const wbsType = selectedWbs?.wbs_type || 'labour_material';

  const remainingHours = Math.max(plannedHours - actualHours, 0);
  const extraHours = Math.max(actualHours - plannedHours, 0);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const [tRes, pRes, wRes, eRes, lRes] = await Promise.all([
        apiRequest<Task>(`/tasks/${taskId}`),
        apiRequest<Project>(`/projects/${projectId}`),
        apiRequest<Wbs[]>(`/projects/${projectId}/wbs`),
        apiRequest<Employee[]>('/employees'),
        apiRequest<Labour[]>('/labours'),
      ]);

      if (pRes.success && pRes.data) setProject(pRes.data);
      if (wRes.success && wRes.data) setWbsList(wRes.data);
      if (eRes.success && eRes.data) setEmployees(eRes.data);
      if (lRes.success && lRes.data) setLabours(lRes.data);

      if (tRes.success && tRes.data) {
        const t = tRes.data;
        setTaskCode(t.task_code || '');
        setTaskName(t.task_name || '');
        setSelectedWbsId(String(t.wbs_id || ''));
        setStartDate(t.start_date ? t.start_date.split('T')[0] : '');
        setEndDate(t.end_date ? t.end_date.split('T')[0] : '');
        setStatus((t.status as any) || 'in_progress');
        setProgressPercentage(t.progress_percentage || 0);
        setAssignedEmployeeId(t.assigned_employee_id ? String(t.assigned_employee_id) : '');
        setAssignedLabourId(t.assigned_labour_id ? String(t.assigned_labour_id) : '');
        setPlannedHours(Number(t.planned_hours) || 0);
        setActualHours(Number(t.actual_hours) || 0);
        setDescription(t.description || '');
      }
      setIsLoading(false);
    };

    if (taskId) loadData();
  }, [taskId, projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) {
      showError('Please enter a valid task name.');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      project_id: projectId,
      wbs_id: Number(selectedWbsId),
      task_code: taskCode,
      task_name: taskName,
      start_date: startDate,
      end_date: endDate,
      status: status,
      progress_percentage: Number(progressPercentage),
      assigned_employee_ids: assignedEmployeeId ? [Number(assignedEmployeeId)] : [],
      allocations: assignedLabourId ? [{
        labour_id: Number(assignedLabourId),
        work_date: startDate || new Date().toISOString().split('T')[0]
      }] : [],
      estimated_hours: Number(plannedHours) || 0,
      description: description,
    };

    const res = await apiRequest(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    setIsSubmitting(false);

    if (res.success) {
      showSuccess('Task updated successfully.');
      onNavigate(`project/workspace/${projectId}/tasks`);
    } else {
      showError(res.message || 'Failed to update task.');
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
    { label: taskCode || 'Edit Task' },
  ];

  return (
    <FormPageLayout
      breadcrumbs={breadcrumbs}
      title={`Edit Task: ${taskCode}`}
      subtitle="Update task details, schedule, and assignees"
      onCancel={() => onNavigate(`project/workspace/${projectId}/tasks`)}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      saveButtonText="Save Changes"
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
                <option key={w.id || w.wbs_id} value={String(w.id || w.wbs_id)}>
                  {w.wbs_code} - {w.wbs_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <FormInput
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div>
            <FormInput
              label="End Date"
              type="date"
              value={endDate}
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
              <option value="">Search labour...</option>
              {labours.map((lab) => (
                <option key={lab.labour_id} value={String(lab.labour_id)}>
                  {lab.labour_name} ({lab.labour_code || 'LBR'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Hours Breakdown */}
        <div
          style={{
            marginTop: '1.5rem',
            padding: '1rem',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.02)',
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
              onChange={(e) => setPlannedHours(parseFloat(e.target.value) || 0)}
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
              step="0.5"
              min="0"
              value={actualHours}
              onChange={(e) => setActualHours(parseFloat(e.target.value) || 0)}
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
