import { DocumentRepository, EntityDocumentRow } from '../repositories/document.repository';
import { MasterRepository } from '../repositories/master.repository';
import { AuditService } from './audit.service';
import { validateDateRange, calculateDocumentExpiryStatus } from '../utils/documentHelper';
import { dbPool } from '../config/db';

export class DocumentService {
  private repo = new DocumentRepository();
  private masterRepo = new MasterRepository();

  async getDocumentsByEntity(entityType: string, entityId: number): Promise<EntityDocumentRow[]> {
    if (!['employee', 'labour', 'project', 'quotation', 'discipline'].includes(entityType)) {
      throw new Error(`Invalid entity type '${entityType}'`);
    }
    const docs = await this.repo.findByEntity(entityType, entityId);
    return docs.map(doc => {
      const calc = calculateDocumentExpiryStatus(doc.expiry_date);
      return {
        ...doc,
        calculated_status: calc.status,
      };
    });
  }

  async getDocumentById(id: number): Promise<EntityDocumentRow> {
    const doc = await this.repo.findById(id);
    if (!doc) throw new Error('Document not found');
    const calc = calculateDocumentExpiryStatus(doc.expiry_date);
    return {
      ...doc,
      calculated_status: calc.status,
    };
  }

  async getExpiringDocuments(daysThreshold = 10): Promise<EntityDocumentRow[]> {
    return this.repo.findExpiringDocuments(daysThreshold);
  }

  async getExpiryManagementList(filters: {
    entity_type?: string;
    doc_type_id?: number;
    country_id?: number;
    project_id?: number;
    status?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<EntityDocumentRow[]> {
    const docs = await this.repo.findExpiryManagementList(filters);
    return docs.map(doc => {
      const calc = calculateDocumentExpiryStatus(doc.expiry_date);
      return {
        ...doc,
        calculated_status: calc.status,
      };
    });
  }

  async getExpiryDashboardCounts() {
    return this.repo.getExpiryDashboardCounts();
  }

  async getNotificationHistory(entityType: string, entityId: number) {
    return this.repo.getNotificationHistory(entityType, entityId);
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
      notes?: string | null;
    },
    uploadedBy?: number,
    ipAddress?: string
  ): Promise<EntityDocumentRow> {
    if (!data.document_name?.trim()) throw new Error('Document name is required');
    if (!data.file_path?.trim()) throw new Error('File upload path is required');

    // Validate issue and expiry date range
    validateDateRange(data.issue_date, data.expiry_date);

    // Fetch document type configuration
    const docTypes = await this.masterRepo.findAllDocumentTypes();
    const docType = docTypes.find(dt => dt.doc_type_id === data.doc_type_id);
    if (!docType) throw new Error('Invalid document type selected');

    // Expiry validation check
    if (docType.has_expiry && !data.expiry_date) {
      throw new Error(`Document type '${docType.type_name}' requires an expiry date`);
    }

    const calc = calculateDocumentExpiryStatus(data.expiry_date);
    let initialStatus: 'active' | 'expiring_soon' | 'expired' = 'active';
    if (calc.status === 'EXPIRED') initialStatus = 'expired';
    else if (calc.status === 'EXPIRING_SOON') initialStatus = 'expiring_soon';

    const id = await this.repo.create({
      ...data,
      status: initialStatus,
      is_current: 1,
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

  async renewDocument(
    oldDocId: number,
    data: {
      doc_type_id: number;
      document_name: string;
      document_number?: string | null;
      issue_date?: string | null;
      expiry_date?: string | null;
      file_path: string;
      file_size?: number;
      mime_type?: string | null;
      notes?: string | null;
    },
    renewedBy?: number,
    ipAddress?: string
  ): Promise<EntityDocumentRow> {
    const oldDoc = await this.repo.findById(oldDocId);
    if (!oldDoc) throw new Error('Original document not found');

    validateDateRange(data.issue_date, data.expiry_date);

    const calc = calculateDocumentExpiryStatus(data.expiry_date);
    let initialStatus: 'active' | 'expiring_soon' | 'expired' = 'active';
    if (calc.status === 'EXPIRED') initialStatus = 'expired';
    else if (calc.status === 'EXPIRING_SOON') initialStatus = 'expiring_soon';

    // 1. Insert new document
    const newDocId = await this.repo.create({
      entity_type: oldDoc.entity_type,
      entity_id: oldDoc.entity_id,
      doc_type_id: data.doc_type_id || oldDoc.doc_type_id,
      document_name: data.document_name,
      document_number: data.document_number || null,
      issue_date: data.issue_date || null,
      expiry_date: data.expiry_date || null,
      file_path: data.file_path,
      file_size: data.file_size || 0,
      mime_type: data.mime_type || null,
      status: initialStatus,
      is_current: 1,
      uploaded_by: renewedBy || null,
      notes: data.notes || `Renewed from Document #${oldDocId}`,
    });

    // 2. Mark old document as archived and link replacement
    await this.repo.update(oldDocId, {
      status: 'archived',
      is_current: 0,
      replaced_by_id: newDocId,
    });

    await AuditService.log({
      userId: renewedBy,
      action: 'RENEW_DOCUMENT',
      module: 'documents',
      description: `Document '${oldDoc.document_name}' (#${oldDocId}) renewed with new document #${newDocId} for ${oldDoc.entity_type} #${oldDoc.entity_id}`,
      recordId: newDocId,
      ipAddress,
    });

    return (await this.repo.findById(newDocId))!;
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

    // Target intervals: 10, 8, 5, 3, 2, 1, 0 (or past)
    const targetIntervals = [10, 8, 5, 3, 2, 1, 0];

    for (const doc of expiringDocs) {
      const daysRemaining = doc.days_remaining !== undefined && doc.days_remaining !== null ? doc.days_remaining : 999;

      // Update document status in DB if expired
      if (daysRemaining <= 0 && doc.status !== 'expired' && doc.status !== 'archived') {
        await this.repo.update(doc.document_id, { status: 'expired' });
      } else if (daysRemaining > 0 && daysRemaining <= 10 && doc.status === 'active') {
        await this.repo.update(doc.document_id, { status: 'expiring_soon' });
      }

      // Check if current day interval qualifies for notification
      const intervalKey = daysRemaining <= 0 ? 0 : daysRemaining;
      if (!targetIntervals.includes(intervalKey)) {
        continue;
      }

      // Format recipient list:
      // 1. Admins & Super Admins
      // 2. Project Managers (if entity has assigned project)
      // 3. Reporting Manager (if employee)
      const recipientIds = new Set<number>();

      const [admins]: any = await dbPool.query(
        `SELECT e.employee_id
         FROM employees e
         JOIN roles r ON e.role_id = r.role_id
         WHERE r.role_name IN ('Super Admin', 'Admin') AND e.status = 'active'`
      );
      admins.forEach((a: any) => recipientIds.add(a.employee_id));

      if (doc.assigned_project_id) {
        const [projManagers]: any = await dbPool.query(
          `SELECT manager_id FROM manager_projects WHERE project_id = ?`,
          [doc.assigned_project_id]
        );
        projManagers.forEach((m: any) => recipientIds.add(m.manager_id));
      }

      if (doc.reporting_to_id) {
        recipientIds.add(doc.reporting_to_id);
      }

      // Format date for notification message (e.g., 30-Sep-2026)
      const expDate = doc.expiry_date ? new Date(doc.expiry_date) : new Date();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const formattedDate = `${String(expDate.getDate()).padStart(2, '0')}-${months[expDate.getMonth()]}-${expDate.getFullYear()}`;

      const personLabel = doc.person_name || `${doc.entity_type.toUpperCase()} #${doc.entity_id}`;
      const docTypeLabel = doc.doc_type_name || 'Document';

      let msg = '';
      let title = '';
      if (daysRemaining <= 0) {
        title = `${docTypeLabel} Expired`;
        msg = `${docTypeLabel} expired: ${personLabel}'s ${docTypeLabel} expired on ${formattedDate}.`;
      } else if (daysRemaining === 1) {
        title = `Urgent: ${docTypeLabel} Expiring Tomorrow`;
        msg = `Urgent: ${personLabel}'s ${docTypeLabel} will expire tomorrow on ${formattedDate}.`;
      } else {
        title = `${docTypeLabel} Expiry Reminder`;
        msg = `${docTypeLabel} expiry reminder: ${personLabel}'s ${docTypeLabel} will expire in ${daysRemaining} days on ${formattedDate}.`;
      }

      for (const recipientId of recipientIds) {
        try {
          // Strict deduplication check: document_id + days_before + recipient_user_id
          const [existing]: any = await dbPool.query(
            `SELECT COUNT(*) as count FROM expiry_notifications_log
             WHERE document_id = ? AND days_before = ? AND recipient_user_id = ?`,
            [doc.document_id, intervalKey, recipientId]
          );

          if (existing[0].count === 0) {
            // Insert notification into notifications table
            await dbPool.query(
              `INSERT INTO notifications
                (user_id, title, message, type, reference_type, reference_id, priority)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                recipientId,
                title,
                msg,
                'expiry_alert',
                doc.entity_type,
                doc.entity_id,
                daysRemaining <= 2 ? 1 : 0,
              ]
            );

            // Log in expiry_notifications_log
            await dbPool.query(
              `INSERT INTO expiry_notifications_log
                (document_id, entity_type, entity_id, days_before, recipient_user_id, delivery_status)
               VALUES (?, ?, ?, ?, ?, 'sent')`,
              [doc.document_id, doc.entity_type, doc.entity_id, intervalKey, recipientId]
            );

            sentCount++;
          }
        } catch (err: any) {
          console.warn('Expiry notification dispatch error:', err.message);
        }
      }
    }

    return { checked_count: expiringDocs.length, notifications_sent: sentCount };
  }
}
