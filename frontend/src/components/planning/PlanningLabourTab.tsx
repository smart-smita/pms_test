import React, { useState } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Clock,
  DollarSign,
  Save,
  X,
  Filter,
  HardHat,
  Briefcase,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

interface PlanningLabourTabProps {
  planning: any;
  onUpdateLabourList: (updatedLabour: any[]) => void;
  isReadOnly?: boolean;
}

export const PlanningLabourTab: React.FC<PlanningLabourTabProps> = ({
  planning,
  onUpdateLabourList,
  isReadOnly = false,
}) => {
  const labourList = planning.labour || [];
  const wbsList = planning.wbs || [];

  const [selectedWbsFilter, setSelectedWbsFilter] = useState<string>('all');
  const [editingLabourId, setEditingLabourId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  // Add Labour Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newLabourWbsId, setNewLabourWbsId] = useState<number>(wbsList[0]?.id || 0);
  const [newLabourName, setNewLabourName] = useState('');
  const [newLabourType, setNewLabourType] = useState('contractor');
  const [newWorkerCount, setNewWorkerCount] = useState(1);
  const [newHours, setNewHours] = useState(40);
  const [newRate, setNewRate] = useState(500);
  const [newStartDate, setNewStartDate] = useState(planning.start_date || '');
  const [newEndDate, setNewEndDate] = useState(planning.end_date || '');
  const [newNotes, setNewNotes] = useState('');

  const filteredLabour = labourList.filter((l: any) => {
    if (selectedWbsFilter === 'all') return true;
    return String(l.planning_wbs_id) === selectedWbsFilter;
  });

  const totalLabourAmount = labourList.reduce(
    (sum: number, l: any) => sum + Number(l.amount || (Number(l.hours || 0) * Number(l.rate || 0))),
    0
  );

  const handleStartEdit = (labour: any) => {
    if (isReadOnly) return;
    setEditingLabourId(labour.id || Math.random());
    setEditForm({ ...labour });
  };

  const handleSaveEdit = () => {
    if (!editingLabourId) return;
    const hours = Number(editForm.hours || 0);
    const rate = Number(editForm.rate || 0);
    const workerCount = Number(editForm.worker_count || 1);
    const amount = Number(editForm.amount || hours * rate * workerCount);

    const updated = labourList.map((l: any) =>
      (l.id === editingLabourId || l === editForm) ? { ...editForm, amount } : l
    );
    onUpdateLabourList(updated);
    setEditingLabourId(null);
  };

  const handleCancelEdit = () => {
    setEditingLabourId(null);
  };

  const handleDeleteLabour = (index: number) => {
    if (isReadOnly) return;
    if (confirm('Are you sure you want to remove this labour assignment?')) {
      const updated = labourList.filter((_: any, i: number) => i !== index);
      onUpdateLabourList(updated);
    }
  };

  const handleCreateLabour = () => {
    if (!newLabourName.trim() || !newLabourWbsId) return;

    const parentWbs = wbsList.find((w: any) => w.id === Number(newLabourWbsId));
    const amount = Number(newHours || 0) * Number(newRate || 0) * Number(newWorkerCount || 1);

    const newLabour = {
      id: undefined,
      planning_wbs_id: Number(newLabourWbsId),
      wbs_name: parentWbs?.wbs_name || 'WBS',
      labour_name: newLabourName.trim(),
      labour_type: newLabourType,
      worker_count: Number(newWorkerCount || 1),
      hours: Number(newHours || 0),
      rate: Number(newRate || 0),
      amount,
      start_date: newStartDate || null,
      end_date: newEndDate || null,
      notes: newNotes.trim() || null,
    };

    onUpdateLabourList([...labourList, newLabour]);
    setIsAddModalOpen(false);
    setNewLabourName('');
    setNewNotes('');
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HardHat size={18} color="var(--accent-primary)" />
              Labour & Contractor Planning ({labourList.length} Items)
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Total Planned Labour Cost:{' '}
              <strong style={{ color: 'var(--success)' }}>₹{totalLabourAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
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
              <option value="all">All WBS Disciplines ({labourList.length})</option>
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
                setNewLabourWbsId(wbsList[0].id);
                setIsAddModalOpen(true);
              }
            }}
            disabled={wbsList.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <Plus size={16} /> Add Labour / Contractor
          </Button>
        )}
      </div>

      {/* ── LABOUR TABLE ─────────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '0.85rem 1rem' }}>Labour / Contractor Name</th>
              <th style={{ padding: '0.85rem 1rem' }}>Parent WBS</th>
              <th style={{ padding: '0.85rem 1rem' }}>Type</th>
              <th style={{ padding: '0.85rem 1rem' }}>Headcount</th>
              <th style={{ padding: '0.85rem 1rem' }}>Planned Hours</th>
              <th style={{ padding: '0.85rem 1rem' }}>Rate (₹/hr)</th>
              <th style={{ padding: '0.85rem 1rem' }}>Total Cost (₹)</th>
              <th style={{ padding: '0.85rem 1rem' }}>Planned Dates</th>
              {!isReadOnly && <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredLabour.map((l: any, idx: number) => {
              const isEditing = editingLabourId === (l.id || l);
              const parentWbs = wbsList.find((w: any) => w.id === l.planning_wbs_id);

              return (
                <tr
                  key={l.id || idx}
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                    background: isEditing ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                  }}
                >
                  {/* Name */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {isEditing ? (
                      <input
                        type="text"
                        className="form-input"
                        value={editForm.labour_name || ''}
                        onChange={(e) => setEditForm({ ...editForm, labour_name: e.target.value })}
                        style={{ fontSize: '0.85rem', padding: '0.25rem 0.4rem' }}
                      />
                    ) : (
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{l.labour_name}</span>
                        {l.notes && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{l.notes}</div>}
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
                        style={{ fontSize: '0.8rem', padding: '0.2rem 0.4rem' }}
                      >
                        {wbsList.map((w: any) => (
                          <option key={w.id} value={w.id}>
                            {w.wbs_name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Badge variant="neutral">{l.wbs_name || parentWbs?.wbs_name || 'WBS'}</Badge>
                    )}
                  </td>

                  {/* Type */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {isEditing ? (
                      <select
                        className="form-select"
                        value={editForm.labour_type || 'contractor'}
                        onChange={(e) => setEditForm({ ...editForm, labour_type: e.target.value })}
                        style={{ fontSize: '0.8rem', padding: '0.2rem 0.4rem' }}
                      >
                        <option value="contractor">Contractor</option>
                        <option value="direct_labour">Direct Labour</option>
                        <option value="temporary">Temporary</option>
                      </select>
                    ) : (
                      <Badge variant="info">{l.labour_type?.replace('_', ' ').toUpperCase() || 'CONTRACTOR'}</Badge>
                    )}
                  </td>

                  {/* Worker Count */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {isEditing ? (
                      <input
                        type="number"
                        className="form-input"
                        value={editForm.worker_count || 1}
                        onChange={(e) => setEditForm({ ...editForm, worker_count: Number(e.target.value) })}
                        style={{ width: '55px', fontSize: '0.8rem', padding: '0.2rem 0.4rem' }}
                      />
                    ) : (
                      <span>{l.worker_count || 1} Workers</span>
                    )}
                  </td>

                  {/* Hours */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {isEditing ? (
                      <input
                        type="number"
                        className="form-input"
                        value={editForm.hours || 0}
                        onChange={(e) => setEditForm({ ...editForm, hours: Number(e.target.value) })}
                        style={{ width: '65px', fontSize: '0.8rem', padding: '0.2rem 0.4rem' }}
                      />
                    ) : (
                      <span>{l.hours || 0} hrs</span>
                    )}
                  </td>

                  {/* Rate */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {isEditing ? (
                      <input
                        type="number"
                        className="form-input"
                        value={editForm.rate || 0}
                        onChange={(e) => setEditForm({ ...editForm, rate: Number(e.target.value) })}
                        style={{ width: '70px', fontSize: '0.8rem', padding: '0.2rem 0.4rem' }}
                      />
                    ) : (
                      <span>₹{Number(l.rate || 0).toLocaleString()}</span>
                    )}
                  </td>

                  {/* Total Cost */}
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--success)' }}>
                    ₹{Number(l.amount || (Number(l.hours || 0) * Number(l.rate || 0) * Number(l.worker_count || 1))).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>

                  {/* Dates */}
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <input
                          type="date"
                          className="form-input"
                          value={editForm.start_date ? String(editForm.start_date).split('T')[0] : ''}
                          onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                          style={{ fontSize: '0.75rem', padding: '0.15rem 0.3rem' }}
                        />
                        <input
                          type="date"
                          className="form-input"
                          value={editForm.end_date ? String(editForm.end_date).split('T')[0] : ''}
                          onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                          style={{ fontSize: '0.75rem', padding: '0.15rem 0.3rem' }}
                        />
                      </div>
                    ) : (
                      <div>
                        {l.start_date ? String(l.start_date).split('T')[0] : 'TBD'} → {l.end_date ? String(l.end_date).split('T')[0] : 'TBD'}
                      </div>
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
                          <Button variant="secondary" onClick={() => handleStartEdit(l)} style={{ padding: '0.3rem 0.5rem' }}>
                            <Edit2 size={13} />
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => handleDeleteLabour(idx)}
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
            {filteredLabour.length === 0 && (
              <tr>
                <td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No labour or contractor items configured. Click "Add Labour / Contractor" to add one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── ADD LABOUR MODAL ─────────────────────────────────────────── */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Labour / Contractor Requirement">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="form-label">Parent WBS Discipline *</label>
            <select
              className="form-select"
              value={newLabourWbsId}
              onChange={(e) => setNewLabourWbsId(Number(e.target.value))}
            >
              {wbsList.map((w: any) => (
                <option key={w.id} value={w.id}>
                  {w.wbs_name} ({w.wbs_code || `WBS-${w.id}`})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Labour / Contractor Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Civil Mason Crew / Lead Contractor"
              value={newLabourName}
              onChange={(e) => setNewLabourName(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Labour Category</label>
              <select
                className="form-select"
                value={newLabourType}
                onChange={(e) => setNewLabourType(e.target.value)}
              >
                <option value="contractor">Subcontractor</option>
                <option value="direct_labour">Direct Labour</option>
                <option value="temporary">Temporary Labour</option>
              </select>
            </div>
            <div>
              <label className="form-label">Worker Headcount</label>
              <input
                type="number"
                className="form-input"
                value={newWorkerCount}
                onChange={(e) => setNewWorkerCount(Number(e.target.value))}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Planned Hours</label>
              <input
                type="number"
                className="form-input"
                value={newHours}
                onChange={(e) => setNewHours(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="form-label">Rate (₹ / hour)</label>
              <input
                type="number"
                className="form-input"
                value={newRate}
                onChange={(e) => setNewRate(Number(e.target.value))}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-input"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-input"
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Scope & Requirements</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="e.g., Daily supervision and safety equipment required"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateLabour}>
              Add Labour
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
