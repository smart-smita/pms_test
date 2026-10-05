import React from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Layers,
  Calendar,
  FileText,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

interface PlanningValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  validationResult: {
    isValid: boolean;
    errors: Array<{ field: string; message: string; tab: string; id?: number }>;
    warnings?: string[];
  } | null;
  onNavigateTab: (tab: string) => void;
  onSubmitPlanning?: () => void;
}

export const PlanningValidationModal: React.FC<PlanningValidationModalProps> = ({
  isOpen,
  onClose,
  validationResult,
  onNavigateTab,
  onSubmitPlanning,
}) => {
  if (!validationResult) return null;

  const tabIdMap: Record<string, string> = {
    'Overview': 'overview',
    'WBS Planning': 'wbs',
    'Task Planning': 'tasks',
    'Dependencies': 'dependencies',
    'Labour': 'labour',
    'Materials': 'materials',
    'Terms & Conditions': 'terms',
  };

  const handleFixError = (tabName: string) => {
    const tabId = tabIdMap[tabName] || 'overview';
    onNavigateTab(tabId);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Planning Integrity & Pre-Submission Validation">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Status Header Banner */}
        <div
          style={{
            padding: '1rem',
            borderRadius: '8px',
            background: validationResult.isValid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: validationResult.isValid ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          {validationResult.isValid ? (
            <CheckCircle2 size={24} color="var(--success)" />
          ) : (
            <XCircle size={24} color="var(--danger)" />
          )}
          <div>
            <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {validationResult.isValid
                ? 'All Validation Checks Passed!'
                : `Validation Issues Detected (${validationResult.errors.length} Errors)`}
            </strong>
            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              {validationResult.isValid
                ? 'Planning dates, dependencies, labour, materials, and mandatory terms are complete and ready for submission.'
                : 'Please resolve the following issues before submitting this planning draft for management review.'}
            </p>
          </div>
        </div>

        {/* Errors List */}
        {validationResult.errors.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
              Required Fixes:
            </span>
            {validationResult.errors.map((err, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.75rem',
                  borderRadius: '6px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem' }}>
                  <Badge variant="danger">{err.tab}</Badge>
                  <span style={{ color: 'var(--text-primary)' }}>{err.message}</span>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => handleFixError(err.tab)}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  Go to Tab <ArrowRight size={12} />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Warnings List */}
        {validationResult.warnings && validationResult.warnings.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
              Advisories & Warnings:
            </span>
            {validationResult.warnings.map((warn, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.6rem 0.75rem',
                  borderRadius: '6px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <AlertTriangle size={15} color="var(--warning)" />
                <span>{warn}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {validationResult.isValid && onSubmitPlanning && (
            <Button variant="primary" onClick={onSubmitPlanning}>
              Proceed with Submission
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
