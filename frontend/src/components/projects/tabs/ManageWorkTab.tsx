import React, { useState, useEffect, useRef } from 'react';
import {
  Briefcase, Layers, Plus, ChevronRight, ChevronDown, Clock, Upload, ArrowLeft, Check, X
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest } from '../../../services/api';
import { Project, ProjectWBS, Task, Employee } from '../../../types';
import { showSuccess, showError } from '../../../utils/toast';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { FormInput } from '../../forms/FormInput';
import { FormSelect } from '../../forms/FormSelect';

interface Props {
  projectId: number;
  onNavigate: (path: string) => void;
  canManage: boolean;
}

const getTodayStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const ManageWorkTab: React.FC<Props> = ({ projectId, onNavigate, canManage }) => {

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>(projectId || '');
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
  const [isTaskDropdownOpen, setIsTaskDropdownOpen] = useState(false);
  const taskDropdownRef = useRef<HTMLDivElement>(null);
  const [isLabourDropdownOpen, setIsLabourDropdownOpen] = useState(false);
  const labourDropdownRef = useRef<HTMLDivElement>(null);
  const [isMaterialDropdownOpen, setIsMaterialDropdownOpen] = useState(false);
  const materialDropdownRef = useRef<HTMLDivElement>(null);
  
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
    if (projectId && projectId !== selectedProjectId) {
      setSelectedProjectId(projectId);
    }
  }, [projectId]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (taskDropdownRef.current && !taskDropdownRef.current.contains(e.target as Node)) {
        setIsTaskDropdownOpen(false);
      }
      if (labourDropdownRef.current && !labourDropdownRef.current.contains(e.target as Node)) {
        setIsLabourDropdownOpen(false);
      }
      if (materialDropdownRef.current && !materialDropdownRef.current.contains(e.target as Node)) {
        setIsMaterialDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
      const existingTask = tasks.find(t => 
        (logForm.task_id && String(t.task_id) === String(logForm.task_id)) ||
        (t.task_name.toLowerCase() === logForm.task_name.trim().toLowerCase() && (
          String(t.wbs_id) === String(selectedWbsForLog) ||
          (selectedWbs && String(t.wbs_id) === String(selectedWbs.wbs_id)) ||
          (selectedWbs && String(t.wbs_id) === String(selectedWbs.id))
        ))
      );
      if (existingTask) {
        finalTaskId = existingTask.task_id;
      } else {
        finalTaskName = logForm.task_name.trim();
      }
    }

    let finalLabourId: number | undefined = logForm.labour_id ? Number(logForm.labour_id) : undefined;
    if (!finalLabourId && logForm.labour_name && logForm.labour_name.trim() !== '') {
      const trimmed = logForm.labour_name.trim().toLowerCase();
      const existingLabour = labours.find(l => (l.name || l.labour_name || '').toLowerCase() === trimmed);
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

    let finalMaterialId: number | undefined = logForm.material_id ? Number(logForm.material_id) : undefined;
    if (!finalMaterialId && logForm.material_name && logForm.material_name.trim() !== '') {
      const trimmed = logForm.material_name.trim().toLowerCase();
      const existingMaterial = materials.find(m => (m.material_name || '').toLowerCase() === trimmed);
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
          material_id: '', material_name: '', material_qty: '', material_rate: '', working_hours: '', description: '', log_date: getTodayStr()
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

  const selectedWbs = wbsList.find(w => String(w.id) === String(selectedWbsForLog) || String(w.wbs_id) === String(selectedWbsForLog));
  const availableTasks = tasks.filter(t => {
    if (!selectedWbsForLog) return true;
    return (
      String(t.wbs_id) === String(selectedWbsForLog) ||
      (selectedWbs && String(t.wbs_id) === String(selectedWbs.wbs_id)) ||
      (selectedWbs && String(t.wbs_id) === String(selectedWbs.id))
    );
  });

  const filteredTasks = availableTasks.filter(t => 
    t.task_name.toLowerCase().includes((logForm.task_name || '').toLowerCase()) ||
    (t.task_code && t.task_code.toLowerCase().includes((logForm.task_name || '').toLowerCase()))
  );

  const filteredLabours = labours.filter(l => {
    const term = (logForm.labour_name || '').toLowerCase().trim();
    if (!term) return true;
    const name = (l.name || l.labour_name || '').toLowerCase();
    const type = (l.labour_type || '').toLowerCase();
    const contractor = (l.contractor_name || '').toLowerCase();
    const phone = (l.contact_number || '').toLowerCase();
    return name.includes(term) || type.includes(term) || contractor.includes(term) || phone.includes(term);
  });

  const filteredMaterials = materials.filter(m => {
    const term = (logForm.material_name || '').toLowerCase().trim();
    if (!term) return true;
    return (m.material_name || '').toLowerCase().includes(term);
  });

  return (
    <div style={{ width: '100%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {!isLogWorkOpen && (
        <div className="page-header" style={{ marginBottom: '0.25rem' }}>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.35rem' }}>
              <Briefcase size={22} style={{ color: '#6366f1' }} /> Project Master / Manage Project Work
            </h1>
            <p className="page-subtitle">
              View and manage project work details, WBS allocations, and log time sheets.
            </p>
          </div>
        </div>
      )}

      {!isLogWorkOpen && (
        <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr', gap: '1rem', alignItems: 'center' }}>
          <div>
            <FormSelect 
              label="Project Name"
              value={selectedProjectId} 
              onChange={e => setSelectedProjectId(e.target.value ? Number(e.target.value) : '')}
              options={[
                { value: '', label: 'Select project' },
                ...projects.map(p => ({ value: p.project_id, label: p.project_name }))
              ]}
              style={{ width: '100%', maxWidth: '500px', background: 'var(--bg-card)' }}
            />
          </div>
          <div style={{ background: 'var(--bg-card)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PROJECT REF</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.2rem' }}>{selectedProject ? `PRJ-${new Date(selectedProject.start_date || new Date()).getFullYear()}-${selectedProject.project_id}` : '-'}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{selectedProject?.start_date || '-'}</div>
          </div>
          <div style={{ background: 'var(--bg-card)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CLIENT NAME</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.2rem' }}>{selectedProject?.customer_name || 'test client'}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginTop: '2rem' }}>
          <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-color)' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total WBS</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{totalWbsCount}</div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={20} color="#6366f1" />
            </div>
          </div>
          <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-color)' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total Planned Hours</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{totalPlannedHrs.toLocaleString()} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>hrs</span></div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} color="#10b981" />
            </div>
          </div>
          <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-color)' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total Actual Hours</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{totalActualHrs.toLocaleString()} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>hrs</span></div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Upload size={20} color="#3b82f6" />
            </div>
          </div>
          <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-color)' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Overall Progress</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{overallProgress}%</div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Briefcase size={20} color="#f59e0b" />
            </div>
          </div>
        </div>
      </div>
      )}

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
                            setIsTaskDropdownOpen(false);
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
        <div style={{ maxWidth: '920px', margin: '0 auto', width: '100%' }}>
          {/* Top Context Navigation Bar */}
          <div
            className="glass-card"
            style={{
              marginBottom: '1.25rem',
              padding: '0.85rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsLogWorkOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <ArrowLeft size={14} /> Back to WBS List
              </Button>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                Project: <strong style={{ color: 'var(--text-primary)' }}>{selectedProject?.project_name || 'Project'}</strong>
                {' '}&bull;{' '}
                WBS: <strong style={{ color: 'var(--accent-primary)' }}>{wbsList.find(w => w.id === selectedWbsForLog)?.wbs_name || 'Selected WBS'}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <span>Planned: <strong style={{ color: 'var(--text-primary)' }}>{totalPlannedHrs} hrs</strong></span>
              <span>Logged: <strong style={{ color: 'var(--success)' }}>{totalActualHrs} hrs</strong></span>
            </div>
          </div>

          {/* Log Time Sheet & Work Progress Form Card */}
          <div
            className="glass-card"
            style={{
              width: '100%',
              padding: '1.75rem',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '1rem',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    margin: 0,
                    color: 'var(--text-primary)',
                  }}
                >
                  <Clock size={20} style={{ color: 'var(--success)' }} /> Log Time Sheet & Work Progress
                </h2>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Record actual hours worked and progress under project WBS
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setIsLogWorkOpen(false)}>
                Cancel
              </Button>
            </div>

            <form onSubmit={handleSaveLog} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Row 1: Project Name & WBS Name */}
              <div className="grid-responsive-2">
                <div className="form-group">
                  <label className="form-label">Project Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={selectedProject?.project_name || ''}
                    disabled
                    readOnly
                    style={{
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontWeight: 500,
                      cursor: 'default',
                    }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">WBS Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={wbsList.find(w => w.id === selectedWbsForLog)?.wbs_name || ''}
                    disabled
                    readOnly
                    style={{
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontWeight: 500,
                      cursor: 'default',
                    }}
                  />
                </div>
              </div>

              {/* Row 2: Choose Task Name (optional) */}
              <div className="form-group" ref={taskDropdownRef} style={{ position: 'relative' }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    Choose Task Name <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
                  </span>
                  {availableTasks.length > 0 && (
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      {availableTasks.length} task{availableTasks.length > 1 ? 's' : ''} under this WBS
                    </span>
                  )}
                </label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Search task or type to create new..." 
                    value={logForm.task_name || ''} 
                    onFocus={() => setIsTaskDropdownOpen(true)}
                    onChange={e => {
                      setLogForm(p => ({ ...p, task_name: e.target.value, task_id: '' }));
                      setIsTaskDropdownOpen(true);
                    }} 
                    style={{ paddingRight: '4rem' }}
                  />
                  <div style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {logForm.task_name && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLogForm(p => ({ ...p, task_name: '', task_id: '' }));
                          setIsTaskDropdownOpen(true);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          borderRadius: '4px'
                        }}
                        title="Clear task"
                      >
                        <X size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsTaskDropdownOpen(prev => !prev)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title={isTaskDropdownOpen ? 'Close list' : 'Open task list'}
                    >
                      <ChevronDown size={16} style={{ transform: isTaskDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                  </div>
                </div>

                {/* Responsive Dropdown Menu */}
                {isTaskDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      right: 0,
                      width: '100%',
                      maxHeight: '260px',
                      overflowY: 'auto',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md, 8px)',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.35)',
                      zIndex: 100,
                      padding: '0.4rem 0',
                    }}
                  >
                    {filteredTasks.length > 0 ? (
                      filteredTasks.map((t) => {
                        const isSelected = logForm.task_name === t.task_name;
                        return (
                          <div
                            key={t.task_id}
                            onClick={() => {
                              setLogForm(p => ({ ...p, task_name: t.task_name, task_id: String(t.task_id) }));
                              setIsTaskDropdownOpen(false);
                            }}
                            style={{
                              padding: '0.65rem 1rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.5rem',
                              background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                              borderLeft: isSelected ? '3px solid var(--accent-primary, #6366f1)' : '3px solid transparent',
                              transition: 'background 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)';
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', minWidth: 0 }}>
                              <span style={{ fontSize: '0.88rem', fontWeight: isSelected ? 600 : 500, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                                {t.task_name}
                              </span>
                              {t.task_code && (
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  {t.task_code}
                                </span>
                              )}
                            </div>
                            {isSelected && <Check size={16} style={{ color: 'var(--accent-primary, #6366f1)', flexShrink: 0 }} />}
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {availableTasks.length === 0 ? (
                          <span>No existing tasks under this WBS yet.</span>
                        ) : (
                          <span>No matching tasks found for &ldquo;{logForm.task_name}&rdquo;.</span>
                        )}
                      </div>
                    )}

                    {/* Quick creation option if custom text is typed */}
                    {logForm.task_name && logForm.task_name.trim() !== '' && !filteredTasks.some(t => t.task_name.toLowerCase() === logForm.task_name.trim().toLowerCase()) && (
                      <div
                        onClick={() => {
                          setIsTaskDropdownOpen(false);
                        }}
                        style={{
                          borderTop: '1px solid var(--border-color)',
                          padding: '0.65rem 1rem',
                          background: 'rgba(16, 185, 129, 0.08)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          color: 'var(--success, #10b981)',
                          fontSize: '0.84rem',
                          fontWeight: 500,
                        }}
                      >
                        <Plus size={15} />
                        <span>Create new task: <strong>&ldquo;{logForm.task_name.trim()}&rdquo;</strong></span>
                      </div>
                    )}
                  </div>
                )}
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  * Select an existing task or type a new name to automatically create it under Project + WBS.
                </div>
              </div>

              {/* Row 3: Employee Name & Labour / Contractor Name */}
              <div className="grid-responsive-2">
                <div className="form-group">
                  <label className="form-label">Employee Name</label>
                  <select
                    className="form-select"
                    value={logForm.employee_id || ''}
                    onChange={e => setLogForm(p => ({ ...p, employee_id: e.target.value }))}
                  >
                    <option value="">-- Select Employee --</option>
                    {employees.map(emp => (
                      <option key={emp.employee_id} value={emp.employee_id}>{emp.full_name || emp.name}</option>
                    ))}
                  </select>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    * Required if logging Employee time.
                  </div>
                </div>

                <div className="form-group" ref={labourDropdownRef} style={{ position: 'relative' }}>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      Labour / Contractor Name <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
                    </span>
                    {labours.length > 0 && (
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                        {labours.length} available
                      </span>
                    )}
                  </label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Search labour or type to add new..." 
                      value={logForm.labour_name || ''} 
                      onFocus={() => setIsLabourDropdownOpen(true)}
                      onChange={e => {
                        setLogForm(p => ({ ...p, labour_name: e.target.value, labour_id: '' }));
                        setIsLabourDropdownOpen(true);
                      }} 
                      style={{ paddingRight: '4rem' }}
                    />
                    <div style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {logForm.labour_name && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLogForm(p => ({ ...p, labour_name: '', labour_id: '' }));
                            setIsLabourDropdownOpen(true);
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: '4px'
                          }}
                          title="Clear labour"
                        >
                          <X size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsLabourDropdownOpen(prev => !prev)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title={isLabourDropdownOpen ? 'Close list' : 'Open labour list'}
                      >
                        <ChevronDown size={16} style={{ transform: isLabourDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                      </button>
                    </div>
                  </div>

                  {/* Responsive Labour / Contractor Dropdown Menu */}
                  {isLabourDropdownOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        width: '100%',
                        maxHeight: '260px',
                        overflowY: 'auto',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md, 8px)',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.35)',
                        zIndex: 100,
                        padding: '0.4rem 0',
                      }}
                    >
                      {filteredLabours.length > 0 ? (
                        filteredLabours.map((l) => {
                          const displayName = l.name || l.labour_name || '';
                          const isSelected = logForm.labour_name === displayName || (logForm.labour_id && String(logForm.labour_id) === String(l.labour_id));
                          const isContractor = l.labour_type === 'contractor';
                          return (
                            <div
                              key={l.labour_id}
                              onClick={() => {
                                setLogForm(p => ({ ...p, labour_name: displayName, labour_id: String(l.labour_id) }));
                                setIsLabourDropdownOpen(false);
                              }}
                              style={{
                                padding: '0.65rem 1rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '0.5rem',
                                background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                borderLeft: isSelected ? '3px solid var(--accent-primary, #6366f1)' : '3px solid transparent',
                                transition: 'background 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)';
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) e.currentTarget.style.background = 'transparent';
                              }}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: '0.88rem', fontWeight: isSelected ? 600 : 500, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                                    {displayName}
                                  </span>
                                  <span style={{
                                    fontSize: '0.7rem',
                                    padding: '0.12rem 0.45rem',
                                    borderRadius: '4px',
                                    fontWeight: 600,
                                    background: isContractor ? 'rgba(59, 130, 246, 0.18)' : 'rgba(16, 185, 129, 0.18)',
                                    color: isContractor ? '#60a5fa' : '#34d399',
                                    textTransform: 'capitalize'
                                  }}>
                                    {isContractor ? 'Contractor' : 'Direct Labour'}
                                  </span>
                                </div>
                                {(l.contractor_name || l.contact_number) && (
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                    {l.contractor_name ? `Contractor: ${l.contractor_name}` : ''}
                                    {l.contractor_name && l.contact_number ? ' • ' : ''}
                                    {l.contact_number ? `Phone: ${l.contact_number}` : ''}
                                  </span>
                                )}
                              </div>
                              {isSelected && <Check size={16} style={{ color: 'var(--accent-primary, #6366f1)', flexShrink: 0 }} />}
                            </div>
                          );
                        })
                      ) : (
                        <div style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {labours.length === 0 ? (
                            <span>No labour or contractor records found.</span>
                          ) : (
                            <span>No matching labour/contractor found for &ldquo;{logForm.labour_name}&rdquo;.</span>
                          )}
                        </div>
                      )}

                      {/* Quick creation option if custom text is typed */}
                      {logForm.labour_name && logForm.labour_name.trim() !== '' && !filteredLabours.some(l => (l.name || l.labour_name || '').toLowerCase() === logForm.labour_name.trim().toLowerCase()) && (
                        <div
                          onClick={() => {
                            setIsLabourDropdownOpen(false);
                          }}
                          style={{
                            borderTop: '1px solid var(--border-color)',
                            padding: '0.65rem 1rem',
                            background: 'rgba(16, 185, 129, 0.08)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: 'var(--success, #10b981)',
                            fontSize: '0.84rem',
                            fontWeight: 500,
                          }}
                        >
                          <Plus size={15} />
                          <span>Create new labour: <strong>&ldquo;{logForm.labour_name.trim()}&rdquo;</strong></span>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    * If new labour name is typed, it will be created.
                  </div>
                </div>
              </div>

              {/* Row 4: Log Date * & Work HRs. * */}
              <div className="grid-responsive-2">
                <FormInput
                  label="Log Date *"
                  type="date"
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
                />
                <FormInput
                  label="Work HRs. *"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={logForm.working_hours}
                  onChange={e => setLogForm(p => ({ ...p, working_hours: e.target.value }))}
                  required
                  placeholder="e.g. 6"
                />
              </div>

              {/* Row 5: Material Details */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>Material Details</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
                </div>
                <div className="grid-responsive-materials">
                  <div className="form-group" ref={materialDropdownRef} style={{ position: 'relative' }}>
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Material Name</span>
                      {materials.length > 0 && (
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                          {materials.length} available
                        </span>
                      )}
                    </label>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Search material or type to add new..." 
                        value={logForm.material_name || ''} 
                        onFocus={() => setIsMaterialDropdownOpen(true)}
                        onChange={e => {
                          setLogForm(p => ({ ...p, material_name: e.target.value, material_id: '' }));
                          setIsMaterialDropdownOpen(true);
                        }} 
                        style={{ paddingRight: '4rem' }}
                      />
                      <div style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {logForm.material_name && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLogForm(p => ({ ...p, material_name: '', material_id: '' }));
                              setIsMaterialDropdownOpen(true);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              borderRadius: '4px'
                            }}
                            title="Clear material"
                          >
                            <X size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsMaterialDropdownOpen(prev => !prev)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title={isMaterialDropdownOpen ? 'Close list' : 'Open material list'}
                        >
                          <ChevronDown size={16} style={{ transform: isMaterialDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                        </button>
                      </div>
                    </div>

                    {/* Responsive Material Dropdown Menu */}
                    {isMaterialDropdownOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 4px)',
                          left: 0,
                          right: 0,
                          width: '100%',
                          maxHeight: '220px',
                          overflowY: 'auto',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md, 8px)',
                          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.35)',
                          zIndex: 100,
                          padding: '0.4rem 0',
                        }}
                      >
                        {filteredMaterials.length > 0 ? (
                          filteredMaterials.map((m) => {
                            const isSelected = logForm.material_name === m.material_name || (logForm.material_id && String(logForm.material_id) === String(m.material_id));
                            return (
                              <div
                                key={m.material_id}
                                onClick={() => {
                                  setLogForm(p => ({ 
                                    ...p, 
                                    material_name: m.material_name, 
                                    material_id: String(m.material_id),
                                    material_rate: m.standard_rate ? String(m.standard_rate) : p.material_rate
                                  }));
                                  setIsMaterialDropdownOpen(false);
                                }}
                                style={{
                                  padding: '0.65rem 1rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '0.5rem',
                                  background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                  borderLeft: isSelected ? '3px solid var(--accent-primary, #6366f1)' : '3px solid transparent',
                                  transition: 'background 0.15s ease',
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)';
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                                }}
                              >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                  <span style={{ fontSize: '0.88rem', fontWeight: isSelected ? 600 : 500, color: 'var(--text-primary)' }}>
                                    {m.material_name}
                                  </span>
                                  {m.unit && (
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                      Unit: {m.unit} {m.standard_rate ? `• Std Rate: ₹${m.standard_rate}` : ''}
                                    </span>
                                  )}
                                </div>
                                {isSelected && <Check size={16} style={{ color: 'var(--accent-primary, #6366f1)', flexShrink: 0 }} />}
                              </div>
                            );
                          })
                        ) : (
                          <div style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            {materials.length === 0 ? (
                              <span>No materials in master.</span>
                            ) : (
                              <span>No matching material found for &ldquo;{logForm.material_name}&rdquo;.</span>
                            )}
                          </div>
                        )}

                        {/* Quick create option if typed custom material */}
                        {logForm.material_name && logForm.material_name.trim() !== '' && !filteredMaterials.some(m => (m.material_name || '').toLowerCase() === logForm.material_name.trim().toLowerCase()) && (
                          <div
                            onClick={() => {
                              setIsMaterialDropdownOpen(false);
                            }}
                            style={{
                              borderTop: '1px solid var(--border-color)',
                              padding: '0.65rem 1rem',
                              background: 'rgba(16, 185, 129, 0.08)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              color: 'var(--success, #10b981)',
                              fontSize: '0.84rem',
                              fontWeight: 500,
                            }}
                          >
                            <Plus size={15} />
                            <span>Create new material: <strong>&ldquo;{logForm.material_name.trim()}&rdquo;</strong></span>
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      * If new material name is typed, it will be created.
                    </div>
                  </div>

                  <FormInput
                    label="Material Qty"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={logForm.material_qty}
                    onChange={e => setLogForm(p => ({ ...p, material_qty: e.target.value }))}
                  />

                  <FormInput
                    label="Material Rate"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={logForm.material_rate}
                    onChange={e => setLogForm(p => ({ ...p, material_rate: e.target.value }))}
                  />
                </div>
              </div>

              {/* Row 6: Description / Comments */}
              <div className="form-group" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                <label className="form-label">
                  Description / Comments <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
                </label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={logForm.description || ''}
                  onChange={e => setLogForm(p => ({ ...p, description: e.target.value }))}
                  style={{ width: '100%', resize: 'vertical', minHeight: '80px' }}
                  placeholder="Add any details about the work done here..."
                />
              </div>

              {/* Row 7: Actions */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginTop: '1.25rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-color)',
                  flexWrap: 'wrap',
                }}
              >
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsLogWorkOpen(false)}
                  style={{ minWidth: '100px' }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  style={{
                    minWidth: '130px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <Clock size={16} /> Save Log
                </Button>
              </div>
            </form>
          </div>
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
