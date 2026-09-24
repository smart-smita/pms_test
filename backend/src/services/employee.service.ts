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
      contract?: {
        document_number?: string;
        contract_type?: string;
        start_date?: string;
        end_date?: string;
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

    // Helper to upload initial doc
    const docTypes = await this.masterRepo.findAllDocumentTypes();
    const findDocTypeId = (code: string) => docTypes.find(dt => dt.type_code === code)?.doc_type_id || 1;

    const uploadInitialDoc = async (
      typeCode: string,
      defaultName: string,
      docData?: {
        document_number?: string;
        issue_date?: string;
        expiry_date?: string;
        file_base64?: string;
        file_name?: string;
        notes?: string;
      }
    ) => {
      if (!docData || (!docData.document_number && !docData.file_base64 && !docData.expiry_date)) {
        return;
      }

      validateDateRange(docData.issue_date, docData.expiry_date);

      let filePath = '/uploads/documents/sample_document.pdf';
      let fileSize = 0;
      let mimeType = 'application/pdf';

      if (docData.file_base64) {
        const saved = saveBase64DocumentFile(docData.file_base64, docData.file_name, 'employee', id);
        filePath = saved.filePath;
        fileSize = saved.fileSize;
        mimeType = saved.mimeType;
      }

      const docTypeId = findDocTypeId(typeCode);
      await this.docService.createDocument(
        {
          entity_type: 'employee',
          entity_id: id,
          doc_type_id: docTypeId,
          document_name: `${data.name.trim()} - ${defaultName}`,
          document_number: docData.document_number || null,
          issue_date: docData.issue_date || null,
          expiry_date: docData.expiry_date || null,
          file_path: filePath,
          file_size: fileSize,
          mime_type: mimeType,
          notes: docData.notes || null,
        },
        uploadedBy,
        ipAddress
      );
    };

    try {
      if (data.passport) {
        await uploadInitialDoc('PASSPORT', 'Passport', data.passport);
      }
      if (data.visa) {
        await uploadInitialDoc('VISA', `Visa (${data.visa.visa_type || 'Employment'})`, data.visa);
      }
      if (data.contract) {
        await uploadInitialDoc(
          'CONTRACT',
          `Contract (${data.contract.contract_type || 'Standard'})`,
          {
            document_number: data.contract.document_number,
            issue_date: data.contract.start_date,
            expiry_date: data.contract.end_date,
            file_base64: data.contract.file_base64,
            file_name: data.contract.file_name,
            notes: data.contract.contract_type,
          }
        );
      }
      if (data.emreads) {
        await uploadInitialDoc('EMIRATES_ID', 'Emirates ID / EMREADS', data.emreads);
      }
    } catch (docErr: any) {
      console.warn('Initial document upload warning for employee:', docErr.message);
    }

    return await this.userRepo.findById(id);
  }

  async updateEmployee(id: number, data: any) {
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

    const activeDocs = documents.filter(d => d.is_current === 1 && d.status !== 'archived');
    const passportDoc = activeDocs.find(d => d.doc_type_code === 'PASSPORT');
    const visaDoc = activeDocs.find(d => d.doc_type_code === 'VISA');
    const contractDoc = activeDocs.find(d => d.doc_type_code === 'CONTRACT');
    const emreadsDoc = activeDocs.find(d => d.doc_type_code === 'EMIRATES_ID');

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
      passport: passportDoc
        ? { ...passportDoc, expiry_calc: calculateDocumentExpiryStatus(passportDoc.expiry_date) }
        : null,
      visa: visaDoc
        ? { ...visaDoc, expiry_calc: calculateDocumentExpiryStatus(visaDoc.expiry_date) }
        : null,
      contract: contractDoc
        ? { ...contractDoc, expiry_calc: calculateDocumentExpiryStatus(contractDoc.expiry_date) }
        : null,
      emreads: emreadsDoc
        ? { ...emreadsDoc, expiry_calc: calculateDocumentExpiryStatus(emreadsDoc.expiry_date) }
        : null,
      notification_history: notificationHistory,
    };
  }
}
