import React, { useState, useEffect } from 'react';
import { DetailLayout } from '../components/common/DetailLayout';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { ProgressBar } from '../components/common/ProgressBar';
import { WbsTypeBadge } from '../components/common/WbsTypeBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { apiRequest } from '../services/api';
import { Task, Project } from '../types';
import { CheckSquare, Calendar, User, Clock, Layers, FileText, CheckCircle2 } from 'lucide-react';
import { showSuccess, showError } from '../utils/toast';

interface TaskDetailPageProps {
  projectId: number;
  taskId: number;
  onNavigate: (page: string) => void;
}

export const TaskDetailPage: React.FC<TaskDetailPageProps> = ({
  projectId,
  taskId,
  onNavigate,
}) => {
  const [task, setTask] = useState<Task | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTaskDetails = async () => {
    setIsLoading(true);
    const [tRes, pRes] = await Promise.all([
      apiRequest<Task>(`/tasks/${taskId}`),
      apiRequest<Project>(`/projects/${projectId}`),
    ]);
    if (tRes.success && tRes.data) setTask(tRes.data);
    if (pRes.success && pRes.data) setProject(pRes.data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (taskId) fetchTaskDetails();
  }, [taskId]);

  const handleMarkComplete = async () => {
    const res = await apiRequest(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'completed', progress_percentage: 100 }),
    });
    if (res.success) {
      showSuccess('Task marked as completed.');
      fetchTaskDetails();
    } else {
      showError(res.message || 'Failed to update task.');
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
        <LoadingSpinner />
        <span style={{ color: 'var(--text-secondary)' }}>Loading task details...</span>
      </div>
    );
  }

  if (!task) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <h2>Task Not Found</h2>
        <Button onClick={() => onNavigate(`project/workspace/${projectId}/tasks`)} variant="secondary" style={{ marginTop: '1rem' }}>
          Back to Tasks
        </Button>
      </div>
    );
  }

  const breadcrumbs = [
    { label: 'Project', onClick: () => onNavigate('project/workspace') },
    { label: project?.project_name || 'Project Workspace', onClick: () => onNavigate(`project/workspace/${projectId}/tasks`) },
    { label: 'Task Management', onClick: () => onNavigate(`project/workspace/${projectId}/tasks`) },
    { label: task.task_code || 'Task Details' },
  ];

  const planned = Number(task.planned_hours) || 0;
  const actual = Number(task.actual_hours) || 0;
  const remaining = Math.max(planned - actual, 0);
  const extra = Math.max(actual - planned, 0);

  return (
    <DetailLayout
      breadcrumbs={breadcrumbs}
      title={`${task.task_code} - ${task.task_name}`}
      subtitle={`Project: ${project?.project_name || 'N/A'}`}
      badge={
        <Badge variant={task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'warning' : 'info'}>
          {task.status}
        </Badge>
      }
      onBack={() => onNavigate(`project/workspace/${projectId}/tasks`)}
      onEdit={() => onNavigate(`project/workspace/${projectId}/tasks/${taskId}/edit`)}
      extraActions={
        task.status !== 'completed' && (
          <Button
            variant="success"
            onClick={handleMarkComplete}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={15} />
            <span>Mark Complete</span>
          </Button>
        )
      }
    >
      {/* 1. Key Metrics & Progress */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>WBS Node</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem' }}>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {task.wbs_name || task.wbs_code || 'WBS Discipline'}
            </span>
            {task.wbs_type && <WbsTypeBadge type={task.wbs_type} size="sm" />}
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Assignee</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <User size={16} color="#4ade80" />
            <span>{task.assigned_employee_name || task.assigned_labour_name || 'Unassigned'}</span>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Timeline</div>
          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.35rem' }}>
            {task.start_date ? new Date(task.start_date).toLocaleDateString() : 'N/A'} - {task.end_date ? new Date(task.end_date).toLocaleDateString() : 'N/A'}
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Progress</div>
          <div style={{ marginTop: '0.35rem' }}>
            <ProgressBar progress={task.progress_percentage || 0} />
          </div>
        </div>
      </div>

      {/* 2. Hours Breakdown */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          padding: '1.5rem',
        }}
      >
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={17} color="#6366f1" />
          <span>Hours Breakdown</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', borderRadius: '8px', background: 'var(--border-color)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>PLANNED HOURS</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>{planned.toFixed(2)} hrs</div>
          </div>

          <div style={{ padding: '1rem', borderRadius: '8px', background: 'var(--border-color)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>ACTUAL HOURS</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.25rem' }}>{actual.toFixed(2)} hrs</div>
          </div>

          <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <div style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 600 }}>REMAINING HOURS</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#818cf8', marginTop: '0.25rem' }}>{remaining.toFixed(2)} hrs</div>
          </div>

          <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>EXTRA / OVERTIME</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ef4444', marginTop: '0.25rem' }}>{extra.toFixed(2)} hrs</div>
          </div>
        </div>
      </div>

      {/* 3. Description */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          padding: '1.5rem',
        }}
      >
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.75rem 0' }}>
          Description & Work Scope
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
          {task.description || 'No additional scope description provided for this task.'}
        </p>
      </div>
    </DetailLayout>
  );
};
