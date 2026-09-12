import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Eye, EyeOff, Calendar, AlertTriangle, ShieldAlert, X, Filter, RotateCcw, Clock, CheckCircle } from 'lucide-react';
import { DataTable, Column } from '../components/common/DataTable';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { showSuccess, showError } from '../utils/toast';

export interface Labour {
  labour_id: number;
  name: string;
  contact_number: string | null;
  aadhar_id: string | null;
  labour_type: 'contractor' | 'direct_labour';
  contractor_id?: number | null;
  contractor_name?: string | null;
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

  // Create / Edit Labour Form State
  const [showAddLabour, setShowAddLabour] = useState(false);
  const [editingLabour, setEditingLabour] = useState<Labour | null>(null);
  const [labourForm, setLabourForm] = useState({
    name: '',
    contact_number: '',
    aadhar_id: '',
    labour_type: 'direct_labour' as 'contractor' | 'direct_labour',
    contractor_id: '' as string | number,
  });

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

  useEffect(() => {
    fetchData();
  }, [search, selectedType, selectedProject, startDate, endDate, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const laboursRes = await apiService.get<Labour[]>('/labours', { search, labour_type: selectedType });
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
    } catch (err) {
      console.error('Error fetching labours data:', err);
    } finally {
      setLoading(false);
    }
  };

  const contractorsList = labours.filter((l) => l.labour_type === 'contractor');

  // Filter tasks based on selected project/wbs in form
  const filteredFormTasks = tasks.filter((t) => {
    if (workLogForm.project_id && Number(t.project_id) !== Number(workLogForm.project_id)) return false;
    if (workLogForm.wbs_id && Number(t.wbs_id) !== Number(workLogForm.wbs_id)) return false;
    return true;
  });

  const handleCreateOrUpdateLabour = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameClean = labourForm.name.trim();
    const contactClean = labourForm.contact_number.trim();
    const aadharClean = labourForm.aadhar_id.trim();

    if (!nameClean) {
      showError('Labour name is required.');
      return;
    }

    if (!contactClean) {
      showError('Contact number is compulsory.');
      return;
    }

    if (!/^\d{10}$/.test(contactClean)) {
      showError('Contact number must be compulsory 10 digits.');
      return;
    }

    if (!aadharClean) {
      showError('Aadhaar ID is compulsory.');
      return;
    }

    if (!/^\d{12}$/.test(aadharClean)) {
      showError('Aadhaar ID must be compulsory 12 digits.');
      return;
    }

    try {
      let res;
      const payload = {
        name: nameClean,
        contact_number: contactClean,
        aadhar_id: aadharClean,
        labour_type: labourForm.labour_type,
        contractor_id: labourForm.contractor_id ? Number(labourForm.contractor_id) : null,
      };

      if (editingLabour) {
        res = await apiService.put(`/labours/${editingLabour.labour_id}`, payload);
      } else {
        res = await apiService.post('/labours', payload);
      }

      if (res.success) {
        showSuccess(editingLabour ? 'Labour updated successfully!' : 'Labour registered successfully!');
        setEditingLabour(null);
        setLabourForm({ name: '', contact_number: '', aadhar_id: '', labour_type: 'direct_labour', contractor_id: '' });
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
          labour_id: '', project_id: '', wbs_id: '', task_id: '',
          work_date: new Date().toISOString().split('T')[0],
          in_time: '', out_time: '', total_working_hours: 8, rate_type: 'hourly', rate: 500, work_description: '',
        });
        setShowAddWorkLog(false);
        fetchData();
      } else {
        showError(res.message || 'Failed to save work log');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to save work log');
    }
  };

  const handleDeleteWorkLog = async (id: number) => {
    if (!window.confirm('Are you sure you want to soft-delete this work log?')) return;
    try {
      const res = await apiService.delete(`/labour-work-logs/${id}`);
      if (res.success) {
        showSuccess('Work log soft-deleted successfully');
        fetchData();
      } else {
        showError(res.message || 'Delete failed');
      }
    } catch (err: any) {
      showError(err.message || 'Delete failed');
    }
  };

  const handleOpenDelete = async (item: Labour) => {
    setDeleteTarget(item);
    try {
      const res = await apiService.get<{ attendanceCount: number; subWorkersCount: number }>(`/labours/${item.labour_id}/dependencies`);
      if (res.success && res.data) {
        setDeleteDeps(res.data);
      } else {
        setDeleteDeps({ attendanceCount: 0, subWorkersCount: 0 });
      }
    } catch (err) {
      setDeleteDeps({ attendanceCount: 0, subWorkersCount: 0 });
    }
  };

  const handleConfirmDelete = async (force: boolean) => {
    if (!deleteTarget) return;
    try {
      const res = await apiService.delete(`/labours/${deleteTarget.labour_id}${force ? '?force=true' : ''}`);
      if (res.success) {
        showSuccess(`Worker '${deleteTarget.name}' deleted successfully!`);
        setDeleteTarget(null);
        setDeleteDeps(null);
        fetchData();
      } else {
        showError(res.message || 'Delete failed');
      }
    } catch (err: any) {
      showError(err.message || 'Delete failed');
    }
  };

  const toggleAadhar = (id: number) => {
    setRevealAadhar((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Registry Columns
  const registryColumns: Column<Labour>[] = [
    { accessor: 'labour_id', header: 'ID', sortable: true },
    { accessor: 'name', header: 'Name', sortable: true, render: (item) => <span className="font-semibold">{item.name}</span> },
    {
      accessor: 'labour_type',
      header: 'Labour Type',
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
    { accessor: 'contact_number', header: 'Contact Number', render: (item) => item.contact_number || '-' },
    {
      accessor: 'aadhar_id',
      header: 'Aadhar ID (PII)',
      render: (item) => (
        <div className="flex items-center gap-2">
          <span>
            {item.aadhar_id
              ? revealAadhar[item.labour_id]
                ? item.aadhar_id
                : item.aadhar_id.replace(/^.*(\d{4})$/, 'XXXX-XXXX-$1')
              : '-'}
          </span>
          {item.aadhar_id && (
            <button
              onClick={() => toggleAadhar(item.labour_id)}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
            >
              {revealAadhar[item.labour_id] ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
      ),
    },
    {
      accessor: (item) => new Date(item.created_at).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      header: 'Registered On',
    },
    {
      accessor: (item) => (
        <div className="flex items-center gap-1">
          {hasPermission('labours', 'update') && (
            <button
              onClick={() => {
                setEditingLabour(item);
                setShowAddLabour(true);
                setLabourForm({
                  name: item.name,
                  contact_number: item.contact_number || '',
                  aadhar_id: item.aadhar_id || '',
                  labour_type: item.labour_type,
                  contractor_id: item.contractor_id || '',
                });
              }}
              className="action-btn edit"
            >
              <Edit2 size={14} />
            </button>
          )}
          {hasPermission('labours', 'delete') && (
            <button onClick={() => handleOpenDelete(item)} className="action-btn delete">
              <Trash2 size={14} />
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
                in_time: i.in_time || '09:00',
                out_time: i.out_time || '18:00',
                total_working_hours: i.total_working_hours || 8,
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
                  setLabourForm({ name: '', contact_number: '', aadhar_id: '', labour_type: 'direct_labour', contractor_id: '' });
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
                  labour_id: '', project_id: '', wbs_id: '', task_id: '',
                  work_date: new Date().toISOString().split('T')[0],
                  in_time: '', out_time: '', total_working_hours: 8, rate_type: 'hourly', rate: 500, work_description: '',
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
          <div className="flex items-center justify-between mb-4 pb-2" style={{ borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))' }}>
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

          <form onSubmit={handleCreateOrUpdateLabour}>
            <div className="grid-2-col mb-4">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  Labour / Contractor Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter full name or contractor name"
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
                <label className="form-label">
                  Contact Number <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="Compulsory 10-digit mobile (e.g. 9876543210)"
                  value={labourForm.contact_number}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setLabourForm({ ...labourForm, contact_number: val });
                  }}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  Aadhaar ID (PII Confidential) <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={12}
                  placeholder="Compulsory 12-digit Aadhaar (e.g. 123456789012)"
                  value={labourForm.aadhar_id}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setLabourForm({ ...labourForm, aadhar_id: val });
                  }}
                  className="form-input"
                />
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
                        {c.name} (ID: L{String(c.labour_id).padStart(3, '0')})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
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
                {editingLabour ? 'Update Labour' : 'Register Labour'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add / Edit Task Work Log Form Card */}
      {showAddWorkLog && (
        <div className="glass-card p-4 mb-4" style={{ borderLeft: '4px solid #2563eb' }}>
          <div className="flex items-center justify-between mb-4 pb-2" style={{ borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))' }}>
            <h3 className="font-semibold flex items-center gap-2" style={{ fontSize: '1.1rem' }}>
              <Clock size={18} style={{ color: '#2563eb' }} />
              {editingWorkLog ? 'Edit Labour Work Log' : 'Add Labour Work Log (Task & Date-Wise)'}
            </h3>
            <button onClick={() => setShowAddWorkLog(false)} className="btn btn-outline" style={{ padding: '0.3rem 0.6rem' }}>
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleCreateOrUpdateWorkLog}>
            <div className="grid-4-col mb-4">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Labour <span className="text-danger">*</span></label>
                <select
                  required
                  value={workLogForm.labour_id}
                  onChange={(e) => setWorkLogForm({ ...workLogForm, labour_id: e.target.value })}
                  className="form-select"
                >
                  <option value="">Select Labour</option>
                  {labours.map((l) => {
                    const code = `L${String(l.labour_id).padStart(3, '0')}`;
                    const typeStr = l.labour_type === 'contractor' ? 'Contractor Labour' : 'Direct Labour';
                    const parentStr = l.contractor_name ? ` - ${l.contractor_name}` : '';
                    return (
                      <option key={l.labour_id} value={l.labour_id}>
                        {l.name} - {code} - {typeStr}{parentStr}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Project <span className="text-danger">*</span></label>
                <select
                  required
                  value={workLogForm.project_id}
                  onChange={(e) => setWorkLogForm({ ...workLogForm, project_id: e.target.value, wbs_id: '', task_id: '' })}
                  className="form-select"
                >
                  <option value="">Select Project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
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
                  <option value="">Select WBS Discipline</option>
                  {wbsList.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Task <span className="text-danger">*</span></label>
                <select
                  required
                  value={workLogForm.task_id}
                  onChange={(e) => setWorkLogForm({ ...workLogForm, task_id: e.target.value })}
                  className="form-select"
                >
                  <option value="">Select Task</option>
                  {filteredFormTasks.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid-4-col mb-4">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Work Date <span className="text-danger">*</span></label>
                <input
                  type="date"
                  required
                  value={workLogForm.work_date}
                  onChange={(e) => setWorkLogForm({ ...workLogForm, work_date: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">In Time (Optional)</label>
                <input
                  type="time"
                  value={workLogForm.in_time}
                  onChange={(e) => setWorkLogForm({ ...workLogForm, in_time: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Out Time (Optional)</label>
                <input
                  type="time"
                  value={workLogForm.out_time}
                  onChange={(e) => setWorkLogForm({ ...workLogForm, out_time: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Rate Type <span className="text-danger">*</span></label>
                <select
                  value={workLogForm.rate_type}
                  onChange={(e) => setWorkLogForm({ ...workLogForm, rate_type: e.target.value as 'hourly' | 'daily' })}
                  className="form-select"
                >
                  <option value="hourly">Hourly Rate (₹/hr)</option>
                  <option value="daily">Daily Flat Rate (₹/day)</option>
                </select>
              </div>
            </div>

            <div className="grid-2-col mb-4">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Rate (₹) <span className="text-danger">*</span></label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={workLogForm.rate}
                  onChange={(e) => setWorkLogForm({ ...workLogForm, rate: Number(e.target.value) })}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Work Description / Scope</label>
                <input
                  type="text"
                  placeholder="Enter work details (e.g. Excavated North Section)"
                  value={workLogForm.work_description}
                  onChange={(e) => setWorkLogForm({ ...workLogForm, work_description: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddWorkLog(false)}
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
      <div className="tabs-container">
        <button
          type="button"
          onClick={() => setActiveTab('registry')}
          className={`tab-btn ${activeTab === 'registry' ? 'active' : ''}`}
        >
          Labour Registry ({labours.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('work_logs')}
          className={`tab-btn ${activeTab === 'work_logs' ? 'active' : ''}`}
        >
          Labour Work Logs ({workLogs.length})
        </button>
      </div>

      {/* Filters & Selection */}
      <div className="glass-card mb-4 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2" style={{ fontSize: '0.9rem' }}>
            <Filter size={16} style={{ color: 'var(--accent-primary)' }} />
            Filters & Selection
          </h3>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setSelectedType('');
              setSelectedProject('');
              setStartDate('');
              setEndDate('');
            }}
            className="btn btn-outline"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>

        <div className="grid-5-col">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label text-xs uppercase text-muted">Search Keyword</label>
            <input
              type="text"
              placeholder="Search by name, project, task..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label text-xs uppercase text-muted">Project</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="form-select"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label text-xs uppercase text-muted">Labour Type</label>
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

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label text-xs uppercase text-muted">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label text-xs uppercase text-muted">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-input"
            />
          </div>
        </div>
      </div>

      {/* Data Table */}
      {activeTab === 'registry' ? (
        <DataTable data={labours} columns={registryColumns} isLoading={loading} exportFilename="Labour_Registry" />
      ) : (
        <DataTable data={workLogs} columns={workLogColumns} isLoading={loading} exportFilename="Labour_Work_Logs" />
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
              <button onClick={() => { setDeleteTarget(null); setDeleteDeps(null); }} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '1.25rem 0' }}>
              <p style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
                Are you sure you want to delete worker/contractor <strong>{deleteTarget.name}</strong> (ID: L{String(deleteTarget.labour_id).padStart(3, '0')})?
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
                onClick={() => { setDeleteTarget(null); setDeleteDeps(null); }}
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
    </div>
  );
};

