import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  AlertCircle,
  Save,
  X,
  Shield,
  Layers,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

interface PlanningTermsTabProps {
  planning: any;
  onUpdateTermsList: (updatedTerms: any[]) => void;
  isReadOnly?: boolean;
}

export const PlanningTermsTab: React.FC<PlanningTermsTabProps> = ({
  planning,
  onUpdateTermsList,
  isReadOnly = false,
}) => {
  const termsList = planning.terms_snapshots || [];
  const templatesList = planning.terms_templates || [];

  const [editingTermId, setEditingTermId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  // Add Term Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newIsMandatory, setNewIsMandatory] = useState(false);

  const handleStartEdit = (term: any, index: number) => {
    if (isReadOnly) return;
    setEditingTermId(term.snapshot_id || index);
    setEditForm({ ...term, _index: index });
  };

  const handleSaveEdit = () => {
    if (editingTermId === null) return;
    const updated = termsList.map((t: any, idx: number) =>
      (t.snapshot_id === editingTermId || idx === editForm._index) ? { ...editForm } : t
    );
    onUpdateTermsList(updated);
    setEditingTermId(null);
  };

  const handleCancelEdit = () => {
    setEditingTermId(null);
  };

  const handleDeleteTerm = (index: number) => {
    if (isReadOnly) return;
    if (confirm('Are you sure you want to remove this condition?')) {
      const updated = termsList.filter((_: any, i: number) => i !== index);
      onUpdateTermsList(updated);
    }
  };

  const handleAddTerm = () => {
    if (!newTitle.trim() || !newDescription.trim()) return;

    const newTerm = {
      snapshot_id: undefined,
      title: newTitle.trim(),
      description: newDescription.trim(),
      is_mandatory: newIsMandatory ? 1 : 0,
      sort_order: termsList.length,
      status: 'active',
    };

    onUpdateTermsList([...termsList, newTerm]);
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewDescription('');
    setNewIsMandatory(false);
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
            <FileText size={18} color="var(--accent-primary)" />
            Terms & Conditions ({termsList.length} Clauses)
          </h3>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Contractual execution milestones, payment terms, warranties, and site access clauses.
          </p>
        </div>

        {!isReadOnly && (
          <Button
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <Plus size={16} /> Add Custom Term Clause
          </Button>
        )}
      </div>

      {/* ── APPLIED TEMPLATES SUMMARY BADGES ─────────────────────────── */}
      {templatesList.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Inherited Templates:</span>
          {templatesList.map((tpl: any, idx: number) => (
            <Badge key={idx} variant="info">
              {tpl.template_name}
            </Badge>
          ))}
        </div>
      )}

      {/* ── TERMS LIST CARDS ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {termsList.map((term: any, idx: number) => {
          const isEditing = editingTermId === (term.snapshot_id || idx);

          return (
            <div
              key={term.snapshot_id || idx}
              className="glass-card"
              style={{
                padding: '1.25rem',
                border: term.is_mandatory ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-color)',
                background: isEditing ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-primary)',
              }}
            >
              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.title || ''}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      style={{ flex: 1 }}
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={!!editForm.is_mandatory}
                        onChange={(e) => setEditForm({ ...editForm, is_mandatory: e.target.checked ? 1 : 0 })}
                      />
                      Mandatory Clause
                    </label>
                  </div>

                  <textarea
                    className="form-input"
                    rows={3}
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  />

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <Button variant="secondary" onClick={handleCancelEdit} style={{ padding: '0.35rem 0.75rem' }}>
                      <X size={14} /> Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSaveEdit} style={{ padding: '0.35rem 0.75rem' }}>
                      <Save size={14} /> Save Clause
                    </Button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {idx + 1}. {term.title}
                      </h4>
                      {term.is_mandatory ? (
                        <Badge variant="danger">MANDATORY</Badge>
                      ) : (
                        <Badge variant="neutral">OPTIONAL</Badge>
                      )}
                      {term.template_name && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({term.template_name})</span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                      {term.description}
                    </p>
                  </div>

                  {!isReadOnly && (
                    <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                      <Button variant="secondary" onClick={() => handleStartEdit(term, idx)} style={{ padding: '0.3rem 0.5rem' }}>
                        <Edit2 size={13} />
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => handleDeleteTerm(idx)}
                        style={{ padding: '0.3rem 0.5rem', color: 'var(--danger)' }}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {termsList.length === 0 && (
          <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No terms & conditions configured for this planning draft.
          </div>
        )}
      </div>

      {/* ── ADD TERM MODAL ───────────────────────────────────────────── */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Custom Planning Condition">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="form-label">Clause Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Site Access & Staging Clearance"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Clause Text / Description *</label>
            <textarea
              className="form-input"
              rows={4}
              placeholder="e.g., Client must provide unhindered site power and water access 7 days prior to mobilization."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={newIsMandatory}
                onChange={(e) => setNewIsMandatory(e.target.checked)}
              />
              <strong>Mark as Mandatory Clause</strong> (Required for approval)
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddTerm}>
              Add Clause
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
