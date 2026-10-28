import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  recordName: string;
  isLoading?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Delete',
  recordName,
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div style={{ padding: '0.5rem 0 1.5rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '50%' }}>
            <AlertTriangle size={36} color="#ef4444" />
          </div>
        </div>
        
        <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
          Are you sure?
        </h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
          You are about to delete <strong>"{recordName}"</strong>.
          <br />
          This action will remove the record from the active list.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Button variant="secondary" onClick={onClose} disabled={isLoading} style={{ padding: '0.65rem 1.5rem' }}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onConfirm} disabled={isLoading} style={{ padding: '0.65rem 1.5rem', background: '#ef4444', borderColor: '#ef4444' }}>
            {isLoading ? 'Deleting...' : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Trash2 size={16} /> Delete Record
              </span>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
