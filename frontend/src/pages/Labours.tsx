import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  AlertTriangle,
  ShieldAlert,
  X,
  Filter,
  RotateCcw,
  Clock,
  CheckCircle,
  FileText,
  Globe,
  Briefcase,
  CreditCard,
  Shield,
  Upload,
} from 'lucide-react';
import { DataTable, Column } from '../components/common/DataTable';
import { DocumentModal } from '../components/common/DocumentModal';
import { LabourDetailsModal } from '../components/common/LabourDetailsModal';
import { useAuth } from '../context/AuthContext';
import { apiService, apiRequest } from '../services/api';
import { showSuccess, showError } from '../utils/toast';
import { calculateExpiryStatus } from '../utils/documentHelper';

export interface Labour {
  labour_id: number;
  name: string;
  contact_number: string | null;
  aadhar_id: string | null;
  labour_type: 'contractor' | 'direct_labour';
  contractor_id?: number | null;
  contractor_name?: string | null;
  assigned_project_id?: number | null;
  assigned_project_name?: string | null;
  nationality_id?: number | null;
  nationality_name?: string | null;
  country_id?: number | null;
  country_name?: string | null;
  emreads_id?: string | null;
  email?: string | null;
  status?: 'active' | 'inactive';
  sub_worker_count?: number;
  created_at: string;
}

export interface LabourWorkLog {
  work_log_id: number;
  labour_id: number;
  labour_name: string;
  labour_type: string;
  project_id: number;
  project_name?: string;
  wbs_id?: number | null;
  wbs_name?: string;
  task_id: number;
  task_name?: string;
  work_date: string;
  in_time?: string;
  out_time?: string;
  total_working_hours: number;
  rate_type: 'hourly' | 'daily';
  rate: number;
  amount: number;
  work_description?: string;
  work_status: 'pending' | 'in_progress' | 'completed';
  payment_status: 'pending' | 'approved' | 'paid' | 'rejected' | 'cancelled';
}

export const Labours: React.FC = () => {
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'registry' | 'work_logs'>('registry');

  const [labours, setLabours] = useState<Labour[]>([]);
  const [workLogs, setWorkLogs] = useState<LabourWorkLog[]>([]);
  const [loading, setLoading] = useState(false);

  const contractorsList = labours.filter((l) => l.labour_type === 'contractor');

  // Filters
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Dropdown options
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);
  const [wbsList, setWbsList] = useState<{ id: number; name: string; project_id?: number }[]>([]);
  const [tasks, setTasks] = useState<{ id: number; name: string; project_id?: number; wbs_id?: number }[]>([]);
  const [countries, setCountries] = useState<{ country_id: number; country_name: string; phone_code: string }[]>([]);
  const [nationalities, setNationalities] = useState<{ nationality_id: number; nationality_name: string }[]>([]);

  // Create / Edit Labour Form State
  const [showAddLabour, setShowAddLabour] = useState(false);
  const [editingLabour, setEditingLabour] = useState<Labour | null>(null);
  const [formSection, setFormSection] = useState<'basic' | 'identity' | 'visa' | 'contract'>('basic');

  const initialLabourForm = {
    name: '',
    contact_number: '',
    aadhar_id: '',
    labour_type: 'direct_labour' as 'contractor' | 'direct_labour',
    contractor_id: '' as string | number,
    country_id: '' as string | number,
    nationality_id: '' as string | number,
    assigned_project_id: '' as string | number,
    status: 'active' as 'active' | 'inactive',
    emreads_id: '',
    // Identity - Passport
    passport_number: '',
    passport_issue_date: '',
    passport_expiry_date: '',
    passport_file_base64: '',
    passport_file_name: '',
    // Labour Card
    labour_card_number: '',
    labour_card_issue_date: '',
    labour_card_expiry_date: '',
    labour_card_file_base64: '',
    labour_card_file_name: '',
    // Visa
    visa_number: '',
    visa_type: 'Employment Visa',
    visa_issue_date: '',
    visa_expiry_date: '',
    visa_file_base64: '',
    visa_file_name: '',
    // Contract
    contract_number: '',
    contract_type: 'Direct Employment',
    contract_start_date: '',
    contract_end_date: '',
    contract_file_base64: '',
    contract_file_name: '',
  };

  const [labourForm, setLabourForm] = useState(initialLabourForm);

  // Profile Details Modal
  const [detailsModalLabourId, setDetailsModalLabourId] = useState<number | null>(null);

  // Work Log Form State
  const [showAddWorkLog, setShowAddWorkLog] = useState(false);
  const [editingWorkLog, setEditingWorkLog] = useState<LabourWorkLog | null>(null);
  const [workLogForm, setWorkLogForm] = useState({
    labour_id: '',
    project_id: '',
    wbs_id: '',
    task_id: '',
    work_date: new Date().toISOString().split('T')[0],
    in_time: '',
    out_time: '',
    total_working_hours: 8,
    rate_type: 'hourly' as 'hourly' | 'daily',
    rate: 500,
    work_description: '',
  });

  // PII Aadhar Toggle State
  const [revealAadhar, setRevealAadhar] = useState<Record<number, boolean>>({});

  // Dependency Check Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<Labour | null>(null);
  const [deleteDeps, setDeleteDeps] = useState<{ attendanceCount: number; subWorkersCount: number } | null>(null);

  // Document Modal State
  const [docModal, setDocModal] = useState<{ isOpen: boolean; labourId: number; labourName: string }>({
    isOpen: false,
    labourId: 0,
    labourName: '',
  });

  useEffect(() => {
    fetchData();
  }, [search, selectedType, selectedProject, startDate, endDate, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const laboursRes = await apiService.get<Labour[]>('/labours', {
        search,
        labour_type: selectedType,
        project_id: selectedProject,
      });
      if (laboursRes.data) setLabours(laboursRes.data);

      if (activeTab === 'work_logs') {
        const res = await apiService.get<LabourWorkLog[]>('/labour-work-logs', {
          project_id: selectedProject,
          start_date: startDate,
          end_date: endDate,
          search,
        });
        if (res.data) setWorkLogs(res.data);
      }

      const projRes = await apiService.get<any[]>('/projects');
      if (projRes.data) setProjects(projRes.data.map((p) => ({ id: p.project_id, name: p.project_name })));

      const wbsRes = await apiService.get<any[]>('/wbs');
      if (wbsRes.data) setWbsList(wbsRes.data.map((w) => ({ id: w.id, name: w.wbs_name, project_id: w.project_id })));

      const taskRes = await apiService.get<any[]>('/tasks');
      if (taskRes.data) setTasks(taskRes.data.map((t) => ({ id: t.task_id, name: t.task_name, project_id: t.project_id, wbs_id: t.wbs_id })));

      const countryRes = await apiRequest<any[]>('/masters/countries');
      if (countryRes.success && countryRes.data) setCountries(countryRes.data);

      const natRes = await apiRequest<any[]>('/masters/nationalities');
      if (natRes.success && natRes.data) setNationalities(natRes.data);
    } catch (err) {
      console.error('Error fetching labours data:', err);
    } finally {
      setLoading(false);
    }
  };

  const [modalWbsList, setModalWbsList] = useState<{ id: number; name: string; project_id?: number }[]>([]);

  useEffect(() => {
    if (workLogForm.project_id) {
      apiService.get<any[]>(`/projects/${workLogForm.project_id}/wbs`).then((res) => {
        if (res.success && res.data) {
          setModalWbsList(
            res.data.map((w: any) => ({
              id: w.id || w.wbs_id,
              name: w.wbs_name,
              project_id: Number(workLogForm.project_id),
            }))
          );
        } else {
          setModalWbsList([]);
        }
      });
    } else {
      setModalWbsList(wbsList);
    }
  }, [workLogForm.project_id, wbsList]);

  const filteredFormTasks = tasks.filter((t) => {
    if (workLogForm.project_id && Number(t.project_id) !== Number(workLogForm.project_id)) return false;
    if (workLogForm.wbs_id && Number(t.wbs_id) !== Number(workLogForm.wbs_id)) return false;
    return true;
  });

  const handleFileUpload = (
    fieldPrefix: 'passport' | 'labour_card' | 'visa' | 'contract',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      showError('File size exceeds 15MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLabourForm((prev) => ({
        ...prev,
        [`${fieldPrefix}_file_base64`]: reader.result as string,
        [`${fieldPrefix}_file_name`]: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleCreateOrUpdateLabour = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameClean = labourForm.name.trim();
    const contactClean = labourForm.contact_number.trim();
    const aadharClean = labourForm.aadhar_id.trim();

    if (!nameClean) {
      showError('Labour name is required.');
      return;
    }

    // Optional phone validation: 7-15 digits
    if (contactClean) {
      const cleanDigits = contactClean.replace(/[\s+-]/g, '');
      if (cleanDigits.length < 7 || cleanDigits.length > 15) {
        showError('Contact number must be between 7 and 15 digits.');
        return;
      }
    }

    // Optional Aadhaar: if entered, must be 12 digits
    if (aadharClean && !/^\d{12}$/.test(aadharClean)) {
      showError('Aadhaar ID must be exactly 12 digits.');
      return;
    }

    // Validate dates: issue date cannot be after expiry date
    const checkDatePair = (issue?: string, expiry?: string, label?: string) => {
      if (issue && expiry && new Date(issue) > new Date(expiry)) {
        throw new Error(`${label}: Issue date cannot be after expiry date.`);
      }
    };

    try {
      checkDatePair(labourForm.passport_issue_date, labourForm.passport_expiry_date, 'Passport');
      checkDatePair(labourForm.visa_issue_date, labourForm.visa_expiry_date, 'Visa');
      checkDatePair(labourForm.labour_card_issue_date, labourForm.labour_card_expiry_date, 'Labour Card');
      checkDatePair(labourForm.contract_start_date, labourForm.contract_end_date, 'Contract');
    } catch (err: any) {
      showError(err.message);
      return;
    }

    try {
      const payload: any = {
        name: nameClean,
        contact_number: contactClean || null,
        aadhar_id: aadharClean || null,
        labour_type: labourForm.labour_type,
        contractor_id: labourForm.contractor_id ? Number(labourForm.contractor_id) : null,
        country_id: labourForm.country_id ? Number(labourForm.country_id) : null,
        nationality_id: labourForm.nationality_id ? Number(labourForm.nationality_id) : null,
        assigned_project_id: labourForm.assigned_project_id ? Number(labourForm.assigned_project_id) : null,
        emreads_id: labourForm.emreads_id?.trim() || null,
        status: labourForm.status,
      };

      if (labourForm.passport_number || labourForm.passport_file_base64) {
        payload.passport = {
          document_number: labourForm.passport_number,
          issue_date: labourForm.passport_issue_date || null,
          expiry_date: labourForm.passport_expiry_date || null,
          file_base64: labourForm.passport_file_base64 || null,
          file_name: labourForm.passport_file_name || null,
        };
      }

      if (labourForm.visa_number || labourForm.visa_file_base64 || labourForm.visa_expiry_date) {
        payload.visa = {
          document_number: labourForm.visa_number,
          visa_type: labourForm.visa_type,
          issue_date: labourForm.visa_issue_date || null,
          expiry_date: labourForm.visa_expiry_date || null,
          file_base64: labourForm.visa_file_base64 || null,
          file_name: labourForm.visa_file_name || null,
        };
      }

      if (labourForm.labour_card_number || labourForm.labour_card_file_base64) {
        payload.labour_card = {
          document_number: labourForm.labour_card_number,
          issue_date: labourForm.labour_card_issue_date || null,
          expiry_date: labourForm.labour_card_expiry_date || null,
          file_base64: labourForm.labour_card_file_base64 || null,
          file_name: labourForm.labour_card_file_name || null,
        };
      }

      if (labourForm.contract_number || labourForm.contract_file_base64) {
        payload.contract = {
          document_number: labourForm.contract_number,
          contract_type: labourForm.contract_type,
          start_date: labourForm.contract_start_date || null,
          end_date: labourForm.contract_end_date || null,
          file_base64: labourForm.contract_file_base64 || null,
          file_name: labourForm.contract_file_name || null,
        };
      }

      let res;
      if (editingLabour) {
        res = await apiService.put(`/labours/${editingLabour.labour_id}`, payload);
      } else {
        res = await apiService.post('/labours', payload);
      }

      if (res.success) {
        showSuccess(editingLabour ? 'Labour updated successfully!' : 'Labour registered successfully with documents!');
        setEditingLabour(null);
        setLabourForm(initialLabourForm);
        setShowAddLabour(false);
        fetchData();
      } else {
        showError(res.message || 'Action failed');
      }
    } catch (err: any) {
      showError(err.message || 'Action failed');
    }
  };

  const handleCreateOrUpdateWorkLog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let res;
      const payload = {
        labour_id: parseInt(workLogForm.labour_id, 10),
        project_id: parseInt(workLogForm.project_id, 10),
        wbs_id: workLogForm.wbs_id ? parseInt(workLogForm.wbs_id, 10) : null,
        task_id: parseInt(workLogForm.task_id, 10),
        work_date: workLogForm.work_date,
        in_time: workLogForm.in_time || null,
        out_time: workLogForm.out_time || null,
        total_working_hours: Number(workLogForm.total_working_hours) || 8,
        rate_type: workLogForm.rate_type,
        rate: Number(workLogForm.rate),
        work_description: workLogForm.work_description,
      };

      if (editingWorkLog) {
        res = await apiService.put(`/labour-work-logs/${editingWorkLog.work_log_id}`, payload);
      } else {
        res = await apiService.post('/labour-work-logs', payload);
      }

      if (res.success) {
        showSuccess(editingWorkLog ? 'Work log updated successfully!' : 'Work log created successfully!');
        setEditingWorkLog(null);
        setWorkLogForm({
          labour_id: '',
          project_id: '',
          wbs_id: '',
          task_id: '',
          work_date: new Date().toISOString().split('T')[0],
          in_time: '',
          out_time: '',
          total_working_hours: 8,
          rate_type: 'hourly',
          rate: 500,
          work_description: '',
        });
        setShowAddWorkLog(false);
        fetchData();
      } else {
        showError(res.message || 'Failed to save work log');
      }
    } catch (err: any) {
      showError(err.message || 'Action failed');
    }
  };

  const handleOpenDelete = async (labour: Labour) => {
    try {
      const res = await apiService.get<{ attendanceCount: number; subWorkersCount: number }>(`/labours/${labour.labour_id}/dependencies`);
      setDeleteTarget(labour);
      if (res.data) setDeleteDeps(res.data);
    } catch (err) {
      setDeleteTarget(labour);
      setDeleteDeps(null);
    }
  };

  const handleConfirmDelete = async (force: boolean) => {
    if (!deleteTarget) return;
    try {
      const res = await apiService.delete(`/labours/${deleteTarget.labour_id}?force=${force}`);
      if (res.success) {
        showSuccess('Labour deleted successfully');
        setDeleteTarget(null);
        setDeleteDeps(null);
        fetchData();
      } else {
        showError(res.message || 'Failed to delete labour');
      }
    } catch (err: any) {
      showError(err.message || 'Delete failed');
    }
  };

  const handleDeleteWorkLog = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this work log?')) return;
    try {
      const res = await apiService.delete(`/labour-work-logs/${id}`);
      if (res.success) {
        showSuccess('Work log deleted');
        fetchData();
      } else {
        showError(res.message || 'Failed to delete work log');
      }
    } catch (err: any) {
      showError(err.message || 'Action failed');
    }
  };

  const toggleAadhar = (id: number) => {
    setRevealAadhar((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const liveVisaCalc = calculateExpiryStatus(labourForm.visa_expiry_date);

  // Registry Columns
  const registryColumns: Column<Labour>[] = [
    {
      accessor: (item) => `LAB-${String(item.labour_id).padStart(3, '0')}`,
      header: 'Labour ID',
      sortable: true,
    },
    {
      accessor: 'name',
      header: 'Labour / Contractor Name',
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-semibold" style={{ color: 'var(--text-primary)', display: 'block' }}>{item.name}</span>
          {item.contractor_name && (
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Contractor: {item.contractor_name}</span>
          )}
        </div>
      ),
    },
    {
      accessor: 'labour_type',
      header: 'Type',
      sortable: true,
      render: (item) => (
        <span
          className={`badge ${item.labour_type === 'contractor' ? 'badge-info' : 'badge-success'}`}
          style={item.labour_type === 'contractor' ? { background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' } : {}}
        >
          {item.labour_type === 'contractor' ? 'Contractor' : 'Direct Labour'}
        </span>
      ),
    },
    {
      accessor: 'contact_number',
      header: 'Contact',
      render: (item) => item.contact_number || '-',
    },
    {
      accessor: (item) => item.assigned_project_name || 'Unassigned',
      header: 'Project Assignment',
      render: (item) => (
        <span style={{ fontSize: '0.85rem' }}>{item.assigned_project_name || <span style={{ color: '#94a3b8' }}>Unassigned</span>}</span>
      ),
    },
    {
      accessor: (item) => item.country_name || item.nationality_name || '-',
      header: 'Country / Nationality',
      render: (item) => (
        <span style={{ fontSize: '0.82rem' }}>
          {item.country_name || item.nationality_name || '-'}
        </span>
      ),
    },
    {
      accessor: 'aadhar_id',
      header: 'Govt / EMREADS ID',
      render: (item) => (
        <div style={{ fontSize: '0.8rem' }}>
          {item.emreads_id ? (
            <span style={{ color: '#38bdf8' }}>{item.emreads_id}</span>
          ) : item.aadhar_id ? (
            <div className="flex items-center gap-1">
              <span>
                {revealAadhar[item.labour_id]
                  ? item.aadhar_id
                  : item.aadhar_id.replace(/^.*(\d{4})$/, 'XXXX-XXXX-$1')}
              </span>
              <button
                type="button"
                onClick={() => toggleAadhar(item.labour_id)}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
              >
                {revealAadhar[item.labour_id] ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          ) : (
            <span style={{ color: '#94a3b8' }}>-</span>
          )}
        </div>
      ),
    },
    {
      accessor: (item) => (
        <span
          style={{
            padding: '0.2rem 0.5rem',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: 600,
            background: item.status === 'inactive' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            color: item.status === 'inactive' ? '#ef4444' : '#10b981',
            textTransform: 'uppercase',
          }}
        >
          {item.status || 'Active'}
        </span>
      ),
      header: 'Status',
    },
    {
      accessor: (item) => (
        <div className="flex items-center gap-1">
          {/* View Details Profile Modal */}
          <button
            onClick={() => setDetailsModalLabourId(item.labour_id)}
            className="action-btn"
            style={{ color: '#6366f1', padding: '0.25rem 0.5rem' }}
            title="View Complete Labour Profile & Documents"
          >
            <Eye size={15} />
          </button>

          {/* Manage Documents Modal */}
          <button
            onClick={() => setDocModal({ isOpen: true, labourId: item.labour_id, labourName: item.name })}
            className="action-btn"
            style={{ color: '#38bdf8', padding: '0.25rem 0.5rem' }}
            title="Manage Passports, Visas & Worker Documents"
          >
            <FileText size={15} />
          </button>

          {hasPermission('labours', 'update') && (
            <button
              onClick={() => {
                setEditingLabour(item);
                setShowAddLabour(true);
                setFormSection('basic');
                setLabourForm({
                  ...initialLabourForm,
                  name: item.name,
                  contact_number: item.contact_number || '',
                  aadhar_id: item.aadhar_id || '',
                  labour_type: item.labour_type,
                  contractor_id: item.contractor_id || '',
                  country_id: item.country_id || '',
                  nationality_id: item.nationality_id || '',
                  assigned_project_id: item.assigned_project_id || '',
                  emreads_id: item.emreads_id || '',
                  status: (item.status as any) || 'active',
                });
              }}
              className="action-btn edit"
              title="Edit Labour"
            >
              <Edit2 size={15} />
            </button>
          )}

          {hasPermission('labours', 'delete') && (
            <button onClick={() => handleOpenDelete(item)} className="action-btn delete" title="Delete Labour">
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ),
      header: 'Actions',
    },
  ];

  // Work Log Columns
  const workLogColumns: Column<LabourWorkLog>[] = [
    { accessor: 'work_date', header: 'Date', sortable: true },
    { accessor: 'labour_name', header: 'Labour Name', sortable: true },
    { accessor: 'project_name', header: 'Project', render: (i) => i.project_name || '-' },
    { accessor: 'wbs_name', header: 'WBS Discipline', render: (i) => i.wbs_name || '-' },
    { accessor: 'task_name', header: 'Task', render: (i) => <span className="font-semibold">{i.task_name || '-'}</span> },
    { accessor: (i) => `${i.in_time || '-'} to ${i.out_time || '-'}`, header: 'In / Out Time' },
    { accessor: (i) => `${Number(i.total_working_hours).toFixed(2)} hrs`, header: 'Hours', sortable: true },
    {
      accessor: (i) => (
        <span style={{ fontSize: '0.85rem' }}>
          ₹{Number(i.rate).toFixed(2)} / {i.rate_type}
        </span>
      ),
      header: 'Rate',
    },
    {
      accessor: (i) => (
        <span className="font-bold text-success" style={{ color: '#10b981', fontSize: '0.95rem' }}>
          ₹{Number(i.amount).toFixed(2)}
        </span>
      ),
      header: 'Total Amount',
      sortable: true,
    },
    {
      accessor: (i) => (
        <span
          className="badge"
          style={{
            background: i.payment_status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            color: i.payment_status === 'paid' ? '#10b981' : '#f59e0b',
            textTransform: 'capitalize',
          }}
        >
          {i.payment_status}
        </span>
      ),
      header: 'Payment Status',
    },
    {
      accessor: (i) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setEditingWorkLog(i);
              setShowAddWorkLog(true);
              setWorkLogForm({
                labour_id: String(i.labour_id),
                project_id: String(i.project_id),
                wbs_id: i.wbs_id ? String(i.wbs_id) : '',
                task_id: String(i.task_id),
                work_date: i.work_date,
                in_time: i.in_time || '',
                out_time: i.out_time || '',
                total_working_hours: i.total_working_hours,
                rate_type: i.rate_type,
                rate: i.rate,
                work_description: i.work_description || '',
              });
            }}
            className="action-btn edit"
          >
            <Edit2 size={14} />
          </button>
          <button onClick={() => handleDeleteWorkLog(i.work_log_id)} className="action-btn delete">
            <Trash2 size={14} />
          </button>
        </div>
      ),
      header: 'Actions',
    },
  ];

  return (
    <div className="page-body">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Users size={24} />
            Labour & Contractor Management
          </h1>
          <p className="page-subtitle">
            Task-wise, date-wise labour work log tracking and rate calculations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {hasPermission('labours', 'create') && (
            <button
              type="button"
              onClick={() => {
                const nextState = !showAddLabour;
                setShowAddLabour(nextState);
                if (nextState) {
                  setShowAddWorkLog(false);
                  setEditingLabour(null);
                  setFormSection('basic');
                  setLabourForm(initialLabourForm);
                }
              }}
              className="btn btn-primary"
            >
              <Plus size={16} />
              Add Labour
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              const nextState = !showAddWorkLog;
              setShowAddWorkLog(nextState);
              if (nextState) {
                setShowAddLabour(false);
                setEditingWorkLog(null);
                setWorkLogForm({
                  labour_id: '',
                  project_id: '',
                  wbs_id: '',
                  task_id: '',
                  work_date: new Date().toISOString().split('T')[0],
                  in_time: '',
                  out_time: '',
                  total_working_hours: 8,
                  rate_type: 'hourly',
                  rate: 500,
                  work_description: '',
                });
              }
            }}
            className="btn btn-blue"
          >
            <Clock size={16} />
            + Add Task Work Log
          </button>
        </div>
      </div>

      {/* Add / Edit Labour Form Card */}
      {showAddLabour && (
        <div className="glass-card p-4 mb-4" style={{ borderLeft: '4px solid var(--accent-primary, #6366f1)' }}>
          <div className="flex items-center justify-between mb-3 pb-2" style={{ borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))' }}>
            <h3 className="font-semibold flex items-center gap-2" style={{ fontSize: '1.1rem' }}>
              <Users size={18} style={{ color: 'var(--accent-primary, #6366f1)' }} />
              {editingLabour ? `Edit Labour / Contractor: ${editingLabour.name}` : 'Register New Labour / Contractor'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setShowAddLabour(false);
                setEditingLabour(null);
              }}
              className="btn btn-outline"
              style={{ padding: '0.3rem 0.6rem' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Form Tabs: Basic, Identity, Visa, Contract */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
            {[
              { key: 'basic', label: '1. Basic Information' },
              { key: 'identity', label: '2. Identity & Govt Documents' },
              { key: 'visa', label: '3. Visa & Immigration' },
              { key: 'contract', label: '4. Labour Card & Contract' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFormSection(tab.key as any)}
                style={{
                  padding: '0.5rem 0.85rem',
                  border: 'none',
                  borderBottom: formSection === tab.key ? '2px solid #6366f1' : '2px solid transparent',
                  background: 'transparent',
                  color: formSection === tab.key ? '#6366f1' : 'var(--text-secondary)',
                  fontWeight: formSection === tab.key ? 600 : 400,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleCreateOrUpdateLabour}>
            {/* TAB 1: BASIC INFORMATION */}
            {formSection === 'basic' && (
              <div>
                <div className="grid-2-col mb-4">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">
                      Labour / Contractor Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter full name or contractor agency name"
                      value={labourForm.name}
                      onChange={(e) => setLabourForm({ ...labourForm, name: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">
                      Labour Type <span className="text-danger">*</span>
                    </label>
                    <select
                      value={labourForm.labour_type}
                      onChange={(e) =>
                        setLabourForm({
                          ...labourForm,
                          labour_type: e.target.value as 'contractor' | 'direct_labour',
                        })
                      }
                      className="form-select"
                    >
                      <option value="direct_labour">Direct Labour</option>
                      <option value="contractor">Contractor (Sub-contractor / Agency)</option>
                    </select>
                  </div>
                </div>

                <div className="grid-3-col mb-4">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Contact Number (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. +971 50 1234567 or 9876543210"
                      value={labourForm.contact_number}
                      onChange={(e) => setLabourForm({ ...labourForm, contact_number: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Country</label>
                    <select
                      value={labourForm.country_id}
                      onChange={(e) => setLabourForm({ ...labourForm, country_id: e.target.value })}
                      className="form-select"
                    >
                      <option value="">-- Select Country --</option>
                      {countries.map((c) => (
                        <option key={c.country_id} value={c.country_id}>
                          {c.country_name} ({c.phone_code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Nationality</label>
                    <select
                      value={labourForm.nationality_id}
                      onChange={(e) => setLabourForm({ ...labourForm, nationality_id: e.target.value })}
                      className="form-select"
                    >
                      <option value="">-- Select Nationality --</option>
                      {nationalities.map((n) => (
                        <option key={n.nationality_id} value={n.nationality_id}>
                          {n.nationality_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid-3-col mb-4">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Project Assignment (Optional)</label>
                    <select
                      value={labourForm.assigned_project_id}
                      onChange={(e) => setLabourForm({ ...labourForm, assigned_project_id: e.target.value })}
                      className="form-select"
                    >
                      <option value="">-- No Initial Project --</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {labourForm.labour_type === 'direct_labour' && (
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Associated Contractor (Optional)</label>
                      <select
                        value={labourForm.contractor_id}
                        onChange={(e) => setLabourForm({ ...labourForm, contractor_id: e.target.value })}
                        className="form-select"
                      >
                        <option value="">-- Direct (No Contractor) --</option>
                        {contractorsList.map((c) => (
                          <option key={c.labour_id} value={c.labour_id}>
                            {c.name} (ID: LAB-{String(c.labour_id).padStart(3, '0')})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Status</label>
                    <select
                      value={labourForm.status}
                      onChange={(e) => setLabourForm({ ...labourForm, status: e.target.value as any })}
                      className="form-select"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: IDENTITY & GOVT DOCUMENTS */}
            {formSection === 'identity' && (
              <div>
                <div className="grid-2-col mb-4">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">EMREADS ID / Emirates ID (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 784-1988-1234567-1"
                      value={labourForm.emreads_id}
                      onChange={(e) => setLabourForm({ ...labourForm, emreads_id: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">National ID / Aadhaar ID (Optional)</label>
                    <input
                      type="text"
                      maxLength={12}
                      placeholder="12-digit Aadhaar (e.g. 123456789012)"
                      value={labourForm.aadhar_id}
                      onChange={(e) => setLabourForm({ ...labourForm, aadhar_id: e.target.value.replace(/\D/g, '') })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', color: '#38bdf8', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Shield size={16} /> Passport Details (Optional)
                  </h4>
                  <div className="grid-3-col mb-3">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Passport Number</label>
                      <input
                        type="text"
                        placeholder="e.g. N1234567"
                        value={labourForm.passport_number}
                        onChange={(e) => setLabourForm({ ...labourForm, passport_number: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Passport Issue Date</label>
                      <input
                        type="date"
                        value={labourForm.passport_issue_date}
                        onChange={(e) => setLabourForm({ ...labourForm, passport_issue_date: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Passport Expiry Date</label>
                      <input
                        type="date"
                        value={labourForm.passport_expiry_date}
                        onChange={(e) => setLabourForm({ ...labourForm, passport_expiry_date: e.target.value })}
                        className="form-input"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Upload Passport Document Copy (PDF, JPG, PNG)</label>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      onChange={(e) => handleFileUpload('passport', e)}
                      className="form-input"
                    />
                    {labourForm.passport_file_name && (
                      <span style={{ fontSize: '0.78rem', color: '#10b981', marginTop: '0.25rem', display: 'block' }}>
                        Attached: {labourForm.passport_file_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: VISA & IMMIGRATION */}
            {formSection === 'visa' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    Record Visa details and expiry dates. The system automatically calculates Visa status and generates alerts at 10, 8, 5, 3, 2, 1 days.
                  </div>
                  {labourForm.visa_expiry_date && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status Preview:</span>
                      <span
                        style={{
                          padding: '0.3rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          ...liveVisaCalc.badgeStyle,
                        }}
                      >
                        {liveVisaCalc.statusLabel}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid-2-col mb-4">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Visa Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 201/2026/8921"
                      value={labourForm.visa_number}
                      onChange={(e) => setLabourForm({ ...labourForm, visa_number: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Visa Type</label>
                    <select
                      value={labourForm.visa_type}
                      onChange={(e) => setLabourForm({ ...labourForm, visa_type: e.target.value })}
                      className="form-select"
                    >
                      <option value="Employment Visa">Employment Visa</option>
                      <option value="Work Visa">Work Visa</option>
                      <option value="Residence Visa">Residence Visa</option>
                      <option value="Mission Visa">Mission Visa</option>
                      <option value="Visit / Short Term">Visit / Short Term</option>
                    </select>
                  </div>
                </div>

                <div className="grid-2-col mb-4">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Visa Issue Date</label>
                    <input
                      type="date"
                      value={labourForm.visa_issue_date}
                      onChange={(e) => setLabourForm({ ...labourForm, visa_issue_date: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Visa Expiry Date</label>
                    <input
                      type="date"
                      value={labourForm.visa_expiry_date}
                      onChange={(e) => setLabourForm({ ...labourForm, visa_expiry_date: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label">Visa Document Upload (PDF, PNG, JPG)</label>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    onChange={(e) => handleFileUpload('visa', e)}
                    className="form-input"
                  />
                  {labourForm.visa_file_name && (
                    <span style={{ fontSize: '0.78rem', color: '#10b981', marginTop: '0.25rem', display: 'block' }}>
                      Attached: {labourForm.visa_file_name}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: LABOUR CARD & CONTRACT */}
            {formSection === 'contract' && (
              <div>
                {/* Labour Card Subsection */}
                <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', color: '#f59e0b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CreditCard size={16} /> Labour Card Details (Optional)
                  </h4>
                  <div className="grid-3-col mb-3">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Labour Card Number</label>
                      <input
                        type="text"
                        placeholder="e.g. LC-998822"
                        value={labourForm.labour_card_number}
                        onChange={(e) => setLabourForm({ ...labourForm, labour_card_number: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Issue Date</label>
                      <input
                        type="date"
                        value={labourForm.labour_card_issue_date}
                        onChange={(e) => setLabourForm({ ...labourForm, labour_card_issue_date: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Expiry Date</label>
                      <input
                        type="date"
                        value={labourForm.labour_card_expiry_date}
                        onChange={(e) => setLabourForm({ ...labourForm, labour_card_expiry_date: e.target.value })}
                        className="form-input"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Upload Labour Card Copy</label>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      onChange={(e) => handleFileUpload('labour_card', e)}
                      className="form-input"
                    />
                    {labourForm.labour_card_file_name && (
                      <span style={{ fontSize: '0.78rem', color: '#10b981', marginTop: '0.25rem', display: 'block' }}>
                        Attached: {labourForm.labour_card_file_name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Contract Subsection */}
                <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', color: '#10b981', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Briefcase size={16} /> Contract Details (Optional)
                  </h4>
                  <div className="grid-2-col mb-3">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Contract Number</label>
                      <input
                        type="text"
                        placeholder="e.g. CON-2026-004"
                        value={labourForm.contract_number}
                        onChange={(e) => setLabourForm({ ...labourForm, contract_number: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Contract Type</label>
                      <select
                        value={labourForm.contract_type}
                        onChange={(e) => setLabourForm({ ...labourForm, contract_type: e.target.value })}
                        className="form-select"
                      >
                        <option value="Direct Employment">Direct Employment</option>
                        <option value="Subcontractor Agreement">Subcontractor Agreement</option>
                        <option value="Fixed-Term Project">Fixed-Term Project</option>
                        <option value="Daily Wage">Daily Wage</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid-2-col mb-3">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Contract Start Date</label>
                      <input
                        type="date"
                        value={labourForm.contract_start_date}
                        onChange={(e) => setLabourForm({ ...labourForm, contract_start_date: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Contract End Date</label>
                      <input
                        type="date"
                        value={labourForm.contract_end_date}
                        onChange={(e) => setLabourForm({ ...labourForm, contract_end_date: e.target.value })}
                        className="form-input"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Upload Contract Document</label>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      onChange={(e) => handleFileUpload('contract', e)}
                      className="form-input"
                    />
                    {labourForm.contract_file_name && (
                      <span style={{ fontSize: '0.78rem', color: '#10b981', marginTop: '0.25rem', display: 'block' }}>
                        Attached: {labourForm.contract_file_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex justify-between items-center pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {formSection !== 'basic' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (formSection === 'contract') setFormSection('visa');
                      else if (formSection === 'visa') setFormSection('identity');
                      else if (formSection === 'identity') setFormSection('basic');
                    }}
                    className="btn btn-outline"
                    style={{ fontSize: '0.85rem' }}
                  >
                    ← Previous Tab
                  </button>
                )}
                {formSection !== 'contract' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (formSection === 'basic') setFormSection('identity');
                      else if (formSection === 'identity') setFormSection('visa');
                      else if (formSection === 'visa') setFormSection('contract');
                    }}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.85rem' }}
                  >
                    Next Tab →
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddLabour(false);
                    setEditingLabour(null);
                  }}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingLabour ? 'Update Labour & Documents' : 'Register Labour & Save Documents'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Add / Edit Work Log Form Card */}
      {showAddWorkLog && (
        <div className="glass-card p-4 mb-4" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div className="flex items-center justify-between mb-4 pb-2" style={{ borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))' }}>
            <h3 className="font-semibold flex items-center gap-2" style={{ fontSize: '1.1rem' }}>
              <Clock size={18} style={{ color: '#3b82f6' }} />
              {editingWorkLog ? 'Edit Task Work Log' : 'Add Daily Labour Task Work Log'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setShowAddWorkLog(false);
                setEditingWorkLog(null);
              }}
              className="btn btn-outline"
              style={{ padding: '0.3rem 0.6rem' }}
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleCreateOrUpdateWorkLog}>
            <div className="grid-3-col mb-4">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  Worker / Contractor <span className="text-danger">*</span>
                </label>
                <select
                  required
                  value={workLogForm.labour_id}
                  onChange={(e) => setWorkLogForm({ ...workLogForm, labour_id: e.target.value })}
                  className="form-select"
                >
                  <option value="">-- Select Worker --</option>
                  {labours.map((l) => (
                    <option key={l.labour_id} value={l.labour_id}>
                      {l.name} ({l.labour_type === 'contractor' ? 'Contractor' : 'Direct'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  Project <span className="text-danger">*</span>
                </label>
                <select
                  required
                  value={workLogForm.project_id}
                  onChange={(e) => setWorkLogForm({ ...workLogForm, project_id: e.target.value, wbs_id: '', task_id: '' })}
                  className="form-select"
                >
                  <option value="">-- Select Project --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">WBS Discipline</label>
                <select
                  value={workLogForm.wbs_id}
                  onChange={(e) => setWorkLogForm({ ...workLogForm, wbs_id: e.target.value, task_id: '' })}
                  className="form-select"
                >
                  <option value="">-- All / General WBS --</option>
                  {modalWbsList.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid-3-col mb-4">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  Task <span className="text-danger">*</span>
                </label>
                <select
                  required
                  value={workLogForm.task_id}
                  onChange={(e) => setWorkLogForm({ ...workLogForm, task_id: e.target.value })}
                  className="form-select"
                >
                  <option value="">-- Select Task --</option>
                  {filteredFormTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  Work Date <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={workLogForm.work_date}
                  onChange={(e) => setWorkLogForm({ ...workLogForm, work_date: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  Total Working Hours <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  required
                  value={workLogForm.total_working_hours}
                  onChange={(e) => setWorkLogForm({ ...workLogForm, total_working_hours: parseFloat(e.target.value) || 0 })}
                  className="form-input"
                />
              </div>
            </div>

            <div className="grid-3-col mb-4">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Rate Type</label>
                <select
                  value={workLogForm.rate_type}
                  onChange={(e) => setWorkLogForm({ ...workLogForm, rate_type: e.target.value as any })}
                  className="form-select"
                >
                  <option value="hourly">Hourly Rate</option>
                  <option value="daily">Daily Wage</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Rate (₹)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={workLogForm.rate}
                  onChange={(e) => setWorkLogForm({ ...workLogForm, rate: parseFloat(e.target.value) || 0 })}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Calculated Amount (₹)</label>
                <input
                  type="text"
                  disabled
                  value={`₹${(
                    workLogForm.rate_type === 'hourly'
                      ? workLogForm.total_working_hours * workLogForm.rate
                      : workLogForm.rate
                  ).toFixed(2)}`}
                  className="form-input"
                  style={{ background: 'rgba(255, 255, 255, 0.05)', fontWeight: 700, color: '#10b981' }}
                />
              </div>
            </div>

            <div className="form-group mb-4">
              <label className="form-label">Work Description / Remarks</label>
              <textarea
                placeholder="Specific tasks completed, site progress, notes..."
                value={workLogForm.work_description}
                onChange={(e) => setWorkLogForm({ ...workLogForm, work_description: e.target.value })}
                className="form-textarea"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddWorkLog(false);
                  setEditingWorkLog(null);
                }}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-blue">
                {editingWorkLog ? 'Update Work Log' : 'Save Work Log'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs-container mb-4">
        <button
          onClick={() => setActiveTab('registry')}
          className={`tab-btn ${activeTab === 'registry' ? 'active' : ''}`}
        >
          Labour Registry ({labours.length})
        </button>
        <button
          onClick={() => setActiveTab('work_logs')}
          className={`tab-btn ${activeTab === 'work_logs' ? 'active' : ''}`}
        >
          Labour Work Logs ({workLogs.length})
        </button>
      </div>

      {/* Filters Section */}
      <div className="glass-card p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold flex items-center gap-2" style={{ fontSize: '0.95rem' }}>
            <Filter size={16} />
            Filters & Selection
          </h4>
          <button
            onClick={() => {
              setSearch('');
              setSelectedType('');
              setSelectedProject('');
              setStartDate('');
              setEndDate('');
            }}
            className="btn btn-outline"
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        <div className="grid-4-col">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Search Keyword</label>
            <input
              type="text"
              placeholder="Search by name, contact, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Project</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="form-select"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Labour Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="form-select"
            >
              <option value="">All Labour Types</option>
              <option value="direct_labour">Direct Labour</option>
              <option value="contractor">Contractor</option>
            </select>
          </div>

          {activeTab === 'work_logs' ? (
            <div className="grid-2-col" style={{ gap: '0.5rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">From Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">To Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Showing <strong>{labours.length}</strong> registered worker(s).
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Table Content */}
      {activeTab === 'registry' ? (
        <DataTable
          columns={registryColumns}
          data={labours}
          isLoading={loading}
          keyExtractor={(item: Labour) => item.labour_id}
          emptyMessage="No labour or contractor records found."
        />
      ) : (
        <DataTable
          columns={workLogColumns}
          data={workLogs}
          isLoading={loading}
          keyExtractor={(item: LabourWorkLog) => item.work_log_id}
          emptyMessage="No labour work logs recorded for the selected period."
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px', width: '90%' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 className="flex items-center gap-2" style={{ color: '#ef4444', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                <AlertTriangle size={20} />
                Delete Labour / Contractor
              </h3>
              <button
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteDeps(null);
                }}
                className="modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '1.25rem 0' }}>
              <p style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
                Are you sure you want to delete worker/contractor <strong>{deleteTarget.name}</strong> (ID: LAB-{String(deleteTarget.labour_id).padStart(3, '0')})?
              </p>
              {deleteDeps && (deleteDeps.attendanceCount > 0 || deleteDeps.subWorkersCount > 0) && (
                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: '#f59e0b',
                    padding: '0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                  }}
                >
                  <div className="flex items-start gap-2">
                    <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Warning: Active Dependencies Detected!</strong>
                      <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', margin: 0 }}>
                        {deleteDeps.attendanceCount > 0 && <li>{deleteDeps.attendanceCount} work log record(s)</li>}
                        {deleteDeps.subWorkersCount > 0 && <li>{deleteDeps.subWorkersCount} sub-worker(s) linked to this contractor</li>}
                      </ul>
                      <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Force deleting will permanently clean up associated logs and unlink sub-workers.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer flex justify-end gap-2" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
              <button
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteDeps(null);
                }}
                className="btn btn-outline"
              >
                Cancel
              </button>
              {deleteDeps && (deleteDeps.attendanceCount > 0 || deleteDeps.subWorkersCount > 0) ? (
                <button
                  onClick={() => handleConfirmDelete(true)}
                  className="btn"
                  style={{ background: '#ef4444', color: '#fff', border: 'none' }}
                >
                  Force Delete All
                </button>
              ) : (
                <button
                  onClick={() => handleConfirmDelete(false)}
                  className="btn"
                  style={{ background: '#ef4444', color: '#fff', border: 'none' }}
                >
                  Confirm Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Labour Profile Details Modal */}
      {detailsModalLabourId && (
        <LabourDetailsModal
          isOpen={!!detailsModalLabourId}
          labourId={detailsModalLabourId}
          onClose={() => setDetailsModalLabourId(null)}
          onUpdated={fetchData}
        />
      )}

      {/* Document Modal */}
      <DocumentModal
        isOpen={docModal.isOpen}
        onClose={() => setDocModal({ ...docModal, isOpen: false })}
        entityType="labour"
        entityId={docModal.labourId}
        entityName={docModal.labourName}
      />
    </div>
  );
};

export default Labours;
