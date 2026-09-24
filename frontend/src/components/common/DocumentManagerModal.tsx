import React, { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Badge } from './Badge';
import { FormInput } from '../forms/FormInput';
import { FormSelect } from '../forms/FormSelect';
import { apiRequest } from '../../services/api';
import { EntityDocument, DocumentType } from '../../types';
import { Upload, FileText, Trash2, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { showSuccess, showError } from '../../utils/toast';

interface DocumentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'employee' | 'labour' | 'project' | 'quotation';
  entityId: number;
  entityName: string;
}

export const DocumentManagerModal: React.FC<DocumentManagerModalProps> = ({
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

  // Form state
  const [docTypeId, setDocTypeId] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchDocuments = async () => {
    if (!entityId) return;
    setIsLoading(true);
    const res = await apiRequest<EntityDocument[]>(`/documents?entity_type=${entityType}&entity_id=${entityId}`);
    if (res.success && res.data) setDocuments(res.data);
    setIsLoading(false);
  };

  const fetchDocTypes = async () => {
    const res = await apiRequest<DocumentType[]>(`/masters/document-types?applies_to=${entityType}`);
    if (res.success && res.data) setDocTypes(res.data);
  };

  useEffect(() => {
    if (isOpen) {
      fetchDocuments();
      fetchDocTypes();
    }
  }, [isOpen, entityType, entityId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!documentName) {
        setDocumentName(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTypeId) { showError('Please select a document type.'); return; }
    if (!documentName.trim()) { showError('Document name is required.'); return; }

    let fileBase64 = '';
    if (selectedFile) {
      fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });
    }

    setIsUploading(true);
    const payload = {
      entity_type: entityType,
      entity_id: entityId,
      doc_type_id: Number(docTypeId),
      document_name: documentName,
      document_number: documentNumber || null,
      issue_date: issueDate || null,
      expiry_date: expiryDate || null,
      file_base64: fileBase64 || undefined,
      file_name: selectedFile?.name || undefined,
    };

    const res = await apiRequest<EntityDocument>('/documents', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    setIsUploading(false);

    if (res.success) {
      showSuccess('Document uploaded successfully.');
      setDocTypeId('');
      setDocumentName('');
      setDocumentNumber('');
      setIssueDate('');
      setExpiryDate('');
      setSelectedFile(null);
      fetchDocuments();
    } else {
      showError(res.message || 'Failed to upload document.');
    }
  };

  const handleDelete = async (docId: number) => {
    const res = await apiRequest(`/documents/${docId}`, { method: 'DELETE' });
    if (res.success) {
      showSuccess('Document deleted.');
      fetchDocuments();
    } else {
      showError(res.message || 'Failed to delete document.');
    }
  };

  const getExpiryBadge = (expiryStr?: string) => {
    if (!expiryStr) return <Badge variant="secondary">No Expiry</Badge>;
    const expDate = new Date(expiryStr);
    const now = new Date();
    const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

    if (diffDays < 0) {
      return <Badge variant="danger"><AlertTriangle size={12} /> Expired ({Math.abs(diffDays)}d ago)</Badge>;
    } else if (diffDays <= 10) {
      return <Badge variant="warning"><AlertTriangle size={12} /> Expiring in {diffDays}d</Badge>;
    } else {
      return <Badge variant="success"><CheckCircle size={12} /> Valid ({diffDays}d left)</Badge>;
    }
  };

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Documents & Credentials — ${entityName}`}
    >
      <div style={{ maxHeight: '75vh', overflowY: 'auto' }}>
        {/* Document Listing */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Attached Documents ({documents.length})
          </h4>

          {isLoading ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>Loading documents...</div>
          ) : documents.length === 0 ? (
            <div style={{ padding: '1.25rem', textAlign: 'center', color: '#94a3b8', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
              No identity or permit documents uploaded yet. Use the form below to attach credentials.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {documents.map((doc) => (
                <div
                  key={doc.document_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                      <FileText size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {doc.document_name} {doc.document_number && <span style={{ color: '#94a3b8', fontWeight: 400 }}>({doc.document_number})</span>}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.15rem' }}>
                        <span>Type: {doc.doc_type_name || 'Document'}</span>
                        {doc.expiry_date && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <Calendar size={12} /> Expiry: {new Date(doc.expiry_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {getExpiryBadge(doc.expiry_date)}
                    {doc.file_path && (
                      <a
                        href={`${apiUrl.replace('/api/v1', '')}${doc.file_path}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '0.8rem', color: '#38bdf8', textDecoration: 'none', fontWeight: 500 }}
                      >
                        View File
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(doc.document_id)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Form */}
        <div style={{ background: 'rgba(99,102,241,0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.15)' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Upload size={16} color="#6366f1" /> Upload New Credential / Document
          </h4>

          <form onSubmit={handleUpload}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <FormSelect
                label="Document Type"
                value={docTypeId}
                onChange={(e) => setDocTypeId(e.target.value)}
                options={[
                  { value: '', label: '-- Select Doc Type --' },
                  ...docTypes.map((dt) => ({ value: String(dt.doc_type_id), label: dt.type_name })),
                ]}
                required
              />
              <FormInput
                label="Document Title"
                placeholder="e.g. Passport - Front Page"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                required
              />
              <FormInput
                label="Doc Number / ID"
                placeholder="e.g. A12345678"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
              />
              <FormInput
                label="Expiry Date"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>

            <div style={{ marginTop: '0.75rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                File Attachment (PDF / PNG / JPG)
              </label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                onChange={handleFileChange}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <Button type="button" variant="secondary" onClick={onClose}>
                Close
              </Button>
              <Button type="submit" variant="primary" disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Upload Document'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
};
