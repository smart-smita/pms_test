import React, { useState } from 'react';
import {
  Briefcase,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Clock,
  DollarSign,
  Save,
  X,
  Filter,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

interface PlanningTasksTabProps {
  planning: any;
  onUpdateTasksList: (updatedTasks: any[]) => void;
  isReadOnly?: boolean;
}

export const PlanningTasksTab: React.FC<PlanningTasksTabProps> = ({
  planning,
  onUpdateTasksList,
  isReadOnly = false,
}) => {
  const tasksList = planning.tasks || [];
  const wbsList = planning.wbs || [];

  const [selectedWbsFilter, setSelectedWbsFilter] = useState<string>('all');
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  // Add Task Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTaskWbsId, setNewTaskWbsId] = useState<number>(wbsList[0]?.id || 0);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskCode, setNewTaskCode] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [newTaskStartDate, setNewTaskStartDate] = useState(planning.start_date || '');
  const [newTaskEndDate, setNewTaskEndDate] = useState(planning.end_date || '');
  const [newTaskDuration, setNewTaskDuration] = useState(3);
  const [newTaskHours, setNewTaskHours] = useState(24);
  const [newTaskLabourCost, setNewTaskLabourCost] = useState(0);
  const [newTaskMaterialCost, setNewTaskMaterialCost] = useState(0);

  const filteredTasks = tasksList.filter((t: any) => {
    if (selectedWbsFilter === 'all') return true;
    return String(t.planning_wbs_id) === selectedWbsFilter;
  });

  const handleStartEdit = (task: any) => {
    if (isReadOnly) return;
    setEditingTaskId(task.id);
    setEditForm({ ...task });
  };

  const handleSaveEdit = () => {
    if (!editingTaskId) return;
    const updated = tasksList.map((t: any) =>
      t.id === editingTaskId ? { ...editForm, manually_adjusted: 1 } : t
    );
    onUpdateTasksList(updated);
    setEditingTaskId(null);
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
  };

  const handleDeleteTask = (id: number) => {
    if (isReadOnly) return;
    if (confirm('Are you sure you want to delete this task?')) {
      const updated = tasksList.filter((t: any) => t.id !== id);
      onUpdateTasksList(updated);
    }
  };

  const handleCreateTask = () => {
    if (!newTaskName.trim() || !newTaskWbsId) return;

    const parentWbs = wbsList.find((w: any) => w.id === Number(newTaskWbsId));
    const newTask = {
      id: undefined,
      planning_wbs_id: Number(newTaskWbsId),
      wbs_name: parentWbs?.wbs_name || 'WBS',
      task_name: newTaskName.trim(),
      task_code: newTaskCode.trim() || `TSK-${tasksList.length + 1}`,
      priority: newTaskPriority,
      start_date: newTaskStartDate || null,
      end_date: newTaskEndDate || null,
      duration: newTaskDuration,
      baseline_start: newTaskStartDate || null,
      baseline_end: newTaskEndDate || null,
      baseline_duration: newTaskDuration,
      planned_hours: newTaskHours,
      planned_labour_cost: Number(newTaskLabourCost || 0),
      planned_material_cost: Number(newTaskMaterialCost || 0),
      planned_other_cost: 0,
      manually_adjusted: 0,
      status: 'pending',
    };

    onUpdateTasksList([...tasksList, newTask]);
    setIsAddModalOpen(false);
    setNewTaskName('');
    setNewTaskCode('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ── TOOLBAR & FILTER BAR ─────────────────────────────────────── */}
      <div
        className="glass-card"
        style={{
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Briefcase size={18} color="var(--accent-primary)" />
              Task Execution Planning ({tasksList.length} Tasks)
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Configure task schedules, working day durations, cost allocations, and priority levels.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={15} color="var(--text-muted)" />
            <select
              className="form-select"
              value={selectedWbsFilter}
              onChange={(e) => setSelectedWbsFilter(e.target.value)}
              style={{ fontSize: '0.82rem', minWidth: '180px' }}
            >
              <option value="all">All WBS Disciplines ({tasksList.length})</option>
              {wbsList.map((w: any) => (
                <option key={w.id} value={String(w.id)}>
                  {w.wbs_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!isReadOnly && (
          <Button
            variant="primary"
            onClick={() => {
              if (wbsList.length > 0) {
                setNewTaskWbsId(wbsList[0].id);
                setIsAddModalOpen(true);
              }
            }}
            disabled={wbsList.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <Plus size={16} /> Add Task
          </Button>
        )}
      </div>

      {/* ── TASKS TABLE ──────────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '0.85rem 1rem' }}>Task Name & Code</th>
              <th style={{ padding: '0.85rem 1rem' }}>Parent WBS</th>
              <th style={{ padding: '0.85rem 1rem' }}>Priority</th>
              <th style={{ padding: '0.85rem 1rem' }}>Baseline Schedule</th>
              <th style={{ padding: '0.85rem 1rem' }}>Current Planned Dates</th>
              <th style={{ padding: '0.85rem 1rem' }}>Working Days</th>
              <th style={{ padding: '0.85rem 1rem' }}>Planned Hours</th>
              <th style={{ padding: '0.85rem 1rem' }}>Labour Cost</th>
              <th style={{ padding: '0.85rem 1rem' }}>Material Cost</th>
              {!isReadOnly && <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task: any, idx: number) => {
              const isEditing = editingTaskId === task.id;
              const parentWbs = wbsList.find((w: any) => w.id === task.planning_wbs_id);

              return (
                <tr
                  key={task.id || idx}
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                    background: isEditing ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                  }}
                >
                  {/* Task Name & Code */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <input
                          type="text"
                          className="form-input"
                          value={editForm.task_name || ''}
                          onChange={(e) => setEditForm({ ...editForm, task_name: e.target.value })}
                          style={{ fontSize: '0.85rem', padding: '0.3rem 0.5rem' }}
                        />
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Task Code"
                          value={editForm.task_code || ''}
                          onChange={(e) => setEditForm({ ...editForm, task_code: e.target.value })}
                          style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem' }}
                        />
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {task.task_name}
                          {task.manually_adjusted ? (
                            <span title="Manually Adjusted" style={{ color: 'var(--accent-primary)', fontSize: '0.7rem' }}>
                              ⚡
                            </span>
                          ) : null}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{task.task_code || `TSK-${idx + 1}`}</div>
                      </div>
                    )}
                  </td>

                  {/* Parent WBS */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {isEditing ? (
                      <select
                        className="form-select"
                        value={editForm.planning_wbs_id}
                        onChange={(e) => setEditForm({ ...editForm, planning_wbs_id: Number(e.target.value) })}
                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.4rem' }}
                      >
                        {wbsList.map((w: any) => (
                          <option key={w.id} value={w.id}>
                            {w.wbs_name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Badge variant="neutral">{task.wbs_name || parentWbs?.wbs_name || 'WBS'}</Badge>
                    )}
                  </td>

                  {/* Priority */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {isEditing ? (
                      <select
                        className="form-select"
                        value={editForm.priority || 'medium'}
                        onChange={(e: any) => setEditForm({ ...editForm, priority: e.target.value })}
                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.4rem' }}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    ) : (
                      <Badge
                        variant={
                          task.priority === 'critical'
                            ? 'danger'
                            : task.priority === 'high'
                            ? 'warning'
                            : task.priority === 'low'
                            ? 'neutral'
                            : 'info'
                        }
                      >
                        {task.priority?.toUpperCase() || 'MEDIUM'}
                      </Badge>
                    )}
                  </td>

                  {/* Baseline Dates */}
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <div>{task.baseline_start ? String(task.baseline_start).split('T')[0] : 'N/A'}</div>
                    <div>→ {task.baseline_end ? String(task.baseline_end).split('T')[0] : 'N/A'}</div>
                  </td>

                  {/* Current Planned Dates */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <input
                          type="date"
                          className="form-input"
                          value={editForm.start_date ? String(editForm.start_date).split('T')[0] : ''}
                          onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                          style={{ fontSize: '0.78rem', padding: '0.2rem 0.4rem' }}
                        />
                        <input
                          type="date"
                          className="form-input"
                          value={editForm.end_date ? String(editForm.end_date).split('T')[0] : ''}
                          onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                          style={{ fontSize: '0.78rem', padding: '0.2rem 0.4rem' }}
                        />
                      </div>
                    ) : (
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        <div>{task.start_date ? String(task.start_date).split('T')[0] : 'TBD'}</div>
                        <div style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>
                          → {task.end_date ? String(task.end_date).split('T')[0] : 'TBD'}
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Working Days Duration */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {isEditing ? (
                      <input
                        type="number"
                        className="form-input"
                        value={editForm.duration || 1}
                        onChange={(e) => setEditForm({ ...editForm, duration: Number(e.target.value) })}
                        style={{ width: '60px', fontSize: '0.8rem', padding: '0.2rem 0.4rem' }}
                      />
                    ) : (
                      <Badge variant="info">{task.duration || 1} Days</Badge>
                    )}
                  </td>

                  {/* Planned Hours */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {isEditing ? (
                      <input
                        type="number"
                        className="form-input"
                        value={editForm.planned_hours || 0}
                        onChange={(e) => setEditForm({ ...editForm, planned_hours: Number(e.target.value) })}
                        style={{ width: '65px', fontSize: '0.8rem', padding: '0.2rem 0.4rem' }}
                      />
                    ) : (
                      <span>{task.planned_hours || 0} hrs</span>
                    )}
                  </td>

                  {/* Labour Cost */}
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                    {isEditing ? (
                      <input
                        type="number"
                        className="form-input"
                        value={editForm.planned_labour_cost || 0}
                        onChange={(e) => setEditForm({ ...editForm, planned_labour_cost: Number(e.target.value) })}
                        style={{ width: '80px', fontSize: '0.8rem', padding: '0.2rem 0.4rem' }}
                      />
                    ) : (
                      `₹${Number(task.planned_labour_cost || 0).toLocaleString()}`
                    )}
                  </td>

                  {/* Material Cost */}
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                    {isEditing ? (
                      <input
                        type="number"
                        className="form-input"
                        value={editForm.planned_material_cost || 0}
                        onChange={(e) => setEditForm({ ...editForm, planned_material_cost: Number(e.target.value) })}
                        style={{ width: '80px', fontSize: '0.8rem', padding: '0.2rem 0.4rem' }}
                      />
                    ) : (
                      `₹${Number(task.planned_material_cost || 0).toLocaleString()}`
                    )}
                  </td>

                  {/* Actions */}
                  {!isReadOnly && (
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'flex-end' }}>
                          <Button variant="primary" onClick={handleSaveEdit} style={{ padding: '0.3rem 0.5rem' }}>
                            <Save size={13} />
                          </Button>
                          <Button variant="secondary" onClick={handleCancelEdit} style={{ padding: '0.3rem 0.5rem' }}>
                            <X size={13} />
                          </Button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'flex-end' }}>
                          <Button variant="secondary" onClick={() => handleStartEdit(task)} style={{ padding: '0.3rem 0.5rem' }}>
                            <Edit2 size={13} />
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => handleDeleteTask(task.id)}
                            style={{ padding: '0.3rem 0.5rem', color: 'var(--danger)' }}
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
            {filteredTasks.length === 0 && (
              <tr>
                <td colSpan={10} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No tasks found under this filter. Click "Add Task" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── ADD TASK MODAL ───────────────────────────────────────────── */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Planning Task">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="form-label">Parent WBS Discipline *</label>
            <select
              className="form-select"
              value={newTaskWbsId}
              onChange={(e) => setNewTaskWbsId(Number(e.target.value))}
            >
              {wbsList.map((w: any) => (
                <option key={w.id} value={w.id}>
                  {w.wbs_name} ({w.wbs_code || `WBS-${w.id}`})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Task Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Trench excavation & surface clearing"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Task Code</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., TSK-01-01"
                value={newTaskCode}
                onChange={(e) => setNewTaskCode(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Priority Level</label>
              <select
                className="form-select"
                value={newTaskPriority}
                onChange={(e: any) => setNewTaskPriority(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-input"
                value={newTaskStartDate}
                onChange={(e) => setNewTaskStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-input"
                value={newTaskEndDate}
                onChange={(e) => setNewTaskEndDate(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Duration (Days)</label>
              <input
                type="number"
                className="form-input"
                value={newTaskDuration}
                onChange={(e) => setNewTaskDuration(Number(e.target.value))}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Planned Hours</label>
              <input
                type="number"
                className="form-input"
                value={newTaskHours}
                onChange={(e) => setNewTaskHours(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="form-label">Labour Cost (₹)</label>
              <input
                type="number"
                className="form-input"
                value={newTaskLabourCost}
                onChange={(e) => setNewTaskLabourCost(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="form-label">Material Cost (₹)</label>
              <input
                type="number"
                className="form-input"
                value={newTaskMaterialCost}
                onChange={(e) => setNewTaskMaterialCost(Number(e.target.value))}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateTask}>
              Create Task
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
