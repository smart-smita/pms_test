import React, { useState, useEffect } from 'react';
import {
  Briefcase, Layers, Plus, ChevronRight, ChevronDown, Clock, Upload, Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { Project, ProjectWBS, Task, Employee } from '../types';
import { showSuccess, showError } from '../utils/toast';
import { Modal } from '../components/common/Modal';
import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';

const getTodayStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const ProjectWork: React.FC = () => {
  const { user } = useAuth();
  const canManage = user?.role_name === 'Admin' || user?.role_name === 'Super Admin' || user?.role_name === 'Manager';

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [wbsList, setWbsList] = useState<ProjectWBS[]>([]);
  const [masterWbsList, setMasterWbsList] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [labours, setLabours] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [projectTimesheets, setProjectTimesheets] = useState<any[]>([]);

  // UI State
  const [isAddWbsOpen, setIsAddWbsOpen] = useState(false);
  const [isLogWorkOpen, setIsLogWorkOpen] = useState(false);
  const [selectedWbsForLog, setSelectedWbsForLog] = useState<number | ''>('');

  // Forms
  const [wbsForm, setWbsForm] = useState({ wbs_id: '', note: '', total_hours: 0, budget_amount: 0 });
  const [logForm, setLogForm] = useState({
    task_id: '',
    task_name: '',
    is_new_task: false,
    employee_id: '',
    labour_id: '',
    material_id: '', material_name: '', labour_name: '',
    material_qty: '',
    material_rate: '',
    working_hours: '',
    description: '',
    log_date: getTodayStr()
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      const pId = Number(selectedProjectId);
      if (projects.length > 0) {
        setSelectedProject(projects.find(p => p.project_id === pId) || null);
      }
      fetchProjectData(pId);
    } else {
      setSelectedProject(null);
      setWbsList([]);
      setTasks([]);
      setProjectTimesheets([]);
    }
  }, [selectedProjectId, projects]);

  const fetchInitialData = async () => {
    const [pRes, mRes, eRes, lRes, matRes] = await Promise.all([
      apiRequest<Project[]>('/projects'),
      apiRequest<any[]>('/wbs'),
      apiRequest<any[]>('/employees'),
      apiRequest<any[]>('/labours'),
      apiRequest<any[]>('/materials/master')
    ]);
    if (pRes.success && pRes.data) {
      setProjects(pRes.data);
      if (pRes.data.length > 0 && !selectedProjectId) setSelectedProjectId(pRes.data[0].project_id);
    }
    if (mRes.success && mRes.data) setMasterWbsList(mRes.data);
    if (eRes.success && eRes.data) setEmployees(eRes.data);
    if (lRes.success && lRes.data) setLabours(lRes.data);
    if (matRes.success && matRes.data) setMaterials(matRes.data);
  };

  const fetchProjectData = async (pId: number) => {
    const [wbsRes, taskRes, tsRes] = await Promise.all([
      apiRequest<ProjectWBS[]>(`/projects/${pId}/wbs`),
      apiRequest<Task[]>(`/tasks?project_id=${pId}`),
      apiRequest<any[]>(`/timesheets?project_id=${pId}`)
    ]);
    if (wbsRes.success && wbsRes.data) setWbsList(wbsRes.data);
    if (taskRes.success && taskRes.data) setTasks(taskRes.data);
    if (tsRes.success && tsRes.data) setProjectTimesheets(tsRes.data);
  };

  const handleAddWbs = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const masterWbs = masterWbsList.find(m => String(m.wbs_id) === String(wbsForm.wbs_id));
      if (!masterWbs) throw new Error("Invalid WBS Selected");

      const payload = {
        project_id: Number(selectedProjectId),
        wbs_id: Number(wbsForm.wbs_id),
        wbs_name: masterWbs.wbs_name,
        note: wbsForm.note,
        total_hours: Number(wbsForm.total_hours),
        budget_amount: Number(wbsForm.budget_amount)
      };

      const res = await apiRequest('/projects/wbs', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.success) {
        showSuccess('WBS added to project successfully');
        setIsAddWbsOpen(false);
        fetchProjectData(Number(selectedProjectId));
      } else {
        showError(res.message || 'Failed to add WBS');
      }
    } catch (err: any) {
      showError(err.message || 'Error adding WBS');
    }
  };

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logForm.employee_id && !logForm.labour_name) {
      showError('Please select at least an Employee or a Labour/Contractor');
      return;
    }

    const today = getTodayStr();
    if (logForm.log_date && logForm.log_date < today) {
      showError('Log Date cannot be a past date');
      return;
    }

    let finalTaskId: number | undefined = undefined;
    let finalTaskName: string | undefined = undefined;

    if (logForm.task_name && logForm.task_name.trim() !== '') {
      const existingTask = tasks.find(t => t.task_name.toLowerCase() === logForm.task_name.trim().toLowerCase() && (!selectedWbsForLog || String(t.wbs_id) === String(selectedWbsForLog)));
      if (existingTask) {
        finalTaskId = existingTask.task_id;
      } else {
        finalTaskName = logForm.task_name.trim();
      }
    }

    let finalLabourId: number | undefined = undefined;
    if (logForm.labour_name && logForm.labour_name.trim() !== '') {
      const existingLabour = labours.find(l => (l.name || l.labour_name || '').toLowerCase() === logForm.labour_name.trim().toLowerCase());
      if (existingLabour) {
        finalLabourId = existingLabour.labour_id;
      } else {
        // Create new labour
        try {
          const res = await apiRequest<{ labour_id: number }>('/labours', {
            method: 'POST',
            body: JSON.stringify({ name: logForm.labour_name.trim(), labour_type: 'direct_labour', status: 'active' })
          });
          if (res.success && res.data) {
            finalLabourId = res.data.labour_id;
          }
        } catch (e) {
          console.error('Failed to create labour inline', e);
        }
      }
    }

    let finalMaterialId: number | undefined = undefined;
    if (logForm.material_name && logForm.material_name.trim() !== '') {
      const existingMaterial = materials.find(m => m.material_name.toLowerCase() === logForm.material_name.trim().toLowerCase());
      if (existingMaterial) {
        finalMaterialId = existingMaterial.material_id;
      } else {
        // Create new material
        try {
          const res = await apiRequest<{ material_id: number }>('/materials/master', {
            method: 'POST',
            body: JSON.stringify({ material_name: logForm.material_name.trim(), unit: 'Nos', status: 'active' })
          });
          if (res.success && res.data) {
            finalMaterialId = res.data.material_id;
          }
        } catch (e) {
          console.error('Failed to create material inline', e);
        }
      }
    }

    try {
      const res = await apiRequest('/timesheets/unified-log', {
        method: 'POST',
        body: JSON.stringify({
          project_id: Number(selectedProjectId),
          wbs_id: selectedWbsForLog ? Number(selectedWbsForLog) : undefined,
          task_id: finalTaskId,
          task_name: finalTaskName,
          employee_id: Number(logForm.employee_id),
          log_date: logForm.log_date,
          working_hours: Number(logForm.working_hours),
        })
      });
      if (res.success) {
        showSuccess('Time sheet logged successfully');
        setIsLogWorkOpen(false);
        setLogForm({
          task_id: '', task_name: '', is_new_task: false, employee_id: '', labour_id: '', labour_name: '',
          material_id: '', material_name: '', material_qty: '', material_rate: '', working_hours: '', description: '', log_date: getTodayStr()
        });
        fetchProjectData(Number(selectedProjectId));
      } else {
        showError(res.message || 'Failed to log time sheet');
      }
    } catch (error: any) {
      showError(error.message || 'Error logging time sheet');
    }
  };

  const totalWbsCount = wbsList.length;
  const totalPlannedHrs = wbsList.reduce((sum, wbs) => sum + (Number(wbs.total_hours) || 0), 0);
  const totalActualHrs = projectTimesheets.reduce((sum, ts) => sum + (Number(ts.working_hours) || 0), 0);
  const overallProgress = totalPlannedHrs > 0 ? ((totalActualHrs / totalPlannedHrs) * 100).toFixed(2) : '0.00';

  return (
    <div className="page-body">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Briefcase size={24} style={{ color: '#6366f1' }} /> Project Master / Manage Project Work
          </h1>
          <p className="page-subtitle">View and manage project work details, WBS allocations, and log time sheets.</p>
        </div>
      </div>

      {/* Top Project Selector & Summary Card */}
      <div style={{ background: 'var(--bg-surface)', padding: '1.25rem 1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'center' }}>
          <div>
            <FormSelect
              label="Project Name"
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value ? Number(e.target.value) : '')}
              options={[
                { value: '', label: 'Select project' },
                ...projects.map(p => ({ value: p.project_id, label: p.project_name }))
              ]}
              style={{ width: '100%', background: 'var(--bg-card)' }}
            />
          </div>
          <div style={{ background: 'var(--bg-card)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PROJECT REF</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.2rem', color: 'var(--text-primary)' }}>{selectedProject ? `PRJ-${new Date(selectedProject.start_date || new Date()).getFullYear()}-${selectedProject.project_id}` : '-'}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{selectedProject?.start_date || '-'}</div>
          </div>
          <div style={{ background: 'var(--bg-card)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CLIENT NAME</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.2rem', color: 'var(--text-primary)' }}>{selectedProject?.customer_name || 'test client'}</div>
          </div>
        </div>

        {/* 4 Metric / KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
          <div style={{ background: 'var(--bg-card)', padding: '1.1rem 1.25rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-color)' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Total WBS</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>{totalWbsCount}</div>
            </div>
            <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={18} color="#6366f1" />
            </div>
          </div>
          <div style={{ background: 'var(--bg-card)', padding: '1.1rem 1.25rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-color)' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Total Planned Hours</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>{totalPlannedHrs.toLocaleString()} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>hrs</span></div>
            </div>
            <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} color="#10b981" />
            </div>
          </div>
          <div style={{ background: 'var(--bg-card)', padding: '1.1rem 1.25rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-color)' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Total Actual Hours</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>{totalActualHrs.toLocaleString()} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>hrs</span></div>
            </div>
            <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Upload size={18} color="#3b82f6" />
            </div>
          </div>
          <div style={{ background: 'var(--bg-card)', padding: '1.1rem 1.25rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-color)' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Overall Progress</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>{overallProgress}%</div>
            </div>
            <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Briefcase size={18} color="#f59e0b" />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Layers size={18} style={{ color: '#6366f1' }} /> Project Work Details
          </h2>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-primary" onClick={() => setIsAddWbsOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Plus size={16} /> Add New WBS
            </button>
          </div>
        </div>

        <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '750px' }}>
            <thead>
              <tr>
                <th style={{ width: '50px', textAlign: 'center' }}>NO.</th>
                <th style={{ minWidth: '200px' }}>WBS NAME</th>
                <th style={{ minWidth: '120px' }}>PLAN START</th>
                <th style={{ minWidth: '120px' }}>PLAN END</th>
                <th style={{ minWidth: '110px', textAlign: 'center' }}>PLAN HRS</th>
                <th style={{ minWidth: '110px', textAlign: 'center' }}>ACTUAL HRS</th>
                <th style={{ minWidth: '140px', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {wbsList.map((wbs, index) => {
                const wbsActualHrs = projectTimesheets.filter(ts => ts.wbs_id === wbs.id).reduce((sum, ts) => sum + (Number(ts.working_hours) || 0), 0);

                return (
                  <tr key={wbs.id}>
                    <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{index + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{wbs.wbs_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{wbs.note || 'No description'}</div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{selectedProject?.start_date || '-'}</td>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{selectedProject?.end_date || '-'}</td>
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 600, padding: '0.25rem 0.6rem', background: 'var(--bg-secondary)', borderRadius: '6px', fontSize: '0.82rem', border: '1px solid var(--border-color)', display: 'inline-block' }}>
                        {wbs.total_hours || 0} hrs
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <span style={{ color: '#10b981', fontWeight: 600, padding: '0.25rem 0.6rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px', fontSize: '0.82rem', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'inline-block' }}>
                        {wbsActualHrs} hrs
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        onClick={() => {
                          setSelectedWbsForLog(wbs.id || '');
                          setIsLogWorkOpen(true);
                        }}
                      >
                        <Clock size={14} /> Log Timesheet
                      </button>
                    </td>
                  </tr>
                );
              })}
              {wbsList.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-secondary)' }}>
                    No WBS allocations found for this project. Click <strong>+ Add New WBS</strong> to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Time Sheet Modal */}
      <Modal isOpen={isLogWorkOpen} onClose={() => setIsLogWorkOpen(false)} title="Log Time Sheet" size="md">
        <form onSubmit={handleSaveLog} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          {/* Project Name */}
          <div>
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.35rem", display: "block" }}>
              Project Name
            </label>
            <input
              type="text"
              className="form-input"
              value={selectedProject ? `${selectedProject.project_code || ''} ${selectedProject.project_name || ''}`.trim() : ''}
              disabled
              style={{ width: "100%", background: "var(--bg-secondary)", color: "var(--text-secondary)", padding: "0.55rem 0.75rem", borderRadius: "6px", fontSize: "0.88rem" }}
            />
          </div>

          {/* WBS Name */}
          <div>
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.35rem", display: "block" }}>
              WBS Name
            </label>
            <input
              type="text"
              className="form-input"
              value={wbsList.find(w => w.id === selectedWbsForLog)?.wbs_name || ""}
              disabled
              style={{ width: "100%", background: "var(--bg-secondary)", color: "var(--text-secondary)", padding: "0.55rem 0.75rem", borderRadius: "6px", fontSize: "0.88rem" }}
            />
          </div>

          {/* Choose Task Name (optional) */}
          <div>
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.35rem", display: "block" }}>
              Choose Task Name <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span>
            </label>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }}>
                <Search size={15} />
              </div>
              <input
                type="text"
                list="taskOptionsModalProjectWork"
                className="form-input"
                placeholder="Search task or type to create new..."
                value={logForm.task_name || ''}
                onChange={e => setLogForm(p => ({ ...p, task_name: e.target.value }))}
                style={{ width: "100%", paddingLeft: "2.4rem", paddingRight: "2.2rem", borderRadius: "6px", fontSize: "0.88rem" }}
              />
              <div style={{ position: "absolute", right: "0.85rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }}>
                <ChevronDown size={16} />
              </div>
            </div>
            <datalist id="taskOptionsModalProjectWork">
              {tasks.filter(t => !selectedWbsForLog || String(t.wbs_id) === String(selectedWbsForLog)).map(t => (
                <option key={t.task_id} value={t.task_name} />
              ))}
            </datalist>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
              * If no task is selected or a new task is typed, it will be automatically created under Project + WBS.
            </div>
          </div>

          {/* Employee Name */}
          <div>
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.35rem", display: "block" }}>
              Employee Name
            </label>
            <select
              className="form-select"
              value={logForm.employee_id || ''}
              onChange={e => setLogForm(p => ({ ...p, employee_id: e.target.value }))}
              style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "6px", fontSize: "0.88rem" }}
            >
              <option value="">-- Select Employee --</option>
              {employees.map(emp => (
                <option key={emp.employee_id} value={emp.employee_id}>
                  {emp.name || emp.full_name || 'Employee'} ({emp.employee_code || `EMP-${emp.employee_id}`})
                </option>
              ))}
            </select>
          </div>

          {/* Labour / Contractor Name */}
          <div>
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.35rem", display: "block" }}>
              Labour / Contractor Name <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span>
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                list="labourOptionsProjectWork"
                className="form-input"
                placeholder="Search labour or type to add new..."
                value={logForm.labour_name || ''}
                onChange={e => setLogForm(p => ({ ...p, labour_name: e.target.value }))}
                style={{ width: "100%", paddingRight: "2rem" }}
              />
              <div style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }}>
                <ChevronDown size={16} />
              </div>
            </div>
            <datalist id="labourOptionsProjectWork">
              {labours.map(l => (
                <option key={l.labour_id} value={l.name || l.labour_name} />
              ))}
            </datalist>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
              * If new labour name is typed, it will be created.
            </div>
          </div>

          {/* Log Date & Work HRs */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.35rem", display: "block" }}>
                Log Date <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="date"
                className="form-input"
                value={logForm.log_date}
                min={getTodayStr()}
                onChange={e => {
                  const val = e.target.value;
                  const today = getTodayStr();
                  if (val && val < today) {
                    showError('Log Date cannot be a past date');
                    return;
                  }
                  setLogForm(p => ({ ...p, log_date: val }));
                }}
                required
                style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "6px", fontSize: "0.88rem" }}
              />
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.35rem", display: "block" }}>
                Work HRs. <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                className="form-input"
                placeholder="e.g. 6"
                value={logForm.working_hours}
                onChange={e => setLogForm(p => ({ ...p, working_hours: e.target.value }))}
                required
                style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "6px", fontSize: "0.88rem" }}
              />
            </div>
          </div>

          {/* Material Used (optional) */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.35rem", display: "block" }}>
              Material Used (optional)
            </label>
            <div style={{ position: "relative", marginBottom: "0.75rem" }}>
              <input
                type="text"
                list="materialOptionsProjectWork"
                className="form-input"
                placeholder="Search material or type to add new..."
                value={logForm.material_name || ''}
                onChange={e => setLogForm(p => ({ ...p, material_name: e.target.value }))}
                style={{ width: "100%", paddingRight: "2rem" }}
              />
              <div style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }}>
                <ChevronDown size={16} />
              </div>
            </div>
            <datalist id="materialOptionsProjectWork">
              {materials.map(m => (
                <option key={m.material_id} value={m.material_name} />
              ))}
            </datalist>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <FormInput label="Material Qty" type="number" min="0" step="any" value={logForm.material_qty} onChange={e => setLogForm(p => ({ ...p, material_qty: e.target.value }))} />
              <FormInput label="Material Rate" type="number" min="0" step="any" value={logForm.material_rate} onChange={e => setLogForm(p => ({ ...p, material_rate: e.target.value }))} />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.35rem", display: "block" }}>
              Description / Comments
            </label>
            <textarea
              className="form-input"
              rows={3}
              value={logForm.description || ''}
              onChange={e => setLogForm(p => ({ ...p, description: e.target.value }))}
              style={{ width: "100%", resize: 'vertical' }}
              placeholder="Add any details about the work done here..."
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.25rem" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsLogWorkOpen(false)}
              style={{ padding: "0.55rem 1.25rem", borderRadius: "6px", fontSize: "0.88rem" }}
            >
              Close
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: "0.55rem 1.5rem", borderRadius: "6px", fontSize: "0.88rem", background: "#f43f5e", borderColor: "#f43f5e", color: "#fff", fontWeight: 600 }}
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Add WBS Modal */}
      <Modal isOpen={isAddWbsOpen} onClose={() => setIsAddWbsOpen(false)} title="Add WBS to Project">
        <form onSubmit={handleAddWbs} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <FormSelect label="WBS Name *" value={wbsForm.wbs_id} onChange={e => setWbsForm(p => ({ ...p, wbs_id: e.target.value }))} required options={[
            { value: '', label: '-- Select WBS --' },
            ...masterWbsList.map(m => ({ value: m.wbs_id, label: m.wbs_name }))
          ]} />
          <div className="grid-responsive-2">
            <FormInput label="Total Planned Hours" type="number" min="0" placeholder="0" value={wbsForm.total_hours} onChange={e => setWbsForm(p => ({ ...p, total_hours: Number(e.target.value) }))} />
            <FormInput label="Budget Amount" type="number" min="0" placeholder="0.00" value={wbsForm.budget_amount} onChange={e => setWbsForm(p => ({ ...p, budget_amount: Number(e.target.value) }))} />
          </div>
          <FormInput label="Note / Description" type="text" placeholder="Optional notes for this WBS" value={wbsForm.note} onChange={e => setWbsForm(p => ({ ...p, note: e.target.value }))} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddWbsOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add WBS</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
