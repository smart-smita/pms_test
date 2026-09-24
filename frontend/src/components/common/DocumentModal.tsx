import React, { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Badge } from './Badge';
import { FormInput } from '../forms/FormInput';
import { FormSelect } from '../forms/FormSelect';
import { apiRequest } from '../../services/api';
import { EntityDocument, DocumentType } from '../../types';
import { FileText, Upload, Trash2, Calendar, AlertTriangle, CheckCircle, ExternalLink, Plus } from 'lucide-react';
import { showSuccess, showError } from '../../utils/toast';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'employee' | 'labour' | 'project' | 'quotation' | 'discipline';
  entityId: number;
  entityName: string;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityName,
}) => {
  const [documents, setDocuments] = useState<EntityDocument[]>([]);
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);

  const [formData, setFormData] = useState({
    doc_type_id: '',
    document_name: '',
    document_number: '',
    issue_date: '',
    expiry_date: '',
    file_base64: '',
    file_name: '',
  });

  useEffect(() => {
    if (isOpen && entityId) {
      fetchDocuments();
      fetchDocTypes();
    }
  }, [isOpen, entityType, entityId]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    const res = await apiRequest<EntityDocument[]>(`/documents?entity_type=${entityType}&entity_id=${entityId}`);
    if (res.success && res.data) {
      setDocuments(res.data);
    }
    setIsLoading(false);
  };

  const fetchDocTypes = async () => {
    const res = await apiRequest<DocumentType[]>('/masters/document-types');
    if (res.success && res.data) {
      // Filter document types matching entity or 'all'
      const filtered = res.data.filter(
        (dt) => dt.applies_to === entityType || dt.applies_to === 'all'
      );
      setDocTypes(filtered);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      showError('File size exceeds 15MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setFormData((prev) => ({
        ...prev,
        file_base64: base64,
        file_name: file.name,
        document_name: prev.document_name || file.name.replace(/\.[^/.]+$/, ''),
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.doc_type_id) {
      showError('Please select a document type.');
      return;
    }
    if (!formData.document_name.trim()) {
      showError('Please enter a document name.');
      return;
    }
    if (!formData.file_base64) {
      showError('Please attach a file.');
      return;
    }

    const selectedDocType = docTypes.find((dt) => String(dt.doc_type_id) === formData.doc_type_id);
    if (selectedDocType?.has_expiry && !formData.expiry_date) {
      showError(`Expiry date is required for '${selectedDocType.type_name}'.`);
      return;
    }

    setIsUploading(true);
    const payload = {
      entity_type: entityType,
      entity_id: entityId,
      doc_type_id: Number(formData.doc_type_id),
      document_name: formData.document_name,
      document_number: formData.document_number || null,
      issue_date: formData.issue_date || null,
      expiry_date: formData.expiry_date || null,
      file_base64: formData.file_base64,
      file_name: formData.file_name,
    };

    const res = await apiRequest('/documents', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    setIsUploading(false);

    if (res.success) {
      showSuccess('Document uploaded successfully.');
      setShowUploadForm(false);
      setFormData({
        doc_type_id: '',
        document_name: '',
        document_number: '',
        issue_date: '',
        expiry_date: '',
        file_base64: '',
        file_name: '',
      });
      fetchDocuments();
    } else {
      showError(res.message || 'Failed to upload document.');
    }
  };

  const handleDelete = async (docId: number) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    const res = await apiRequest(`/documents/${docId}`, { method: 'DELETE' });
    if (res.success) {
      showSuccess('Document deleted.');
      fetchDocuments();
    } else {
      showError(res.message || 'Failed to delete document.');
    }
  };

  const renderExpiryBadge = (doc: EntityDocument) => {
    if (doc.days_remaining === undefined || doc.days_remaining === null) {
      return <Badge variant="secondary">No Expiry</Badge>;
    }
    if (doc.days_remaining < 0) {
      return <Badge variant="danger">Expired ({Math.abs(doc.days_remaining)}d ago)</Badge>;
    }
    if (doc.days_remaining <= 10) {
      return <Badge variant="warning">Expiring in {doc.days_remaining}d</Badge>;
    }
    return <Badge variant="success">Valid ({doc.days_remaining}d left)</Badge>;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Documents for ${entityName} (${entityType.toUpperCase()})`}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Total Documents: <strong>{documents.length}</strong>
          </div>
          <Button variant="primary" onClick={() => setShowUploadForm(!showUploadForm)}>
            <Plus size={16} /> {showUploadForm ? 'Cancel Upload' : 'Upload Document'}
          </Button>
        </div>

        {/* Upload Form */}
        {showUploadForm && (
          <form
            onSubmit={handleUploadSubmit}
            style={{
              padding: '1.25rem',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              marginBottom: '1.5rem',
            }}
          >
            <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6366f1' }}>
              <Upload size={18} /> Register New Document
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <FormSelect
                label="Document Type"
                value={formData.doc_type_id}
                onChange={(e) => setFormData({ ...formData, doc_type_id: e.target.value })}
                options={[
                  { value: '', label: '-- Select Document Type --' },
                  ...docTypes.map((dt) => ({ value: String(dt.doc_type_id), label: `${dt.type_name} ${dt.has_expiry ? '(Requires Expiry)' : ''}` })),
                ]}
                required
              />
              <FormInput
                label="Document Name / Title"
                placeholder="e.g. Passport Copy or Visa Approval"
                value={formData.document_name}
                onChange={(e) => setFormData({ ...formData, document_name: e.target.value })}
                required
              />
              <FormInput
                label="Document ID / Serial Number"
                placeholder="e.g. A98214-X"
                value={formData.document_number}
                onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
              />
              <FormInput
                label="Issue Date (Optional)"
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
              />
              <FormInput
                label="Expiry Date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              />
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Attach Document (PDF, Image, DOC)
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileChange}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <Button type="button" variant="secondary" onClick={() => setShowUploadForm(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Save Document'}
              </Button>
            </div>
          </form>
        )}

        {/* Documents Table */}
        {documents.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No documents uploaded yet. Click <strong>Upload Document</strong> to add identity or regional permission files.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
            {documents.map((doc) => (
              <div
                key={doc.document_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ padding: '0.65rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', color: '#6366f1' }}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {doc.document_name}
                      {doc.doc_type_name && <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>({doc.doc_type_name})</span>}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', gap: '1rem', marginTop: '0.2rem' }}>
                      {doc.document_number && <span>Doc #: {doc.document_number}</span>}
                      {doc.expiry_date && <span>Expires: {new Date(doc.expiry_date).toLocaleDateString()}</span>}
                      {doc.uploaded_by_name && <span>Uploaded by: {doc.uploaded_by_name}</span>}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {renderExpiryBadge(doc)}
                  {doc.file_path && (
                    <a
                      href={doc.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '0.4rem 0.65rem',
                        borderRadius: '6px',
                        background: 'rgba(56, 189, 248, 0.1)',
                        color: '#38bdf8',
                        fontSize: '0.8rem',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <ExternalLink size={13} /> View
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(doc.document_id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: '0.35rem',
                    }}
                    title="Delete document"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
export default DocumentModal;
