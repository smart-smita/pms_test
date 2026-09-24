import { Request, Response, NextFunction } from 'express';
import { DocumentService } from '../services/document.service';
import { saveBase64DocumentFile } from '../utils/documentHelper';

const docService = new DocumentService();

export class DocumentController {
  static async getDocumentsByEntity(req: Request, res: Response, next: NextFunction) {
    try {
      const entityType = String(req.query.entity_type || '');
      const entityId = Number(req.query.entity_id || 0);

      if (!entityType || !entityId) {
        return res.status(400).json({ success: false, message: 'entity_type and entity_id query parameters are required' });
      }

      const docs = await docService.getDocumentsByEntity(entityType, entityId);
      res.json({ success: true, data: docs });
    } catch (err) {
      next(err);
    }
  }

  static async getExpiringDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const days = req.query.days ? Number(req.query.days) : 10;
      const docs = await docService.getExpiringDocuments(days);
      res.json({ success: true, data: docs });
    } catch (err) {
      next(err);
    }
  }

  static async getExpiryManagementList(req: Request, res: Response, next: NextFunction) {
    try {
      const { entity_type, doc_type_id, country_id, project_id, status, date_from, date_to } = req.query;
      const docs = await docService.getExpiryManagementList({
        entity_type: entity_type ? String(entity_type) : undefined,
        doc_type_id: doc_type_id ? Number(doc_type_id) : undefined,
        country_id: country_id ? Number(country_id) : undefined,
        project_id: project_id ? Number(project_id) : undefined,
        status: status ? String(status) : undefined,
        date_from: date_from ? String(date_from) : undefined,
        date_to: date_to ? String(date_to) : undefined,
      });
      res.json({ success: true, data: docs });
    } catch (err) {
      next(err);
    }
  }

  static async getExpiryDashboardCounts(req: Request, res: Response, next: NextFunction) {
    try {
      const counts = await docService.getExpiryDashboardCounts();
      res.json({ success: true, data: counts });
    } catch (err) {
      next(err);
    }
  }

  static async getNotificationHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const entityType = String(req.query.entity_type || '');
      const entityId = Number(req.query.entity_id || 0);

      if (!entityType || !entityId) {
        return res.status(400).json({ success: false, message: 'entity_type and entity_id query parameters are required' });
      }

      const history = await docService.getNotificationHistory(entityType, entityId);
      res.json({ success: true, data: history });
    } catch (err) {
      next(err);
    }
  }

  static async getDocumentById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const doc = await docService.getDocumentById(id);
      res.json({ success: true, data: doc });
    } catch (err) {
      next(err);
    }
  }

  static async uploadDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        entity_type,
        entity_id,
        doc_type_id,
        document_name,
        document_number,
        issue_date,
        expiry_date,
        file_base64,
        file_name,
        notes,
      } = req.body;

      if (!entity_type || !entity_id || !doc_type_id || !document_name) {
        return res.status(400).json({
          success: false,
          message: 'entity_type, entity_id, doc_type_id, and document_name are required',
        });
      }

      let filePath = req.body.file_path || '';
      let fileSize = 0;
      let mimeType = 'application/pdf';

      if (file_base64) {
        const saved = saveBase64DocumentFile(file_base64, file_name, entity_type, entity_id);
        filePath = saved.filePath;
        fileSize = saved.fileSize;
        mimeType = saved.mimeType;
      }

      if (!filePath) {
        filePath = `/uploads/documents/sample_document.pdf`;
      }

      const uploadedBy = (req as any).user?.employee_id;
      const ipAddress = req.ip;

      const doc = await docService.createDocument(
        {
          entity_type,
          entity_id: Number(entity_id),
          doc_type_id: Number(doc_type_id),
          document_name,
          document_number,
          issue_date,
          expiry_date,
          file_path: filePath,
          file_size: fileSize,
          mime_type: mimeType,
          notes,
        },
        uploadedBy,
        ipAddress
      );

      res.status(201).json({ success: true, message: 'Document uploaded successfully', data: doc });
    } catch (err) {
      next(err);
    }
  }

  static async renewDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const {
        doc_type_id,
        document_name,
        document_number,
        issue_date,
        expiry_date,
        file_base64,
        file_name,
        notes,
      } = req.body;

      if (!document_name) {
        return res.status(400).json({
          success: false,
          message: 'Document name is required for renewal',
        });
      }

      let filePath = req.body.file_path || '';
      let fileSize = 0;
      let mimeType = 'application/pdf';

      if (file_base64) {
        const saved = saveBase64DocumentFile(file_base64, file_name, 'renew', id);
        filePath = saved.filePath;
        fileSize = saved.fileSize;
        mimeType = saved.mimeType;
      }

      if (!filePath) {
        filePath = `/uploads/documents/sample_document.pdf`;
      }

      const renewedBy = (req as any).user?.employee_id;
      const ipAddress = req.ip;

      const newDoc = await docService.renewDocument(
        id,
        {
          doc_type_id: Number(doc_type_id),
          document_name,
          document_number,
          issue_date,
          expiry_date,
          file_path: filePath,
          file_size: fileSize,
          mime_type: mimeType,
          notes,
        },
        renewedBy,
        ipAddress
      );

      res.status(201).json({ success: true, message: 'Document renewed successfully', data: newDoc });
    } catch (err) {
      next(err);
    }
  }

  static async deleteDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const deletedBy = (req as any).user?.employee_id;
      const ipAddress = req.ip;

      await docService.deleteDocument(id, deletedBy, ipAddress);
      res.json({ success: true, message: 'Document deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  static async triggerExpiryJob(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await docService.triggerExpiryCheckJob();
      res.json({ success: true, message: 'Document expiry check job completed', data: result });
    } catch (err) {
      next(err);
    }
  }
}
