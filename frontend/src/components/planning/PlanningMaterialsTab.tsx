import React, { useState } from 'react';
import {
  Package,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  DollarSign,
  Save,
  X,
  Filter,
  Layers,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

interface PlanningMaterialsTabProps {
  planning: any;
  onUpdateMaterialsList: (updatedMaterials: any[]) => void;
  isReadOnly?: boolean;
}

export const PlanningMaterialsTab: React.FC<PlanningMaterialsTabProps> = ({
  planning,
  onUpdateMaterialsList,
  isReadOnly = false,
}) => {
  const materialsList = planning.materials || [];
  const wbsList = planning.wbs || [];

  const [selectedWbsFilter, setSelectedWbsFilter] = useState<string>('all');
  const [editingMaterialId, setEditingMaterialId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  // Add Material Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMaterialWbsId, setNewMaterialWbsId] = useState<number>(wbsList[0]?.id || 0);
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newQuantity, setNewQuantity] = useState(100);
  const [newUnit, setNewUnit] = useState('Nos');
  const [newRate, setNewRate] = useState(350);
  const [newStartDate, setNewStartDate] = useState(planning.start_date || '');
  const [newEndDate, setNewEndDate] = useState(planning.end_date || '');
  const [newNotes, setNewNotes] = useState('');

  const filteredMaterials = materialsList.filter((m: any) => {
    if (selectedWbsFilter === 'all') return true;
    return String(m.planning_wbs_id) === selectedWbsFilter;
  });

  const totalMaterialAmount = materialsList.reduce(
    (sum: number, m: any) => sum + Number(m.amount || (Number(m.quantity || 0) * Number(m.rate || 0))),
    0
  );

  const handleStartEdit = (mat: any) => {
    if (isReadOnly) return;
    setEditingMaterialId(mat.id || Math.random());
    setEditForm({ ...mat });
  };

  const handleSaveEdit = () => {
    if (!editingMaterialId) return;
    const qty = Number(editForm.quantity || 0);
    const rate = Number(editForm.rate || 0);
    const amount = Number(editForm.amount || qty * rate);

    const updated = materialsList.map((m: any) =>
      (m.id === editingMaterialId || m === editForm) ? { ...editForm, amount } : m
    );
    onUpdateMaterialsList(updated);
    setEditingMaterialId(null);
  };

  const handleCancelEdit = () => {
    setEditingMaterialId(null);
  };

  const handleDeleteMaterial = (index: number) => {
    if (isReadOnly) return;
    if (confirm('Are you sure you want to remove this material requirement?')) {
      const updated = materialsList.filter((_: any, i: number) => i !== index);
      onUpdateMaterialsList(updated);
    }
  };

  const handleCreateMaterial = () => {
    if (!newMaterialName.trim() || !newMaterialWbsId) return;

    const parentWbs = wbsList.find((w: any) => w.id === Number(newMaterialWbsId));
    const amount = Number(newQuantity || 0) * Number(newRate || 0);

    const newMaterial = {
      id: undefined,
      planning_wbs_id: Number(newMaterialWbsId),
      wbs_name: parentWbs?.wbs_name || 'WBS',
      material_name: newMaterialName.trim(),
      quantity: Number(newQuantity || 0),
      unit: newUnit,
      rate: Number(newRate || 0),
      amount,
      start_date: newStartDate || null,
      end_date: newEndDate || null,
      notes: newNotes.trim() || null,
    };

    onUpdateMaterialsList([...materialsList, newMaterial]);
    setIsAddModalOpen(false);
    setNewMaterialName('');
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
              <Package size={18} color="var(--accent-primary)" />
              Material Supply & Indent Planning ({materialsList.length} Items)
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Total Planned Material Cost:{' '}
              <strong style={{ color: 'var(--success)' }}>₹{totalMaterialAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
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
              <option value="all">All WBS Disciplines ({materialsList.length})</option>
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
                setNewMaterialWbsId(wbsList[0].id);
                setIsAddModalOpen(true);
              }
            }}
            disabled={wbsList.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <Plus size={16} /> Add Material Requirement
          </Button>
        )}
      </div>

      {/* ── MATERIALS TABLE ──────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '0.85rem 1rem' }}>Material Item & Spec</th>
              <th style={{ padding: '0.85rem 1rem' }}>Parent WBS</th>
              <th style={{ padding: '0.85rem 1rem' }}>Planned Quantity</th>
              <th style={{ padding: '0.85rem 1rem' }}>Unit</th>
              <th style={{ padding: '0.85rem 1rem' }}>Unit Rate (₹)</th>
              <th style={{ padding: '0.85rem 1rem' }}>Total Cost (₹)</th>
              <th style={{ padding: '0.85rem 1rem' }}>Supply / Staging Dates</th>
              {!isReadOnly && <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredMaterials.map((m: any, idx: number) => {
              const isEditing = editingMaterialId === (m.id || m);
              const parentWbs = wbsList.find((w: any) => w.id === m.planning_wbs_id);

              return (
                <tr
                  key={m.id || idx}
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
                        value={editForm.material_name || ''}
                        onChange={(e) => setEditForm({ ...editForm, material_name: e.target.value })}
                        style={{ fontSize: '0.85rem', padding: '0.25rem 0.4rem' }}
                      />
                    ) : (
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.material_name}</span>
                        {m.notes && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.notes}</div>}
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
                      <Badge variant="neutral">{m.wbs_name || parentWbs?.wbs_name || 'WBS'}</Badge>
                    )}
                  </td>

                  {/* Quantity */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {isEditing ? (
                      <input
                        type="number"
                        className="form-input"
                        value={editForm.quantity || 0}
                        onChange={(e) => setEditForm({ ...editForm, quantity: Number(e.target.value) })}
                        style={{ width: '75px', fontSize: '0.8rem', padding: '0.2rem 0.4rem' }}
                      />
                    ) : (
                      <span style={{ fontWeight: 600 }}>{Number(m.quantity || 0).toLocaleString()}</span>
                    )}
                  </td>

                  {/* Unit */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {isEditing ? (
                      <input
                        type="text"
                        className="form-input"
                        value={editForm.unit || 'Nos'}
                        onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                        style={{ width: '60px', fontSize: '0.8rem', padding: '0.2rem 0.4rem' }}
                      />
                    ) : (
                      <Badge variant="neutral">{m.unit || 'Nos'}</Badge>
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
                        style={{ width: '75px', fontSize: '0.8rem', padding: '0.2rem 0.4rem' }}
                      />
                    ) : (
                      <span>₹{Number(m.rate || 0).toLocaleString()}</span>
                    )}
                  </td>

                  {/* Total Cost */}
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--success)' }}>
                    ₹{Number(m.amount || (Number(m.quantity || 0) * Number(m.rate || 0))).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                        {m.start_date ? String(m.start_date).split('T')[0] : 'TBD'} → {m.end_date ? String(m.end_date).split('T')[0] : 'TBD'}
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
                          <Button variant="secondary" onClick={() => handleStartEdit(m)} style={{ padding: '0.3rem 0.5rem' }}>
                            <Edit2 size={13} />
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => handleDeleteMaterial(idx)}
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
            {filteredMaterials.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No materials configured. Click "Add Material Requirement" to add one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── ADD MATERIAL MODAL ───────────────────────────────────────── */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Material Requirement">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="form-label">Parent WBS Discipline *</label>
            <select
              className="form-select"
              value={newMaterialWbsId}
              onChange={(e) => setNewMaterialWbsId(Number(e.target.value))}
            >
              {wbsList.map((w: any) => (
                <option key={w.id} value={w.id}>
                  {w.wbs_name} ({w.wbs_code || `WBS-${w.id}`})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Material Name / Specification *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., UltraTech OPC 53 Grade Cement"
              value={newMaterialName}
              onChange={(e) => setNewMaterialName(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Planned Quantity</label>
              <input
                type="number"
                className="form-input"
                value={newQuantity}
                onChange={(e) => setNewQuantity(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="form-label">Unit of Measure</label>
              <select
                className="form-select"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
              >
                <option value="Nos">Nos</option>
                <option value="Bags">Bags</option>
                <option value="MT">MT (Metric Ton)</option>
                <option value="Kg">Kg</option>
                <option value="Sqft">Sqft</option>
                <option value="Cum">Cum (Cubic Metre)</option>
                <option value="Litres">Litres</option>
                <option value="Rmt">Rmt (Running Metre)</option>
              </select>
            </div>
            <div>
              <label className="form-label">Unit Rate (₹)</label>
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
              <label className="form-label">Planned Start Date</label>
              <input
                type="date"
                className="form-input"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Planned End Date</label>
              <input
                type="date"
                className="form-input"
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Delivery Notes / Specifications</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="e.g., Delivered to Block B staging area in batches of 100 bags"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateMaterial}>
              Add Material
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
