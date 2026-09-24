import { LabourRepository, LabourRow } from '../repositories/labour.repository';
import { DocumentService } from './document.service';
import { MasterRepository } from '../repositories/master.repository';
import { calculateDocumentExpiryStatus, saveBase64DocumentFile, validateDateRange } from '../utils/documentHelper';

export class LabourService {
  private labourRepo = new LabourRepository();
  private docService = new DocumentService();
  private masterRepo = new MasterRepository();

  async getLabours(search?: string, labourType?: string, projectId?: number, countryId?: number): Promise<LabourRow[]> {
    return await this.labourRepo.findAll(search, labourType, projectId, countryId);
  }

  async getLabourById(id: number): Promise<LabourRow> {
    const labour = await this.labourRepo.findById(id);
    if (!labour) throw new Error('Labour record not found');
    return labour;
  }

  async getLabourDetails(id: number): Promise<any> {
    const labour = await this.labourRepo.findById(id);
    if (!labour) throw new Error('Labour record not found');

    const documents = await this.docService.getDocumentsByEntity('labour', id);
    const notificationHistory = await this.docService.getNotificationHistory('labour', id);

    // Extract current active primary documents
    const activeDocs = documents.filter(d => d.is_current === 1 && d.status !== 'archived');
    const passportDoc = activeDocs.find(d => d.doc_type_code === 'PASSPORT');
    const visaDoc = activeDocs.find(d => d.doc_type_code === 'VISA');
    const labourCardDoc = activeDocs.find(d => d.doc_type_code === 'LABOUR_CARD');
    const contractDoc = activeDocs.find(d => d.doc_type_code === 'CONTRACT' || d.doc_type_code === 'LABOUR_CONTRACT');
    const emreadsDoc = activeDocs.find(d => d.doc_type_code === 'EMIRATES_ID');

    return {
      labour,
      documents,
      passport: passportDoc
        ? { ...passportDoc, expiry_calc: calculateDocumentExpiryStatus(passportDoc.expiry_date) }
        : null,
      visa: visaDoc
        ? { ...visaDoc, expiry_calc: calculateDocumentExpiryStatus(visaDoc.expiry_date) }
        : null,
      labour_card: labourCardDoc
        ? { ...labourCardDoc, expiry_calc: calculateDocumentExpiryStatus(labourCardDoc.expiry_date) }
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

  async createLabour(
    data: {
      name: string;
      contact_number?: string | null;
      aadhar_id?: string | null;
      labour_type?: 'contractor' | 'direct_labour';
      contractor_id?: number | null;
      assigned_project_id?: number | null;
      nationality_id?: number | null;
      country_id?: number | null;
      emreads_id?: string | null;
      email?: string | null;
      status?: 'active' | 'inactive';

      // Document payloads
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
      labour_card?: {
        document_number?: string;
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
  ): Promise<LabourRow> {
    if (!data.name || !data.name.trim()) throw new Error('Labour name is required');

    // Clean & validate contact number (allow international / 7-15 digits if present)
    const cleanContact = data.contact_number ? data.contact_number.trim() : null;
    if (cleanContact) {
      const cleanDigits = cleanContact.replace(/[\s+-]/g, '');
      if (cleanDigits.length < 7 || cleanDigits.length > 15) {
        throw new Error('Contact number must be a valid phone number (7-15 digits).');
      }
      const existingContact = await this.labourRepo.findByContact(cleanContact);
      if (existingContact) {
        const err: any = new Error(`Labour with contact number '${cleanContact}' already exists (${existingContact.name}).`);
        err.existingLabour = existingContact;
        err.statusCode = 409;
        throw err;
      }
    }

    // Clean & validate Aadhaar (optional, but 12 digits if provided)
    const cleanAadhar = data.aadhar_id ? data.aadhar_id.trim() : null;
    if (cleanAadhar) {
      if (!/^\d{12}$/.test(cleanAadhar)) {
        throw new Error('Aadhaar ID must be exactly 12 digits.');
      }
      const existingAadhar = await this.labourRepo.findByAadhar(cleanAadhar);
      if (existingAadhar) {
        const err: any = new Error(`Labour with Aadhaar ID '${cleanAadhar}' already exists (${existingAadhar.name}).`);
        err.existingLabour = existingAadhar;
        err.statusCode = 409;
        throw err;
      }
    }

    // Clean & validate Emirates ID / EMREADS ID if provided
    const cleanEmreads = data.emreads_id ? data.emreads_id.trim() : null;
    if (cleanEmreads) {
      const existingEmreads = await this.labourRepo.findByEmreads(cleanEmreads);
      if (existingEmreads) {
        const err: any = new Error(`Labour with EMREADS / Emirates ID '${cleanEmreads}' already exists (${existingEmreads.name}).`);
        err.existingLabour = existingEmreads;
        err.statusCode = 409;
        throw err;
      }
    }

    // 1. Create Labour Record
    const labourId = await this.labourRepo.create({
      name: data.name.trim(),
      contact_number: cleanContact,
      aadhar_id: cleanAadhar,
      labour_type: data.labour_type || 'direct_labour',
      contractor_id: data.contractor_id ? Number(data.contractor_id) : null,
      assigned_project_id: data.assigned_project_id ? Number(data.assigned_project_id) : null,
      nationality_id: data.nationality_id ? Number(data.nationality_id) : null,
      country_id: data.country_id ? Number(data.country_id) : null,
      emreads_id: cleanEmreads,
      email: data.email ? data.email.trim() : null,
      status: data.status || 'active',
    });

    // 2. Fetch all document types for ID mapping
    const docTypes = await this.masterRepo.findAllDocumentTypes();
    const findDocTypeId = (code: string) => docTypes.find(dt => dt.type_code === code)?.doc_type_id || 1;

    // Helper to upload initial doc
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
        const saved = saveBase64DocumentFile(docData.file_base64, docData.file_name, 'labour', labourId);
        filePath = saved.filePath;
        fileSize = saved.fileSize;
        mimeType = saved.mimeType;
      }

      const docTypeId = findDocTypeId(typeCode);
      await this.docService.createDocument(
        {
          entity_type: 'labour',
          entity_id: labourId,
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

    // Upload initial documents if provided
    try {
      if (data.passport) {
        await uploadInitialDoc('PASSPORT', 'Passport', data.passport);
      }
      if (data.visa) {
        await uploadInitialDoc('VISA', `Visa (${data.visa.visa_type || 'Work'})`, data.visa);
      }
      if (data.labour_card) {
        await uploadInitialDoc('LABOUR_CARD', 'Labour Card', data.labour_card);
      }
      if (data.contract) {
        await uploadInitialDoc(
          'LABOUR_CONTRACT',
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
      console.warn('Initial document upload warning for labour:', docErr.message);
    }

    return (await this.labourRepo.findById(labourId))!;
  }

  async updateLabour(
    id: number,
    data: {
      name?: string;
      contact_number?: string | null;
      aadhar_id?: string | null;
      labour_type?: 'contractor' | 'direct_labour';
      contractor_id?: number | null;
      assigned_project_id?: number | null;
      nationality_id?: number | null;
      country_id?: number | null;
      emreads_id?: string | null;
      email?: string | null;
      status?: 'active' | 'inactive';
    }
  ): Promise<LabourRow> {
    const labour = await this.labourRepo.findById(id);
    if (!labour) throw new Error('Labour record not found');

    if (data.name !== undefined && (!data.name || !data.name.trim())) {
      throw new Error('Labour name is required');
    }

    let cleanContact: string | null | undefined = undefined;
    if (data.contact_number !== undefined) {
      cleanContact = data.contact_number ? data.contact_number.trim() : null;
      if (cleanContact) {
        const cleanDigits = cleanContact.replace(/[\s+-]/g, '');
        if (cleanDigits.length < 7 || cleanDigits.length > 15) {
          throw new Error('Contact number must be a valid phone number (7-15 digits).');
        }
        const existingContact = await this.labourRepo.findByContact(cleanContact, id);
        if (existingContact) {
          const err: any = new Error(`Another labour with contact number '${cleanContact}' already exists (${existingContact.name}).`);
          err.existingLabour = existingContact;
          err.statusCode = 409;
          throw err;
        }
      }
    }

    let cleanAadhar: string | null | undefined = undefined;
    if (data.aadhar_id !== undefined) {
      cleanAadhar = data.aadhar_id ? data.aadhar_id.trim() : null;
      if (cleanAadhar) {
        if (!/^\d{12}$/.test(cleanAadhar)) {
          throw new Error('Aadhaar ID must be exactly 12 digits.');
        }
        const existingAadhar = await this.labourRepo.findByAadhar(cleanAadhar, id);
        if (existingAadhar) {
          const err: any = new Error(`Another labour with Aadhaar ID '${cleanAadhar}' already exists (${existingAadhar.name}).`);
          err.existingLabour = existingAadhar;
          err.statusCode = 409;
          throw err;
        }
      }
    }

    let cleanEmreads: string | null | undefined = undefined;
    if (data.emreads_id !== undefined) {
      cleanEmreads = data.emreads_id ? data.emreads_id.trim() : null;
      if (cleanEmreads) {
        const existingEmreads = await this.labourRepo.findByEmreads(cleanEmreads, id);
        if (existingEmreads) {
          const err: any = new Error(`Another labour with EMREADS / Emirates ID '${cleanEmreads}' already exists (${existingEmreads.name}).`);
          err.existingLabour = existingEmreads;
          err.statusCode = 409;
          throw err;
        }
      }
    }

    await this.labourRepo.update(id, {
      ...data,
      ...(cleanContact !== undefined ? { contact_number: cleanContact } : {}),
      ...(cleanAadhar !== undefined ? { aadhar_id: cleanAadhar } : {}),
      ...(cleanEmreads !== undefined ? { emreads_id: cleanEmreads } : {}),
    });

    return (await this.labourRepo.findById(id))!;
  }

  async getDependencies(id: number): Promise<{ attendanceCount: number; subWorkersCount: number; canDelete: boolean }> {
    const deps = await this.labourRepo.getDependencies(id);
    return {
      ...deps,
      canDelete: deps.attendanceCount === 0 && deps.subWorkersCount === 0,
    };
  }

  async deleteLabour(id: number, force: boolean = false): Promise<boolean> {
    const labour = await this.labourRepo.findById(id);
    if (!labour) throw new Error('Labour record not found');

    const deps = await this.labourRepo.getDependencies(id);
    if (!force && (deps.attendanceCount > 0 || deps.subWorkersCount > 0)) {
      const err: any = new Error(
        `Cannot delete worker/contractor '${labour.name}' because it has active dependencies (${deps.attendanceCount} attendance logs, ${deps.subWorkersCount} sub-workers).`
      );
      err.dependencies = deps;
      err.statusCode = 409;
      throw err;
    }

    return await this.labourRepo.delete(id, force);
  }
}
