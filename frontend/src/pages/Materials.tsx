import React, { useEffect, useState } from 'react';
import { Plus, Search, Package, Edit, Trash2, Layers, Download, Upload, History, FileText, ArrowRight, CheckCircle2, AlertTriangle, IndianRupee } from 'lucide-react';
import { apiRequest } from '../services/api';
import { Modal } from '../components/common/Modal';
import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { showSuccess, showError } from '../utils/toast';
import { Project, ProjectWBS, ProjectMaterial, ProjectMaterialLog } from '../types';

interface MaterialMaster {
  material_id: number;
  material_code: string;
  material_name: string;
  category: string | null;
  description: string | null;
  unit: string;
  brand_spec: string | null;
  status: 'active' | 'inactive';
}

export interface MaterialsProps {
  projectId?: number;
  isMasterOnly?: boolean;
  onNavigate?: (page: string) => void;
}

export const Materials: React.FC<MaterialsProps> = ({ projectId, isMasterOnly, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'project_materials' | 'master'>(isMasterOnly ? 'master' : 'project_materials');

  useEffect(() => {
    if (isMasterOnly) {
      setActiveTab('master');
    }
  }, [isMasterOnly]);

  // Master Materials State
  const [searchQuery, setSearchQuery] = useState('');
  const [materials, setMaterials] = useState<MaterialMaster[]>([]);
  const [isLoadingMaster, setIsLoadingMaster] = useState(false);
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [editingMaster, setEditingMaster] = useState<MaterialMaster | null>(null);
  const [masterFormData, setMasterFormData] = useState({
    material_code: '',
    material_name: '',
    category: '',
    description: '',
    unit: 'Nos',
    brand_spec: '',
    status: 'active'
  });
  const [isSubmittingMaster, setIsSubmittingMaster] = useState(false);

  // Project Material Tracking State (Project -> Material WBS -> Material -> Quantity -> Cost)
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>(projectId || '');

  useEffect(() => {
    if (projectId) {
      setSelectedProjectId(projectId);
    }
  }, [projectId]);
  const [materialWbsList, setMaterialWbsList] = useState<ProjectWBS[]>([]);
  const [selectedWbsId, setSelectedWbsId] = useState<number | ''>('');
  const [projectMaterials, setProjectMaterials] = useState<ProjectMaterial[]>([]);
  const [isLoadingProjectMaterials, setIsLoadingProjectMaterials] = useState(false);

  // Add/Edit Project Material Modal State
  const [isProjectMaterialModalOpen, setIsProjectMaterialModalOpen] = useState(false);
  const [editingProjectMaterial, setEditingProjectMaterial] = useState<ProjectMaterial | null>(null);
  const [projectMaterialForm, setProjectMaterialForm] = useState({
    material_id: '',
    material_name: '',
    unit: 'Nos',
    planned_quantity: 10,
    unit_rate: 0,
    notes: ''
  });
  const [isSubmittingProjectMaterial, setIsSubmittingProjectMaterial] = useState(false);

  // Log Material Receipt / Usage Modal State
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [loggingMaterial, setLoggingMaterial] = useState<ProjectMaterial | null>(null);
  const [logActionType, setLogActionType] = useState<'received' | 'used'>('received');
  const [logFormData, setLogFormData] = useState({
    quantity: 1,
    unit_cost: 0,
    log_date: new Date().toISOString().split('T')[0],
    challan_or_invoice_no: '',
    notes: ''
  });
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);

  // Transaction History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyMaterial, setHistoryMaterial] = useState<ProjectMaterial | null>(null);
  const [materialLogs, setMaterialLogs] = useState<ProjectMaterialLog[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Load Projects & Master Materials initially
  useEffect(() => {
    fetchProjects();
    fetchMaterials();
  }, []);

  // When projects load, default select the first one
  const fetchProjects = async () => {
    const res = await apiRequest<Project[]>('/projects');
    if (res.success && res.data) {
      setProjects(res.data);
      if (res.data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(res.data[0].project_id);
      }
    }
  };

  const fetchMaterials = async () => {
    setIsLoadingMaster(true);
    const res = await apiRequest<MaterialMaster[]>(`/materials/master${searchQuery ? `?search=${searchQuery}` : ''}`);
    if (res.success && res.data) {
      setMaterials(res.data);
    }
    setIsLoadingMaster(false);
  };

  useEffect(() => {
    if (activeTab === 'master') {
      fetchMaterials();
    }
  }, [searchQuery, activeTab]);

  // When selected project changes, fetch its Material WBS list
  useEffect(() => {
    if (selectedProjectId) {
      fetchMaterialWbs(Number(selectedProjectId));
    } else {
      setMaterialWbsList([]);
      setSelectedWbsId('');
      setProjectMaterials([]);
    }
  }, [selectedProjectId]);

  const fetchMaterialWbs = async (pId: number) => {
    const res = await apiRequest<ProjectWBS[]>(`/projects/${pId}/wbs?wbs_type=material`);
    if (res.success && res.data) {
      // Strictly filter to Material WBS
      const matWbs = res.data.filter((w) => (w.wbs_type || 'material') === 'material');
      setMaterialWbsList(matWbs);
      if (matWbs.length > 0) {
        setSelectedWbsId(matWbs[0].id);
      } else {
        setSelectedWbsId('');
        setProjectMaterials([]);
      }
    }
  };

  // When selected project or Material WBS changes, fetch project materials
  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectMaterials(Number(selectedProjectId), selectedWbsId ? Number(selectedWbsId) : undefined);
    }
  }, [selectedProjectId, selectedWbsId]);

  const fetchProjectMaterials = async (pId: number, wbsId?: number) => {
    setIsLoadingProjectMaterials(true);
    let url = `/materials/project-materials?project_id=${pId}`;
    if (wbsId) url += `&project_wbs_id=${wbsId}`;
    const res = await apiRequest<ProjectMaterial[]>(url);
    if (res.success && res.data) {
      setProjectMaterials(res.data);
    } else {
      setProjectMaterials([]);
    }
    setIsLoadingProjectMaterials(false);
  };

  // --- Handlers for Project Materials ---
  const openAddProjectMaterialModal = () => {
    if (!selectedWbsId) {
      showError('Please select a Material WBS / Discipline first.');
      return;
    }
    setEditingProjectMaterial(null);
    setProjectMaterialForm({
      material_id: '',
      material_name: '',
      unit: 'Nos',
      planned_quantity: 10,
      unit_rate: 0,
      notes: ''
    });
    setIsProjectMaterialModalOpen(true);
  };

  const openEditProjectMaterialModal = (item: ProjectMaterial) => {
    setEditingProjectMaterial(item);
    setProjectMaterialForm({
      material_id: item.material_id ? String(item.material_id) : '',
      material_name: item.material_name,
      unit: item.unit || 'Nos',
      planned_quantity: Number(item.planned_quantity || 0),
      unit_rate: Number(item.unit_rate || 0),
      notes: item.notes || ''
    });
    setIsProjectMaterialModalOpen(true);
  };

  const handleSaveProjectMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !selectedWbsId) return;
    if (!projectMaterialForm.material_name.trim()) {
      showError('Material name is required');
      return;
    }

    setIsSubmittingProjectMaterial(true);
    const payload = {
      project_id: Number(selectedProjectId),
      project_wbs_id: Number(selectedWbsId),
      material_id: projectMaterialForm.material_id ? Number(projectMaterialForm.material_id) : null,
      material_name: projectMaterialForm.material_name.trim(),
      unit: projectMaterialForm.unit || 'Nos',
      planned_quantity: Number(projectMaterialForm.planned_quantity || 0),
      unit_rate: Number(projectMaterialForm.unit_rate || 0),
      notes: projectMaterialForm.notes || undefined
    };

    const endpoint = editingProjectMaterial ? `/materials/project-materials/${editingProjectMaterial.id}` : '/materials/project-materials';
    const method = editingProjectMaterial ? 'PUT' : 'POST';

    const res = await apiRequest(endpoint, { method, body: JSON.stringify(payload) });
    setIsSubmittingProjectMaterial(false);

    if (res.success) {
      showSuccess(`Project material ${editingProjectMaterial ? 'updated' : 'added'} successfully.`);
      setIsProjectMaterialModalOpen(false);
      fetchProjectMaterials(Number(selectedProjectId), Number(selectedWbsId));
    } else {
      showError(res.message || 'Failed to save project material.');
    }
  };

  const handleDeleteProjectMaterial = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this material from the project WBS?')) return;
    const res = await apiRequest(`/materials/project-materials/${id}`, { method: 'DELETE' });
    if (res.success) {
      showSuccess('Material removed from project WBS.');
      if (selectedProjectId) {
        fetchProjectMaterials(Number(selectedProjectId), selectedWbsId ? Number(selectedWbsId) : undefined);
      }
    } else {
      showError(res.message || 'Failed to delete project material.');
    }
  };

  // --- Handlers for Logging Receipt / Usage ---
  const openLogModal = (item: ProjectMaterial, action: 'received' | 'used') => {
    setLoggingMaterial(item);
    setLogActionType(action);
    setLogFormData({
      quantity: 1,
      unit_cost: Number(item.unit_rate || 0),
      log_date: new Date().toISOString().split('T')[0],
      challan_or_invoice_no: '',
      notes: ''
    });
    setIsLogModalOpen(true);
  };

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggingMaterial) return;
    if (Number(logFormData.quantity) <= 0) {
      showError('Quantity must be greater than 0');
      return;
    }

    setIsSubmittingLog(true);
    const payload = {
      action_type: logActionType,
      quantity: Number(logFormData.quantity),
      unit_cost: Number(logFormData.unit_cost) || Number(loggingMaterial.unit_rate) || 0,
      log_date: logFormData.log_date,
      challan_or_invoice_no: logFormData.challan_or_invoice_no || undefined,
      notes: logFormData.notes || undefined
    };

    const res = await apiRequest(`/materials/project-materials/${loggingMaterial.id}/log`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setIsSubmittingLog(false);

    if (res.success) {
      showSuccess(`Material ${logActionType === 'received' ? 'receipt' : 'usage'} logged successfully.`);
      setIsLogModalOpen(false);
      if (selectedProjectId) {
        fetchProjectMaterials(Number(selectedProjectId), selectedWbsId ? Number(selectedWbsId) : undefined);
      }
    } else {
      showError(res.message || 'Failed to log material transaction.');
    }
  };

  // --- Handlers for Transaction Logs History ---
  const openHistoryModal = async (item: ProjectMaterial) => {
    setHistoryMaterial(item);
    setIsHistoryModalOpen(true);
    setIsLoadingHistory(true);
    const res = await apiRequest<ProjectMaterialLog[]>(`/materials/project-materials/${item.id}/logs`);
    if (res.success && res.data) {
      setMaterialLogs(res.data);
    } else {
      setMaterialLogs([]);
    }
    setIsLoadingHistory(false);
  };

  // --- Master Material Handlers ---
  const openCreateMasterModal = () => {
    setEditingMaster(null);
    setMasterFormData({
      material_code: '',
      material_name: '',
      category: '',
      description: '',
      unit: 'Nos',
      brand_spec: '',
      status: 'active'
    });
    setIsMasterModalOpen(true);
  };

  const openEditMasterModal = (mat: MaterialMaster) => {
    setEditingMaster(mat);
    setMasterFormData({
      material_code: mat.material_code,
      material_name: mat.material_name,
      category: mat.category || '',
      description: mat.description || '',
      unit: mat.unit || 'Nos',
      brand_spec: mat.brand_spec || '',
      status: mat.status || 'active'
    });
    setIsMasterModalOpen(true);
  };

  const handleSaveMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingMaster(true);
    const endpoint = editingMaster ? `/materials/master/${editingMaster.material_id}` : '/materials/master';
    const method = editingMaster ? 'PUT' : 'POST';

    const res = await apiRequest(endpoint, { method, body: JSON.stringify(masterFormData) });
    setIsSubmittingMaster(false);

    if (res.success) {
      showSuccess(`Master material ${editingMaster ? 'updated' : 'created'} successfully.`);
      setIsMasterModalOpen(false);
      fetchMaterials();
    } else {
      showError(res.message || 'Failed to save master material.');
    }
  };

  const handleDeleteMaster = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this master material?')) return;
    const res = await apiRequest(`/materials/master/${id}`, { method: 'DELETE' });
    if (res.success) {
      showSuccess('Master material deleted successfully.');
      fetchMaterials();
    } else {
      showError(res.message || 'Failed to delete master material.');
    }
  };

  // Metrics for Project Materials
  const totalPlannedCost = projectMaterials.reduce((sum, m) => sum + Number(m.planned_cost || 0), 0);
  const totalActualCost = projectMaterials.reduce((sum, m) => sum + Number(m.actual_cost || 0), 0);
  const totalRemainingCost = projectMaterials.reduce((sum, m) => sum + Number(m.remaining_cost || 0), 0);

  const selectedProjectObj = projects.find((p) => p.project_id === Number(selectedProjectId));
  const selectedWbsObj = materialWbsList.find((w) => Number(w.id) === Number(selectedWbsId));

  return (
    <div style={{ padding: isMasterOnly ? '0.25rem 0 1rem 0' : '1.5rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Page Header */}
      {!isMasterOnly && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.65rem', margin: 0 }}>
              <Package color="#a855f7" size={26} />
              Material Management
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.85rem' }}>
              Track material usage and costs against Project Material WBS / Disciplines, and manage master materials.
            </p>
          </div>

          {/* View Switcher */}
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--border-color)', padding: '0.35rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={() => setActiveTab('project_materials')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '7px',
                fontSize: '0.85rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: activeTab === 'project_materials' ? 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)' : 'transparent',
                color: activeTab === 'project_materials' ? '#ffffff' : 'var(--text-secondary)'
              }}
            >
              <Layers size={15} /> 1. Project Material WBS Tracking
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('master')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '7px',
                fontSize: '0.85rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: activeTab === 'master' ? 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)' : 'transparent',
                color: activeTab === 'master' ? '#ffffff' : 'var(--text-secondary)'
              }}
            >
              <Package size={15} /> 2. Material Master Catalog
            </button>
          </div>
        </div>
      )}

      {activeTab === 'project_materials' ? (
        /* TAB 1: Project Material Tracking */
        <div>
          {/* Project & Material WBS Selector Bar */}
          <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.25rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', flex: 1, minWidth: '320px' }}>
              <div style={{ minWidth: '260px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Select Project
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : '')}
                  className="form-select"
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 600 }}
                >
                  <option value="">-- Choose Project --</option>
                  {projects.map((p) => (
                    <option key={p.project_id} value={p.project_id}>
                      {p.project_name} ({p.project_code || `PRJ-${p.project_id}`})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ minWidth: '300px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Select Material WBS / Discipline (Only Material WBS)
                </label>
                <select
                  value={selectedWbsId}
                  onChange={(e) => setSelectedWbsId(e.target.value ? Number(e.target.value) : '')}
                  className="form-select"
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 600 }}
                >
                  <option value="">-- All Material WBS --</option>
                  {materialWbsList.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.wbs_name} ({w.wbs_code || `WBS-${w.id}`}) — Qty: {w.planned_quantity || 0} {w.unit || 'nos'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedWbsId && (
              <Button variant="primary" onClick={openAddProjectMaterialModal} style={{ background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)', border: 'none' }}>
                <Plus size={16} style={{ marginRight: '0.35rem' }} /> Add Material to WBS
              </Button>
            )}
          </div>

          {/* Metric Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '1.1rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block' }}>Total Planned Cost</span>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                ₹ {totalPlannedCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span style={{ fontSize: '0.72rem', color: '#c084fc', marginTop: '0.2rem', display: 'block' }}>
                {projectMaterials.length} material item(s) budgeted
              </span>
            </div>

            <div className="glass-card" style={{ padding: '1.1rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600, display: 'block' }}>Total Actual / Used Cost</span>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#10b981', marginTop: '0.2rem' }}>
                ₹ {totalActualCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                Consumed material expenditure
              </span>
            </div>

            <div className="glass-card" style={{ padding: '1.1rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 600, display: 'block' }}>Total Remaining Budget</span>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.2rem' }}>
                ₹ {totalRemainingCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                Remaining planned budget
              </span>
            </div>

            <div className="glass-card" style={{ padding: '1.1rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 600, display: 'block' }}>Material WBS Context</span>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedWbsObj ? selectedWbsObj.wbs_name : 'All Material Disciplines'}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem', display: 'block' }}>
                Project: {selectedProjectObj?.project_code || 'N/A'}
              </span>
            </div>
          </div>

          {/* Project Materials Tracking Table */}
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '12px' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Package size={17} color="#a855f7" /> Material Usage & Quantity Tracking (Project → Material WBS → Material)
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Track Planned, Received, Used, Remaining, Extra quantities and unit costs.
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%', fontSize: '0.84rem', margin: 0 }}>
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Material Name</th>
                    <th>WBS Discipline</th>
                    <th>Unit</th>
                    <th>Plan Qty</th>
                    <th>Recv Qty</th>
                    <th>Used Qty</th>
                    <th>Rem Qty</th>
                    <th>Extra Qty</th>
                    <th>Unit Rate</th>
                    <th>Plan Cost</th>
                    <th>Act Cost</th>
                    <th>Rem Cost</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingProjectMaterials ? (
                    <tr><td colSpan={14} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>Loading project materials...</td></tr>
                  ) : projectMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={14} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <Package size={32} style={{ opacity: 0.4, margin: '0 auto 0.5rem auto' }} />
                        <div>No materials found for this project & Material WBS.</div>
                        <div style={{ fontSize: '0.78rem', marginTop: '0.25rem' }}>Click "+ Add Material to WBS" above to start tracking quantities and costs.</div>
                      </td>
                    </tr>
                  ) : (
                    projectMaterials.map((mat, idx) => {
                      const plannedQ = Number(mat.planned_quantity || 0);
                      const receivedQ = Number(mat.received_quantity || 0);
                      const usedQ = Number(mat.used_quantity || 0);
                      const remainingQ = Number(mat.remaining_quantity || 0);
                      const extraQ = Number(mat.extra_quantity || 0);
                      const rate = Number(mat.unit_rate || 0);
                      const pCost = Number(mat.planned_cost || 0);
                      const aCost = Number(mat.actual_cost || 0);
                      const rCost = Number(mat.remaining_cost || 0);

                      return (
                        <tr key={mat.id}>
                          <td>{idx + 1}</td>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{mat.material_name}</div>
                            {mat.material_code && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{mat.material_code}</div>}
                          </td>
                          <td>
                            <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(168, 85, 247, 0.12)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.25)', fontWeight: 600 }}>
                              {mat.wbs_name || 'Material WBS'}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>{mat.unit || 'Nos'}</td>
                          <td style={{ fontWeight: 700 }}>{plannedQ}</td>
                          <td style={{ fontWeight: 700, color: '#38bdf8' }}>{receivedQ}</td>
                          <td style={{ fontWeight: 700, color: '#10b981' }}>{usedQ}</td>
                          <td style={{ fontWeight: 600, color: remainingQ === 0 ? '#10b981' : 'var(--text-primary)' }}>{remainingQ}</td>
                          <td>
                            {extraQ > 0 ? (
                              <span style={{ padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontWeight: 700, fontSize: '0.75rem' }}>
                                +{extraQ}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>0</span>
                            )}
                          </td>
                          <td>₹ {rate.toFixed(2)}</td>
                          <td style={{ fontWeight: 700 }}>₹ {pCost.toFixed(2)}</td>
                          <td style={{ fontWeight: 700, color: '#10b981' }}>₹ {aCost.toFixed(2)}</td>
                          <td style={{ fontWeight: 700, color: '#f59e0b' }}>₹ {rCost.toFixed(2)}</td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                              <button
                                type="button"
                                onClick={() => openLogModal(mat, 'received')}
                                title="Log Received / Purchased Material"
                                style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                              >
                                <Download size={12} /> Receive
                              </button>
                              <button
                                type="button"
                                onClick={() => openLogModal(mat, 'used')}
                                title="Log Consumed / Used Material"
                                style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                              >
                                <Upload size={12} /> Use
                              </button>
                              <button
                                type="button"
                                onClick={() => openHistoryModal(mat)}
                                title="View Receipt & Usage History"
                                style={{ padding: '0.25rem 0.45rem', borderRadius: '6px', fontSize: '0.72rem', background: 'var(--border-color)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', cursor: 'pointer' }}
                              >
                                <History size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditProjectMaterialModal(mat)}
                                title="Edit Budget"
                                style={{ padding: '0.25rem 0.45rem', borderRadius: '6px', fontSize: '0.72rem', background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.25)', cursor: 'pointer' }}
                              >
                                <Edit size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProjectMaterial(mat.id)}
                                title="Remove Material"
                                style={{ padding: '0.25rem 0.45rem', borderRadius: '6px', fontSize: '0.72rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.25)', cursor: 'pointer' }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* TAB 2: Material Master Catalog */
        <div className="glass-card" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search master materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '0.7rem 1rem 0.7rem 2.75rem', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              />
            </div>
            <Button variant="primary" onClick={openCreateMasterModal} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)', border: 'none' }}>
              <Plus size={18} /> Add Master Material
            </Button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Code</th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Name & Category</th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>UOM</th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Status</th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingMaster ? (
                  <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }}>Loading materials...</td></tr>
                ) : materials.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No materials found</td></tr>
                ) : (
                  materials.map((mat) => (
                    <tr key={mat.material_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem 1.5rem', color: 'var(--text-primary)', fontWeight: 500 }}>{mat.material_code}</td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{mat.material_name}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{mat.category || 'No Category'}</div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>{mat.unit}</td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, background: mat.status === 'active' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: mat.status === 'active' ? '#22c55e' : '#ef4444' }}>
                          {mat.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <Button variant="secondary" onClick={() => openEditMasterModal(mat)} style={{ padding: '0.4rem', color: '#6366f1' }}>
                            <Edit size={16} />
                          </Button>
                          <Button variant="secondary" onClick={() => handleDeleteMaster(mat.material_id)} style={{ padding: '0.4rem', color: '#ef4444' }}>
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Add / Edit Project Material */}
      <Modal
        isOpen={isProjectMaterialModalOpen}
        onClose={() => setIsProjectMaterialModalOpen(false)}
        title={editingProjectMaterial ? `Edit Project Material (${editingProjectMaterial.material_name})` : 'Add Material to Material WBS'}
      >
        <form onSubmit={handleSaveProjectMaterial} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'rgba(168, 85, 247, 0.08)', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(168, 85, 247, 0.25)', fontSize: '0.82rem' }}>
            <div><strong>Project:</strong> {selectedProjectObj?.project_name}</div>
            <div style={{ marginTop: '0.2rem' }}><strong>Material WBS:</strong> {selectedWbsObj?.wbs_name}</div>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
              Material Name *
            </label>
            <input
              type="text"
              list="master-materials-dropdown"
              className="form-input"
              required
              placeholder="Select from Master or type custom material..."
              value={projectMaterialForm.material_name}
              onChange={(e) => {
                const val = e.target.value;
                const match = materials.find((m) => m.material_name.toLowerCase() === val.toLowerCase());
                if (match) {
                  setProjectMaterialForm({
                    ...projectMaterialForm,
                    material_name: match.material_name,
                    material_id: String(match.material_id),
                    unit: match.unit || 'Nos'
                  });
                } else {
                  setProjectMaterialForm({ ...projectMaterialForm, material_name: val, material_id: '' });
                }
              }}
            />
            <datalist id="master-materials-dropdown">
              {materials.map((m) => (
                <option key={m.material_id} value={m.material_name}>
                  {m.material_code} ({m.unit})
                </option>
              ))}
            </datalist>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormInput
              label="Planned Quantity *"
              type="number"
              step="any"
              min="0.1"
              required
              value={String(projectMaterialForm.planned_quantity)}
              onChange={(e) => setProjectMaterialForm({ ...projectMaterialForm, planned_quantity: Number(e.target.value) })}
            />
            <FormInput
              label="Unit of Measure"
              value={projectMaterialForm.unit}
              onChange={(e) => setProjectMaterialForm({ ...projectMaterialForm, unit: e.target.value })}
              placeholder="e.g. Bags, Tons, Nos, Sqft"
            />
          </div>

          <FormInput
            label="Estimated Unit Rate (₹) *"
            type="number"
            step="any"
            min="0"
            required
            value={String(projectMaterialForm.unit_rate)}
            onChange={(e) => setProjectMaterialForm({ ...projectMaterialForm, unit_rate: Number(e.target.value) })}
          />

          <div style={{ background: 'rgba(34, 197, 94, 0.08)', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Planned Budget:</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>
              ₹ {(Number(projectMaterialForm.planned_quantity || 0) * Number(projectMaterialForm.unit_rate || 0)).toFixed(2)}
            </span>
          </div>

          <FormInput
            label="Notes / Specification"
            value={projectMaterialForm.notes}
            onChange={(e) => setProjectMaterialForm({ ...projectMaterialForm, notes: e.target.value })}
            placeholder="Grade, brand, supplier notes..."
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsProjectMaterialModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isSubmittingProjectMaterial} style={{ background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)', border: 'none' }}>
              {isSubmittingProjectMaterial ? 'Saving...' : editingProjectMaterial ? 'Update Material' : 'Add Material'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Log Material Receipt / Usage */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title={logActionType === 'received' ? `Receive / Purchase Material (${loggingMaterial?.material_name})` : `Log Material Usage (${loggingMaterial?.material_name})`}
      >
        <form onSubmit={handleSaveLog} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: logActionType === 'received' ? 'rgba(56, 189, 248, 0.08)' : 'rgba(16, 185, 129, 0.08)', padding: '0.75rem', borderRadius: '8px', border: `1px solid ${logActionType === 'received' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(16, 185, 129, 0.25)'}` }}>
            <div style={{ fontWeight: 700, color: logActionType === 'received' ? '#38bdf8' : '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
              {logActionType === 'received' ? <Download size={16} /> : <Upload size={16} />}
              {logActionType === 'received' ? 'RECEIVE / PURCHASE SHIPMENT' : 'RECORD ACTUAL SITE USAGE'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Material: <strong>{loggingMaterial?.material_name}</strong> | Unit: {loggingMaterial?.unit}
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', marginTop: '0.35rem' }}>
              <span>Planned: <strong>{loggingMaterial?.planned_quantity}</strong></span>
              <span>Received: <strong>{loggingMaterial?.received_quantity}</strong></span>
              <span>Used: <strong>{loggingMaterial?.used_quantity}</strong></span>
              <span>Remaining: <strong>{loggingMaterial?.remaining_quantity}</strong></span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormInput
              label={`${logActionType === 'received' ? 'Received' : 'Used'} Quantity (${loggingMaterial?.unit}) *`}
              type="number"
              step="any"
              min="0.01"
              required
              value={String(logFormData.quantity)}
              onChange={(e) => setLogFormData({ ...logFormData, quantity: Number(e.target.value) })}
            />
            <FormInput
              label="Transaction Date *"
              type="date"
              required
              value={logFormData.log_date}
              onChange={(e) => setLogFormData({ ...logFormData, log_date: e.target.value })}
            />
          </div>

          {logActionType === 'received' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <FormInput
                label="Unit Cost (₹)"
                type="number"
                step="any"
                min="0"
                value={String(logFormData.unit_cost)}
                onChange={(e) => setLogFormData({ ...logFormData, unit_cost: Number(e.target.value) })}
              />
              <FormInput
                label="Challan / Invoice No."
                placeholder="e.g. INV-2026-981"
                value={logFormData.challan_or_invoice_no}
                onChange={(e) => setLogFormData({ ...logFormData, challan_or_invoice_no: e.target.value })}
              />
            </div>
          )}

          <FormInput
            label="Notes / Location / Purpose"
            placeholder={logActionType === 'received' ? 'Received from vendor XYZ...' : 'Used in column footing work...'}
            value={logFormData.notes}
            onChange={(e) => setLogFormData({ ...logFormData, notes: e.target.value })}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsLogModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isSubmittingLog} style={{ background: logActionType === 'received' ? 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none' }}>
              {isSubmittingLog ? 'Saving...' : logActionType === 'received' ? 'Confirm Receipt' : 'Record Usage'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Transaction Logs History */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={`Transaction History — ${historyMaterial?.material_name || ''}`}
      >
        <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {isLoadingHistory ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>Loading history logs...</div>
          ) : materialLogs.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No transactions recorded for this material yet.
            </div>
          ) : (
            <table className="data-table" style={{ width: '100%', fontSize: '0.82rem' }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>Unit Cost</th>
                  <th>Total Cost</th>
                  <th>Challan / Invoice</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {materialLogs.map((log) => {
                  const isRec = log.action_type === 'received';
                  const total = Number(log.total_cost || Number(log.quantity) * Number(log.unit_cost || 0));

                  return (
                    <tr key={log.log_id}>
                      <td>{log.log_date ? log.log_date.split('T')[0] : '-'}</td>
                      <td>
                        <span style={{
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: isRec ? 'rgba(56, 189, 248, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: isRec ? '#38bdf8' : '#10b981'
                        }}>
                          {log.action_type.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>{log.quantity}</td>
                      <td>₹ {Number(log.unit_cost || 0).toFixed(2)}</td>
                      <td style={{ fontWeight: 700, color: isRec ? '#38bdf8' : '#10b981' }}>₹ {total.toFixed(2)}</td>
                      <td>{log.challan_or_invoice_no || '-'}</td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{log.notes || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Modal>

      {/* MODAL 4: Material Master Create/Edit */}
      <Modal isOpen={isMasterModalOpen} onClose={() => setIsMasterModalOpen(false)} title={editingMaster ? 'Edit Master Material' : 'Add Master Material'}>
        <form onSubmit={handleSaveMaster} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <FormInput
            label="Material Code (Leave blank for auto)"
            value={masterFormData.material_code}
            onChange={(e) => setMasterFormData({ ...masterFormData, material_code: e.target.value })}
            disabled={!!editingMaster}
          />
          <FormInput
            label="Material Name *"
            value={masterFormData.material_name}
            onChange={(e) => setMasterFormData({ ...masterFormData, material_name: e.target.value })}
            required
          />
          <FormInput
            label="Category"
            value={masterFormData.category}
            onChange={(e) => setMasterFormData({ ...masterFormData, category: e.target.value })}
          />
          <FormInput
            label="Unit of Measure"
            value={masterFormData.unit}
            onChange={(e) => setMasterFormData({ ...masterFormData, unit: e.target.value })}
          />
          <FormInput
            label="Description"
            value={masterFormData.description}
            onChange={(e) => setMasterFormData({ ...masterFormData, description: e.target.value })}
          />
          <FormSelect
            label="Status"
            value={masterFormData.status}
            onChange={(e) => setMasterFormData({ ...masterFormData, status: e.target.value as 'active' | 'inactive' })}
            options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsMasterModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isSubmittingMaster}>
              {isSubmittingMaster ? 'Saving...' : editingMaster ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
