import React, { useEffect, useState } from 'react';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { apiRequest } from '../services/api';
import { Task, Project, Employee } from '../types';
import { CheckSquare, Plus, Edit, UserCheck, AlertTriangle, Clock } from 'lucide-react';

export const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form State
  const [projectId, setProjectId] = useState<number>(0);
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [requiredWorkerCount, setRequiredWorkerCount] = useState<number>(1);
  const [estimatedHours, setEstimatedHours] = useState<number>(10);
  const [startDate, setStartDate] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [status, setStatus] = useState<'pending' | 'in-progress' | 'completed' | 'delayed'>('pending');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    const [tRes, pRes, eRes] = await Promise.all([
      apiRequest<Task[]>('/tasks'),
      apiRequest<Project[]>('/projects'),
      apiRequest<Employee[]>('/employees'),
    ]);

    if (tRes.success && tRes.data) setTasks(tRes.data);
    if (pRes.success && pRes.data) setProjects(pRes.data);
    if (eRes.success && eRes.data) setEmployees(eRes.data);

    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingTask(null);
    setProjectId(projects[0]?.project_id || 0);
    setTaskName('');
    setDescription('');
    setRequiredWorkerCount(2);
    setEstimatedHours(40);
    setStartDate(new Date().toISOString().split('T')[0]);
    setTargetDate('');
    setStatus('pending');
    setSelectedEmployeeIds([]);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (t: Task) => {
    setEditingTask(t);
    setProjectId(t.project_id);
    setTaskName(t.task_name);
    setDescription(t.description || '');
    setRequiredWorkerCount(t.required_worker_count);
    setEstimatedHours(Number(t.estimated_hours));
    setStartDate(t.start_date || '');
    setTargetDate(t.target_date || '');
    setStatus(t.status);
    setSelectedEmployeeIds(t.assigned_employees ? t.assigned_employees.map((e) => e.employee_id) : []);
    setError(null);
    setIsModalOpen(true);
  };

  const toggleEmployeeSelection = (empId: number) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload: any = {
      project_id: projectId,
      task_name: taskName,
      description,
      required_worker_count: requiredWorkerCount,
      estimated_hours: estimatedHours,
      start_date: startDate || undefined,
      target_date: targetDate || undefined,
      status,
      assigned_employee_ids: selectedEmployeeIds,
    };

    if (editingTask) {
      const res = await apiRequest(`/tasks/${editingTask.task_id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (res.success) {
        setIsModalOpen(false);
        fetchData();
      } else {
        setError(res.message || 'Failed to update task');
      }
    } else {
      const res = await apiRequest('/tasks', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.success) {
        setIsModalOpen(false);
        fetchData();
      } else {
        setError(res.message || 'Failed to create task');
      }
    }
  };

  const getProductivityBadge = (prod: Task['productivity_status']) => {
    switch (prod) {
      case 'on-time':
      case 'completed':
        return <Badge variant="success">On-Time</Badge>;
      case 'extra-hours-logged':
      case 'exceeding-estimate':
        return <Badge variant="danger">Exceeding Est.</Badge>;
      case 'delayed':
        return <Badge variant="warning">Delayed Schedule</Badge>;
      default:
        return <Badge variant="info">{prod}</Badge>;
    }
  };

  const columns: Column<Task>[] = [
    { header: 'Task Name', accessor: 'task_name' },
    { header: 'Project', accessor: (r) => r.project_name || '-' },
    {
      header: 'Staffing',
      accessor: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span>
            {r.assigned_worker_count} / {r.required_worker_count} Workers
          </span>
          {r.is_understaffed && (
            <span style={{ color: '#ef4444', display: 'inline-flex', alignItems: 'center' }} title="Under-staffed task!">
              <AlertTriangle size={15} />
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Planned vs Actual',
      accessor: (r) => (
        <div>
          <div style={{ fontSize: '0.85rem' }}>
            <span style={{ color: '#94a3b8' }}>Est:</span> {r.estimated_hours}h |{' '}
            <span style={{ color: '#818cf8', fontWeight: 700 }}>Act:</span> {r.actual_hours}h
          </div>
          <div style={{ marginTop: '0.2rem' }}>{getProductivityBadge(r.productivity_status)}</div>
        </div>
      ),
    },
    {
      header: 'Target Date',
      accessor: (r) => r.target_date || 'No deadline',
    },
    {
      header: 'Status',
      accessor: (r) => (
        <Badge
          variant={
            r.status === 'completed'
              ? 'success'
              : r.status === 'in-progress'
              ? 'info'
              : r.status === 'delayed'
              ? 'danger'
              : 'warning'
          }
        >
          {r.status}
        </Badge>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Task Management & Staffing</h1>
          <p className="page-subtitle">Allocate worker crews, monitor under-staffing flags, and compare planned vs actual logged hours</p>
        </div>
        <Button variant="primary" onClick={openCreateModal}>
          <Plus size={18} /> Create Task
        </Button>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="glass-card">
          <DataTable
            columns={columns}
            data={tasks}
            searchPlaceholder="Search tasks by name or project..."
            exportFilename="tasks_list.csv"
            actions={(row) => (
              <Button variant="secondary" onClick={() => openEditModal(row)} style={{ padding: '0.35rem 0.65rem' }}>
                <Edit size={14} /> Edit
              </Button>
            )}
          />
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTask ? 'Edit Task Details' : 'Create Project Task'}>
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <FormSelect
            label="Project"
            value={projectId}
            onChange={(e) => setProjectId(parseInt(e.target.value, 10))}
            options={projects.map((p) => ({ value: p.project_id, label: `${p.project_code} - ${p.project_name}` }))}
          />

          <FormInput label="Task Name" type="text" value={taskName} onChange={(e) => setTaskName(e.target.value)} required />
          <FormInput label="Description" type="text" value={description} onChange={(e) => setDescription(e.target.value)} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormInput
              label="Required Worker Count"
              type="number"
              min="1"
              value={requiredWorkerCount}
              onChange={(e) => setRequiredWorkerCount(parseInt(e.target.value, 10))}
              required
            />

            <FormInput
              label="Estimated Hours"
              type="number"
              step="0.5"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(parseFloat(e.target.value))}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormInput label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <FormInput label="Target Date" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </div>

          <FormSelect
            label="Task Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'in-progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'delayed', label: 'Delayed' },
            ]}
          />

          {/* Worker Assignment Section */}
          <div className="form-group">
            <label className="form-label">
              Assign Workers ({selectedEmployeeIds.length} assigned / {requiredWorkerCount} required)
            </label>
            <div
              style={{
                maxHeight: '140px',
                overflowY: 'auto',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '0.5rem',
                background: 'rgba(15, 23, 42, 0.6)',
              }}
            >
              {employees.map((emp) => {
                const isSelected = selectedEmployeeIds.includes(emp.employee_id);
                return (
                  <div
                    key={emp.employee_id}
                    onClick={() => toggleEmployeeSelection(emp.employee_id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.4rem 0.6rem',
                      marginBottom: '0.2rem',
                      borderRadius: '4px',
                      background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    <span>
                      {emp.name} ({emp.employee_code}) - ₹{emp.hourly_rate}/hr
                    </span>
                    {isSelected && <UserCheck size={16} color="#818cf8" />}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingTask ? 'Save Task' : 'Create Task'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
