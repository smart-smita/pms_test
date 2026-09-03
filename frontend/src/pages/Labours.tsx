import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Eye, EyeOff, Calendar, AlertTriangle, ShieldAlert, X, Filter, RotateCcw } from 'lucide-react';
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

export interface LabourAttendance {
  labour_attendance_id: number;
  labour_id: number;
  labour_name: string;
  labour_type: string;
  project_name?: string;
  wbs_name?: string;
  task_name?: string;
  attendance_date: string;
  in_time: string;
  out_time: string;
  daily_pay_amount: number;
  worker_count: number;
  total_cost?: number;
  comment?: string;
}

export const Labours: React.FC = () => {
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'registry' | 'attendance'>('registry');

  const [labours, setLabours] = useState<Labour[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<LabourAttendance[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Dropdown options
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);
  const [wbsList, setWbsList] = useState<{ id: number; name: string }[]>([]);
  const [tasks, setTasks] = useState<{ id: number; name: string }[]>([]);

  // Create / Edit Form State
  const [showAddLabour, setShowAddLabour] = useState(false);
  const [editingLabour, setEditingLabour] = useState<Labour | null>(null);
  const [labourForm, setLabourForm] = useState({
    name: '',
    contact_number: '',
    aadhar_id: '',
    labour_type: 'direct_labour' as 'contractor' | 'direct_labour',
    contractor_id: '' as string | number,
  });

  // Attendance Form State
  const [showLogAttendance, setShowLogAttendance] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState({
    labour_id: '',
    project_id: '',
    wbs_id: '',
    task_id: '',
    attendance_date: new Date().toISOString().split('T')[0],
    in_time: '09:00',
    out_time: '18:00',
    daily_pay_amount: 300,
    worker_count: 1,
    comment: '',
  });

  // PII Aadhar Toggle State
  const [revealAadhar, setRevealAadhar] = useState<Record<number, boolean>>({});

  // Dependency Check Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<Labour | null>(null);
  const [deleteDeps, setDeleteDeps] = useState<{ attendanceCount: number; subWorkersCount: number } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [search, selectedType, selectedProject, startDate, endDate, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const laboursRes = await apiService.get<Labour[]>('/labours', { search, labour_type: selectedType });
      if (laboursRes.data) setLabours(laboursRes.data);

      if (activeTab === 'attendance') {
        const res = await apiService.get<LabourAttendance[]>('/labours/attendance', {
          project_id: selectedProject,
          start_date: startDate,
          end_date: endDate,
        });
        if (res.data) setAttendanceLogs(res.data);
      }

      const projRes = await apiService.get<any[]>('/projects');
      if (projRes.data) setProjects(projRes.data.map((p) => ({ id: p.project_id, name: p.project_name })));

      const wbsRes = await apiService.get<any[]>('/wbs');
      if (wbsRes.data) setWbsList(wbsRes.data.map((w) => ({ id: w.id, name: w.wbs_name })));

      const taskRes = await apiService.get<any[]>('/tasks');
      if (taskRes.data) setTasks(taskRes.data.map((t) => ({ id: t.task_id, name: t.task_name })));
    } catch (err) {
      console.error('Error fetching labours data:', err);
    } finally {
      setLoading(false);
    }
  };

  const contractorsList = labours.filter((l) => l.labour_type === 'contractor');

  const handleCreateOrUpdateLabour = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let res;
      const payload = {
        name: labourForm.name,
        contact_number: labourForm.contact_number,
        aadhar_id: labourForm.aadhar_id,
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

  const handleOpenDelete = async (item: Labour) => {
    setDeleteTarget(item);
    setDeleteLoading(true);
    try {
      const res = await apiService.get<{ attendanceCount: number; subWorkersCount: number }>(`/labours/${item.labour_id}/dependencies`);
      if (res.success && res.data) {
        setDeleteDeps(res.data);
      } else {
        setDeleteDeps({ attendanceCount: 0, subWorkersCount: 0 });
      }
    } catch (err) {
      setDeleteDeps({ attendanceCount: 0, subWorkersCount: 0 });
    } finally {
      setDeleteLoading(false);
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

  const handleLogAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiService.post('/labours/attendance', {
        labour_id: parseInt(attendanceForm.labour_id, 10),
        project_id: attendanceForm.project_id ? parseInt(attendanceForm.project_id, 10) : null,
        wbs_id: attendanceForm.wbs_id ? parseInt(attendanceForm.wbs_id, 10) : null,
        task_id: attendanceForm.task_id ? parseInt(attendanceForm.task_id, 10) : null,
        attendance_date: attendanceForm.attendance_date,
        in_time: attendanceForm.in_time,
        out_time: attendanceForm.out_time,
        daily_pay_amount: Number(attendanceForm.daily_pay_amount),
        worker_count: Number(attendanceForm.worker_count),
        comment: attendanceForm.comment,
      });

      if (res.success) {
        showSuccess('Labour flat daily pay logged successfully!');
        setAttendanceForm({
          labour_id: '',
          project_id: '',
          wbs_id: '',
          task_id: '',
          attendance_date: new Date().toISOString().split('T')[0],
          in_time: '09:00',
          out_time: '18:00',
          daily_pay_amount: 300,
          worker_count: 1,
          comment: '',
        });
        setShowLogAttendance(false);
        fetchData();
      } else {
        showError(res.message || 'Log attendance failed');
      }
    } catch (err: any) {
      showError(err.message || 'Log attendance failed');
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
          className={`badge ${item.labour_type === 'contractor' ? 'badge-info' : 'badge-success'
            }`}
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
      accessor: (item) => new Date(item.created_at).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      header: 'Created At',
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
                setTimeout(() => document.getElementById('create-labour-card')?.scrollIntoView({ behavior: 'smooth' }), 100);
              }}
              className="action-btn edit"
            >
              <Edit2 size={14} />
            </button>
          )}
          {hasPermission('labours', 'delete') && (
            <button
              onClick={() => handleOpenDelete(item)}
              className="action-btn delete"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ),
      header: 'Actions',
    },
  ];

  // Attendance Columns
  const attendanceColumns: Column<LabourAttendance>[] = [
    { accessor: 'attendance_date', header: 'Date', sortable: true },
    { accessor: 'labour_name', header: 'Labour Name', sortable: true },
    { accessor: 'labour_type', header: 'Type', render: (i) => i.labour_type || 'direct_labour' },
    { accessor: 'project_name', header: 'Project', render: (i) => i.project_name || '-' },
    { accessor: 'wbs_name', header: 'WBS Discipline', render: (i) => i.wbs_name || '-' },
    { accessor: 'task_name', header: 'Task', render: (i) => i.task_name || '-' },
    { accessor: 'worker_count', header: 'Worker Count', sortable: true },
    {
      accessor: 'daily_pay_amount',
      header: 'Daily Flat Pay (₹)',
      sortable: true,
      render: (i) => (
        <span className="font-semibold">
          {Number(i.daily_pay_amount).toFixed(2)}
        </span>
      ),
    },
    {
      accessor: (i) => (
        <span className="font-bold">
          {(Number(i.daily_pay_amount) * (i.worker_count || 1)).toFixed(2)}
        </span>
      ),
      header: 'Total Pay Out (₹)',
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
            Registry for non-login workers and flat-rate daily pay attendance tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {hasPermission('labours', 'create') && (
            <button
              type="button"
              onClick={() => {
                setShowAddLabour(!showAddLabour);
                if (!showAddLabour) {
                  setEditingLabour(null);
                  setLabourForm({ name: '', contact_number: '', aadhar_id: '', labour_type: 'direct_labour', contractor_id: '' });
                  setTimeout(() => document.getElementById('create-labour-card')?.scrollIntoView({ behavior: 'smooth' }), 100);
                }
              }}
              className="btn btn-primary"
            >
              <Plus size={16} />
              Add Labour
            </button>
          )}

          {hasPermission('labours', 'create') && (
            <button
              type="button"
              onClick={() => {
                setShowLogAttendance(!showLogAttendance);
                if (!showLogAttendance) {
                  setTimeout(() => document.getElementById('log-attendance-card')?.scrollIntoView({ behavior: 'smooth' }), 100);
                }
              }}
              className="btn btn-blue"
            >
              <Calendar size={16} />
              Log Daily Pay Attendance
            </button>
          )}
        </div>
      </div>

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
          onClick={() => setActiveTab('attendance')}
          className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
        >
          Daily Pay Attendance Logs ({attendanceLogs.length})
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
              placeholder="Search by name, contact, aadhar..."
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
        <DataTable data={attendanceLogs} columns={attendanceColumns} isLoading={loading} exportFilename="Labour_Attendance" />
      )}

      {/* Bottom Side-by-Side Section */}
      {(showAddLabour || showLogAttendance) && (
        <div className={showAddLabour && showLogAttendance ? 'grid-2-col pt-4' : 'pt-4'}>
          {/* Left Card: Create / Edit Labour */}
          {showAddLabour && (
            <div id="create-labour-card" className="glass-card flex flex-col p-4 mb-4">
              <div className="flex items-center gap-2 mb-4">
                <Users size={18} style={{ color: 'var(--accent-primary)' }} />
                <h2 className="font-semibold" style={{ fontSize: '1.1rem' }}>
                  {editingLabour ? 'Edit Labour' : 'Create / Edit Labour'}
                </h2>
              </div>

              <form onSubmit={handleCreateOrUpdateLabour} className="flex-col flex-1">
                <div className="grid-2-col mb-4">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">
                      Full Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter full name"
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
                      onChange={(e) => setLabourForm({ ...labourForm, labour_type: e.target.value as 'contractor' | 'direct_labour' })}
                      className="form-select"
                    >
                      <option value="direct_labour">Direct Labour</option>
                      <option value="contractor">Contractor</option>
                    </select>
                  </div>
                </div>

                <div className="grid-2-col mb-4">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Contact Number</label>
                    <input
                      type="text"
                      placeholder="Enter contact number"
                      value={labourForm.contact_number}
                      onChange={(e) => setLabourForm({ ...labourForm, contact_number: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Aadhar ID (PII)</label>
                    <input
                      type="text"
                      placeholder="12-digit Aadhar number"
                      value={labourForm.aadhar_id}
                      onChange={(e) => setLabourForm({ ...labourForm, aadhar_id: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                {labourForm.labour_type === 'direct_labour' && (
                  <div className="form-group">
                    <label className="form-label">Parent Contractor (Optional)</label>
                    <select
                      value={labourForm.contractor_id}
                      onChange={(e) => setLabourForm({ ...labourForm, contractor_id: e.target.value })}
                      className="form-select"
                    >
                      <option value="">-- Independent Direct Labour --</option>
                      {contractorsList.map((c) => (
                        <option key={c.labour_id} value={c.labour_id}>{c.name} (Contractor)</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex-1"></div>

                <div className="flex justify-end gap-3 mt-auto pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingLabour(null);
                      setLabourForm({ name: '', contact_number: '', aadhar_id: '', labour_type: 'direct_labour', contractor_id: '' });
                      setShowAddLabour(false);
                    }}
                    className="btn"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingLabour ? 'Update Labour' : 'Save Labour'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Right Card: Log Daily Pay Attendance */}
          {showLogAttendance && (
            <div id="log-attendance-card" className="glass-card flex flex-col p-4 mb-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={18} style={{ color: '#2563eb' }} />
                <h2 className="font-semibold" style={{ fontSize: '1.1rem' }}>Log Daily Pay Attendance</h2>
              </div>

              <form onSubmit={handleLogAttendance} className="flex-col flex-1">
                <div className="grid-4-col mb-4">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">
                      Labour <span className="text-danger">*</span>
                    </label>
                    <select
                      required
                      value={attendanceForm.labour_id}
                      onChange={(e) => {
                        const lId = e.target.value;
                        const selectedL = labours.find((l) => String(l.labour_id) === lId);
                        setAttendanceForm({
                          ...attendanceForm,
                          labour_id: lId,
                          worker_count: selectedL?.labour_type === 'contractor' && selectedL.sub_worker_count ? selectedL.sub_worker_count : 1,
                        });
                      }}
                      className="form-select"
                    >
                      <option value="">Select Labour</option>
                      {labours.map((l) => (
                        <option key={l.labour_id} value={l.labour_id}>{l.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Project</label>
                    <select
                      value={attendanceForm.project_id}
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, project_id: e.target.value })}
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
                      value={attendanceForm.wbs_id}
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, wbs_id: e.target.value })}
                      className="form-select"
                    >
                      <option value="">Select WBS</option>
                      {wbsList.map((w) => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Task</label>
                    <select
                      value={attendanceForm.task_id}
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, task_id: e.target.value })}
                      className="form-select"
                    >
                      <option value="">Select Task</option>
                      {tasks.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid-4-col mb-4">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">
                      Date <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={attendanceForm.attendance_date}
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, attendance_date: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">
                      IN Time <span className="text-danger">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={attendanceForm.in_time}
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, in_time: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">
                      OUT Time <span className="text-danger">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={attendanceForm.out_time}
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, out_time: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">
                      Workers <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={attendanceForm.worker_count}
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, worker_count: parseInt(e.target.value, 10) })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="grid-2-col mb-4">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">
                      Daily Flat Pay (₹) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={attendanceForm.daily_pay_amount}
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, daily_pay_amount: Number(e.target.value) })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Comments / Work Scope</label>
                    <input
                      type="text"
                      placeholder="Enter comments"
                      value={attendanceForm.comment}
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, comment: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="flex-1"></div>

                <div className="flex justify-end gap-3 mt-auto pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setAttendanceForm({
                        labour_id: '', project_id: '', wbs_id: '', task_id: '',
                        attendance_date: new Date().toISOString().split('T')[0],
                        in_time: '09:00', out_time: '18:00', daily_pay_amount: 300,
                        worker_count: 1, comment: '',
                      });
                      setShowLogAttendance(false);
                    }}
                    className="btn"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-blue">
                    Submit Attendance
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Safety Modal remains here */}
      {deleteTarget && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="flex items-center gap-2 text-danger">
                <AlertTriangle size={18} />
                Remove Labour Record
              </h3>
              <button onClick={() => setDeleteTarget(null)} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {deleteLoading ? (
                <div className="flex justify-center p-4">Loading...</div>
              ) : deleteDeps && (deleteDeps.attendanceCount > 0 || deleteDeps.subWorkersCount > 0) ? (
                <div className="flex-col gap-3">
                  <div style={{ padding: '1rem', background: 'var(--warning-bg)', borderRadius: 'var(--radius-md)', color: 'var(--warning)' }}>
                    <div className="font-bold flex items-center gap-2 mb-2">
                      <ShieldAlert size={16} /> Active Dependencies Found!
                    </div>
                    <p style={{ fontSize: '0.85rem' }}>Worker <strong>{deleteTarget.name}</strong> has active records:</p>
                    <ul style={{ paddingLeft: '1.5rem', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                      {deleteDeps.attendanceCount > 0 && <li>{deleteDeps.attendanceCount} daily pay attendance log entries</li>}
                      {deleteDeps.subWorkersCount > 0 && <li>{deleteDeps.subWorkersCount} sub-workers linked</li>}
                    </ul>
                    <p className="font-bold mt-2" style={{ fontSize: '0.85rem' }}>Forcing removal will delete linked attendance logs and unlink sub-workers.</p>
                  </div>
                  <div className="flex justify-end gap-3 mt-4">
                    <button onClick={() => setDeleteTarget(null)} className="btn btn-secondary">Cancel</button>
                    <button onClick={() => handleConfirmDelete(true)} className="btn" style={{ background: 'var(--danger)', color: '#fff' }}>Force Delete</button>
                  </div>
                </div>
              ) : (
                <div className="flex-col gap-3">
                  <p style={{ fontSize: '0.9rem' }}>Are you sure you want to delete worker <strong>{deleteTarget.name}</strong>? This action cannot be undone.</p>
                  <div className="flex justify-end gap-3 mt-4">
                    <button onClick={() => setDeleteTarget(null)} className="btn btn-secondary">Cancel</button>
                    <button onClick={() => handleConfirmDelete(false)} className="btn" style={{ background: 'var(--danger)', color: '#fff' }}>Delete Worker</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
