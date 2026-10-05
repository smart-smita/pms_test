import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Clock,
  DollarSign,
  ChevronDown,
  ChevronRight,
  Save,
  X,
  Briefcase,
  Package,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

interface PlanningWbsTabProps {
  planning: any;
  onUpdateWbsList: (updatedWbs: any[]) => void;
  isReadOnly?: boolean;
}

export const PlanningWbsTab: React.FC<PlanningWbsTabProps> = ({
  planning,
  onUpdateWbsList,
  isReadOnly = false,
}) => {
  const wbsList = planning.wbs || [];
  const tasksList = planning.tasks || [];
  const labourList = planning.labour || [];
  const materialList = planning.materials || [];

  const [expandedWbs, setExpandedWbs] = useState<Record<number, boolean>>({});
  const [editingWbsId, setEditingWbsId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  // Add WBS Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newWbsName, setNewWbsName] = useState('');
  const [newWbsCode, setNewWbsCode] = useState('');
  const [newWbsType, setNewWbsType] = useState<'labour' | 'material' | 'both'>('labour');
  const [newWbsStartDate, setNewWbsStartDate] = useState(planning.start_date || '');
  const [newWbsEndDate, setNewWbsEndDate] = useState(planning.end_date || '');
  const [newWbsDuration, setNewWbsDuration] = useState(5);
  const [newWbsBudget, setNewWbsBudget] = useState(0);

  const toggleExpand = (id: number) => {
    setExpandedWbs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStartEdit = (wbs: any) => {
    if (isReadOnly) return;
    setEditingWbsId(wbs.id);
    setEditForm({ ...wbs });
  };

  const handleSaveEdit = () => {
    if (!editingWbsId) return;
    const updated = wbsList.map((w: any) => (w.id === editingWbsId ? { ...editForm } : w));
    onUpdateWbsList(updated);
    setEditingWbsId(null);
  };

  const handleCancelEdit = () => {
    setEditingWbsId(null);
  };

  const handleDeleteWbs = (id: number) => {
    if (isReadOnly) return;
    if (confirm('Are you sure you want to remove this WBS discipline? Its child tasks will also be removed.')) {
      const updated = wbsList.filter((w: any) => w.id !== id);
      onUpdateWbsList(updated);
    }
  };

  const handleCreateWbs = () => {
    if (!newWbsName.trim()) return;

    const newWbs = {
      id: undefined, // newly created
      wbs_name: newWbsName.trim(),
      wbs_code: newWbsCode.trim() || `WBS-${wbsList.length + 1}`,
      wbs_type: newWbsType,
      unit: newWbsType === 'material' ? 'Nos' : 'hours',
      planned_quantity: 1,
      rate: Number(newWbsBudget || 0),
      budget_amount: Number(newWbsBudget || 0),
      planned_hours: newWbsType === 'material' ? 0 : 40,
      planned_labour_cost: newWbsType === 'material' ? 0 : Number(newWbsBudget || 0),
      planned_material_cost: newWbsType === 'material' ? Number(newWbsBudget || 0) : 0,
      planned_other_cost: 0,
      start_date: newWbsStartDate || null,
      end_date: newWbsEndDate || null,
      duration: newWbsDuration,
      baseline_start: newWbsStartDate || null,
      baseline_end: newWbsEndDate || null,
      baseline_duration: newWbsDuration,
    };

    onUpdateWbsList([...wbsList, newWbs]);
    setIsAddModalOpen(false);
    setNewWbsName('');
    setNewWbsCode('');
    setNewWbsBudget(0);
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
            <Layers size={18} color="var(--accent-primary)" />
            Work Breakdown Structure ({wbsList.length} Disciplines)
          </h3>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Review baseline dates vs current planned schedule, adjust duration, and inspect child task roll-ups.
          </p>
        </div>

        {!isReadOnly && (
          <Button
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <Plus size={16} /> Add WBS Discipline
          </Button>
        )}
      </div>

      {/* ── WBS TABLE ────────────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '0.85rem 1rem', width: '40px' }}></th>
              <th style={{ padding: '0.85rem 1rem' }}>WBS Name & Code</th>
              <th style={{ padding: '0.85rem 1rem' }}>Type</th>
              <th style={{ padding: '0.85rem 1rem' }}>Baseline Dates</th>
              <th style={{ padding: '0.85rem 1rem' }}>Current Planned Dates</th>
              <th style={{ padding: '0.85rem 1rem' }}>Working Days</th>
              <th style={{ padding: '0.85rem 1rem' }}>Labour Cost</th>
              <th style={{ padding: '0.85rem 1rem' }}>Material Cost</th>
              <th style={{ padding: '0.85rem 1rem' }}>Total Budget</th>
              {!isReadOnly && <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {wbsList.map((wbs: any, idx: number) => {
              const isEditing = editingWbsId === wbs.id;
              const isExpanded = !!expandedWbs[wbs.id];
              const childTasks = tasksList.filter((t: any) => t.planning_wbs_id === wbs.id);
              const childLabour = labourList.filter((l: any) => l.planning_wbs_id === wbs.id);
              const childMaterials = materialList.filter((m: any) => m.planning_wbs_id === wbs.id);

              return (
                <React.Fragment key={wbs.id || idx}>
                  <tr
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      background: isEditing ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                    }}
                  >
                    {/* Expand toggle */}
                    <td style={{ padding: '0.85rem 0.5rem 0.85rem 1rem', textAlign: 'center' }}>
                      <button
                        onClick={() => toggleExpand(wbs.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                      >
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </td>

                    {/* WBS Name & Code */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          <input
                            type="text"
                            className="form-input"
                            value={editForm.wbs_name || ''}
                            onChange={(e) => setEditForm({ ...editForm, wbs_name: e.target.value })}
                            style={{ fontSize: '0.85rem', padding: '0.3rem 0.5rem' }}
                          />
                          <input
                            type="text"
                            className="form-input"
                            placeholder="WBS Code"
                            value={editForm.wbs_code || ''}
                            onChange={(e) => setEditForm({ ...editForm, wbs_code: e.target.value })}
                            style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem' }}
                          />
                        </div>
                      ) : (
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{wbs.wbs_name}</span>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{wbs.wbs_code || `WBS-${idx + 1}`}</div>
                        </div>
                      )}
                    </td>

                    {/* Type */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <Badge variant={wbs.wbs_type === 'material' ? 'warning' : wbs.wbs_type === 'both' ? 'info' : 'success'}>
                        {wbs.wbs_type?.toUpperCase()}
                      </Badge>
                    </td>

                    {/* Baseline Dates */}
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      <div>{wbs.baseline_start ? String(wbs.baseline_start).split('T')[0] : 'N/A'}</div>
                      <div>→ {wbs.baseline_end ? String(wbs.baseline_end).split('T')[0] : 'N/A'}</div>
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
                          <div>{wbs.start_date ? String(wbs.start_date).split('T')[0] : 'TBD'}</div>
                          <div style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>
                            → {wbs.end_date ? String(wbs.end_date).split('T')[0] : 'TBD'}
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
                        <Badge variant="info">{wbs.duration || 0} Days</Badge>
                      )}
                    </td>

                    {/* Labour Cost */}
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                      ₹{Number(wbs.planned_labour_cost || 0).toLocaleString()}
                    </td>

                    {/* Material Cost */}
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                      ₹{Number(wbs.planned_material_cost || 0).toLocaleString()}
                    </td>

                    {/* Total Budget */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {isEditing ? (
                        <input
                          type="number"
                          className="form-input"
                          value={editForm.budget_amount || 0}
                          onChange={(e) => setEditForm({ ...editForm, budget_amount: Number(e.target.value) })}
                          style={{ width: '90px', fontSize: '0.8rem', padding: '0.2rem 0.4rem' }}
                        />
                      ) : (
                        <span style={{ fontWeight: 700, color: 'var(--success)' }}>
                          ₹{Number(wbs.budget_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </td>

                    {/* Action Buttons */}
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
                            <Button variant="secondary" onClick={() => handleStartEdit(wbs)} style={{ padding: '0.3rem 0.5rem' }}>
                              <Edit2 size={13} />
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() => handleDeleteWbs(wbs.id)}
                              style={{ padding: '0.3rem 0.5rem', color: 'var(--danger)' }}
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>

                  {/* Expanded child section: Tasks, Labour, Materials preview */}
                  {isExpanded && (
                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                      <td colSpan={10} style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                          {/* Child Tasks */}
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Briefcase size={14} color="var(--accent-primary)" /> Tasks ({childTasks.length})
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                              {childTasks.map((t: any) => (
                                <div
                                  key={t.id}
                                  style={{
                                    padding: '0.45rem 0.75rem',
                                    borderRadius: '6px',
                                    background: 'var(--bg-primary)',
                                    border: '1px solid var(--border-color)',
                                    fontSize: '0.8rem',
                                    display: 'flex',
                                    gap: '0.6rem',
                                    alignItems: 'center',
                                  }}
                                >
                                  <strong>{t.task_name}</strong>
                                  <span style={{ color: 'var(--text-secondary)' }}>
                                    {t.start_date ? String(t.start_date).split('T')[0] : 'TBD'} → {t.end_date ? String(t.end_date).split('T')[0] : 'TBD'}
                                  </span>
                                  <Badge variant="neutral">{t.duration}d</Badge>
                                </div>
                              ))}
                              {childTasks.length === 0 && (
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No tasks under this WBS yet.</span>
                              )}
                            </div>
                          </div>

                          {/* Child Labour & Materials summary */}
                          <div style={{ display: 'flex', gap: '2rem', fontSize: '0.8rem', color: 'var(--text-secondary)', borderTop: '1px dashed var(--border-color)', paddingTop: '0.5rem' }}>
                            <span>Labour items: <strong>{childLabour.length}</strong> (Planned: ₹{childLabour.reduce((sum: number, l: any) => sum + Number(l.amount || 0), 0).toLocaleString()})</span>
                            <span>Material items: <strong>{childMaterials.length}</strong> (Planned: ₹{childMaterials.reduce((sum: number, m: any) => sum + Number(m.amount || 0), 0).toLocaleString()})</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {wbsList.length === 0 && (
              <tr>
                <td colSpan={10} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No WBS disciplines configured. Click "Add WBS Discipline" to start.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── ADD WBS MODAL ────────────────────────────────────────────── */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Work Breakdown Structure (WBS)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="form-label">WBS Name / Discipline *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Foundation & Structural Work"
              value={newWbsName}
              onChange={(e) => setNewWbsName(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">WBS Code</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., WBS-01"
                value={newWbsCode}
                onChange={(e) => setNewWbsCode(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">WBS Type</label>
              <select
                className="form-select"
                value={newWbsType}
                onChange={(e: any) => setNewWbsType(e.target.value)}
              >
                <option value="labour">Labour Only</option>
                <option value="material">Material Only</option>
                <option value="both">Combined (Labour + Material)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Planned Start Date</label>
              <input
                type="date"
                className="form-input"
                value={newWbsStartDate}
                onChange={(e) => setNewWbsStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Planned End Date</label>
              <input
                type="date"
                className="form-input"
                value={newWbsEndDate}
                onChange={(e) => setNewWbsEndDate(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Duration (Working Days)</label>
              <input
                type="number"
                className="form-input"
                value={newWbsDuration}
                onChange={(e) => setNewWbsDuration(Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Estimated Budget Amount (₹)</label>
            <input
              type="number"
              className="form-input"
              value={newWbsBudget}
              onChange={(e) => setNewWbsBudget(Number(e.target.value))}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateWbs}>
              Add WBS
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
