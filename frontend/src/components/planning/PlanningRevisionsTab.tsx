import React, { useState } from 'react';
import {
  History,
  Clock,
  User,
  Eye,
  FileCode,
  CheckCircle,
  GitCommit,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

interface PlanningRevisionsTabProps {
  planning: any;
}

export const PlanningRevisionsTab: React.FC<PlanningRevisionsTabProps> = ({ planning }) => {
  const revisionsList = planning.revisions || [];
  const [selectedRevision, setSelectedRevision] = useState<any | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History size={18} color="var(--accent-primary)" />
          Planning Revision & Audit Trail ({revisionsList.length} Revisions)
        </h3>
        <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          Historical snapshots captured whenever dates are rescheduled, resources modified, or approvals granted.
        </p>
      </div>

      {/* ── REVISION TIMELINE ────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative' }}>
          {revisionsList.map((rev: any, idx: number) => {
            let parsedSnapshot: any = null;
            try {
              if (typeof rev.snapshot_data === 'string') {
                parsedSnapshot = JSON.parse(rev.snapshot_data);
              } else {
                parsedSnapshot = rev.snapshot_data;
              }
            } catch (e) {}

            return (
              <div
                key={rev.id || idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1.25rem',
                  paddingBottom: '1.25rem',
                  borderBottom: idx < revisionsList.length - 1 ? '1px solid var(--border-color)' : 'none',
                }}
              >
                {/* Version Circle */}
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: 'rgba(59, 130, 246, 0.15)',
                    border: '2px solid var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    color: 'var(--accent-primary)',
                    flexShrink: 0,
                  }}
                >
                  v{rev.version}.0
                </div>

                {/* Revision details */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {rev.reason || `Planning Revision ${rev.version}`}
                      </strong>
                      {idx === 0 && <Badge variant="success">LATEST ACTIVE</Badge>}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <User size={13} /> {rev.created_by_name || 'System / Planner'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={13} /> {rev.created_at ? new Date(rev.created_at).toLocaleString() : 'N/A'}
                      </span>
                      <Button
                        variant="secondary"
                        onClick={() => setSelectedRevision({ ...rev, parsedSnapshot })}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Eye size={12} /> View Snapshot
                      </Button>
                    </div>
                  </div>

                  {rev.change_summary && (
                    <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {rev.change_summary}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {revisionsList.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              No previous revisions captured yet.
            </div>
          )}
        </div>
      </div>

      {/* ── REVISION SNAPSHOT MODAL ──────────────────────────────────── */}
      <Modal
        isOpen={!!selectedRevision}
        onClose={() => setSelectedRevision(null)}
        title={`Planning Snapshot (v${selectedRevision?.version}.0)`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Change Reason:</strong>{' '}
            <span>{selectedRevision?.reason}</span>
          </div>

          <div>
            <label className="form-label">Raw Snapshot Payload:</label>
            <pre
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '1rem',
                fontSize: '0.75rem',
                maxHeight: '350px',
                overflowY: 'auto',
                color: 'var(--text-primary)',
                lineHeight: 1.4,
              }}
            >
              {JSON.stringify(selectedRevision?.parsedSnapshot || {}, null, 2)}
            </pre>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <Button variant="secondary" onClick={() => setSelectedRevision(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
