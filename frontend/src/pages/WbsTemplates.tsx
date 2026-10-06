import React, { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../services/api';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';
import { Badge } from '../components/common/Badge';
import { ConfirmDeleteModal } from '../components/common/ConfirmDeleteModal';
import { showSuccess, showError } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import {
  Plus, Edit, Trash2, Layers, ChevronDown, ChevronRight,
  Eye, Copy, ArrowUp, ArrowDown, FolderPlus, Building2, Search,
  FolderTree, CornerDownRight, CheckCircle2, AlertCircle, X
} from 'lucide-react';
import { WbsTemplate, WbsTemplateDetail, WbsTemplateProjectType } from '../types';

interface ProjectTypeMaster {
  type_id: number;
  type_name: string;
  type_code: string;
}

interface WbsMaster {
  id: number;
  wbs_code: string;
  wbs_name: string;
  wbs_type: string;
}

interface WbsTemplatesProps {
  isEmbedded?: boolean;
  initialAction?: 'create';
  onNavigate?: (page: string) => void;
}

export const WbsTemplates: React.FC<WbsTemplatesProps> = ({ isEmbedded, initialAction, onNavigate }) => {
  const { user } = useAuth();
  const canManage = user?.role_name === 'Admin' || user?.role_name === 'Super Admin';

  const [templates, setTemplates] = useState<WbsTemplate[]>([]);
  const [projectTypesList, setProjectTypesList] = useState<ProjectTypeMaster[]>([]);
  const [wbsMasterList, setWbsMasterList] = useState<WbsMaster[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProjectType, setFilterProjectType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewTemplate, setViewTemplate] = useState<WbsTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<WbsTemplate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formStatus, setFormStatus] = useState('1');
  
  // Selected Project Types in Form: array of project_type_id
  const [formSelectedProjectTypes, setFormSelectedProjectTypes] = useState<number[]>([]);
  const [selectedProjectTypeToAdd, setSelectedProjectTypeToAdd] = useState<string>('');
  
  // Details list: items having project_type_id and parent_id
  const [formDetails, setFormDetails] = useState<WbsTemplateDetail[]>([]);

  // Expanded Nodes
  const [expandedNodes, setExpandedNodes] = useState<Set<string | number>>(new Set());

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    const [tRes, ptRes, wbsRes] = await Promise.all([
      apiRequest<WbsTemplate[]>('/wbs-templates'),
      apiRequest<ProjectTypeMaster[]>('/masters/project-types'),
      apiRequest<WbsMaster[]>('/wbs'),
    ]);
    if (tRes.success && tRes.data) setTemplates(tRes.data);
    if (ptRes.success && ptRes.data) setProjectTypesList(ptRes.data);
    if (wbsRes.success && wbsRes.data) setWbsMasterList(wbsRes.data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const toggleExpand = (id: string | number) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = (details: WbsTemplateDetail[], ptIds: number[]) => {
    const all = new Set<string | number>();
    ptIds.forEach(id => all.add(`pt_${id}`));
    details.forEach(d => all.add(d.id));
    setExpandedNodes(all);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const openCreate = () => {
    setEditingTemplate(null);
    setFormName('');
    setFormCode('');
    setFormDesc('');
    setFormStatus('1');
    setFormSelectedProjectTypes([]);
    setSelectedProjectTypeToAdd('');
    setFormDetails([]);
    setExpandedNodes(new Set());
    setIsFormOpen(true);
  };

  useEffect(() => {
    if (initialAction === 'create') {
      openCreate();
    }
  }, [initialAction]);

  const openEdit = async (t: WbsTemplate) => {
    setEditingTemplate(t);
    setFormName(t.template_name);
    setFormCode(t.template_code);
    setFormDesc(t.description || '');
    setFormStatus(String(t.status));
    setSelectedProjectTypeToAdd('');

    const res = await apiRequest<WbsTemplate>(`/wbs-templates/${t.id}`);
    if (res.success && res.data) {
      const data = res.data;
      const ptIds = (data.project_types || []).map(pt => pt.project_type_id);
      setFormSelectedProjectTypes(ptIds);
      const details = data.details || [];
      setFormDetails(details);

      // Expand all project types and nodes by default
      const all = new Set<string | number>();
      ptIds.forEach(id => all.add(`pt_${id}`));
      details.forEach(d => all.add(d.id));
      setExpandedNodes(all);
    }
    setIsFormOpen(true);
  };

  const openView = async (t: WbsTemplate) => {
    const res = await apiRequest<WbsTemplate>(`/wbs-templates/${t.id}`);
    if (res.success && res.data) {
      setViewTemplate(res.data);
      const ptIds = (res.data.project_types || []).map(pt => pt.project_type_id);
      const details = res.data.details || [];
      const all = new Set<string | number>();
      ptIds.forEach(id => all.add(`pt_${id}`));
      details.forEach(d => all.add(d.id));
      setExpandedNodes(all);
    } else {
      setViewTemplate(t);
    }
    setIsViewOpen(true);
  };

  // --- Project Types in Form ---
  const handleAddProjectType = () => {
    const ptId = Number(selectedProjectTypeToAdd);
    if (!ptId) {
      showError('Please select a Project Type to add');
      return;
    }
    if (formSelectedProjectTypes.includes(ptId)) {
      showError('This Project Type is already added to this template');
      return;
    }
    setFormSelectedProjectTypes(prev => [...prev, ptId]);
    setExpandedNodes(prev => new Set(prev).add(`pt_${ptId}`));
    setSelectedProjectTypeToAdd('');
  };

  const handleRemoveProjectType = (ptId: number) => {
    setFormSelectedProjectTypes(prev => prev.filter(id => id !== ptId));
    // Remove all WBS details belonging to this project type
    setFormDetails(prev => prev.filter(d => d.project_type_id !== ptId));
  };

  // --- WBS Tree Manipulation Logic ---
  const handleAddWbsNode = (projectTypeId: number, parentId: string | number | null = null) => {
    const newId = `temp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const siblings = formDetails.filter(d => d.project_type_id === projectTypeId && d.parent_id === parentId);

    const newNode: WbsTemplateDetail = {
      id: newId,
      project_type_id: projectTypeId,
      parent_id: parentId,
      wbs_name: '',
      wbs_code: '',
      description: '',
      sort_order: siblings.length,
    };

    setFormDetails(prev => [...prev, newNode]);
    
    // Auto expand parent
    if (parentId) {
      setExpandedNodes(prev => new Set(prev).add(parentId));
    }
    setExpandedNodes(prev => new Set(prev).add(`pt_${projectTypeId}`));
  };

  const handleUpdateNode = (id: string | number, field: keyof WbsTemplateDetail, val: any) => {
    setFormDetails(prev => prev.map(node => {
      if (node.id !== id) return node;
      const updated: any = { ...node, [field]: val };
      if (field === 'wbs_id' && val) {
        const master = wbsMasterList.find(w => String(w.id) === String(val));
        if (master) {
          updated.wbs_name = master.wbs_name;
          updated.wbs_code = master.wbs_code;
        }
      }
      return updated;
    }));
  };

  const handleDeleteNode = (id: string | number) => {
    const toDelete = new Set<string | number>();
    const findDescendants = (parentId: string | number) => {
      toDelete.add(parentId);
      formDetails.filter(d => d.parent_id === parentId).forEach(d => findDescendants(d.id));
    };
    findDescendants(id);
    setFormDetails(prev => prev.filter(node => !toDelete.has(node.id)));
  };

  const handleMoveNode = (id: string | number, direction: 'up' | 'down') => {
    const node = formDetails.find(d => d.id === id);
    if (!node) return;
    const siblings = formDetails
      .filter(d => d.project_type_id === node.project_type_id && d.parent_id === node.parent_id)
      .sort((a, b) => a.sort_order - b.sort_order);

    const index = siblings.findIndex(s => s.id === id);
    if (direction === 'up' && index > 0) {
      const prevNode = siblings[index - 1];
      setFormDetails(prevDetails => {
        return prevDetails.map(item => {
          if (item.id === id) return { ...item, sort_order: prevNode.sort_order };
          if (item.id === prevNode.id) return { ...item, sort_order: node.sort_order };
          return item;
        });
      });
    } else if (direction === 'down' && index < siblings.length - 1) {
      const nextNode = siblings[index + 1];
      setFormDetails(prevDetails => {
        return prevDetails.map(item => {
          if (item.id === id) return { ...item, sort_order: nextNode.sort_order };
          if (item.id === nextNode.id) return { ...item, sort_order: node.sort_order };
          return item;
        });
      });
    }
  };

  // Build recursive tree for a specific project type
  const buildTreeForProjectType = (
    details: WbsTemplateDetail[],
    projectTypeId: number,
    parentId: string | number | null = null
  ): (WbsTemplateDetail & { children: any[] })[] => {
    return details
      .filter(d => d.project_type_id === projectTypeId && d.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(d => ({
        ...d,
        children: buildTreeForProjectType(details, projectTypeId, d.id),
      }));
  };

  // Recursive Tree Node Renderer
  // Recursive Tree Node Renderer
  const renderTreeNode = (
    node: WbsTemplateDetail & { children: any[] },
    level: number = 0,
    isViewMode = false
  ) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    if (isViewMode) {
      return (
        <div key={node.id} style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.55rem 0.85rem',
              marginLeft: level > 0 ? `${Math.min(level, 4) * 1.25}rem` : '0',
              borderLeft: level > 0 ? '2.5px solid var(--accent-primary, #6366f1)' : 'none',
              background: level === 0 ? 'var(--bg-card)' : 'var(--bg-input)',
              marginBottom: '6px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              transition: 'all 0.15s ease',
            }}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpand(node.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            ) : (
              <div style={{ width: '16px', display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--text-muted)' }} />
              </div>
            )}

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  color: '#6366f1',
                  fontSize: '0.78rem',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  background: 'rgba(99, 102, 241, 0.12)',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                }}
              >
                {node.wbs_code || 'WBS'}
              </span>
              <span
                style={{
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  fontWeight: level === 0 ? 600 : 500,
                }}
              >
                {node.wbs_name}
              </span>
              {level > 0 && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    background: 'var(--bg-primary)',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  Sub-point (Level {level})
                </span>
              )}
              {hasChildren && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: '#818cf8',
                    background: 'rgba(99, 102, 241, 0.1)',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px',
                    fontWeight: 600,
                  }}
                >
                  {node.children.length} {node.children.length === 1 ? 'child' : 'children'}
                </span>
              )}
              {node.description && (
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginLeft: 'auto' }}>
                  {node.description}
                </span>
              )}
            </div>
          </div>

          {/* Children Render in View Mode */}
          {hasChildren && isExpanded && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {node.children.map((child: any) => renderTreeNode(child, level + 1, true))}
            </div>
          )}
        </div>
      );
    }

    // EDIT / CREATE MODE
    return (
      <div key={node.id} style={{ display: 'flex', flexDirection: 'column', marginBottom: '0.65rem' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            padding: '0.65rem 0.85rem',
            marginLeft: level > 0 ? `${Math.min(level, 4) * 1.25}rem` : '0',
            borderLeft: level > 0 ? '3px solid #6366f1' : '1px solid var(--border-color)',
            background: level === 0 ? 'var(--bg-card)' : 'var(--bg-input)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            transition: 'all 0.15s ease',
          }}
        >
          {/* Top Row: Level & Hierarchy Badge + Prominent Actions Toolbar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
              flexWrap: 'wrap',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '0.4rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => toggleExpand(node.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
              ) : (
                <div style={{ width: '16px', display: 'flex', justifyContent: 'center' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--text-muted)' }} />
                </div>
              )}

              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  background: level === 0 ? 'rgba(99, 102, 241, 0.15)' : 'rgba(14, 165, 233, 0.15)',
                  color: level === 0 ? '#818cf8' : '#38bdf8',
                  border: level === 0 ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(14, 165, 233, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                {level === 0 ? (
                  <>
                    <FolderTree size={12} /> Root WBS
                  </>
                ) : (
                  <>
                    <CornerDownRight size={12} /> Sub-Point (Level {level})
                  </>
                )}
              </span>

              {hasChildren && (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  ({node.children.length} {node.children.length === 1 ? 'sub-item' : 'sub-items'})
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleMoveNode(node.id, 'up')}
                title="Move Up"
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '0.3rem 0.45rem',
                  borderRadius: '5px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ArrowUp size={13} />
              </button>
              <button
                type="button"
                onClick={() => handleMoveNode(node.id, 'down')}
                title="Move Down"
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '0.3rem 0.45rem',
                  borderRadius: '5px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ArrowDown size={13} />
              </button>
              
              {/* VIBRANT + ADD SUB-POINT BUTTON */}
              <button
                type="button"
                onClick={() => handleAddWbsNode(node.project_type_id, node.id)}
                title="Add Sub-point (Child WBS) under this item"
                style={{
                  background: '#4f46e5',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  padding: '0.3rem 0.7rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  boxShadow: '0 2px 6px rgba(79, 70, 229, 0.35)',
                  transition: 'all 0.15s ease',
                }}
              >
                <Plus size={14} /> + Add Sub-Point
              </button>

              <button
                type="button"
                onClick={() => handleDeleteNode(node.id)}
                title="Delete this item and its sub-points"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  cursor: 'pointer',
                  padding: '0.3rem 0.5rem',
                  borderRadius: '5px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {/* Bottom Row: Responsive Inputs (Code, Name, Master autofill) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.5rem',
              alignItems: 'center',
            }}
          >
            <div style={{ maxWidth: '140px', minWidth: '100px' }}>
              <input
                type="text"
                placeholder="Code *"
                value={node.wbs_code || ''}
                onChange={(e) => handleUpdateNode(node.id, 'wbs_code', e.target.value)}
                style={{
                  width: '100%',
                  height: '34px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  borderRadius: '6px',
                  padding: '0 0.6rem',
                  fontSize: '0.82rem',
                  fontFamily: 'monospace',
                  fontWeight: 600,
                }}
              />
            </div>
            <div style={{ minWidth: '200px', flex: 2 }}>
              <input
                type="text"
                placeholder="WBS Name (e.g. Civil Works, Drainage, Pipe Installation) *"
                value={node.wbs_name || ''}
                onChange={(e) => handleUpdateNode(node.id, 'wbs_name', e.target.value)}
                style={{
                  width: '100%',
                  height: '34px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  borderRadius: '6px',
                  padding: '0 0.65rem',
                  fontSize: '0.84rem',
                }}
              />
            </div>
            <div style={{ minWidth: '200px', flex: 1.5 }}>
              <select
                value={node.wbs_id || ''}
                onChange={(e) => handleUpdateNode(node.id, 'wbs_id', e.target.value ? Number(e.target.value) : null)}
                style={{
                  width: '100%',
                  height: '34px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  borderRadius: '6px',
                  padding: '0 0.6rem',
                  fontSize: '0.8rem',
                }}
              >
                <option value="">Link to Master WBS (Optional)...</option>
                {wbsMasterList.map(w => (
                  <option key={w.id} value={w.id}>{w.wbs_code} - {w.wbs_name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Children Render in Edit Mode */}
        {hasChildren && isExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {node.children.map((child: any) => renderTreeNode(child, level + 1, false))}
          </div>
        )}
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return showError('Template name is required');
    if (formSelectedProjectTypes.length === 0) {
      return showError('Please add at least ONE Project Type to the template');
    }

    // Check all WBS nodes have names
    for (const node of formDetails) {
      if (!node.wbs_name?.trim()) {
        return showError('All WBS items must have a name');
      }
    }

    setIsSubmitting(true);
    const payload = {
      template_name: formName.trim(),
      template_code: formCode.trim() || undefined,
      description: formDesc || null,
      status: Number(formStatus),
      project_type_ids: formSelectedProjectTypes,
      details: formDetails,
    };

    const url = editingTemplate ? `/wbs-templates/${editingTemplate.id}` : '/wbs-templates';
    const method = editingTemplate ? 'PUT' : 'POST';

    try {
      const res = await apiRequest<WbsTemplate>(url, {
        method,
        body: JSON.stringify(payload),
      });
      if (res.success) {
        showSuccess(`WBS Template ${editingTemplate ? 'updated' : 'created'} successfully`);
        setIsFormOpen(false);
        fetchAll();
      } else {
        showError(res.message || 'Failed to save template');
      }
    } catch (err: any) {
      showError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicate = async (t: WbsTemplate) => {
    try {
      const res = await apiRequest(`/wbs-templates/${t.id}/duplicate`, { method: 'POST' });
      if (res.success) {
        showSuccess('Template duplicated successfully with all Project Types & WBS hierarchy');
        fetchAll();
      } else {
        showError(res.message || 'Failed to duplicate template');
      }
    } catch (e: any) {
      showError(e.message || 'An error occurred');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await apiRequest(`/wbs-templates/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.success) {
        showSuccess('Template deleted successfully');
        setTemplates(prev => prev.filter(t => t.id !== deleteTarget.id));
        setDeleteTarget(null);
        setIsDeleteModalOpen(false);
      } else {
        showError(res.message || 'Failed to delete template');
      }
    } catch (e: any) {
      showError(e.message || 'An error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Templates
  const filteredTemplates = templates.filter(t => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = t.template_name?.toLowerCase().includes(q);
      const matchCode = t.template_code?.toLowerCase().includes(q);
      const matchPt = t.project_type_names?.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchPt) return false;
    }
    if (filterProjectType) {
      const hasPt = (t.project_types || []).some(pt => String(pt.project_type_id) === filterProjectType);
      if (!hasPt) return false;
    }
    if (filterStatus) {
      if (String(t.status) !== filterStatus) return false;
    }
    return true;
  });

  return (
    <div style={{ padding: isEmbedded ? '0.25rem 0 1rem 0' : '1.5rem', maxWidth: '1300px', margin: '0 auto' }}>
      {/* Page Header */}
      {!isEmbedded ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Layers size={24} color="var(--accent-primary)" />
              WBS Templates Management
            </h1>
            <p className="page-subtitle" style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Manage master WBS Templates containing multiple Project Types with dedicated WBS tree hierarchies.
            </p>
          </div>
          {canManage && (
            <Button onClick={openCreate} variant="primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Plus size={18} /> Create WBS Template
            </Button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1rem' }}>
          {canManage && (
            <Button onClick={openCreate} variant="primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Plus size={18} /> Create WBS Template
            </Button>
          )}
        </div>
      )}

      {/* Filters Bar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 250px', position: 'relative' }}>
          <Search size={16} color="#64748b" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by template name, code, or project type..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: '38px',
              paddingLeft: '34px',
              paddingRight: '12px',
              background: 'var(--input-bg)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              borderRadius: '6px',
              fontSize: '0.875rem'
            }}
          />
        </div>

        <div style={{ flex: '0 1 220px' }}>
          <select
            value={filterProjectType}
            onChange={e => setFilterProjectType(e.target.value)}
            style={{
              width: '100%',
              height: '38px',
              background: 'var(--input-bg)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              borderRadius: '6px',
              padding: '0 0.75rem',
              fontSize: '0.875rem'
            }}
          >
            <option value="">All Project Types</option>
            {projectTypesList.map(pt => (
              <option key={pt.type_id} value={String(pt.type_id)}>{pt.type_name}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: '0 1 150px' }}>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{
              width: '100%',
              height: '38px',
              background: 'var(--input-bg)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              borderRadius: '6px',
              padding: '0 0.75rem',
              fontSize: '0.875rem'
            }}
          >
            <option value="">All Statuses</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
        </div>

        {(searchQuery || filterProjectType || filterStatus) && (
          <button
            onClick={() => { setSearchQuery(''); setFilterProjectType(''); setFilterStatus(''); }}
            style={{ background: 'transparent', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: '0.82rem', textDecoration: 'underline' }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Templates Table List */}
      {isLoading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading WBS templates...</div>
      ) : filteredTemplates.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
          No WBS templates found matching criteria. {canManage && 'Create a new template to get started.'}
        </div>
      ) : (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Template Code</th>
                  <th style={{ width: '250px' }}>Template Name</th>
                  <th>Included Project Types</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>Total Nodes</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Status</th>
                  <th style={{ width: '180px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTemplates.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600, color: '#818cf8', fontFamily: 'monospace' }}>
                      {t.template_code}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.template_name}</div>
                      {t.description && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {t.project_types && t.project_types.length > 0 ? (
                          t.project_types.map(pt => (
                            <span
                              key={pt.project_type_id}
                              style={{
                                fontSize: '0.72rem',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                background: 'rgba(99, 102, 241, 0.12)',
                                color: 'var(--text-primary)',
                                border: '1px solid rgba(99, 102, 241, 0.25)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                            >
                              <Building2 size={11} color="#818cf8" />
                              {pt.project_type_name}
                              <span style={{ fontSize: '0.68rem', color: '#6366f1', fontWeight: 600 }}>
                                ({pt.wbs_count || 0})
                              </span>
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>No project types</span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Badge variant="info">{t.detail_count || 0} items</Badge>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {t.status === 1 ? <Badge variant="success">Active</Badge> : <Badge variant="warning">Inactive</Badge>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <Button variant="secondary" onClick={() => openView(t)} style={{ padding: '0.35rem 0.5rem' }} title="View Structure">
                          <Eye size={14} />
                        </Button>
                        {canManage && (
                          <>
                            <Button variant="secondary" onClick={() => openEdit(t)} style={{ padding: '0.35rem 0.5rem' }} title="Edit Template">
                              <Edit size={14} />
                            </Button>
                            <Button variant="secondary" onClick={() => handleDuplicate(t)} style={{ padding: '0.35rem 0.5rem' }} title="Duplicate Template">
                              <Copy size={14} />
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() => { setDeleteTarget({ id: t.id, name: t.template_name }); setIsDeleteModalOpen(true); }}
                              style={{ padding: '0.35rem 0.5rem' }}
                              title="Delete Template"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingTemplate ? `Edit WBS Template: ${editingTemplate.template_name}` : 'Add WBS Template'}
        size="2xl"
      >
        <style>{`
          .wbs-template-layout {
            display: flex;
            flex-direction: column;
            height: 100%;
            max-height: 85vh;
          }
          .wbs-template-grid {
            display: grid;
            grid-template-columns: 320px 1fr;
            gap: 1.25rem;
            flex: 1;
            min-height: 0;
          }
          .wbs-template-sidebar {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
            padding-right: 0.5rem;
            overflow-y: auto;
          }
          .wbs-template-main {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 1.25rem;
            overflow-y: auto;
          }
          .wbs-template-footer {
            display: flex;
            justify-content: flex-end;
            gap: 0.75rem;
            padding-top: 1rem;
            margin-top: 1rem;
            border-top: 1px solid var(--border-color);
            background: var(--bg-card);
          }
          
          @media (max-width: 992px) {
            .wbs-template-grid {
              grid-template-columns: 1fr;
              gap: 1rem;
            }
            .wbs-template-sidebar {
              overflow-y: visible;
              padding-right: 0;
            }
            .wbs-template-main {
              overflow-y: visible;
              max-height: 520px;
            }
            .wbs-template-layout {
              max-height: none;
            }
          }
        `}</style>
        
        <form onSubmit={handleSubmit} className="wbs-template-layout">
          <div className="wbs-template-grid">
            
            {/* LEFT COLUMN: Template Level Fields & Add Project Type */}
            <div className="wbs-template-sidebar">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-input)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Template Details</h3>
                
                <FormInput
                  label="Template Name *"
                  type="text"
                  placeholder="e.g. Villa Construction Template"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  required
                />
                
                <FormInput
                  label="Template Code"
                  type="text"
                  placeholder="Auto-generated (e.g. WBST-0001)"
                  value={formCode}
                  onChange={e => setFormCode(e.target.value)}
                />
                
                <FormInput
                  label="Description"
                  type="text"
                  placeholder="Brief description of the template"
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                />
                
                <FormSelect
                  label="Status"
                  value={formStatus}
                  onChange={e => setFormStatus(e.target.value)}
                  options={[
                    { value: '1', label: 'Active' },
                    { value: '0', label: 'Inactive' },
                  ]}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-input)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Building2 size={16} color="#818cf8" /> Add Project Type
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.35rem 0 0.75rem 0' }}>
                    Select project types to define their specific WBS hierarchy in this template.
                  </p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <select
                    value={selectedProjectTypeToAdd}
                    onChange={e => setSelectedProjectTypeToAdd(e.target.value)}
                    style={{
                      width: '100%',
                      height: '38px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      borderRadius: '6px',
                      padding: '0 0.75rem',
                      fontSize: '0.85rem'
                    }}
                  >
                    <option value="">-- Select Project Type --</option>
                    {projectTypesList
                      .filter(pt => !formSelectedProjectTypes.includes(pt.type_id))
                      .map(pt => (
                        <option key={pt.type_id} value={String(pt.type_id)}>
                          {pt.type_name} ({pt.type_code})
                        </option>
                      ))}
                  </select>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleAddProjectType}
                    disabled={!selectedProjectTypeToAdd}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <Plus size={15} style={{ marginRight: '0.4rem' }} /> Add to Template
                  </Button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: WBS Hierarchies Section */}
            <div className="wbs-template-main">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FolderTree size={18} color="#818cf8" />
                    WBS Structures
                  </h3>
                </div>
                {formSelectedProjectTypes.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={() => expandAll(formDetails, formSelectedProjectTypes)}
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.75rem', padding: '0.35rem 0.6rem', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Expand All
                    </button>
                    <button
                      type="button"
                      onClick={collapseAll}
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.75rem', padding: '0.35rem 0.6rem', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Collapse All
                    </button>
                  </div>
                )}
              </div>

              {formSelectedProjectTypes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8', border: '1px dashed var(--border-color)', borderRadius: '8px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <AlertCircle size={32} style={{ margin: '0 auto 0.75rem', color: '#818cf8', opacity: 0.6 }} />
                  <div style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-primary)' }}>No Project Types Added</div>
                  <div style={{ fontSize: '0.85rem', marginTop: '0.35rem' }}>Use the sidebar to add Project Types and configure their WBS structures.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {formSelectedProjectTypes.map(ptId => {
                    const ptInfo = projectTypesList.find(p => p.type_id === ptId);
                    const ptName = ptInfo?.type_name || `Project Type #${ptId}`;
                    const isPtExpanded = expandedNodes.has(`pt_${ptId}`);
                    const ptTree = buildTreeForProjectType(formDetails, ptId, null);
                    const totalPtItems = formDetails.filter(d => d.project_type_id === ptId).length;

                    return (
                      <div
                        key={ptId}
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                            padding: '0.75rem 1rem',
                            background: 'rgba(99, 102, 241, 0.05)',
                            borderBottom: isPtExpanded ? '1px solid var(--border-color)' : 'none'
                          }}
                        >
                          <div
                            onClick={() => toggleExpand(`pt_${ptId}`)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none', flex: 1 }}
                          >
                            {isPtExpanded ? <ChevronDown size={18} color="#818cf8" /> : <ChevronRight size={18} color="#818cf8" />}
                            <Building2 size={16} color="#818cf8" />
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                              {ptName}
                            </span>
                            <span style={{ fontSize: '0.75rem', background: 'var(--bg-input)', color: 'var(--text-secondary)', padding: '0.15rem 0.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                              {totalPtItems} WBS {totalPtItems === 1 ? 'item' : 'items'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Button
                              type="button"
                              variant="primary"
                              onClick={() => handleAddWbsNode(ptId, null)}
                              style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                            >
                              <Plus size={14} style={{ marginRight: '0.25rem' }} /> Add Root WBS
                            </Button>
                            <button
                              type="button"
                              onClick={() => handleRemoveProjectType(ptId)}
                              title="Remove Project Type"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#ef4444',
                                cursor: 'pointer',
                                padding: '0.35rem',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {isPtExpanded && (
                          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', background: 'var(--bg-card)' }}>
                            {ptTree.length === 0 ? (
                              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', border: '1px dashed var(--border-color)', borderRadius: '6px' }}>
                                No WBS items added under {ptName} yet. Click <strong>+ Add Root WBS</strong> above.
                              </div>
                            ) : (
                              ptTree.map(node => renderTreeNode(node, 0, false))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="wbs-template-footer">
            <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)} style={{ padding: '0.5rem 1.25rem' }}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting} style={{ padding: '0.5rem 1.25rem' }}>
              {isSubmitting ? 'Saving Template...' : 'Save Template'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* VIEW STRUCTURE MODAL */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title={viewTemplate ? `WBS Template: ${viewTemplate.template_name} (${viewTemplate.template_code})` : 'View WBS Template'}
        size="xl"
      >
        {viewTemplate && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Template Header Overview Card */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '1rem 1.25rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      color: '#818cf8',
                      background: 'rgba(99, 102, 241, 0.12)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                    }}
                  >
                    {viewTemplate.template_code}
                  </span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {viewTemplate.template_name}
                  </span>
                </div>
                <div>
                  {viewTemplate.status === 1 ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Badge variant="warning">Inactive</Badge>
                  )}
                </div>
              </div>

              {viewTemplate.description && (
                <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {viewTemplate.description}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Hierarchical Structure ({viewTemplate.project_types?.length || 0} Project Types, {viewTemplate.details?.length || 0} Total WBS Nodes):
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => expandAll(viewTemplate.details || [], (viewTemplate.project_types || []).map(p => p.project_type_id))}
                  style={{ padding: '0.25rem 0.65rem', fontSize: '0.78rem' }}
                >
                  Expand All
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={collapseAll}
                  style={{ padding: '0.25rem 0.65rem', fontSize: '0.78rem' }}
                >
                  Collapse All
                </Button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {(viewTemplate.project_types || []).map(pt => {
                const ptTree = buildTreeForProjectType(viewTemplate.details || [], pt.project_type_id, null);
                const isPtExpanded = expandedNodes.has(`pt_${pt.project_type_id}`);
                const totalPtItems = (viewTemplate.details || []).filter(d => d.project_type_id === pt.project_type_id).length;

                return (
                  <div
                    key={pt.project_type_id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div
                      onClick={() => toggleExpand(`pt_${pt.project_type_id}`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        background: 'rgba(99, 102, 241, 0.06)',
                        cursor: 'pointer',
                        userSelect: 'none',
                        borderBottom: isPtExpanded ? '1px solid var(--border-color)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {isPtExpanded ? <ChevronDown size={18} color="#818cf8" /> : <ChevronRight size={18} color="#818cf8" />}
                        <Building2 size={16} color="#818cf8" />
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                          {pt.project_type_name}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          background: 'rgba(99, 102, 241, 0.12)',
                          color: '#818cf8',
                          padding: '0.15rem 0.55rem',
                          borderRadius: '12px',
                          fontWeight: 600,
                          border: '1px solid rgba(99, 102, 241, 0.2)',
                        }}
                      >
                        {totalPtItems} WBS {totalPtItems === 1 ? 'item' : 'items'}
                      </span>
                    </div>

                    {isPtExpanded && (
                      <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', background: 'var(--bg-card)' }}>
                        {ptTree.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            No WBS nodes under this project type.
                          </div>
                        ) : (
                          ptTree.map(node => renderTreeNode(node, 0, true))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem', gap: '0.5rem' }}>
              {canManage && (
                <Button
                  variant="primary"
                  onClick={() => {
                    setIsViewOpen(false);
                    openEdit(viewTemplate);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Edit size={14} /> Edit This Template
                </Button>
              )}
              <Button variant="secondary" onClick={() => setIsViewOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* DELETE MODAL */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete WBS Template"
        recordName={deleteTarget?.name || 'WBS Template'}
        isLoading={isDeleting}
      />
    </div>
  );
};
