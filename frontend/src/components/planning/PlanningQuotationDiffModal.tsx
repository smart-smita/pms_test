import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCcw,
  ArrowRight,
  Layers,
  Calendar,
  DollarSign,
  Package,
  HardHat,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

interface PlanningQuotationDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  diffs: Array<{ type: string; title: string; message: string; details?: any }>;
  onApplyChanges: () => void;
  isApplying: boolean;
}

export const PlanningQuotationDiffModal: React.FC<PlanningQuotationDiffModalProps> = ({
  isOpen,
  onClose,
  diffs = [],
  onApplyChanges,
  isApplying,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quotation vs Planning Difference Inspector">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Banner */}
        <div
          style={{
            padding: '1rem',
            borderRadius: '8px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <AlertTriangle size={24} color="var(--warning)" />
          <div>
            <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {diffs.length} Quotation Changes Detected
            </strong>
            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              The commercial quotation has been modified. You can review the line-by-line differences below and choose to synchronize them into Planning.
            </p>
          </div>
        </div>

        {/* Diffs List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto' }}>
          {diffs.map((diff, idx) => (
            <div
              key={idx}
              style={{
                padding: '0.85rem',
                borderRadius: '8px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '6px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '0.1rem',
                }}
              >
                {diff.type.includes('wbs') ? (
                  <Layers size={15} color="var(--accent-primary)" />
                ) : diff.type.includes('date') ? (
                  <Calendar size={15} color="var(--info)" />
                ) : diff.type.includes('labour') ? (
                  <HardHat size={15} color="var(--warning)" />
                ) : (
                  <Package size={15} color="#a855f7" />
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{diff.title}</strong>
                  <Badge variant="warning">{diff.type.replace('_', ' ').toUpperCase()}</Badge>
                </div>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {diff.message}
                </p>
              </div>
            </div>
          ))}

          {diffs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              No differences detected between Quotation and Planning.
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <Button variant="secondary" onClick={onClose}>
            Dismiss
          </Button>

          {diffs.length > 0 && (
            <Button
              variant="primary"
              onClick={onApplyChanges}
              disabled={isApplying}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <RefreshCcw size={15} /> {isApplying ? 'Applying...' : 'Apply Quotation Changes to Planning'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
