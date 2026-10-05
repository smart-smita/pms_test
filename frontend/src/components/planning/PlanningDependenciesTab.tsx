import React, { useState } from 'react';
import {
  History,
  Plus,
  Trash2,
  AlertTriangle,
  ArrowRight,
  RefreshCcw,
  CheckCircle,
  HelpCircle,
  Layers,
  GitBranch,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

interface PlanningDependenciesTabProps {
  planning: any;
  onUpdateDependencies: (updatedDeps: any[]) => void;
  onRecalculateSchedule: () => void;
  isReadOnly?: boolean;
}

export const PlanningDependenciesTab: React.FC<PlanningDependenciesTabProps> = ({
  planning,
  onUpdateDependencies,
  onRecalculateSchedule,
  isReadOnly = false,
}) => {
  const tasksList = planning.tasks || [];
  const dependenciesList = planning.dependencies || [];

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number>(tasksList[1]?.id || tasksList[0]?.id || 0);
  const [selectedPredecessorId, setSelectedPredecessorId] = useState<number>(tasksList[0]?.id || 0);
  const [selectedType, setSelectedType] = useState<'FS' | 'SS' | 'FF' | 'SF'>('FS');
  const [lagDays, setLagDays] = useState<number>(0);

  const dependencyTypeLabels: Record<string, { label: string; desc: string; badgeVariant: 'info' | 'success' | 'warning' | 'neutral' }> = {
    FS: { label: 'Finish-to-Start (FS)', desc: 'Task starts after predecessor finishes', badgeVariant: 'info' },
    SS: { label: 'Start-to-Start (SS)', desc: 'Task starts concurrently with predecessor', badgeVariant: 'success' },
    FF: { label: 'Finish-to-Finish (FF)', desc: 'Task finishes when predecessor finishes', badgeVariant: 'warning' },
    SF: { label: 'Start-to-Finish (SF)', desc: 'Task finishes when predecessor starts', badgeVariant: 'neutral' },
  };

  const handleAddDependency = () => {
    if (!selectedTaskId || !selectedPredecessorId) return;
    if (selectedTaskId === selectedPredecessorId) {
      alert('A task cannot depend on itself!');
      return;
    }

    // Check if already exists
    const exists = dependenciesList.some(
      (d: any) => d.task_id === selectedTaskId && d.predecessor_task_id === selectedPredecessorId
    );
    if (exists) {
      alert('This dependency relationship already exists.');
      return;
    }

    const taskObj = tasksList.find((t: any) => t.id === selectedTaskId);
    const predObj = tasksList.find((t: any) => t.id === selectedPredecessorId);

    const newDep = {
      task_id: selectedTaskId,
      predecessor_task_id: selectedPredecessorId,
      task_name: taskObj?.task_name || `Task ${selectedTaskId}`,
      predecessor_task_name: predObj?.task_name || `Task ${selectedPredecessorId}`,
      dependency_type: selectedType,
      lag_days: Number(lagDays || 0),
    };

    onUpdateDependencies([...dependenciesList, newDep]);
    setIsAddModalOpen(false);
  };

  const handleDeleteDependency = (taskId: number, predId: number) => {
    if (isReadOnly) return;
    const updated = dependenciesList.filter(
      (d: any) => !(d.task_id === taskId && d.predecessor_task_id === predId)
    );
    onUpdateDependencies(updated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ── TOOLBAR ──────────────────────────────────────────────────── */}
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
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GitBranch size={18} color="var(--accent-primary)" />
            Task Dependency Chain & Postpone Automation ({dependenciesList.length} Rules)
          </h3>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            When a predecessor task is postponed or rescheduled, all successor tasks automatically shift by working days.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            variant="secondary"
            onClick={onRecalculateSchedule}
            title="Recalculate all dates according to dependency rules"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
          >
            <RefreshCcw size={14} /> Recalculate Propagation
          </Button>

          {!isReadOnly && (
            <Button
              variant="primary"
              onClick={() => setIsAddModalOpen(true)}
              disabled={tasksList.length < 2}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            >
              <Plus size={16} /> Add Dependency
            </Button>
          )}
        </div>
      </div>

      {/* ── DEPENDENCY PROPAGATION LOGIC EXPLAINER CARD ───────────────── */}
      <div
        style={{
          background: 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '10px',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          fontSize: '0.84rem',
        }}
      >
        <HelpCircle size={22} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
        <div style={{ color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>Automatic Dependency Propagation Engine:</strong> If{' '}
          <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Task A (Predecessor)</span> is delayed by 3 working days,{' '}
          <span style={{ color: 'var(--success)', fontWeight: 600 }}>Task B (Successor)</span> and all subsequent chained tasks automatically move forward while skipping weekends and company holidays.
        </div>
      </div>

      {/* ── DEPENDENCIES TABLE ───────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '0.85rem 1rem' }}>Predecessor Task (Must finish first)</th>
              <th style={{ padding: '0.85rem 1rem', width: '60px', textAlign: 'center' }}>Link</th>
              <th style={{ padding: '0.85rem 1rem' }}>Dependent Task (Successor)</th>
              <th style={{ padding: '0.85rem 1rem' }}>Dependency Type</th>
              <th style={{ padding: '0.85rem 1rem' }}>Lag / Lead Days</th>
              <th style={{ padding: '0.85rem 1rem' }}>Execution Rule</th>
              {!isReadOnly && <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {dependenciesList.map((dep: any, idx: number) => {
              const predTask = tasksList.find((t: any) => t.id === dep.predecessor_task_id);
              const succTask = tasksList.find((t: any) => t.id === dep.task_id);
              const typeInfo = dependencyTypeLabels[dep.dependency_type || 'FS'] || dependencyTypeLabels.FS;

              return (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {/* Predecessor */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {dep.predecessor_task_name || predTask?.task_name || `Task ${dep.predecessor_task_id}`}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Dates: {predTask?.start_date ? String(predTask.start_date).split('T')[0] : 'TBD'} → {predTask?.end_date ? String(predTask.end_date).split('T')[0] : 'TBD'}
                    </div>
                  </td>

                  {/* Arrow Link */}
                  <td style={{ padding: '0.85rem 0.5rem', textAlign: 'center', color: 'var(--accent-primary)' }}>
                    <ArrowRight size={18} />
                  </td>

                  {/* Successor */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {dep.task_name || succTask?.task_name || `Task ${dep.task_id}`}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Dates: {succTask?.start_date ? String(succTask.start_date).split('T')[0] : 'TBD'} → {succTask?.end_date ? String(succTask.end_date).split('T')[0] : 'TBD'}
                    </div>
                  </td>

                  {/* Type */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <Badge variant={typeInfo.badgeVariant}>{typeInfo.label}</Badge>
                  </td>

                  {/* Lag */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {dep.lag_days > 0 ? (
                      <span style={{ color: 'var(--warning)', fontWeight: 600 }}>+{dep.lag_days} days lag</span>
                    ) : dep.lag_days < 0 ? (
                      <span style={{ color: 'var(--info)', fontWeight: 600 }}>{dep.lag_days} days lead</span>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)' }}>0 days (Immediate)</span>
                    )}
                  </td>

                  {/* Description */}
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {typeInfo.desc}
                  </td>

                  {/* Actions */}
                  {!isReadOnly && (
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <Button
                        variant="secondary"
                        onClick={() => handleDeleteDependency(dep.task_id, dep.predecessor_task_id)}
                        style={{ padding: '0.3rem 0.5rem', color: 'var(--danger)' }}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </td>
                  )}
                </tr>
              );
            })}
            {dependenciesList.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No dependencies configured. Tasks will execute concurrently from their initial start dates.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── ADD DEPENDENCY MODAL ─────────────────────────────────────── */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Task Dependency Link">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="form-label">Predecessor Task (Must occur first) *</label>
            <select
              className="form-select"
              value={selectedPredecessorId}
              onChange={(e) => setSelectedPredecessorId(Number(e.target.value))}
            >
              {tasksList.map((t: any) => (
                <option key={t.id} value={t.id} disabled={t.id === selectedTaskId}>
                  {t.task_name} ({t.wbs_name || 'WBS'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Dependent Task (Successor) *</label>
            <select
              className="form-select"
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(Number(e.target.value))}
            >
              {tasksList.map((t: any) => (
                <option key={t.id} value={t.id} disabled={t.id === selectedPredecessorId}>
                  {t.task_name} ({t.wbs_name || 'WBS'})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Dependency Type</label>
              <select
                className="form-select"
                value={selectedType}
                onChange={(e: any) => setSelectedType(e.target.value)}
              >
                <option value="FS">Finish-to-Start (FS) - Standard</option>
                <option value="SS">Start-to-Start (SS) - Concurrent</option>
                <option value="FF">Finish-to-Finish (FF) - Synchronized End</option>
                <option value="SF">Start-to-Finish (SF) - Overlap</option>
              </select>
            </div>

            <div>
              <label className="form-label">Lag Days (Working Days)</label>
              <input
                type="number"
                className="form-input"
                placeholder="0"
                value={lagDays}
                onChange={(e) => setLagDays(Number(e.target.value))}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddDependency}>
              Save Dependency Rule
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
