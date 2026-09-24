import { DocumentRepository, EntityDocumentRow } from '../repositories/document.repository';
import { MasterRepository } from '../repositories/master.repository';
import { AuditService } from './audit.service';

export class DocumentService {
  private repo = new DocumentRepository();
  private masterRepo = new MasterRepository();

  async getDocumentsByEntity(entityType: string, entityId: number): Promise<EntityDocumentRow[]> {
    if (!['employee', 'labour', 'project', 'quotation', 'discipline'].includes(entityType)) {
      throw new Error(`Invalid entity type '${entityType}'`);
    }
    return this.repo.findByEntity(entityType, entityId);
  }

  async getDocumentById(id: number): Promise<EntityDocumentRow> {
    const doc = await this.repo.findById(id);
    if (!doc) throw new Error('Document not found');
    return doc;
  }

  async getExpiringDocuments(daysThreshold = 10): Promise<EntityDocumentRow[]> {
    return this.repo.findExpiringDocuments(daysThreshold);
  }

  async createDocument(
    data: {
      entity_type: 'employee' | 'labour' | 'project' | 'quotation' | 'discipline';
      entity_id: number;
      doc_type_id: number;
      document_name: string;
      document_number?: string | null;
      issue_date?: string | null;
      expiry_date?: string | null;
      file_path: string;
      file_size?: number;
      mime_type?: string | null;
    },
    uploadedBy?: number,
    ipAddress?: string
  ): Promise<EntityDocumentRow> {
    if (!data.document_name?.trim()) throw new Error('Document name is required');
    if (!data.file_path?.trim()) throw new Error('File upload path is required');

    // Fetch document type configuration
    const docTypes = await this.masterRepo.findAllDocumentTypes();
    const docType = docTypes.find(dt => dt.doc_type_id === data.doc_type_id);
    if (!docType) throw new Error('Invalid document type selected');

    // Expiry validation check
    if (docType.has_expiry && !data.expiry_date) {
      throw new Error(`Document type '${docType.type_name}' requires an expiry date`);
    }

    const id = await this.repo.create({
      ...data,
      uploaded_by: uploadedBy || null,
    });

    await AuditService.log({
      userId: uploadedBy,
      action: 'UPLOAD_DOCUMENT',
      module: 'documents',
      description: `Document '${data.document_name}' (${docType.type_name}) uploaded for ${data.entity_type} #${data.entity_id}`,
      recordId: id,
      ipAddress,
    });

    return (await this.repo.findById(id))!;
  }

  async deleteDocument(id: number, deletedBy?: number, ipAddress?: string): Promise<void> {
    const doc = await this.repo.findById(id);
    if (!doc) throw new Error('Document not found');

    await this.repo.delete(id);

    await AuditService.log({
      userId: deletedBy,
      action: 'DELETE_DOCUMENT',
      module: 'documents',
      description: `Document '${doc.document_name}' deleted from ${doc.entity_type} #${doc.entity_id}`,
      recordId: id,
      ipAddress,
    });
  }

  async triggerExpiryCheckJob(): Promise<{ checked_count: number; notifications_sent: number }> {
    const expiringDocs = await this.repo.findExpiringDocuments(10);
    let sentCount = 0;

    for (const doc of expiringDocs) {
      const daysRemaining = doc.days_remaining !== undefined ? doc.days_remaining : 999;
      
      // Update status if expired
      if (daysRemaining <= 0 && doc.status !== 'expired') {
        await this.repo.update(doc.document_id, { status: 'expired' });
      }

      // Notification interval targets: 10, 8, 5, 3, 2, 1, 0
      const targetDays = [10, 8, 5, 3, 2, 1, 0];
      if (targetDays.includes(daysRemaining)) {
        // Send alert to admins/managers
        const [admins]: any = await (this as any).repo ? require('../config/db').dbPool.query(
          `SELECT employee_id FROM employees e JOIN roles r ON e.role_id = r.role_id WHERE r.role_name IN ('Super Admin', 'Admin', 'Manager') AND e.status = 'active'`
        ) : [[], []];

        for (const admin of admins) {
          try {
            // Deduplication check
            const [existing]: any = await require('../config/db').dbPool.query(
              `SELECT COUNT(*) as count FROM expiry_notifications_log WHERE document_id = ? AND days_before = ? AND recipient_user_id = ?`,
              [doc.document_id, daysRemaining, admin.employee_id]
            );

            if (existing[0].count === 0) {
              const msg = daysRemaining <= 0
                ? `CRITICAL: Document '${doc.document_name}' for ${doc.entity_type} #${doc.entity_id} HAS EXPIRED!`
                : `WARNING: Document '${doc.document_name}' for ${doc.entity_type} #${doc.entity_id} expires in ${daysRemaining} day(s).`;

              // Insert notification
              await require('../config/db').dbPool.query(
                `INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id, priority) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [admin.employee_id, 'Document Expiry Alert', msg, 'expiry_alert', 'document', doc.document_id, daysRemaining <= 2 ? 1 : 0]
              );

              // Log sent notification
              await require('../config/db').dbPool.query(
                `INSERT INTO expiry_notifications_log (document_id, entity_type, entity_id, days_before, recipient_user_id, delivery_status) VALUES (?, ?, ?, ?, ?, 'sent')`,
                [doc.document_id, doc.entity_type, doc.entity_id, daysRemaining, admin.employee_id]
              );

              sentCount++;
            }
          } catch (err: any) {
            console.warn('Expiry notification dispatch error:', err.message);
          }
        }
      }
    }

    return { checked_count: expiringDocs.length, notifications_sent: sentCount };
  }
}
