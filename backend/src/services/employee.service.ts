import bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/user.repository';
import { DocumentService } from './document.service';
import { MasterRepository } from '../repositories/master.repository';
import { calculateDocumentExpiryStatus, saveBase64DocumentFile, validateDateRange } from '../utils/documentHelper';

export class EmployeeService {
  private userRepo = new UserRepository();
  private docService = new DocumentService();
  private masterRepo = new MasterRepository();

  async getEmployees(status?: string, roleId?: number, search?: string, managerId?: number, employeeId?: number) {
    return await this.userRepo.findAll(status, roleId, search, managerId, employeeId);
  }

  async getEmployeeById(id: number) {
    const emp = await this.userRepo.findById(id);
    if (!emp) throw new Error('Employee not found');
    return emp;
  }

  async createEmployee(
    data: {
      employee_code: string;
      name: string;
      email: string;
      password: string;
      role_id: number;
      hourly_rate?: number;
      status: string;
      reporting_to_id?: number | null;
      assigned_project_id?: number | null;
      assigned_wbs_id?: number | null;
      department?: string | null;
      contact_number?: string | null;
      nationality_id?: number | null;
      country_id?: number | null;
      emreads_id?: string | null;

      // Initial documents
      passport?: {
        document_number?: string;
        issue_date?: string;
        expiry_date?: string;
        file_base64?: string;
        file_name?: string;
      };
      visa?: {
        document_number?: string;
        visa_type?: string;
        issue_date?: string;
        expiry_date?: string;
        file_base64?: string;
        file_name?: string;
      };

      emreads?: {
        document_number?: string;
        issue_date?: string;
        expiry_date?: string;
        file_base64?: string;
        file_name?: string;
      };
    },
    uploadedBy?: number,
    ipAddress?: string
  ) {
    const existingCode = await this.userRepo.findByEmployeeCode(data.employee_code);
    if (existingCode) throw new Error('Employee code already exists');

    const existingEmail = await this.userRepo.findByEmail(data.email);
    if (existingEmail) throw new Error('Email address already in use');

    const hash = await bcrypt.hash(data.password, 10);

    const id = await this.userRepo.create({
      employee_code: data.employee_code,
      name: data.name,
      email: data.email,
      password_hash: hash,
      role_id: data.role_id,
      hourly_rate: data.hourly_rate || 0,
      status: data.status,
      reporting_to_id: data.reporting_to_id,
      assigned_project_id: data.assigned_project_id,
      assigned_wbs_id: data.assigned_wbs_id,
      department: data.department || null,
      contact_number: data.contact_number || null,
      nationality_id: data.nationality_id ? Number(data.nationality_id) : null,
      country_id: data.country_id ? Number(data.country_id) : null,
      emreads_id: data.emreads_id || null,
    });

    // Helper to upload or update initial employee doc
    const docTypes = await this.masterRepo.findAllDocumentTypes();
    const findDocTypeId = (code: string) => docTypes.find(dt => dt.type_code === code)?.doc_type_id || 1;

    const processEmployeeDoc = async (
      typeCode: string,
      docTypeDb: 'passport' | 'visa' | 'national_id',
      defaultName: string,
      docData?: {
        document_number?: string;
        issue_date?: string;
        expiry_date?: string;
        start_date?: string;
        end_date?: string;
        issuing_country?: string;
        sub_type?: string;
        file_base64?: string;
        file_name?: string;
        remarks?: string;
      }
    ) => {
      if (!docData) return;

      const issueDate = docData.issue_date || docData.start_date || null;
      const expiryDate = docData.expiry_date || docData.end_date || null;
      const docNum = docData.document_number?.trim() || null;

      if (!docNum && !docData.file_base64 && !expiryDate) {
        return;
      }

      // Validate issue and expiry dates
      validateDateRange(issueDate, expiryDate);

      let filePath: string | null = null;
      let fileSize = 0;
      let mimeType = 'application/pdf';

      if (docData.file_base64) {
        const saved = saveBase64DocumentFile(docData.file_base64, docData.file_name, 'employee', id);
        filePath = saved.filePath;
        fileSize = saved.fileSize;
        mimeType = saved.mimeType;
      }

      const docTypeId = findDocTypeId(typeCode);
      const calc = calculateDocumentExpiryStatus(expiryDate);
      let statusStr: 'active' | 'expiring_soon' | 'expired' = 'active';
      if (calc.status === 'EXPIRED') statusStr = 'expired';
      else if (calc.status === 'EXPIRING_SOON') statusStr = 'expiring_soon';

      // Insert into employee_documents table
      await import('../config/db').then(m => m.dbPool.query(
        `INSERT INTO employee_documents 
          (employee_id, document_type, document_number, issue_date, expiry_date, issuing_country, document_file, file_size, mime_type, sub_type, status, remarks)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, docTypeDb, docNum, issueDate, expiryDate, docData.issuing_country || null, filePath, fileSize, mimeType, docData.sub_type || null, statusStr, docData.remarks || null]
      )).catch((err: any) => console.warn('employee_documents table write warning:', err.message));

      // Also create/sync entity_document for expiry notification tracking engine
      await this.docService.createDocument(
        {
          entity_type: 'employee',
          entity_id: id,
          doc_type_id: docTypeId,
          document_name: `${data.name.trim()} - ${defaultName}`,
          document_number: docNum,
          issue_date: issueDate,
          expiry_date: expiryDate,
          file_path: filePath || '/uploads/documents/sample_document.pdf',
          file_size: fileSize,
          mime_type: mimeType,
          notes: docData.sub_type || docData.remarks || null,
        },
        uploadedBy,
        ipAddress
      ).catch(() => {});
    };

    try {
      if (data.passport) {
        await processEmployeeDoc('PASSPORT', 'passport', 'Passport', {
          ...data.passport,
          issuing_country: (data.passport as any).issuing_country,
        });
      }
      if (data.visa) {
        await processEmployeeDoc('VISA', 'visa', `Visa (${(data.visa as any).visa_type || 'Employment'})`, {
          ...data.visa,
          sub_type: (data.visa as any).visa_type,
          issuing_country: (data.visa as any).issuing_country,
        });
      }
      if ((data as any).national_id || data.emreads) {
        const nid = (data as any).national_id || data.emreads;
        await processEmployeeDoc('EMIRATES_ID', 'national_id', 'Emirates ID / National ID', {
          ...nid,
          issuing_country: nid.issuing_country,
        });
      }

      // Immediately trigger expiry calculation & notification check
      await this.docService.triggerExpiryCheckJob().catch(() => {});
    } catch (docErr: any) {
      console.warn('Initial document upload warning for employee:', docErr.message);
    }

    return await this.userRepo.findById(id);
  }

  async updateEmployee(id: number, data: any, uploadedBy?: number, ipAddress?: string) {
    const emp = await this.userRepo.findById(id);
    if (!emp) throw new Error('Employee not found');

    const updatePayload: any = {};
    if (data.name) updatePayload.name = data.name;
    if (data.email) updatePayload.email = data.email;
    if (data.role_id) updatePayload.role_id = data.role_id;
    if (data.hourly_rate !== undefined) updatePayload.hourly_rate = data.hourly_rate;
    if (data.status) updatePayload.status = data.status;
    if (data.reporting_to_id !== undefined) updatePayload.reporting_to_id = data.reporting_to_id;
    if (data.assigned_project_id !== undefined) updatePayload.assigned_project_id = data.assigned_project_id;
    if (data.assigned_wbs_id !== undefined) updatePayload.assigned_wbs_id = data.assigned_wbs_id;
    if (data.department !== undefined) updatePayload.department = data.department;
    if (data.contact_number !== undefined) updatePayload.contact_number = data.contact_number;
    if (data.nationality_id !== undefined) updatePayload.nationality_id = data.nationality_id ? Number(data.nationality_id) : null;
    if (data.country_id !== undefined) updatePayload.country_id = data.country_id ? Number(data.country_id) : null;
    if (data.emreads_id !== undefined) updatePayload.emreads_id = data.emreads_id;
    if (data.password) {
      updatePayload.password_hash = await bcrypt.hash(data.password, 10);
    }

    await this.userRepo.update(id, updatePayload);

    // Update documents if provided in payload
    const docTypes = await this.masterRepo.findAllDocumentTypes();
    const findDocTypeId = (code: string) => docTypes.find(dt => dt.type_code === code)?.doc_type_id || 1;

    const processUpdateDoc = async (
      typeCode: string,
      docTypeDb: 'passport' | 'visa' | 'national_id',
      defaultName: string,
      docData?: any
    ) => {
      if (!docData) return;
      const issueDate = docData.issue_date || docData.start_date || null;
      const expiryDate = docData.expiry_date || docData.end_date || null;
      const docNum = docData.document_number?.trim() || null;

      if (!docNum && !docData.file_base64 && !expiryDate) return;

      validateDateRange(issueDate, expiryDate);

      let filePath: string | null = null;
      let fileSize = 0;
      let mimeType = 'application/pdf';

      if (docData.file_base64) {
        const saved = saveBase64DocumentFile(docData.file_base64, docData.file_name, 'employee', id);
        filePath = saved.filePath;
        fileSize = saved.fileSize;
        mimeType = saved.mimeType;
      }

      const docTypeId = findDocTypeId(typeCode);
      const calc = calculateDocumentExpiryStatus(expiryDate);
      let statusStr: 'active' | 'expiring_soon' | 'expired' = 'active';
      if (calc.status === 'EXPIRED') statusStr = 'expired';
      else if (calc.status === 'EXPIRING_SOON') statusStr = 'expiring_soon';

      let finalFilePath = filePath;
      await import('../config/db').then(async (m) => {
        const [existing] = await m.dbPool.query<any[]>(
          `SELECT id, document_file FROM employee_documents WHERE employee_id = ? AND document_type = ?`,
          [id, docTypeDb]
        );
        
        finalFilePath = filePath || (existing.length > 0 ? existing[0].document_file : null);

        if (existing.length > 0) {
          await m.dbPool.query(
            `UPDATE employee_documents SET 
              document_number = ?, issue_date = ?, expiry_date = ?, issuing_country = ?, 
              document_file = ?, file_size = ?, mime_type = ?, sub_type = ?, status = ?, remarks = ?
             WHERE id = ?`,
            [docNum, issueDate, expiryDate, docData.issuing_country || null, finalFilePath, fileSize || null, mimeType || null, docData.visa_type || null, statusStr, docData.remarks || null, existing[0].id]
          );
        } else {
          await m.dbPool.query(
            `INSERT INTO employee_documents 
              (employee_id, document_type, document_number, issue_date, expiry_date, issuing_country, document_file, file_size, mime_type, sub_type, status, remarks)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, docTypeDb, docNum, issueDate, expiryDate, docData.issuing_country || null, finalFilePath, fileSize, mimeType, docData.visa_type || null, statusStr, docData.remarks || null]
          );
        }
      }).catch(() => {});

      if (finalFilePath || expiryDate || docNum) {
        await this.docService.createDocument(
          {
            entity_type: 'employee',
            entity_id: id,
            doc_type_id: docTypeId,
            document_name: `${emp.name.trim()} - ${defaultName}`,
            document_number: docNum,
            issue_date: issueDate,
            expiry_date: expiryDate,
            file_path: finalFilePath || '/uploads/documents/sample_document.pdf',
            file_size: fileSize || 0,
            mime_type: mimeType || 'application/pdf',
          },
          uploadedBy,
          ipAddress
        ).catch(() => {});
      }
    };

    try {
      if (data.passport) await processUpdateDoc('PASSPORT', 'passport', 'Passport', data.passport);
      if (data.visa) await processUpdateDoc('VISA', 'visa', 'Visa', data.visa);
      if (data.national_id || data.emreads) await processUpdateDoc('EMIRATES_ID', 'national_id', 'Emirates ID / National ID', data.national_id || data.emreads);


      await this.docService.triggerExpiryCheckJob().catch(() => {});
    } catch (e: any) {
      console.warn('Update document warning:', e.message);
    }

    return await this.userRepo.findById(id);
  }

  async deleteEmployee(id: number, deletedBy: number) {
    const emp = await this.userRepo.findById(id);
    if (!emp) throw new Error('Employee not found');

    const [taskCount] = await import('../config/db').then(m => m.dbPool.query<any[]>(`SELECT COUNT(*) as count FROM task_assignments WHERE employee_id = ?`, [id]));
    if (taskCount[0].count > 0) throw new Error('Cannot delete employee: Assigned to tasks. Re-assign tasks or disable the account instead.');

    const [attendanceCount] = await import('../config/db').then(m => m.dbPool.query<any[]>(`SELECT COUNT(*) as count FROM attendance_logs WHERE employee_id = ?`, [id]));
    if (attendanceCount[0].count > 0) throw new Error('Cannot delete employee: Has attendance logs. Disable the account instead.');

    return await this.userRepo.softDelete(id, deletedBy);
  }

  async getEmployeeDetails(id: number) {
    const emp = await this.userRepo.findById(id);
    if (!emp) throw new Error('Employee not found');
    const workHistory = await this.userRepo.getWorkHistory(id);

    const documents = await this.docService.getDocumentsByEntity('employee', id);
    const notificationHistory = await this.docService.getNotificationHistory('employee', id);

    // Fetch employee_documents
    const [empDocsRows]: any = await import('../config/db').then(m => m.dbPool.query(
      `SELECT * FROM employee_documents WHERE employee_id = ? ORDER BY id DESC`,
      [id]
    )).catch(() => [[]]);

    const activeDocs = documents.filter(d => d.is_current === 1 && d.status !== 'archived');
    const passportDoc = activeDocs.find(d => d.doc_type_code === 'PASSPORT');
    const visaDoc = activeDocs.find(d => d.doc_type_code === 'VISA');
    const contractDoc = activeDocs.find(d => d.doc_type_code === 'CONTRACT');
    const emreadsDoc = activeDocs.find(d => d.doc_type_code === 'EMIRATES_ID');
    const labourCardDoc = activeDocs.find(d => d.doc_type_code === 'LABOUR_CARD');

    const empDocsList = empDocsRows.map((ed: any) => ({
      ...ed,
      expiry_calc: calculateDocumentExpiryStatus(ed.expiry_date),
    }));

    return {
      employee: emp,
      reporting_manager: {
        code: (emp as any).reporting_to_code || null,
        name: (emp as any).reporting_to_name || 'Direct Admin',
        email: (emp as any).reporting_to_email || null,
        role: (emp as any).reporting_to_role_name || 'Admin',
        status: (emp as any).reporting_to_status || 'active',
      },
      assigned_projects: workHistory.projects,
      assigned_tasks: workHistory.tasks,
      timesheet_history: workHistory.timesheets,
      documents,
      employee_documents: empDocsList,
      passport: passportDoc
        ? { ...passportDoc, expiry_calc: calculateDocumentExpiryStatus(passportDoc.expiry_date) }
        : empDocsList.find((d: any) => d.document_type === 'passport') || null,
      visa: visaDoc
        ? { ...visaDoc, expiry_calc: calculateDocumentExpiryStatus(visaDoc.expiry_date) }
        : empDocsList.find((d: any) => d.document_type === 'visa') || null,
      contract: contractDoc
        ? { ...contractDoc, expiry_calc: calculateDocumentExpiryStatus(contractDoc.expiry_date) }
        : empDocsList.find((d: any) => d.document_type === 'contract') || null,
      emreads: emreadsDoc
        ? { ...emreadsDoc, expiry_calc: calculateDocumentExpiryStatus(emreadsDoc.expiry_date) }
        : empDocsList.find((d: any) => d.document_type === 'national_id') || null,
      labour_card: labourCardDoc
        ? { ...labourCardDoc, expiry_calc: calculateDocumentExpiryStatus(labourCardDoc.expiry_date) }
        : empDocsList.find((d: any) => d.document_type === 'labour_card') || null,
      notification_history: notificationHistory,
    };
  }
}
