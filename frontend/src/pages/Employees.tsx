import React, { useEffect, useState } from 'react';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { apiRequest, parseApiErrors } from '../services/api';
import { Employee } from '../types';
import { showSuccess, showError } from '../utils/toast';
import { Plus, Edit, Trash2, Eye, UserCheck, Briefcase, Clock, Layers, ShieldCheck, X, FileText, Globe, Calendar, Download } from 'lucide-react';
import { RequirePermission } from '../components/common/RequirePermission';
import { ConfirmDeleteModal } from '../components/common/ConfirmDeleteModal';
import { DocumentModal } from '../components/common/DocumentModal';
import { useAuth } from '../context/AuthContext';
import { getDocumentUrl } from '../utils/documentHelper';

interface EmployeesProps {
  isEmbedded?: boolean;
  initialAction?: 'create';
  onNavigate?: (page: string) => void;
}

export const Employees: React.FC<EmployeesProps> = ({ isEmbedded, initialAction, onNavigate }) => {
  const { user } = useAuth();
  const isAdmin = user?.role_name === 'Admin' || user?.role_name === 'Super Admin';

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [countries, setCountries] = useState<{ country_id: number; country_name: string; country_code: string }[]>([]);
  const [nationalities, setNationalities] = useState<{ nationality_id: number; nationality_name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  // Employee Details Modal State
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsTab, setDetailsTab] = useState<'info' | 'manager' | 'history' | 'docs'>('info');
  const [selectedDetails, setSelectedDetails] = useState<any | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Form State
  const [employeeCode, setEmployeeCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [nationalityId, setNationalityId] = useState<number | ''>('');
  const [countryId, setCountryId] = useState<number | ''>('');
  const [emreadsId, setEmreadsId] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState<number>(3); // 1=Admin, 2=Manager, 3=Employee
  const [reportsToId, setReportsToId] = useState<number | ''>('');
  const [assignedProjectId, setAssignedProjectId] = useState<number | ''>('');
  const [assignedWbsId, setAssignedWbsId] = useState<number | ''>('');
  const [projectOptions, setProjectOptions] = useState<{ id: number; name: string }[]>([]);
  const [wbsOptions, setWbsOptions] = useState<{ id: number; name: string; project_id?: number }[]>([]);
  const [hourlyRate, setHourlyRate] = useState<number>(25.0);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Employee Documents & Immigration Form States
  const [docSectionTab, setDocSectionTab] = useState<'passport' | 'visa' | 'national_id'>('passport');

  const [passportForm, setPassportForm] = useState({
    document_number: '',
    issue_date: '',
    expiry_date: '',
    issuing_country: '',
    file_base64: '',
    file_name: '',
  });

  const [visaForm, setVisaForm] = useState({
    document_number: '',
    visa_type: 'Employment',
    issue_date: '',
    expiry_date: '',
    issuing_country: '',
    file_base64: '',
    file_name: '',
  });

  const [nationalIdForm, setNationalIdForm] = useState({
    document_number: '',
    issue_date: '',
    expiry_date: '',
    issuing_country: '',
    file_base64: '',
    file_name: '',
  });



  // Import CSV State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingEmp, setDeletingEmp] = useState<{ id: number; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Document Modal State
  const [docModal, setDocModal] = useState<{ isOpen: boolean; empId: number; empName: string }>({
    isOpen: false,
    empId: 0,
    empName: '',
  });


  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;
      
      const lines = text.split('\n');
      if (lines.length < 2) return showError("CSV file is empty or missing data rows");
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const parsedData = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',').map(v => v.trim());
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        parsedData.push(row);
      }
      
      setImportData(parsedData);
    };
    reader.readAsText(file);
  };

  const processImport = async () => {
    if (importData.length === 0) return showError("No data to import");
    setIsImporting(true);
    let successCount = 0;
    let errorCount = 0;

    for (const row of importData) {
      try {
        const payload = {
          name: row.name || row['employee name'],
          email: row.email,
          contact_number: row.contact_number || row.contact,
          role_id: Number(row.role_id || 4), // Default to employee role
          department: row.department || '',
          hourly_rate: Number(row.hourly_rate || row.salary || 0),
          status: row.status || 'active',
          password: row.password || 'password123'
        };

        if (!payload.name || !payload.email) {
          throw new Error("Missing required fields");
        }

        const res = await apiRequest('/employees', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        if (res.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (err) {
        errorCount++;
      }
    }

    setIsImporting(false);
    setIsImportModalOpen(false);
    setImportData([]);
    showSuccess(`Import complete: ${successCount} added, ${errorCount} failed.`);
    fetchEmployees();
  };

  const fetchEmployees = async () => {
    setIsLoading(true);
    const res = await apiRequest<Employee[]>('/employees');
    if (res.success && res.data) {
      setEmployees(res.data);
    }
    const projRes = await apiRequest<any[]>('/projects');
    if (projRes.success && projRes.data) {
      setProjectOptions(projRes.data.map((p: any) => ({ id: p.project_id, name: p.project_name })));
    }
    const wbsRes = await apiRequest<any[]>('/wbs');
    if (wbsRes.success && wbsRes.data) {
      setWbsOptions(wbsRes.data.map((w: any) => ({ id: w.id, name: w.wbs_name, project_id: w.project_id })));
    }
    const countryRes = await apiRequest<any[]>('/masters/countries');
    if (countryRes.success && countryRes.data) {
      setCountries(countryRes.data);
    }
    const nationalityRes = await apiRequest<any[]>('/masters/nationalities');
    if (nationalityRes.success && nationalityRes.data) {
      setNationalities(nationalityRes.data);
    }
    setIsLoading(false);
  };

  const [modalWbsList, setModalWbsList] = useState<{ id: number; name: string; project_id?: number }[]>([]);

  useEffect(() => {
    if (assignedProjectId) {
      apiRequest<any[]>(`/projects/${assignedProjectId}/wbs`).then((res) => {
        if (res.success && res.data) {
          setModalWbsList(res.data.map((w: any) => ({
            id: w.id || w.wbs_id,
            name: w.wbs_name,
            project_id: Number(assignedProjectId),
          })));
        } else {
          setModalWbsList([]);
        }
      });
    } else {
      setModalWbsList([]);
    }
  }, [assignedProjectId]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (initialAction === 'create') {
      openCreateModal();
    }
  }, [initialAction]);

  const openViewDetails = async (empId: number) => {
    setIsLoadingDetails(true);
    setIsDetailsOpen(true);
    setDetailsTab('info');
    setSelectedDetails(null);
    const res = await apiRequest<any>(`/employees/${empId}/details`);
    if (res.success && res.data) {
      setSelectedDetails(res.data);
    } else {
      showError(res.message || 'Failed to load employee details');
    }
    setIsLoadingDetails(false);
  };

  const resetDocForms = () => {
    setPassportForm({ document_number: '', issue_date: '', expiry_date: '', issuing_country: '', file_base64: '', file_name: '' });
    setVisaForm({ document_number: '', visa_type: 'Employment', issue_date: '', expiry_date: '', issuing_country: '', file_base64: '', file_name: '' });
    setNationalIdForm({ document_number: '', issue_date: '', expiry_date: '', issuing_country: '', file_base64: '', file_name: '' });
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<any>>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showError('File size exceeds maximum allowed limit of 10MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setter((prev: any) => ({
        ...prev,
        file_base64: base64,
        file_name: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const openCreateModal = () => {
    setEditingEmp(null);
    setEmployeeCode(`EMP${Math.floor(100 + Math.random() * 900)}`);
    setName('');
    setEmail('');
    setDepartment('');
    setContactNumber('');
    setNationalityId('');
    setCountryId('');
    setEmreadsId('');
    setPassword('Employee@123');
    setRoleId(3);
    setReportsToId('');
    setAssignedProjectId('');
    setAssignedWbsId('');
    setHourlyRate(25.0);
    setStatus('active');
    setFormErrors({});
    resetDocForms();
    setDocSectionTab('passport');
    setIsModalOpen(true);
  };

  const openEditModal = async (emp: Employee) => {
    setEditingEmp(emp);
    setEmployeeCode(emp.employee_code);
    setName(emp.name);
    setEmail(emp.email);
    setDepartment((emp as any).department || '');
    setContactNumber((emp as any).contact_number || '');
    setNationalityId((emp as any).nationality_id || '');
    setCountryId((emp as any).country_id || '');
    setEmreadsId((emp as any).emreads_id || '');
    setPassword('');
    setRoleId(emp.role_id);
    setReportsToId(emp.reporting_to_id || emp.reports_to_id || '');
    setAssignedProjectId(emp.assigned_project_id || '');
    setAssignedWbsId(emp.assigned_wbs_id || '');
    setHourlyRate(Number(emp.hourly_rate));
    setStatus(emp.status);
    setFormErrors({});
    resetDocForms();
    setDocSectionTab('passport');
    setIsModalOpen(true);

    // Fetch details to prefill document fields
    const res = await apiRequest<any>(`/employees/${emp.employee_id}/details`);
    if (res.success && res.data) {
      const d = res.data;
      if (d.passport) {
        setPassportForm({
          document_number: d.passport.document_number || '',
          issue_date: d.passport.issue_date ? d.passport.issue_date.split('T')[0] : '',
          expiry_date: d.passport.expiry_date ? d.passport.expiry_date.split('T')[0] : '',
          issuing_country: d.passport.issuing_country || '',
          file_base64: '',
          file_name: d.passport.document_file ? 'Existing Document Attached' : '',
        });
      }
      if (d.visa) {
        setVisaForm({
          document_number: d.visa.document_number || '',
          visa_type: d.visa.sub_type || d.visa.notes || 'Employment',
          issue_date: d.visa.issue_date ? d.visa.issue_date.split('T')[0] : '',
          expiry_date: d.visa.expiry_date ? d.visa.expiry_date.split('T')[0] : '',
          issuing_country: d.visa.issuing_country || '',
          file_base64: '',
          file_name: d.visa.document_file ? 'Existing Document Attached' : '',
        });
      }
      if (d.emreads || d.national_id) {
        const nid = d.emreads || d.national_id;
        setNationalIdForm({
          document_number: nid.document_number || '',
          issue_date: nid.issue_date ? nid.issue_date.split('T')[0] : '',
          expiry_date: nid.expiry_date ? nid.expiry_date.split('T')[0] : '',
          issuing_country: nid.issuing_country || '',
          file_base64: '',
          file_name: nid.document_file ? 'Existing Document Attached' : '',
        });
      }
    }
  };

  const handleDelete = (id: number, name: string) => {
    setDeletingEmp({ id, name });
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingEmp) return;
    setIsDeleting(true);
    const res = await apiRequest(`/employees/${deletingEmp.id}`, { method: 'DELETE' });
    setIsDeleting(false);
    if (res.success) {
      showSuccess('Employee deleted successfully.');
      setIsDeleteModalOpen(false);
      fetchEmployees();
    } else {
      showError(res.message || 'Failed to delete employee.');
    }
  };

  const validateDocDates = (): boolean => {
    const checkRange = (issue?: string, expiry?: string, label?: string) => {
      if (issue && expiry) {
        if (new Date(issue) > new Date(expiry)) {
          showError(`${label || 'Document'}: Issue date cannot be greater than expiry date.`);
          return false;
        }
      }
      return true;
    };

    if (!checkRange(passportForm.issue_date, passportForm.expiry_date, 'Passport')) return false;
    if (!checkRange(visaForm.issue_date, visaForm.expiry_date, 'Visa')) return false;
    if (!checkRange(nationalIdForm.issue_date, nationalIdForm.expiry_date, 'Emirates ID / National ID')) return false;

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    if (!validateDocDates()) {
      return;
    }

    setIsSubmitting(true);

    const docPayload = {
      passport: passportForm.document_number || passportForm.file_base64 || passportForm.expiry_date ? passportForm : undefined,
      visa: visaForm.document_number || visaForm.file_base64 || visaForm.expiry_date ? visaForm : undefined,
      national_id: nationalIdForm.document_number || nationalIdForm.file_base64 || nationalIdForm.expiry_date ? nationalIdForm : undefined,
    };

    if (editingEmp) {
      const payload: any = {
        name,
        email,
        department,
        contact_number: contactNumber,
        role_id: roleId,
        reporting_to_id: reportsToId ? Number(reportsToId) : null,
        assigned_project_id: assignedProjectId ? Number(assignedProjectId) : null,
        assigned_wbs_id: assignedWbsId ? Number(assignedWbsId) : null,
        hourly_rate: hourlyRate,
        nationality_id: nationalityId ? Number(nationalityId) : null,
        country_id: countryId ? Number(countryId) : null,
        emreads_id: emreadsId,
        status,
        ...docPayload,
      };
      if (password) payload.password = password;
      const res = await apiRequest(`/employees/${editingEmp.employee_id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (res.success) {
        showSuccess('Employee updated successfully.');
        setIsModalOpen(false);
        fetchEmployees();
      } else {
        if (res.errors) setFormErrors(parseApiErrors(res.errors));
        showError(res.message || 'Failed to update employee.');
      }
    } else {
      const res = await apiRequest('/employees', {
        method: 'POST',
        body: JSON.stringify({
          employee_code: employeeCode,
          name,
          email,
          department,
          contact_number: contactNumber,
          password,
          role_id: roleId,
          reporting_to_id: reportsToId ? Number(reportsToId) : null,
          assigned_project_id: assignedProjectId ? Number(assignedProjectId) : null,
          assigned_wbs_id: assignedWbsId ? Number(assignedWbsId) : null,
          hourly_rate: hourlyRate,
          nationality_id: nationalityId ? Number(nationalityId) : null,
          country_id: countryId ? Number(countryId) : null,
          emreads_id: emreadsId,
          status,
          ...docPayload,
        }),
      });
      if (res.success) {
        showSuccess('Employee created successfully with document records.');
        setIsModalOpen(false);
        fetchEmployees();
      } else {
        if (res.errors) setFormErrors(parseApiErrors(res.errors));
        showError(res.message || 'Failed to create employee.');
      }
    }
    setIsSubmitting(false);
  };

  // Filter manager options according to role
  const eligibleManagers = employees.filter((emp) => {
    if (roleId === 2) return emp.role_name === 'Admin' || emp.role_name === 'Super Admin';
    if (roleId === 3) return emp.role_name === 'Admin' || emp.role_name === 'Super Admin' || emp.role_name === 'Manager';
    return false;
  });

  const columns: Column<Employee>[] = [
    { header: 'Code', accessor: 'employee_code', sortKey: 'employee_code' },
    { header: 'Name', accessor: 'name', sortKey: 'name' },
    { header: 'Email', accessor: 'email', sortKey: 'email' },
    { header: 'Department', accessor: (r: any) => r.department || '-', sortKey: 'department' },
    { header: 'Contact', accessor: (r: any) => r.contact_number || '-' },
    {
      header: 'Role',
      accessor: (r) => (
        <Badge variant={r.role_name === 'Super Admin' || r.role_name === 'Admin' ? 'danger' : r.role_name === 'Manager' ? 'warning' : 'info'}>
          {r.role_name}
        </Badge>
      ),
      csvAccessor: 'role_name',
      sortKey: 'role_name'
    },
    {
      header: 'Reports To',
      accessor: (r) => r.reporting_to_name || r.manager_name || '-',
      csvAccessor: (r) => r.reporting_to_name || r.manager_name || '-',
    },
    {
      header: 'Assigned Project',
      accessor: (r) => r.assigned_project_name || '-',
      csvAccessor: (r) => r.assigned_project_name || '-',
    },
    {
      header: 'Assigned WBS',
      accessor: (r) => r.assigned_wbs_name || '-',
      csvAccessor: (r) => r.assigned_wbs_name || '-',
    },
    {
      header: 'Status',
      accessor: (r) => <Badge variant={r.status === 'active' ? 'success' : 'danger'}>{r.status}</Badge>,
      csvAccessor: (r) => r.status === 'active' ? 'Active' : 'Inactive',
      sortKey: 'status'
    },
  ];

  const renderDocBadge = (calc?: any) => {
    if (!calc) return <Badge variant="secondary">No Document</Badge>;
    if (calc.status === 'EXPIRED') return <Badge variant="danger">{calc.statusLabel || 'Expired'}</Badge>;
    if (calc.status === 'EXPIRING_SOON') return <Badge variant="warning">{calc.statusLabel || 'Expiring Soon'}</Badge>;
    if (calc.status === 'ACTIVE') return <Badge variant="success">{calc.statusLabel || 'Active'}</Badge>;
    return <Badge variant="secondary">{calc.statusLabel || 'Not Set'}</Badge>;
  };

  return (
    <div>
      {!isEmbedded ? (
        <div className="page-header">
          <div>
            <h1 className="page-title">Employees</h1>
            <p className="page-subtitle">Manage system users, roles, profiles, and immigration documents</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <RequirePermission module="employees" action="create">
              <Button variant="secondary" onClick={() => setIsImportModalOpen(true)}>
                <Download size={16} /> Import CSV
              </Button>
              <Button variant="primary" onClick={openCreateModal}>
                <Plus size={18} /> Add Employee
              </Button>
            </RequirePermission>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
          <RequirePermission module="employees" action="create">
            <Button variant="secondary" onClick={() => setIsImportModalOpen(true)}>
              <Download size={16} /> Import CSV
            </Button>
            <Button variant="primary" onClick={openCreateModal}>
              <Plus size={18} /> Add Employee
            </Button>
          </RequirePermission>
        </div>
      )}

      <div className="glass-card">
        <DataTable
          columns={columns}
          data={employees}
          searchPlaceholder="Search employees by code, name, or role..."
          exportFilename="employees"
          isLoading={isLoading}
          actions={(row) => (
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <Button 
                variant="secondary" 
                onClick={() => openViewDetails(row.employee_id)} 
                style={{ padding: '0.35rem 0.65rem', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', border: '1px solid rgba(99, 102, 241, 0.3)' }}
                title="View Employee Details, Documents & Reporting Manager"
              >
                <Eye size={14} /> View Details
              </Button>
              <Button
                variant="secondary"
                onClick={() => setDocModal({ isOpen: true, empId: row.employee_id, empName: row.name })}
                style={{ padding: '0.35rem 0.65rem', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}
                title="Manage Passports, Visas & Official Documents"
              >
                <FileText size={14} /> Docs
              </Button>
              {isAdmin && (
                <>
                  <Button variant="secondary" onClick={() => openEditModal(row)} style={{ padding: '0.35rem 0.65rem' }}>
                    <Edit size={14} /> Edit
                  </Button>
                  <Button variant="secondary" onClick={() => handleDelete(row.employee_id, row.name)} style={{ padding: '0.35rem 0.65rem', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    <Trash2 size={14} /> Delete
                  </Button>
                </>
              )}
            </div>
          )}
        />
      </div>

      {/* Employee Details Modal (4 Tabs: Profile, Reporting Manager, History, Immigration & Documents) */}
      {isDetailsOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700 }}>
                  {selectedDetails?.employee?.name ? selectedDetails.employee.name.charAt(0).toUpperCase() : 'E'}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    {selectedDetails?.employee?.name || 'Employee Details'}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Code: <strong>{selectedDetails?.employee?.employee_code}</strong> • Role: <Badge variant="info">{selectedDetails?.employee?.role_name}</Badge>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsDetailsOpen(false)} className="modal-close-btn"><X size={18} /></button>
            </div>

            {isLoadingDetails ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}><LoadingSpinner /></div>
            ) : selectedDetails ? (
              <div className="modal-body" style={{ paddingTop: '1rem' }}>
                {/* Modal Sub-Tabs */}
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setDetailsTab('info')}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '6px',
                      border: 'none',
                      background: detailsTab === 'info' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                      color: detailsTab === 'info' ? '#6366f1' : 'var(--text-secondary)',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <UserCheck size={15} /> Employee Profile
                  </button>
                  <button
                    onClick={() => setDetailsTab('docs')}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '6px',
                      border: 'none',
                      background: detailsTab === 'docs' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                      color: detailsTab === 'docs' ? '#38bdf8' : 'var(--text-secondary)',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <FileText size={15} /> Immigration & Documents
                  </button>
                  <button
                    onClick={() => setDetailsTab('manager')}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '6px',
                      border: 'none',
                      background: detailsTab === 'manager' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                      color: detailsTab === 'manager' ? '#6366f1' : 'var(--text-secondary)',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <ShieldCheck size={15} /> Reporting Manager
                  </button>
                  <button
                    onClick={() => setDetailsTab('history')}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '6px',
                      border: 'none',
                      background: detailsTab === 'history' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                      color: detailsTab === 'history' ? '#6366f1' : 'var(--text-secondary)',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <Clock size={15} /> Work & Timesheets
                  </button>
                </div>

                {/* Tab 1: Employee Information */}
                {detailsTab === 'info' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Employee Code</span>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedDetails.employee.employee_code}</strong>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Full Name</span>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedDetails.employee.name}</strong>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Email Address</span>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedDetails.employee.email}</strong>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Department</span>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedDetails.employee.department || 'N/A'}</strong>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Contact Number</span>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedDetails.employee.contact_number || 'N/A'}</strong>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Role</span>
                      <Badge variant="info">{selectedDetails.employee.role_name}</Badge>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Account Status</span>
                      <Badge variant={selectedDetails.employee.status === 'active' ? 'success' : 'danger'}>{selectedDetails.employee.status}</Badge>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Assigned Project</span>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedDetails.employee.assigned_project_name || 'None'}</strong>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Assigned WBS Discipline</span>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedDetails.employee.assigned_wbs_name || 'None'}</strong>
                    </div>
                  </div>
                )}

                {/* Tab 2: Immigration & Documents */}
                {detailsTab === 'docs' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      {/* Passport Card */}
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <strong style={{ color: '#38bdf8', fontSize: '0.9rem' }}>Passport Details</strong>
                          {renderDocBadge(selectedDetails.passport?.expiry_calc)}
                        </div>
                        <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', color: 'var(--text-secondary)' }}>
                          <div>Number: <strong style={{ color: 'var(--text-primary)' }}>{selectedDetails.passport?.document_number || 'N/A'}</strong></div>
                          <div>Country: <strong>{selectedDetails.passport?.issuing_country || 'N/A'}</strong></div>
                          <div>Issue: {selectedDetails.passport?.issue_date ? new Date(selectedDetails.passport.issue_date).toLocaleDateString() : 'N/A'}</div>
                          <div>Expiry: {selectedDetails.passport?.expiry_date ? new Date(selectedDetails.passport.expiry_date).toLocaleDateString() : 'N/A'}</div>
                          {selectedDetails.passport?.file_path && (
                            <a href={getDocumentUrl(selectedDetails.passport.file_path)} target="_blank" rel="noreferrer" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.3rem' }}>
                              <Download size={13} /> View Passport File
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Visa Card */}
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <strong style={{ color: '#a855f7', fontSize: '0.9rem' }}>Visa Details</strong>
                          {renderDocBadge(selectedDetails.visa?.expiry_calc)}
                        </div>
                        <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', color: 'var(--text-secondary)' }}>
                          <div>Number: <strong style={{ color: 'var(--text-primary)' }}>{selectedDetails.visa?.document_number || 'N/A'}</strong></div>
                          <div>Type: <strong>{selectedDetails.visa?.sub_type || selectedDetails.visa?.notes || 'Employment'}</strong></div>
                          <div>Country: <strong>{selectedDetails.visa?.issuing_country || 'N/A'}</strong></div>
                          <div>Expiry: {selectedDetails.visa?.expiry_date ? new Date(selectedDetails.visa.expiry_date).toLocaleDateString() : 'N/A'}</div>
                          {selectedDetails.visa?.file_path && (
                            <a href={getDocumentUrl(selectedDetails.visa.file_path)} target="_blank" rel="noreferrer" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.3rem' }}>
                              <Download size={13} /> View Visa File
                            </a>
                          )}
                        </div>
                      </div>

                      {/* National ID / Emirates ID Card */}
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <strong style={{ color: '#4ade80', fontSize: '0.9rem' }}>Emirates ID / National ID</strong>
                          {renderDocBadge(selectedDetails.emreads?.expiry_calc)}
                        </div>
                        <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', color: 'var(--text-secondary)' }}>
                          <div>Number: <strong style={{ color: 'var(--text-primary)' }}>{selectedDetails.emreads?.document_number || 'N/A'}</strong></div>
                          <div>Country: <strong>{selectedDetails.emreads?.issuing_country || 'N/A'}</strong></div>
                          <div>Expiry: {selectedDetails.emreads?.expiry_date ? new Date(selectedDetails.emreads.expiry_date).toLocaleDateString() : 'N/A'}</div>
                          {selectedDetails.emreads?.file_path && (
                            <a href={getDocumentUrl(selectedDetails.emreads.file_path)} target="_blank" rel="noreferrer" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.3rem' }}>
                              <Download size={13} /> View National ID File
                            </a>
                          )}
                        </div>
                      </div>

                      {selectedDetails.reporting_manager.email && (
                        <div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>Manager Email ID</span>
                          <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{selectedDetails.reporting_manager.email}</strong>
                        </div>
                      )}
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>Manager Role</span>
                        <Badge variant="warning">{selectedDetails.reporting_manager.role}</Badge>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>Manager Login Status</span>
                        <Badge variant="success">{selectedDetails.reporting_manager.status}</Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 4: Work & Timesheet History */}
                {detailsTab === 'history' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Projects */}
                    <div>
                      <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>Assigned Projects ({selectedDetails.assigned_projects?.length || 0})</h5>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {selectedDetails.assigned_projects?.map((p: any) => (
                          <div key={p.project_id} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid var(--border-color)' }}>
                            <strong>{p.project_code || `P0${p.project_id}`}</strong> {p.project_name} ({p.status})
                          </div>
                        ))}
                        {(!selectedDetails.assigned_projects || selectedDetails.assigned_projects.length === 0) && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No active project assignments found.</div>
                        )}
                      </div>
                    </div>

                    {/* Tasks */}
                    <div>
                      <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>Assigned Tasks ({selectedDetails.assigned_tasks?.length || 0})</h5>
                      <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
                        <table className="minimal-table" style={{ width: '100%', fontSize: '0.8rem' }}>
                          <thead>
                            <tr>
                              <th style={{ textAlign: 'left', padding: '0.4rem' }}>Task Name</th>
                              <th style={{ textAlign: 'left', padding: '0.4rem' }}>Project / Discipline</th>
                              <th style={{ textAlign: 'right', padding: '0.4rem' }}>Est. Hours</th>
                              <th style={{ textAlign: 'center', padding: '0.4rem' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedDetails.assigned_tasks?.map((t: any) => (
                              <tr key={t.task_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '0.4rem', color: 'var(--text-primary)', fontWeight: 600 }}>{t.task_name}</td>
                                <td style={{ padding: '0.4rem', color: 'var(--text-secondary)' }}>{t.project_name} ({t.wbs_name || 'General'})</td>
                                <td style={{ padding: '0.4rem', textAlign: 'right', fontWeight: 600 }}>{t.estimated_hours} hrs</td>
                                <td style={{ padding: '0.4rem', textAlign: 'center' }}><Badge variant="info">{t.task_status}</Badge></td>
                              </tr>
                            ))}
                            {(!selectedDetails.assigned_tasks || selectedDetails.assigned_tasks.length === 0) && (
                              <tr><td colSpan={4} style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No assigned tasks found.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Timesheets */}
                    <div>
                      <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>Timesheet Log History ({selectedDetails.timesheet_history?.length || 0})</h5>
                      <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                        <table className="minimal-table" style={{ width: '100%', fontSize: '0.8rem' }}>
                          <thead>
                            <tr>
                              <th style={{ textAlign: 'left', padding: '0.4rem' }}>Log Date</th>
                              <th style={{ textAlign: 'left', padding: '0.4rem' }}>Project / Task</th>
                              <th style={{ textAlign: 'right', padding: '0.4rem' }}>Logged HRs</th>
                              <th style={{ textAlign: 'center', padding: '0.4rem' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedDetails.timesheet_history?.map((ts: any) => (
                              <tr key={ts.timesheet_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '0.4rem', color: 'var(--text-primary)' }}>{ts.log_date}</td>
                                <td style={{ padding: '0.4rem', color: 'var(--text-secondary)' }}>{ts.project_name} ({ts.task_name || ts.wbs_name || 'General Log'})</td>
                                <td style={{ padding: '0.4rem', textAlign: 'right', fontWeight: 700, color: '#10b981' }}>{ts.working_hours} hrs</td>
                                <td style={{ padding: '0.4rem', textAlign: 'center' }}><Badge variant="success">{ts.status || 'Approved'}</Badge></td>
                              </tr>
                            ))}
                            {(!selectedDetails.timesheet_history || selectedDetails.timesheet_history.length === 0) && (
                              <tr><td colSpan={4} style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No timesheet logs found for this employee.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <Button variant="secondary" onClick={() => setIsDetailsOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingEmp ? 'Edit Employee' : 'Add New Employee'}>
        <form noValidate onSubmit={handleSubmit}>
          {!editingEmp && (
            <FormInput
              label="Employee Code (Unique)"
              type="text"
              value={employeeCode}
              onChange={(e) => { setEmployeeCode(e.target.value); setFormErrors(prev => ({...prev, employee_code: ''})); }}
              required
              error={formErrors.employee_code}
            />
          )}

          <FormInput label="Full Name" type="text" value={name} onChange={(e) => { setName(e.target.value); setFormErrors(prev => ({...prev, name: ''})); }} required error={formErrors.name} />
          <FormInput label="Email Address" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setFormErrors(prev => ({...prev, email: ''})); }} required error={formErrors.email} />
          
          <div className="grid-2-col">
            <FormInput label="Department" type="text" value={department} onChange={(e) => setDepartment(e.target.value)} />
            <FormInput label="Contact Number" type="text" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
          </div>

          <FormInput
            label={editingEmp ? 'New Password (leave blank to keep current)' : 'Password'}
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setFormErrors(prev => ({...prev, password: ''})); }}
            required={!editingEmp}
            error={formErrors.password}
          />

          <div className="grid-2-col">
            <FormSelect
              label="Nationality"
              value={nationalityId}
              onChange={(e) => setNationalityId(e.target.value ? Number(e.target.value) : '')}
              options={[
                { value: '', label: '-- Select Nationality --' },
                ...nationalities.map((n) => ({ value: n.nationality_id, label: n.nationality_name })),
              ]}
            />
            <FormSelect
              label="Country"
              value={countryId}
              onChange={(e) => setCountryId(e.target.value ? Number(e.target.value) : '')}
              options={[
                { value: '', label: '-- Select Country --' },
                ...countries.map((c) => ({ value: c.country_id, label: c.country_name })),
              ]}
            />
          </div>
          <FormInput label="Emirates ID / National ID" type="text" value={emreadsId} onChange={(e) => setEmreadsId(e.target.value)} />

          <div className="grid-2-col">
            <FormSelect
              label="Role"
              value={roleId}
              onChange={(e) => setRoleId(parseInt(e.target.value, 10))}
              options={[
                { value: 1, label: 'Admin' },
                { value: 2, label: 'Manager' },
                { value: 3, label: 'Employee' },
              ]}
              error={formErrors.role_id}
            />

            <FormSelect
              label="Reporting Manager"
              value={reportsToId}
              onChange={(e) => setReportsToId(e.target.value ? parseInt(e.target.value, 10) : '')}
              options={[
                { value: '', label: '-- None (Direct Admin) --' },
                ...eligibleManagers.map((m) => ({ value: m.employee_id, label: `${m.name} (${m.role_name})` })),
              ]}
              error={formErrors.reports_to_id}
            />
          </div>

          <div className="grid-2-col">
            <FormSelect
              label="Assigned Project"
              value={assignedProjectId}
              onChange={(e) => {
                const newPid = e.target.value ? parseInt(e.target.value, 10) : '';
                setAssignedProjectId(newPid);
                setAssignedWbsId('');
              }}
              options={[
                { value: '', label: '-- None --' },
                ...projectOptions.map((p) => ({ value: p.id, label: p.name })),
              ]}
              error={formErrors.assigned_project_id}
            />

            <FormSelect
              label="Assigned WBS Discipline"
              value={assignedWbsId}
              onChange={(e) => setAssignedWbsId(e.target.value ? parseInt(e.target.value, 10) : '')}
              options={[
                { value: '', label: '-- None --' },
                ...modalWbsList.map((w) => ({ value: w.id, label: w.name })),
              ]}
              error={formErrors.assigned_wbs_id}
            />
          </div>

          <div className="form-group mb-3">
            <FormSelect
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              error={formErrors.status}
            />
          </div>

          {/* Employee Documents & Immigration Section */}
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} color="#38bdf8" /> Employee Documents & Immigration Details
              </h4>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Optional files up to 10MB</span>
            </div>

            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {[
                { key: 'passport', label: '1. Passport' },
                { key: 'visa', label: '2. Visa Details' },
                { key: 'national_id', label: '3. Emirates ID / National ID' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setDocSectionTab(tab.key as any)}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: docSectionTab === tab.key ? '#4f46e5' : 'rgba(255,255,255,0.05)',
                    color: docSectionTab === tab.key ? '#ffffff' : 'var(--text-secondary)',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Passport */}
            {docSectionTab === 'passport' && (
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div className="grid-2-col">
                  <FormInput label="Passport Number" value={passportForm.document_number} onChange={(e) => setPassportForm({ ...passportForm, document_number: e.target.value })} placeholder="e.g. Z1234567" />
                  <FormSelect
                    label="Passport Issuing Country"
                    value={passportForm.issuing_country}
                    onChange={(e) => setPassportForm({ ...passportForm, issuing_country: e.target.value })}
                    options={[
                      { value: '', label: '-- Select Country --' },
                      ...countries.map((c) => ({ value: c.country_name, label: `${c.country_name} (${c.country_code})` })),
                    ]}
                  />
                </div>
                <div className="grid-2-col">
                  <FormInput label="Passport Issue Date" type="date" value={passportForm.issue_date} onChange={(e) => setPassportForm({ ...passportForm, issue_date: e.target.value })} />
                  <FormInput label="Passport Expiry Date" type="date" value={passportForm.expiry_date} onChange={(e) => setPassportForm({ ...passportForm, expiry_date: e.target.value })} />
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>Passport Document Upload (PDF, PNG, JPG)</label>
                  <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={(e) => handleFileUpload(e, setPassportForm)} style={{ fontSize: '0.8rem' }} />
                  {passportForm.file_name && <div style={{ fontSize: '0.75rem', color: '#4ade80', marginTop: '0.2rem' }}>Selected: {passportForm.file_name}</div>}
                </div>
              </div>
            )}

            {/* Visa */}
            {docSectionTab === 'visa' && (
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div className="grid-2-col">
                  <FormInput label="Visa Number" value={visaForm.document_number} onChange={(e) => setVisaForm({ ...visaForm, document_number: e.target.value })} placeholder="e.g. 201/2026/12345" />
                  <FormSelect
                    label="Visa Type"
                    value={visaForm.visa_type}
                    onChange={(e) => setVisaForm({ ...visaForm, visa_type: e.target.value })}
                    options={[
                      { value: 'Employment', label: 'Employment Visa' },
                      { value: 'Residence', label: 'Residency Visa' },
                      { value: 'Partner/Investor', label: 'Partner / Investor Visa' },
                      { value: 'Visit/Business', label: 'Visit / Business Visa' },
                      { value: 'Transit', label: 'Transit / Short Term' },
                    ]}
                  />
                </div>
                <div className="grid-2-col">
                  <FormInput label="Visa Issue Date" type="date" value={visaForm.issue_date} onChange={(e) => setVisaForm({ ...visaForm, issue_date: e.target.value })} />
                  <FormInput label="Visa Expiry Date" type="date" value={visaForm.expiry_date} onChange={(e) => setVisaForm({ ...visaForm, expiry_date: e.target.value })} />
                </div>
                <div className="grid-2-col" style={{ marginTop: '0.5rem' }}>
                  <FormSelect
                    label="Visa Issuing Country"
                    value={visaForm.issuing_country}
                    onChange={(e) => setVisaForm({ ...visaForm, issuing_country: e.target.value })}
                    options={[
                      { value: '', label: '-- Select Country --' },
                      ...countries.map((c) => ({ value: c.country_name, label: `${c.country_name} (${c.country_code})` })),
                    ]}
                  />
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>Visa Document Upload (PDF, PNG, JPG)</label>
                    <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={(e) => handleFileUpload(e, setVisaForm)} style={{ fontSize: '0.8rem' }} />
                    {visaForm.file_name && <div style={{ fontSize: '0.75rem', color: '#4ade80', marginTop: '0.2rem' }}>Selected: {visaForm.file_name}</div>}
                  </div>
                </div>
              </div>
            )}

            {/* National ID / Emirates ID */}
            {docSectionTab === 'national_id' && (
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div className="grid-2-col">
                  <FormInput
                    label="ID Number (Emirates ID / National ID / 16-Digit ID)"
                    value={nationalIdForm.document_number}
                    onChange={(e) => setNationalIdForm({ ...nationalIdForm, document_number: e.target.value })}
                    placeholder="e.g. 784-1990-1234567-1 or 7841990123456789"
                    maxLength={25}
                  />
                  <FormSelect
                    label="Issuing Country"
                    value={nationalIdForm.issuing_country}
                    onChange={(e) => setNationalIdForm({ ...nationalIdForm, issuing_country: e.target.value })}
                    options={[
                      { value: '', label: '-- Select Country --' },
                      ...countries.map((c) => ({ value: c.country_name, label: `${c.country_name} (${c.country_code})` })),
                    ]}
                  />
                </div>
                <div className="grid-2-col">
                  <FormInput label="ID Issue Date" type="date" value={nationalIdForm.issue_date} onChange={(e) => setNationalIdForm({ ...nationalIdForm, issue_date: e.target.value })} />
                  <FormInput label="ID Expiry Date" type="date" value={nationalIdForm.expiry_date} onChange={(e) => setNationalIdForm({ ...nationalIdForm, expiry_date: e.target.value })} />
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>ID Document Upload (PDF, PNG, JPG)</label>
                  <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={(e) => handleFileUpload(e, setNationalIdForm)} style={{ fontSize: '0.8rem' }} />
                  {nationalIdForm.file_name && <div style={{ fontSize: '0.75rem', color: '#4ade80', marginTop: '0.2rem' }}>Selected: {nationalIdForm.file_name}</div>}
                </div>
              </div>
            )}

            {/* Labour Card */}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (editingEmp ? 'Save Changes' : 'Create Employee')}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        recordName={deletingEmp?.name || 'this employee'}
        isLoading={isDeleting}
      />

      <DocumentModal
        isOpen={docModal.isOpen}
        onClose={() => setDocModal({ ...docModal, isOpen: false })}
        entityType="employee"
        entityId={docModal.empId}
        entityName={docModal.empName}
      />
    </div>
  );
};
