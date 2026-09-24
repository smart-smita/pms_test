import { Request, Response, NextFunction } from 'express';
import { DocumentService } from '../services/document.service';
import fs from 'fs';
import path from 'path';

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

      // Handle base64 upload if passed
      if (file_base64) {
        const uploadsDir = path.join(process.cwd(), 'uploads', 'documents');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const matches = file_base64.match(/^data:(.+);base64,(.+)$/);
        let buffer: Buffer;
        if (matches) {
          mimeType = matches[1];
          buffer = Buffer.from(matches[2], 'base64');
        } else {
          buffer = Buffer.from(file_base64, 'base64');
        }

        const ext = file_name ? path.extname(file_name) : '.pdf';
        const uniqueFileName = `${entity_type}_${entity_id}_${Date.now()}${ext}`;
        const targetPath = path.join(uploadsDir, uniqueFileName);

        fs.writeFileSync(targetPath, buffer);
        filePath = `/uploads/documents/${uniqueFileName}`;
        fileSize = buffer.length;
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
        },
        uploadedBy,
        ipAddress
      );

      res.status(201).json({ success: true, message: 'Document uploaded successfully', data: doc });
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
