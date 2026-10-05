import React, { useState, useEffect, useMemo } from 'react';
import {
  Briefcase, Layers, Clock, Edit, Plus, Trash2, ChevronRight, ChevronDown,
  UserCheck, IndianRupee, Package, CheckSquare, HardHat, Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { Project, ProjectWBS, MasterWBS, Task, Employee } from '../types';
import { showSuccess, showError } from '../utils/toast';
import { Modal } from '../components/common/Modal';
import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';

export const ProjectWork: React.FC = () => {
  const { user } = useAuth();
  const canManage = user?.role_name === 'Admin' || user?.role_name === 'Super Admin' || user?.role_name === 'Manager';

  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [wbsAllocations, setWbsAllocations] = useState<ProjectWBS[]>([]);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [projectLabourLogs, setProjectLabourLogs] = useState<any[]>([]);
  const [projectMaterials, setProjectMaterials] = useState<any[]>([]);
  const [projectTimesheets, setProjectTimesheets] = useState<any[]>([]);
  
  const [masterWbsList, setMasterWbsList] = useState<MasterWBS[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [labours, setLabours] = useState<any[]>([]);

  // UI State
  const [expandedWbsId, setExpandedWbsId] = useState<number | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);

  // Modals
  const [isAddWbsOpen, setIsAddWbsOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);

  // Forms
  const [wbsForm, setWbsForm] = useState({ wbs_id: '', note: '', total_hours: 0, budget_amount: 0 });
  const [taskForm, setTaskForm] = useState({ wbs_id: '', task_name: '', description: '', planned_hours: 8, hourly_rate: 300 });
  const [logForm, setLogForm] = useState({ task_id: '', employee_id: '', working_hours: '', log_date: new Date().toISOString().split('T')[0] });
  const [contractLabourLogForm, setContractLabourLogForm] = useState({ task_id: '', labour_id: '', work_date: new Date().toISOString().split('T')[0], total_working_hours: '', rate: '', amount: '', rate_type: 'hourly', work_description: '' });
  const [materialLogForm, setMaterialLogForm] = useState({ task_id: '', wbs_id: '', material_id: '', quantity: '', log_date: new Date().toISOString().split('T')[0], notes: '' });

  const [isAddContractLabourLogOpen, setIsAddContractLabourLogOpen] = useState(false);
  const [isAddMaterialLogOpen, setIsAddMaterialLogOpen] = useState(false);

  const [materialsMaster, setMaterialsMaster] = useState<any[]>([]);
  useEffect(() => {
    fetchCustomers();
    fetchProjects();
    fetchMasterWbs();
    fetchEmployees();
    fetchLabours();
    fetchMaterialsMaster();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await apiService.get<any[]>('/customers');
      if (res.data) setCustomers(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (selectedProjectId) {
      const pId = Number(selectedProjectId);
      const proj = projects.find((p) => p.project_id === pId) || null;
      setSelectedProject(proj);
      fetchProjectData(pId);
    } else {
      setSelectedProject(null);
      setWbsAllocations([]);
      setProjectTasks([]);
      setProjectLabourLogs([]);
      setProjectMaterials([]);
      setProjectTimesheets([]);
    }
  }, [selectedProjectId, projects]);

  const fetchProjects = async () => {
    try {
      const res = await apiService.get<Project[]>('/projects');
      if (res.data) {
        setProjects(res.data);
        if (res.data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(res.data[0].project_id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMasterWbs = async () => {
    try {
      const res = await apiService.get<MasterWBS[]>('/wbs');
      if (res.data) setMasterWbsList(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchEmployees = async () => {
    try {
      const res = await apiService.get<Employee[]>('/employees');
      if (res.data) setEmployees(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchLabours = async () => {
    try {
      const res = await apiService.get<any[]>('/labours');
      if (res.data) setLabours(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchMaterialsMaster = async () => {
    try {
      const res = await apiService.get<any[]>('/materials/master');
      if (res.data) setMaterialsMaster(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchProjectData = async (pId: number) => {
    try {
      const [wbsRes, taskRes, llRes, matRes, tsRes] = await Promise.all([
        apiService.get<ProjectWBS[]>(`/projects/${pId}/wbs`),
        apiService.get<Task[]>(`/tasks?project_id=${pId}`),
        apiService.get<any[]>(`/labour-work-logs?project_id=${pId}`),
        apiService.get<any[]>(`/materials/project-materials?project_id=${pId}`),
        apiService.get<any[]>(`/timesheets?project_id=${pId}`),
      ]);
      if (wbsRes.data) setWbsAllocations(wbsRes.data);
      if (taskRes.data) setProjectTasks(taskRes.data);
      if (llRes.data) setProjectLabourLogs(llRes.data);
      if (matRes.data) setProjectMaterials(matRes.data);
      if (tsRes.data) setProjectTimesheets(tsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveWbs = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiService.post('/wbs/project-wbs', {
        project_id: Number(selectedProjectId),
        wbs_id: Number(wbsForm.wbs_id),
        note: wbsForm.note,
        total_hours: Number(wbsForm.total_hours),
        budget_amount: Number(wbsForm.budget_amount)
      });
      if (res.success) {
        showSuccess('Project WBS added. Default Task created automatically.');
        setIsAddWbsOpen(false);
        fetchProjectData(Number(selectedProjectId));
      } else {
        showError(res.message || 'Failed to add WBS');
      }
    } catch (err: any) {
      showError(err.message || 'Error adding WBS');
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiService.post('/tasks', {
        project_id: Number(selectedProjectId),
        wbs_id: Number(taskForm.wbs_id),
        task_name: taskForm.task_name,
        description: taskForm.description,
        estimated_hours: Number(taskForm.planned_hours)
      });
      if (res.success) {
        showSuccess('Task added successfully');
        setIsAddTaskOpen(false);
        fetchProjectData(Number(selectedProjectId));
      } else {
        showError(res.message || 'Failed to add task');
      }
    } catch (err: any) {
      showError(err.message || 'Error adding task');
    }
  };

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const task = projectTasks.find(t => String(t.task_id) === String(logForm.task_id));
      const res = await apiService.post('/timesheets', {
        project_id: Number(selectedProjectId),
        wbs_id: task?.wbs_id,
        task_id: Number(logForm.task_id),
        employee_id: Number(logForm.employee_id),
        log_date: logForm.log_date,
        working_hours: Number(logForm.working_hours),
      });
      if (res.success) {
        showSuccess('Work Log added successfully');
        setIsAddLogOpen(false);
        fetchProjectData(Number(selectedProjectId));
      } else {
        showError(res.message || 'Failed to add log');
      }
    } catch (err: any) {
      showError(err.message || 'Error adding log');
    }
  };

  const handleSaveContractLabourLog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const task = projectTasks.find(t => String(t.task_id) === String(contractLabourLogForm.task_id));
      const rate = Number(contractLabourLogForm.rate || 0);
      const hours = Number(contractLabourLogForm.total_working_hours);
      const amount = hours * rate;

      const res = await apiService.post('/labour-work-logs', {
        project_id: Number(selectedProjectId),
        wbs_id: task?.wbs_id,
        task_id: Number(contractLabourLogForm.task_id),
        labour_id: Number(contractLabourLogForm.labour_id),
        work_date: contractLabourLogForm.work_date,
        total_working_hours: hours,
        rate: rate,
        amount: amount,
        rate_type: contractLabourLogForm.rate_type,
        work_description: contractLabourLogForm.work_description
      });
      if (res.success) {
        showSuccess('Contract Labour Log added successfully');
        setIsAddContractLabourLogOpen(false);
        fetchProjectData(Number(selectedProjectId));
      } else {
        showError(res.message || 'Failed to add labour log');
      }
    } catch (err: any) {
      showError(err.message || 'Error adding labour log');
    }
  };

  const handleSaveMaterialLog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const material = materialsMaster.find(m => String(m.material_id) === String(materialLogForm.material_id));
      if (!material) throw new Error("Invalid Material Selected");
      
      let pmId = null;
      const existingPm = projectMaterials.find(pm => String(pm.wbs_id) === String(materialLogForm.wbs_id) && String(pm.material_id) === String(materialLogForm.material_id));
      if (existingPm) {
        pmId = existingPm.project_material_id || existingPm.id;
      } else {
        const linkRes = await apiService.post('/materials/project-materials', {
          project_id: Number(selectedProjectId),
          wbs_id: Number(materialLogForm.wbs_id),
          material_id: Number(material.material_id),
          material_name: material.material_name,
          unit: material.unit || 'Nos',
          unit_rate: Number(material.rate || 0),
          planned_quantity: 0
        });
        if (linkRes.success && linkRes.data?.id) {
          pmId = linkRes.data.id;
        } else {
          throw new Error('Failed to link material to project WBS');
        }
      }

      const res = await apiService.post(`/materials/project-materials/${pmId}/log`, {
        action_type: 'used',
        quantity: Number(materialLogForm.quantity),
        log_date: materialLogForm.log_date,
        notes: materialLogForm.notes
      });

      if (res.success) {
        showSuccess('Material Log added successfully');
        setIsAddMaterialLogOpen(false);
        fetchProjectData(Number(selectedProjectId));
      } else {
        showError(res.message || 'Failed to add material log');
      }
    } catch (err: any) {
      showError(err.message || 'Error adding material log');
    }
  };

  return (
    <div className="page-body">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Briefcase size={24} style={{ color: '#6366f1' }} /> Manage Project Work (Execution Flow)
          </h1>
          <p className="page-subtitle">PROJECT → WBS → TASK → WORK LOG Hierarchy</p>
        </div>
      </div>

      <div className="glass-card mb-6" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '1.5rem', flex: '1 1 300px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 250px' }}>
            <label className="form-label">Select Customer</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value ? Number(e.target.value) : '');
                setSelectedProjectId('');
                setExpandedWbsId(null);
                setExpandedTaskId(null);
              }}
              className="form-select"
              style={{ width: '100%', fontSize: '0.9rem', fontWeight: 600 }}
            >
              <option value="">-- All Customers --</option>
              {customers.map((c) => (
                <option key={c.customer_id} value={c.customer_id}>{c.customer_name}</option>
              ))}
            </select>
          </div>
          
          <div style={{ flex: '1 1 250px' }}>
            <label className="form-label">Select Project</label>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value ? Number(e.target.value) : '');
                setExpandedWbsId(null);
                setExpandedTaskId(null);
              }}
              className="form-select"
              style={{ width: '100%', fontSize: '0.9rem', fontWeight: 600 }}
            >
              <option value="">-- Choose Project --</option>
              {projects
                .filter(p => !selectedCustomerId || p.customer_id === selectedCustomerId)
                .map((p) => (
                <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
              ))}
            </select>
          </div>
        </div>
        {selectedProject && canManage && (
          <button onClick={() => setIsAddWbsOpen(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
            <Plus size={16} /> Add WBS
          </button>
        )}
      </div>

      {selectedProject && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {wbsAllocations.length === 0 ? (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No WBS found for this project. Add a WBS to begin execution tracking.
            </div>
          ) : (
            wbsAllocations.map(wbs => {
              const isWbsExpanded = expandedWbsId === wbs.id;
              const wbsTasks = projectTasks.filter(t => t.wbs_id === wbs.id || t.wbs_id === wbs.wbs_id);
              
              const plannedHrs = Number(wbs.total_hours || 0);
              const actualHrs = Number(wbs.actual_hours || 0) + projectTimesheets.filter(ts => ts.wbs_id === wbs.id || ts.wbs_id === wbs.wbs_id).reduce((s, ts) => s + Number(ts.working_hours), 0);
              const remHrs = Math.max(plannedHrs - actualHrs, 0);
              const extraHrs = Math.max(actualHrs - plannedHrs, 0);
              const progPct = plannedHrs > 0 ? Math.min(Math.round((actualHrs / plannedHrs) * 100), 100) : 0;

              return (
                <div key={wbs.id} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                  {/* WBS Header (Click to expand) */}
                  <div 
                    onClick={() => setExpandedWbsId(isWbsExpanded ? null : wbs.id as number)}
                    style={{ 
                      padding: '1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: isWbsExpanded ? 'rgba(255,255,255,0.03)' : 'transparent',
                      borderBottom: isWbsExpanded ? '1px solid var(--border-color)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '0.5rem', borderRadius: '8px' }}>
                        <Layers size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{wbs.wbs_name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Code: {wbs.wbs_code || `WBS-${wbs.id}`} | {wbsTasks.length} Tasks</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Progress</div>
                        <div style={{ fontWeight: 700, color: '#4ade80' }}>{progPct}%</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Hrs (Act/Plan)</div>
                        <div style={{ fontWeight: 700 }}>{actualHrs} / {plannedHrs}</div>
                      </div>
                      {isWbsExpanded ? <ChevronDown size={20} color="var(--text-secondary)" /> : <ChevronRight size={20} color="var(--text-secondary)" />}
                    </div>
                  </div>

                  {/* WBS Body */}
                  {isWbsExpanded && (
                    <div style={{ padding: '1.25rem', background: 'rgba(0,0,0,0.15)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div className="dashboard-metric" style={{ background: 'rgba(56, 189, 248, 0.08)' }}>
                          <span style={{ color: '#38bdf8' }}>Planned Hours</span>
                          <strong style={{ color: 'var(--text-primary)' }}>{plannedHrs}</strong>
                        </div>
                        <div className="dashboard-metric" style={{ background: 'rgba(168, 85, 247, 0.08)' }}>
                          <span style={{ color: '#c084fc' }}>Actual Hours</span>
                          <strong style={{ color: '#c084fc' }}>{actualHrs}</strong>
                        </div>
                        <div className="dashboard-metric" style={{ background: 'rgba(245, 158, 11, 0.08)' }}>
                          <span style={{ color: '#f59e0b' }}>Remaining Hours</span>
                          <strong style={{ color: '#f59e0b' }}>{remHrs}</strong>
                        </div>
                        <div className="dashboard-metric" style={{ background: extraHrs > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.03)' }}>
                          <span style={{ color: extraHrs > 0 ? '#ef4444' : 'var(--text-secondary)' }}>Extra Hours</span>
                          <strong style={{ color: extraHrs > 0 ? '#ef4444' : 'var(--text-primary)' }}>{extraHrs}</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CheckSquare size={16} /> TASKS</h3>
                        {canManage && (
                          <button onClick={() => { setTaskForm(prev => ({ ...prev, wbs_id: String(wbs.id) })); setIsAddTaskOpen(true); }} className="btn btn-secondary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>
                            + Add Task
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {wbsTasks.length === 0 ? (
                          <div style={{ padding: '1rem', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '8px', color: 'var(--text-secondary)' }}>No tasks. Add one to start logging work.</div>
                        ) : (
                          wbsTasks.map(task => {
                            const isTaskExpanded = expandedTaskId === task.task_id;
                            const taskLogs = projectTimesheets.filter(ts => ts.task_id === task.task_id);
                            const tActualHrs = taskLogs.reduce((s, l) => s + Number(l.working_hours), 0);
                            
                            return (
                              <div key={task.task_id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                                {/* Task Header */}
                                <div 
                                  onClick={() => setExpandedTaskId(isTaskExpanded ? null : task.task_id)}
                                  style={{ padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', background: isTaskExpanded ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <CheckSquare size={16} color="#0ea5e9" />
                                    <div style={{ fontWeight: 600 }}>{task.task_name}</div>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.85rem' }}>
                                    <div style={{ color: 'var(--text-secondary)' }}>Hrs: <strong style={{ color: '#10b981' }}>{tActualHrs}</strong> / {task.estimated_hours || task.working_hours || 0}</div>
                                    <div style={{ color: 'var(--text-secondary)' }}>Logs: <strong>{taskLogs.length}</strong></div>
                                    {isTaskExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                  </div>
                                </div>

                                {/* Task Body (Work Logs) */}
                                {isTaskExpanded && (
                                  <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                      <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>WORK LOGS</h4>
                                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <button onClick={() => { setLogForm(prev => ({ ...prev, task_id: String(task.task_id) })); setIsAddLogOpen(true); }} style={{ background: 'transparent', border: '1px solid #10b981', color: '#10b981', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>
                                          + Employee Log
                                        </button>
                                        <button onClick={() => { setContractLabourLogForm(prev => ({ ...prev, task_id: String(task.task_id) })); setIsAddContractLabourLogOpen(true); }} style={{ background: 'transparent', border: '1px solid #f59e0b', color: '#f59e0b', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>
                                          + Labour Log
                                        </button>
                                        <button onClick={() => { setMaterialLogForm(prev => ({ ...prev, task_id: String(task.task_id), wbs_id: String(wbs.id) })); setIsAddMaterialLogOpen(true); }} style={{ background: 'transparent', border: '1px solid #0ea5e9', color: '#0ea5e9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>
                                          + Material Usage
                                        </button>
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                      {/* Employee Timesheets */}
                                      <div>
                                        <h5 style={{ fontSize: '0.8rem', color: '#10b981', marginBottom: '0.25rem' }}>Employee Timesheets</h5>
                                        {taskLogs.length === 0 ? (
                                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No employee logs.</div>
                                        ) : (
                                          <table className="data-table" style={{ width: '100%', fontSize: '0.8rem', margin: 0 }}>
                                            <thead><tr><th>Date</th><th>Employee</th><th>Hours</th></tr></thead>
                                            <tbody>
                                              {taskLogs.map(log => (
                                                <tr key={log.timesheet_id}>
                                                  <td>{log.log_date?.split('T')[0]}</td>
                                                  <td>{log.employee_name}</td>
                                                  <td style={{ fontWeight: 700, color: '#10b981' }}>{log.working_hours} hrs</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        )}
                                      </div>

                                      {/* Contract Labour Logs */}
                                      {projectLabourLogs.filter(ll => ll.task_id === task.task_id).length > 0 && (
                                        <div>
                                          <h5 style={{ fontSize: '0.8rem', color: '#f59e0b', marginBottom: '0.25rem' }}>Contract Labour Usage</h5>
                                          <table className="data-table" style={{ width: '100%', fontSize: '0.8rem', margin: 0 }}>
                                            <thead><tr><th>Date</th><th>Labour Name</th><th>Hours</th><th>Amount</th></tr></thead>
                                            <tbody>
                                              {projectLabourLogs.filter(ll => ll.task_id === task.task_id).map(ll => (
                                                <tr key={ll.work_log_id || ll.id}>
                                                  <td>{new Date(ll.work_date).toLocaleDateString()}</td>
                                                  <td>{labours.find(l => l.labour_id === ll.labour_id)?.name || `Labour #${ll.labour_id}`}</td>
                                                  <td>{ll.total_working_hours}</td>
                                                  <td>{ll.amount}</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}

                                      {/* Material Logs */}
                                      {projectMaterials.filter(pm => pm.wbs_id === wbs.id).length > 0 && (
                                        <div>
                                          <h5 style={{ fontSize: '0.8rem', color: '#0ea5e9', marginBottom: '0.25rem' }}>Material Usage</h5>
                                          <table className="data-table" style={{ width: '100%', fontSize: '0.8rem', margin: 0 }}>
                                            <thead><tr><th>Material</th><th>Planned</th><th>Used</th><th>Cost</th></tr></thead>
                                            <tbody>
                                              {projectMaterials.filter(pm => pm.wbs_id === wbs.id).map(pm => (
                                                <tr key={pm.project_material_id || pm.id}>
                                                  <td>{pm.material_name}</td>
                                                  <td>{pm.planned_quantity} {pm.unit}</td>
                                                  <td style={{ color: '#0ea5e9', fontWeight: 600 }}>{pm.used_quantity} {pm.unit}</td>
                                                  <td>{pm.actual_cost}</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={isAddWbsOpen} onClose={() => setIsAddWbsOpen(false)} title="Add WBS to Project">
        <form onSubmit={handleSaveWbs} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <FormSelect label="Select WBS Master" value={wbsForm.wbs_id} onChange={e => setWbsForm(p => ({...p, wbs_id: e.target.value}))} required options={[
            { value: '', label: '-- Select --' },
            ...masterWbsList.map(m => ({ value: m.id, label: m.wbs_name }))
          ]} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormInput label="Planned Hours" type="number" value={wbsForm.total_hours} onChange={e => setWbsForm(p => ({...p, total_hours: Number(e.target.value)}))} />
            <FormInput label="Planned Cost" type="number" value={wbsForm.budget_amount} onChange={e => setWbsForm(p => ({...p, budget_amount: Number(e.target.value)}))} />
          </div>
          <FormInput label="Remarks" value={wbsForm.note} onChange={e => setWbsForm(p => ({...p, note: e.target.value}))} />
          <button type="submit" className="btn btn-primary">Save WBS</button>
        </form>
      </Modal>

      <Modal isOpen={isAddTaskOpen} onClose={() => setIsAddTaskOpen(false)} title="Add Task to WBS">
        <form onSubmit={handleSaveTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <FormInput label="Task Name" value={taskForm.task_name} onChange={e => setTaskForm(p => ({...p, task_name: e.target.value}))} required />
          <FormInput label="Description" value={taskForm.description} onChange={e => setTaskForm(p => ({...p, description: e.target.value}))} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormInput label="Planned Hours" type="number" value={taskForm.planned_hours} onChange={e => setTaskForm(p => ({...p, planned_hours: Number(e.target.value)}))} />
          </div>
          <button type="submit" className="btn btn-primary">Save Task</button>
        </form>
      </Modal>

      <Modal isOpen={isAddLogOpen} onClose={() => setIsAddLogOpen(false)} title="Add Work Log">
        <form onSubmit={handleSaveLog} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <FormInput label="Date" type="date" value={logForm.log_date} onChange={e => setLogForm(p => ({...p, log_date: e.target.value}))} required />
          <FormSelect label="Employee" value={logForm.employee_id} onChange={e => setLogForm(p => ({...p, employee_id: e.target.value}))} required options={[
            { value: '', label: '-- Select --' },
            ...employees.map(e => ({ value: e.employee_id, label: e.name }))
          ]} />
          <FormInput label="Working Hours" type="number" value={logForm.working_hours} onChange={e => setLogForm(p => ({...p, working_hours: e.target.value}))} required />
          <button type="submit" className="btn btn-primary">Save Log</button>
        </form>
      </Modal>

      <Modal isOpen={isAddContractLabourLogOpen} onClose={() => setIsAddContractLabourLogOpen(false)} title="Add Contract Labour Log">
        <form onSubmit={handleSaveContractLabourLog} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <FormInput label="Date" type="date" value={contractLabourLogForm.work_date} onChange={e => setContractLabourLogForm(p => ({...p, work_date: e.target.value}))} required />
          <FormSelect label="Contract Labour" value={contractLabourLogForm.labour_id} onChange={e => setContractLabourLogForm(p => ({...p, labour_id: e.target.value}))} required options={[
            { value: '', label: '-- Select --' },
            ...labours.map(l => ({ value: l.labour_id, label: l.name }))
          ]} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormInput label="Working Hours" type="number" value={contractLabourLogForm.total_working_hours} onChange={e => setContractLabourLogForm(p => ({...p, total_working_hours: e.target.value}))} required />
            <FormInput label="Rate" type="number" value={contractLabourLogForm.rate} onChange={e => setContractLabourLogForm(p => ({...p, rate: e.target.value}))} required />
          </div>
          <FormInput label="Work Description" type="text" value={contractLabourLogForm.work_description} onChange={e => setContractLabourLogForm(p => ({...p, work_description: e.target.value}))} />
          <button type="submit" className="btn btn-primary">Save Labour Log</button>
        </form>
      </Modal>

      <Modal isOpen={isAddMaterialLogOpen} onClose={() => setIsAddMaterialLogOpen(false)} title="Add Material Usage Log">
        <form onSubmit={handleSaveMaterialLog} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <FormInput label="Date" type="date" value={materialLogForm.log_date} onChange={e => setMaterialLogForm(p => ({...p, log_date: e.target.value}))} required />
          <FormSelect label="Material" value={materialLogForm.material_id} onChange={e => setMaterialLogForm(p => ({...p, material_id: e.target.value}))} required options={[
            { value: '', label: '-- Select --' },
            ...materialsMaster.map(m => ({ value: m.material_id, label: m.material_name }))
          ]} />
          <FormInput label="Quantity Used" type="number" step="0.01" value={materialLogForm.quantity} onChange={e => setMaterialLogForm(p => ({...p, quantity: e.target.value}))} required />
          <FormInput label="Notes" type="text" value={materialLogForm.notes} onChange={e => setMaterialLogForm(p => ({...p, notes: e.target.value}))} />
          <button type="submit" className="btn btn-primary">Save Material Log</button>
        </form>
      </Modal>
    </div>
  );
};
