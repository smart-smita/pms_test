import React, { useState, useEffect } from 'react';
import {
  Briefcase, Layers, Plus, ChevronRight, ChevronDown, Clock, Upload
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { Project, ProjectWBS, Task, Employee } from '../types';
import { showSuccess, showError } from '../utils/toast';
import { Modal } from '../components/common/Modal';
import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';

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
    log_date: new Date().toISOString().split('T')[0]
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

    let finalTaskId: number | undefined = undefined;
    let finalTaskName: string | undefined = undefined;
    
    if (logForm.task_name && logForm.task_name.trim() !== '') {
      const existingTask = tasks.find(t => t.task_name.toLowerCase() === logForm.task_name.trim().toLowerCase() && String(t.wbs_id) === String(selectedWbsForLog));
      if (existingTask) {
        finalTaskId = existingTask.task_id;
      } else {
        finalTaskName = logForm.task_name.trim();
      }
    }

    let finalLabourId: number | undefined = undefined;
    if (logForm.labour_name && logForm.labour_name.trim() !== '') {
      const existingLabour = labours.find(l => l.labour_name.toLowerCase() === logForm.labour_name.trim().toLowerCase());
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
          employee_id: logForm.employee_id ? Number(logForm.employee_id) : undefined,
          labour_id: finalLabourId,
          material_id: finalMaterialId,
          material_qty: logForm.material_qty ? Number(logForm.material_qty) : undefined,
          material_rate: logForm.material_rate ? Number(logForm.material_rate) : undefined,
          log_date: logForm.log_date,
          working_hours: Number(logForm.working_hours),
          comment: logForm.description
        })
      });
      if (res.success) {
        showSuccess('Work logged successfully');
        setIsLogWorkOpen(false);
        setLogForm({
          task_id: '', task_name: '', is_new_task: false, employee_id: '', labour_id: '', labour_name: '',
          material_id: '', material_name: '', material_qty: '', material_rate: '', working_hours: '', description: '', log_date: new Date().toISOString().split('T')[0]
        });
        fetchProjectData(Number(selectedProjectId));
      } else {
        showError(res.message || 'Failed to log work');
      }
    } catch (error: any) {
      showError(error.message || 'Error logging work');
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

      <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: '1 1 300px' }}>
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
          <div style={{ flex: '1 1 150px', background: 'var(--bg-card)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PROJECT REF</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.2rem', color: 'var(--text-primary)' }}>{selectedProject ? `PRJ-${new Date(selectedProject.start_date || new Date()).getFullYear()}-${selectedProject.project_id}` : '-'}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{selectedProject?.start_date || '-'}</div>
          </div>
          <div style={{ flex: '1 1 150px', background: 'var(--bg-card)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CLIENT NAME</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.2rem', color: 'var(--text-primary)' }}>{selectedProject?.customer_name || 'test client'}</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginTop: '2rem' }}>
          <div style={{ flex: '1 1 200px', background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-color)' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total WBS</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{totalWbsCount}</div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={20} color="#6366f1" />
            </div>
          </div>
          <div style={{ flex: '1 1 200px', background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-color)' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total Planned Hours</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{totalPlannedHrs.toLocaleString()} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>hrs</span></div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} color="#10b981" />
            </div>
          </div>
          <div style={{ flex: '1 1 200px', background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-color)' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total Actual Hours</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{totalActualHrs.toLocaleString()} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>hrs</span></div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Upload size={20} color="#3b82f6" />
            </div>
          </div>
          <div style={{ flex: '1 1 200px', background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-color)' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Overall Progress</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{overallProgress}%</div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Briefcase size={20} color="#f59e0b" />
            </div>
          </div>
        </div>
      </div>

      
      {!isLogWorkOpen ? (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} style={{ color: '#6366f1' }} /> Project Work Details
            </h2>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-primary" onClick={() => setIsAddWbsOpen(true)}>
                <Plus size={16} /> Add New WBS
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>NO.</th>
                  <th>WBS NAME</th>
                  <th>PLAN START</th>
                  <th>PLAN END</th>
                  <th>PLAN HRS</th>
                  <th>ACTUAL HRS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {wbsList.map((wbs, index) => {
                  const wbsActualHrs = projectTimesheets.filter(ts => ts.wbs_id === wbs.id).reduce((sum, ts) => sum + (Number(ts.working_hours) || 0), 0);
                  
                  return (
                    <tr key={wbs.id}>
                      <td>{index + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{wbs.wbs_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{wbs.note || 'No description'}</div>
                      </td>
                      <td>{selectedProject?.start_date || '-'}</td>
                      <td>{selectedProject?.end_date || '-'}</td>
                      <td style={{ fontWeight: 600 }}>{wbs.total_hours || 0}</td>
                      <td style={{ color: '#10b981', fontWeight: 600 }}>{wbsActualHrs}</td>
                      <td>
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
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
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                      No WBS allocations found for this project.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} style={{ color: '#10b981' }} /> Log Time Sheet & Work Progress
            </h2>
            <button className="btn btn-secondary" onClick={() => setIsLogWorkOpen(false)}>
              Cancel
            </button>
          </div>

          <form onSubmit={handleSaveLog} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Project Name</label>
                <input type="text" className="form-control" value={selectedProject?.project_name || ''} disabled style={{ background: "var(--bg-card)", color: "var(--text-muted)", width: "100%" }} />
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>WBS Name</label>
                <input type="text" className="form-control" value={wbsList.find(w => w.id === selectedWbsForLog)?.wbs_name || ""} disabled style={{ background: "var(--bg-card)", color: "var(--text-muted)", width: "100%" }} />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Choose Task Name (optional)</label>
              <div style={{ position: "relative" }}>
                <input 
                  type="text" 
                  list="taskOptions"
                  className="form-control" 
                  placeholder="Search task or type to create new..." 
                  value={logForm.task_name || ''} 
                  onChange={e => setLogForm(p => ({ ...p, task_name: e.target.value }))} 
                  style={{ width: "100%", paddingRight: "2rem" }}
                />
                <div style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
              <datalist id="taskOptions">
                {tasks.filter(t => String(t.wbs_id) === String(selectedWbsForLog)).map(t => (
                  <option key={t.task_id} value={t.task_name} />
                ))}
              </datalist>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
                * If no task is selected or a new task is typed, it will be automatically created under Project + WBS.
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Employee Name</label>
                <select className="form-control" value={logForm.employee_id || ''} onChange={e => setLogForm(p => ({ ...p, employee_id: e.target.value }))} style={{ width: '100%', background: 'var(--input-bg)', color: 'var(--input-text)' }}>
                  <option value="">-- Select Employee --</option>
                  {employees.map(emp => (
                    <option key={emp.employee_id} value={emp.employee_id}>{emp.full_name}</option>
                  ))}
                </select>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
                  * Required if logging Employee time.
                </div>
              </div>

              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Labour / Contractor Name (optional)</label>
                <div style={{ position: "relative" }}>
                  <input 
                    type="text" 
                    list="labourOptions"
                    className="form-control" 
                    placeholder="Search labour or type to add new..." 
                    value={logForm.labour_name || ''} 
                    onChange={e => setLogForm(p => ({ ...p, labour_name: e.target.value }))} 
                    style={{ width: "100%", paddingRight: "2rem" }}
                  />
                  <div style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
                <datalist id="labourOptions">
                  {labours.map(l => (
                    <option key={l.labour_id} value={l.labour_name} />
                  ))}
                </datalist>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
                  * If new labour name is typed, it will be created.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem' }}>
              <div style={{ flex: '1 1 200px' }}>
                <FormInput label="Log Date *" type="date" value={logForm.log_date} onChange={e => setLogForm(p => ({ ...p, log_date: e.target.value }))} required />
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <FormInput label="Work HRs. *" type="number" min="0.5" step="0.5" value={logForm.working_hours} onChange={e => setLogForm(p => ({ ...p, working_hours: e.target.value }))} required placeholder="e.g. 6" />
              </div>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
              <div style={{ flex: '2 1 300px' }}>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Material Used (optional)</label>
                <div style={{ position: "relative" }}>
                  <input 
                    type="text" 
                    list="materialOptions"
                    className="form-control" 
                    placeholder="Search material or type to add new..." 
                    value={logForm.material_name || ''} 
                    onChange={e => setLogForm(p => ({ ...p, material_name: e.target.value }))} 
                    style={{ width: "100%", paddingRight: "2rem" }}
                  />
                  <div style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
                <datalist id="materialOptions">
                  {materials.map(m => (
                    <option key={m.material_id} value={m.material_name} />
                  ))}
                </datalist>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
                  * If new material name is typed, it will be created.
                </div>
              </div>
              <div style={{ flex: '1 1 100px' }}>
                <FormInput label="Material Qty" type="number" min="0" step="any" value={logForm.material_qty} onChange={e => setLogForm(p => ({ ...p, material_qty: e.target.value }))} />
              </div>
              <div style={{ flex: '1 1 100px' }}>
                <FormInput label="Material Rate" type="number" min="0" step="any" value={logForm.material_rate} onChange={e => setLogForm(p => ({ ...p, material_rate: e.target.value }))} />
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Description / Comments</label>
              <textarea className="form-control" rows={3} value={logForm.description || ''} onChange={e => setLogForm(p => ({ ...p, description: e.target.value }))} style={{ width: "100%", resize: 'vertical' }} placeholder="Add any details about the work done here..."></textarea>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsLogWorkOpen(false)} style={{ padding: "0.75rem 1.5rem" }}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ padding: "0.75rem 1.5rem", fontSize: "1rem", fontWeight: 600 }}>Save Log</button>
            </div>
          </form>
        </div>
      )}


      <Modal isOpen={isAddWbsOpen} onClose={() => setIsAddWbsOpen(false)} title="Add WBS to Project">
        <form onSubmit={handleAddWbs} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <FormSelect label="WBS Name *" value={wbsForm.wbs_id} onChange={e => setWbsForm(p => ({ ...p, wbs_id: e.target.value }))} required options={[
            { value: '', label: '-- Select WBS --' },
            ...masterWbsList.map(m => ({ value: m.wbs_id, label: m.wbs_name }))
          ]} />
          <FormInput label="Total Planned Hours" type="number" min="0" value={wbsForm.total_hours} onChange={e => setWbsForm(p => ({ ...p, total_hours: Number(e.target.value) }))} />
          <FormInput label="Budget Amount" type="number" min="0" value={wbsForm.budget_amount} onChange={e => setWbsForm(p => ({ ...p, budget_amount: Number(e.target.value) }))} />
          <FormInput label="Note / Description" type="text" value={wbsForm.note} onChange={e => setWbsForm(p => ({ ...p, note: e.target.value }))} />
          <button type="submit" className="btn btn-primary">Add WBS</button>
        </form>
      </Modal>

      

    </div>
  );
};
