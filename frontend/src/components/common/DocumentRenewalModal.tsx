import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { FormInput } from '../forms/FormInput';
import { apiRequest } from '../../services/api';
import { showSuccess, showError } from '../../utils/toast';
import { RefreshCw, FileText, AlertCircle, Calendar } from 'lucide-react';

interface DocumentRenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  document: {
    document_id: number;
    doc_type_id: number;
    doc_type_name?: string;
    document_name: string;
    document_number?: string | null;
    issue_date?: string | null;
    expiry_date?: string | null;
    entity_type?: string;
    entity_id?: number;
  } | null;
  entityName?: string;
}

export const DocumentRenewalModal: React.FC<DocumentRenewalModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  document,
  entityName,
}) => {
  if (!document) return null;

  const [documentNumber, setDocumentNumber] = useState(document.document_number || '');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [fileBase64, setFileBase64] = useState('');
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      showError('File size exceeds 15MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result as string);
      setFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!expiryDate) {
      showError('Expiry date is required for document renewal.');
      return;
    }

    if (issueDate && expiryDate) {
      const issue = new Date(issueDate);
      const exp = new Date(expiryDate);
      if (issue > exp) {
        showError('Issue date cannot be after expiry date.');
        return;
      }
    }

    if (!fileBase64) {
      showError('Please upload the new renewed document file.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        doc_type_id: document.doc_type_id,
        document_name: `${document.doc_type_name || 'Document'} (Renewed)`,
        document_number: documentNumber || null,
        issue_date: issueDate || null,
        expiry_date: expiryDate,
        file_base64: fileBase64,
        file_name: fileName,
        notes: notes || `Renewed replacement for Document #${document.document_id}`,
      };

      const res = await apiRequest(`/documents/${document.document_id}/renew`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        showSuccess('Document renewed successfully! Old document marked as archived.');
        onSuccess();
        onClose();
      } else {
        showError(res.message || 'Failed to renew document.');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to renew document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Renew / Replace ${document.doc_type_name || 'Document'} - ${entityName || ''}`}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div
          style={{
            padding: '0.85rem 1rem',
            background: 'rgba(99, 102, 241, 0.08)',
            borderRadius: '10px',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.85rem',
            color: '#c7d2fe',
          }}
        >
          <RefreshCw size={20} color="#818cf8" />
          <div>
            Renewing will set the current active document to <strong>Archived</strong> and register the new valid document
            with updated issue and expiry dates.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <FormInput
            label="New Document Number"
            placeholder="e.g. VISA-2026-9921"
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
          />
          <FormInput
            label="New Issue Date (Optional)"
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
          />
          <FormInput
            label="New Expiry Date"
            type="date"
            required
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
          />
          <FormInput
            label="Renewal Remarks / Notes"
            placeholder="e.g. 2-Year Extension Issued"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
            Attach Renewed Document (PDF, PNG, JPG) <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="file"
            required
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            onChange={handleFileChange}
            style={{
              width: '100%',
              padding: '0.55rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Renewing...' : 'Save & Renew Document'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
export default DocumentRenewalModal;
