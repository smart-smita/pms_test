import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../components/common/Button';
import { FormPageLayout } from '../components/layout/FormPageLayout';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';
import { SearchableSelect, SearchableOption } from '../components/common/SearchableSelect';
import {
  ArrowLeft, MapPin, Plus, Trash2, Save, HardHat, Package, Layers,
  FileText, Paperclip, Upload, Eye, Download, Check, X, Sparkles,
  Calendar, CheckCircle2, AlertCircle, Building2, FolderKanban, DollarSign
} from 'lucide-react';
import { apiRequest, parseApiErrors } from '../services/api';
import { Project, Customer, ProjectType, EntityDocument } from '../types';
import { showSuccess, showError, showWarning } from '../utils/toast';
import { ConfirmDeleteModal } from '../components/common/ConfirmDeleteModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

interface ProjectFormProps {
  projectId?: number;
  onBack?: () => void;
  isWorkspace?: boolean;
}

interface ProjectWbsAllocation {
  id: string | number;
  wbs_id?: number | null;
  wbs_code?: string;
  wbs_name: string;
  wbs_type: 'labour' | 'material' | 'both';
  unit: string;
  planned_quantity: number;
  rate: number;
  budget_amount: number;
  total_hours: number;
  planned_labour_cost: number;
  planned_material_cost: number;
  start_date: string;
  end_date: string;
  is_custom?: boolean; // clearly marks custom project-added WBS
}

export const ProjectForm: React.FC<ProjectFormProps> = ({ projectId, onBack, isWorkspace }) => {
  const getFormattedDate = (d?: string) => {
    if (!d) return new Date().toISOString().split('T')[0];
    return d.split('T')[0].split(' ')[0];
  };

  const [isLoadingProject, setIsLoadingProject] = useState(!!projectId);
  const [project, setProject] = useState<Project | null>(null);

  // Active Tab: 'details' | 'wbs' | 'documents'
  const [activeTab, setActiveTab] = useState<'details' | 'wbs' | 'documents'>('details');

  // Core Form Fields
  const [projectCode, setProjectCode] = useState(`PRJ-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`);
  const [projectName, setProjectName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [sourceQuotationId, setSourceQuotationId] = useState('');
  const [quotationReference, setQuotationReference] = useState('');
  const [projectTypeId, setProjectTypeId] = useState('');
  const [currencyId, setCurrencyId] = useState('1');
  const [budgetAmount, setBudgetAmount] = useState<string>('0');
  const [startDate, setStartDate] = useState(getFormattedDate());
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('active');
  const [projectAddress, setProjectAddress] = useState('');
  const [note, setNote] = useState('');

  // Master lists
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [wbsTemplates, setWbsTemplates] = useState<any[]>([]);
  const [selectedWbsTemplateIds, setSelectedWbsTemplateIds] = useState<number[]>([]);

  // WBS Allocations State
  const [wbsAllocations, setWbsAllocations] = useState<ProjectWbsAllocation[]>([]);
  const [isWbsModalOpen, setIsWbsModalOpen] = useState(false);
  const [editingWbsItem, setEditingWbsItem] = useState<ProjectWbsAllocation | null>(null);

  // Project Documents State
  const [documents, setDocuments] = useState<EntityDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isDocUploadModalOpen, setIsDocUploadModalOpen] = useState(false);
  const [uploadDocName, setUploadDocName] = useState('');
  const [uploadDocType, setUploadDocType] = useState('291'); // Default to 291 (Other Document) which has no expiry
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // Quick Customer Modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [quickCustName, setQuickCustName] = useState('');
  const [quickCustContact, setQuickCustContact] = useState('');
  const [quickCustPhone, setQuickCustPhone] = useState('');
  const [quickCustEmail, setQuickCustEmail] = useState('');
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);

  // Submit State
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected Currency Details
  const selectedCurrency = useMemo(() => {
    return currencies.find((c) => String(c.currency_id) === currencyId) || {
      currency_id: 1,
      currency_code: 'INR',
      symbol: '₹',
    };
  }, [currencies, currencyId]);

  // Available WBS Templates for selected Project Type
  const availableWbsTemplates = useMemo(() => {
    if (!projectTypeId) return wbsTemplates;
    const ptId = Number(projectTypeId);
    return wbsTemplates.filter((t) => {
      if (t.project_type_ids && Array.isArray(t.project_type_ids)) {
        return t.project_type_ids.includes(ptId);
      }
      return true;
    });
  }, [wbsTemplates, projectTypeId]);

  // Load Masters & Project Data
  useEffect(() => {
    Promise.all([
      apiRequest<Customer[]>('/customers'),
      apiRequest<any[]>('/quotations'),
      apiRequest<ProjectType[]>('/masters/project-types'),
      apiRequest<any[]>('/masters/currencies?all=true'),
      apiRequest<any[]>('/wbs-templates'),
    ]).then(([cRes, qRes, ptRes, curRes, wtRes]) => {
      if (cRes.success && cRes.data) setCustomers(cRes.data);
      if (qRes.success && qRes.data) setQuotations(qRes.data);
      if (ptRes.success && ptRes.data) setProjectTypes(ptRes.data);
      if (curRes.success && curRes.data) setCurrencies(curRes.data);
      if (wtRes.success && wtRes.data) setWbsTemplates(wtRes.data);
    });

    if (projectId) {
      setIsLoadingProject(true);
      // Fetch Project Details
      apiRequest<Project & any>(`/projects/${projectId}`).then((res) => {
        if (res.success && res.data) {
          const p = res.data;
          setProject(p);
          setProjectCode(p.project_code || '');
          setProjectName(p.project_name || '');
          setCustomerId(p.customer_id ? String(p.customer_id) : '');
          if (p.source_quotation_id) setSourceQuotationId(String(p.source_quotation_id));
          if (p.quotation_reference) setQuotationReference(p.quotation_reference);
          setProjectTypeId(p.project_type_id ? String(p.project_type_id) : '');
          setCurrencyId(p.currency_id ? String(p.currency_id) : '1');
          setBudgetAmount(p.budget_amount ? String(p.budget_amount) : '0');
          setStatus(p.status || 'active');
          if (p.start_date) setStartDate(p.start_date.split('T')[0]);
          if (p.end_date) setEndDate(p.end_date.split('T')[0]);
          setProjectAddress(p.project_address || '');
          setNote(p.note || '');
        }
      });

      // Fetch Project WBS Allocations
      apiRequest<any[]>(`/projects/${projectId}/wbs`).then((res) => {
        if (res.success && res.data) {
          setWbsAllocations(
            res.data.map((w) => ({
              id: w.id,
              wbs_id: w.wbs_id,
              wbs_code: w.wbs_code,
              wbs_name: w.wbs_name || 'WBS Task',
              wbs_type: w.wbs_type || 'both',
              unit: w.unit || 'hours',
              planned_quantity: Number(w.planned_quantity || 1),
              rate: Number(w.rate || 0),
              budget_amount: Number(w.budget_amount || 0),
              total_hours: Number(w.total_hours || 0),
              planned_labour_cost: Number(w.planned_labour_cost || 0),
              planned_material_cost: Number(w.planned_material_cost || 0),
              start_date: w.start_date ? w.start_date.split('T')[0] : '',
              end_date: w.end_date ? w.end_date.split('T')[0] : '',
              is_custom: !w.wbs_template_id && !w.quotation_discipline_id,
            }))
          );
        }
        setIsLoadingProject(false);
      });

      // Fetch Project Documents
      fetchProjectDocuments();
    }
  }, [projectId]);

  const fetchProjectDocuments = async () => {
    if (!projectId) return;
    setIsLoadingDocs(true);
    const res = await apiRequest<EntityDocument[]>(`/documents?entity_type=project&entity_id=${projectId}`);
    if (res.success && res.data) setDocuments(res.data);
    setIsLoadingDocs(false);
  };

  // Pre-populate when user selects a Source Quotation (if creating new project manually from a quotation)
  const handleSelectQuotation = async (qId: string) => {
    setSourceQuotationId(qId);
    if (!qId) return;

    try {
      const res = await apiRequest<any>(`/quotations/${qId}`);
      if (res.success && res.data) {
        const q = res.data;
        if (q.customer_id) setCustomerId(String(q.customer_id));
        if (q.project_type_id) setProjectTypeId(String(q.project_type_id));
        if (q.currency_id) setCurrencyId(String(q.currency_id));
        if (!projectName) setProjectName(q.new_project_name || `${q.customer_name || 'Client'} Project`);
        if (q.total_amount) setBudgetAmount(String(q.total_amount));
        if (q.quotation_code) setQuotationReference(q.quotation_code);
        if (q.start_date) setStartDate(q.start_date.split('T')[0]);
        if (q.end_date) setEndDate(q.end_date.split('T')[0]);

        // Automatically import quotation WBS allocations
        if (q.disciplines && q.disciplines.length > 0) {
          const importedWbs: ProjectWbsAllocation[] = q.disciplines.map((d: any, idx: number) => {
            const isMat = d.wbs_type === 'material';
            const isBoth = d.wbs_type === 'both';
            const wbsType = isBoth ? 'both' : isMat ? 'material' : 'labour';
            const qty = Number(d.quantity || 1);
            const rate = Number(d.rate || 0);
            const amt = Number(d.amount || qty * rate);

            return {
              id: `quo-wbs-${idx}-${Date.now()}`,
              wbs_id: d.wbs_id || d.discipline_id || null,
              wbs_code: d.wbs_code || `WBS-${idx + 1}`,
              wbs_name: d.discipline_name || `Task ${idx + 1}`,
              wbs_type: wbsType,
              unit: d.unit || (isMat ? 'nos' : 'hours'),
              planned_quantity: qty,
              rate: rate,
              budget_amount: amt,
              total_hours: isMat ? 0 : Number(d.labour_hours || qty),
              planned_labour_cost: isMat ? 0 : Number(d.labour_cost || amt),
              planned_material_cost: isMat ? amt : Number(d.material_cost || 0),
              start_date: d.start_date ? d.start_date.split('T')[0] : q.start_date ? q.start_date.split('T')[0] : '',
              end_date: d.end_date ? d.end_date.split('T')[0] : q.end_date ? q.end_date.split('T')[0] : '',
              is_custom: false,
            };
          });

          setWbsAllocations(importedWbs);
          showSuccess(`Imported ${importedWbs.length} WBS items from Quotation ${q.quotation_code}`);
        }
      }
    } catch (err: any) {
      showError('Failed to import quotation: ' + err.message);
    }
  };

  // Quick Customer Creation
  const handleQuickCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCustName.trim()) {
      showError('Customer name is required');
      return;
    }

    setIsSavingCustomer(true);
    const res = await apiRequest<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify({
        customer_name: quickCustName.trim(),
        customer_code: `CUST-${Date.now().toString().slice(-4)}`,
        contact_person: quickCustContact,
        contact_number: quickCustPhone,
        email: quickCustEmail,
      }),
    });
    setIsSavingCustomer(false);

    if (res.success && res.data) {
      const newCust = res.data;
      showSuccess(`Customer "${newCust.customer_name}" created`);
      setCustomers((prev) => [newCust, ...prev]);
      setCustomerId(String(newCust.customer_id));
      setIsCustomerModalOpen(false);
      setQuickCustName('');
      setQuickCustContact('');
      setQuickCustPhone('');
      setQuickCustEmail('');
    } else {
      showError(res.message || 'Failed to create customer');
    }
  };

  // Multi-WBS Template Import into Project
  const handleToggleWbsTemplate = async (templateId: number) => {
    const isSelected = selectedWbsTemplateIds.includes(templateId);
    const newSelected = isSelected
      ? selectedWbsTemplateIds.filter((id) => id !== templateId)
      : [...selectedWbsTemplateIds, templateId];

    setSelectedWbsTemplateIds(newSelected);

    if (!isSelected) {
      try {
        const ptId = projectTypeId ? Number(projectTypeId) : 0;
        const endpoint = ptId
          ? `/wbs-templates/${templateId}/project-types/${ptId}/wbs`
          : `/wbs-templates/${templateId}`;

        const res = await apiRequest<any>(endpoint);
        if (res.success && res.data) {
          const tmpl = wbsTemplates.find((t) => t.template_id === templateId);
          const detailsList = Array.isArray(res.data) ? res.data : res.data.details || [];

          const newItems: ProjectWbsAllocation[] = detailsList.map((d: any, idx: number) => ({
            id: `tmpl-${templateId}-${idx}-${Date.now()}`,
            wbs_id: d.wbs_id || null,
            wbs_code: d.wbs_code || `WBS-${idx + 1}`,
            wbs_name: d.wbs_name || d.task_name || d.name || `Task ${idx + 1}`,
            wbs_type: 'both',
            unit: 'hours',
            planned_quantity: 1,
            rate: 0,
            budget_amount: 0,
            total_hours: 8,
            planned_labour_cost: 0,
            planned_material_cost: 0,
            start_date: startDate || '',
            end_date: endDate || '',
            is_custom: false,
          }));

          setWbsAllocations((prev) => [...prev, ...newItems]);
          showSuccess(`Imported ${newItems.length} WBS tasks from "${tmpl?.template_name || 'Template'}"`);
        }
      } catch (err: any) {
        showError('Could not import template: ' + err.message);
      }
    }
  };

  // Add Custom Project WBS
  const handleAddCustomWbs = () => {
    const newItem: ProjectWbsAllocation = {
      id: `custom-proj-wbs-${Date.now()}`,
      wbs_name: '',
      wbs_type: 'both',
      unit: 'hours',
      planned_quantity: 1,
      rate: 0,
      budget_amount: 0,
      total_hours: 8,
      planned_labour_cost: 0,
      planned_material_cost: 0,
      start_date: startDate || '',
      end_date: endDate || '',
      is_custom: true,
    };
    setWbsAllocations((prev) => [...prev, newItem]);
  };

  const handleRemoveWbs = (id: string | number) => {
    setWbsAllocations((prev) => prev.filter((w) => w.id !== id));
  };

  const handleUpdateWbs = (id: string | number, updates: Partial<ProjectWbsAllocation>) => {
    setWbsAllocations((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w;
        const updated = { ...w, ...updates };

        // Auto-calculate budget amount
        if (updates.planned_labour_cost !== undefined || updates.planned_material_cost !== undefined) {
          updated.budget_amount = (updated.planned_labour_cost || 0) + (updated.planned_material_cost || 0);
        } else if (updates.planned_quantity !== undefined || updates.rate !== undefined) {
          updated.budget_amount = (updated.planned_quantity || 0) * (updated.rate || 0);
        }

        return updated;
      })
    );
  };

  // Document Upload
  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      showWarning('Please save the project first before uploading documents.');
      return;
    }
    if (!uploadDocName.trim() || !uploadFile) {
      showError('Document name and file are required');
      return;
    }

    setIsUploadingDoc(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const res = await apiRequest<EntityDocument>('/documents', {
        method: 'POST',
        body: JSON.stringify({
          entity_type: 'project',
          entity_id: projectId,
          doc_type_id: Number(uploadDocType),
          document_name: uploadDocName.trim(),
          file_base64: base64,
          file_name: uploadFile.name,
        }),
      });

      setIsUploadingDoc(false);
      if (res.success) {
        showSuccess('Document uploaded successfully');
        setIsDocUploadModalOpen(false);
        setUploadDocName('');
        setUploadFile(null);
        fetchProjectDocuments();
      } else {
        showError(res.message || 'Upload failed');
      }
    };
    reader.readAsDataURL(uploadFile);
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    const res = await apiRequest(`/documents/${docId}`, { method: 'DELETE' });
    if (res.success) {
      showSuccess('Document deleted');
      fetchProjectDocuments();
    } else {
      showError(res.message || 'Delete failed');
    }
  };

  // Main Submit (Create or Update Project)
  const handleSubmitProject = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault?.();
    if (!projectName.trim()) {
      showError('Project Name is required');
      return;
    }
    if (!customerId) {
      showError('Customer is required');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      project_code: projectCode,
      project_name: projectName.trim(),
      customer_id: Number(customerId),
      source_quotation_id: sourceQuotationId ? Number(sourceQuotationId) : null,
      quotation_reference: quotationReference || null,
      project_type_id: projectTypeId ? Number(projectTypeId) : null,
      currency_id: Number(currencyId || 1),
      budget_amount: parseFloat(budgetAmount) || 0,
      status,
      start_date: startDate || null,
      end_date: endDate || null,
      project_address: projectAddress || null,
      note: note || null,
      wbs_allocations: wbsAllocations.map((w) => ({
        id: typeof w.id === 'number' ? w.id : undefined,
        wbs_id: w.wbs_id || null,
        wbs_code: w.wbs_code || null,
        wbs_name: w.wbs_name,
        wbs_type: w.wbs_type,
        unit: w.unit,
        planned_quantity: w.planned_quantity,
        rate: w.rate,
        budget_amount: w.budget_amount,
        total_hours: w.total_hours,
        planned_labour_cost: w.planned_labour_cost,
        planned_material_cost: w.planned_material_cost,
        start_date: w.start_date || null,
        end_date: w.end_date || null,
        is_custom: w.is_custom ? 1 : 0,
      })),
    };

    try {
      let res;
      if (projectId) {
        res = await apiRequest(`/projects/${projectId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        res = await apiRequest('/projects', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      if (res.success) {
        showSuccess(`Project ${projectId ? 'updated' : 'created'} successfully!`);
        if (onBack) onBack();
      } else {
        showError(res.message || 'Failed to save project');
      }
    } catch (err: any) {
      showError(err.message || 'Network error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const customerOptions: SearchableOption[] = customers.map((c) => ({
    value: c.customer_id,
    label: c.customer_name,
    code: c.customer_code,
    subLabel: c.contact_number || c.email || '',
  }));

  if (isLoadingProject) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
        <LoadingSpinner />
        <span style={{ color: 'var(--text-secondary)' }}>Loading project details...</span>
      </div>
    );
  }

  return (
    <FormPageLayout
      title={projectId ? `Project: ${projectName || projectCode}` : 'New Project'}
      subtitle="Manage project execution, WBS hierarchy, optional labour & materials, and project documents"
      onBack={onBack}
      onSave={handleSubmitProject}
      isSaving={isSubmitting}
      saveLabel="Save Project"
    >

      {/* Linked Quotation Banner */}
      {(sourceQuotationId || quotationReference) && (
        <div
          style={{
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.3)',
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sparkles size={18} color="#10b981" />
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#10b981' }}>
              Linked to Approved Quotation {quotationReference ? `(${quotationReference})` : `(#${sourceQuotationId})`}
            </span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Quotation details, WBS trees, and documents have been imported automatically.
          </span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
        {[
          { key: 'details', label: '1. Project Details', icon: FolderKanban },
          { key: 'wbs', label: `2. WBS & Tasks (${wbsAllocations.length})`, icon: Layers },
          { key: 'documents', label: `3. Project Documents (${documents.length})`, icon: Paperclip },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                padding: '0.65rem 1.2rem',
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid #6366f1' : '2px solid transparent',
                color: isActive ? '#6366f1' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: PROJECT DETAILS ───────────────────────────────────────────── */}
      {activeTab === 'details' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FolderKanban size={18} color="#6366f1" /> General Information
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              {/* Project Code */}
              <FormInput
                label="Project Code"
                type="text"
                value={projectCode}
                onChange={(e) => setProjectCode(e.target.value)}
                required
              />

              {/* Project Name */}
              <FormInput
                label="Project Name"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Marina View Luxury Villa Fitout"
                required
              />

              {/* Customer Searchable Select */}
              <SearchableSelect
                label="Customer"
                placeholder="Search customer..."
                options={customerOptions}
                value={customerId}
                onChange={(val) => setCustomerId(String(val))}
                onAddNew={() => setIsCustomerModalOpen(true)}
                addNewLabel="+ Add New Customer"
                required
              />

              {/* Project Type */}
              <FormSelect
                label="Project Type"
                value={projectTypeId}
                onChange={(e) => setProjectTypeId(e.target.value)}
                options={[
                  { value: '', label: 'Select Project Type...' },
                  ...projectTypes.map((pt) => ({
                    value: String(pt.type_id),
                    label: `${pt.type_name} (${pt.type_code})`,
                  })),
                ]}
                required
              />

              {/* Currency */}
              <FormSelect
                label="Currency"
                value={currencyId}
                onChange={(e) => setCurrencyId(e.target.value)}
                options={currencies.map((c) => ({
                  value: String(c.currency_id),
                  label: `${c.currency_code} (${c.symbol}) — ${c.currency_name}`,
                }))}
                required
              />

              {/* Budget Amount */}
              <FormInput
                label={`Budget / Contract Value (${selectedCurrency.symbol})`}
                type="number"
                step="0.01"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
              />

              {/* Start & End Dates */}
              <FormInput
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />

              <FormInput
                label="Target End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />

              {/* Status */}
              <FormSelect
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={[
                  { value: 'active', label: 'Active / In Progress' },
                  { value: 'draft', label: 'Draft' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'on_hold', label: 'On Hold' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
                required
              />

              {/* Source Quotation Dropdown (optional) */}
              {!projectId && (
                <div>
                  <FormSelect
                    label="Import from Quotation (Optional)"
                    value={sourceQuotationId}
                    onChange={(e) => handleSelectQuotation(e.target.value)}
                    options={[
                      { value: '', label: 'None (Start from scratch)' },
                      ...quotations.map((q) => ({
                        value: String(q.quotation_id),
                        label: `${q.quotation_code} — ${q.customer_name || 'Client'} (${q.status})`,
                      })),
                    ]}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Selecting an approved quotation imports all WBS trees and pricing.
                  </span>
                </div>
              )}
            </div>

            {/* Address & Notes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '1.25rem' }}>
              <FormInput
                label="Site Address / Location"
                type="text"
                value={projectAddress}
                onChange={(e) => setProjectAddress(e.target.value)}
                placeholder="e.g. Palm Jumeirah Villa 42, Dubai"
              />

              <FormInput
                label="Project Notes / Scope"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Key project milestones or client instructions..."
              />
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: WBS & TASKS ──────────────────────────────────────────────── */}
      {activeTab === 'wbs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={18} color="#a855f7" /> Work Breakdown Structure (WBS)
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                  Single combined WBS tree imported from quotation or template. Add extra project-specific tasks anytime.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button type="button" variant="secondary" onClick={handleAddCustomWbs}>
                  <Sparkles size={14} /> + Add Extra Project WBS
                </Button>
              </div>
            </div>

            {/* Available WBS Templates */}
            {availableWbsTemplates.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Import WBS from Master Templates:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {availableWbsTemplates.map((t) => {
                    const isSelected = selectedWbsTemplateIds.includes(t.template_id);
                    return (
                      <button
                        key={t.template_id}
                        type="button"
                        onClick={() => handleToggleWbsTemplate(t.template_id)}
                        style={{
                          padding: '0.4rem 0.75rem',
                          borderRadius: '20px',
                          border: isSelected ? '1px solid #a855f7' : '1px solid var(--border-color)',
                          background: isSelected ? 'rgba(168,85,247,0.15)' : 'transparent',
                          color: isSelected ? '#d8b4fe' : 'var(--text-secondary)',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        {isSelected && <Check size={13} color="#a855f7" />}
                        {t.template_name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* WBS Allocations List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {wbsAllocations.map((wbs, idx) => (
                <div
                  key={wbs.id}
                  style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.02)',
                    border: wbs.is_custom ? '1px solid rgba(168,85,247,0.4)' : '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#a855f7' }}>#{idx + 1}</span>
                      <input
                        type="text"
                        value={wbs.wbs_name}
                        onChange={(e) => handleUpdateWbs(wbs.id, { wbs_name: e.target.value })}
                        placeholder="WBS Task Name"
                        style={{
                          flex: 1,
                          padding: '0.45rem 0.65rem',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-input)',
                          color: 'var(--text-primary)',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                        }}
                        required
                      />
                      {wbs.is_custom && <Badge variant="warning">✨ Extra Project WBS</Badge>}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="date"
                        value={wbs.start_date}
                        onChange={(e) => handleUpdateWbs(wbs.id, { start_date: e.target.value })}
                        title="Start Date"
                        style={{ padding: '0.35rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
                      />
                      <span style={{ color: 'var(--text-secondary)' }}>to</span>
                      <input
                        type="date"
                        value={wbs.end_date}
                        onChange={(e) => handleUpdateWbs(wbs.id, { end_date: e.target.value })}
                        title="End Date"
                        style={{ padding: '0.35rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
                      />

                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => handleRemoveWbs(wbs.id)}
                        style={{ padding: '0.3rem 0.5rem', color: '#ef4444' }}
                        title="Remove Task"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>

                  {/* Planned Quantities & Costs Row */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: '0.75rem',
                      background: 'rgba(0,0,0,0.15)',
                      padding: '0.65rem',
                      borderRadius: '6px',
                    }}
                  >
                    <div>
                      <label style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>Planned Hours</label>
                      <input
                        type="number"
                        value={wbs.total_hours || ''}
                        onChange={(e) => handleUpdateWbs(wbs.id, { total_hours: parseFloat(e.target.value) || 0 })}
                        style={{ width: '100%', padding: '0.3rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '0.82rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>Planned Labour Cost ({selectedCurrency.symbol})</label>
                      <input
                        type="number"
                        value={wbs.planned_labour_cost || ''}
                        onChange={(e) => handleUpdateWbs(wbs.id, { planned_labour_cost: parseFloat(e.target.value) || 0 })}
                        style={{ width: '100%', padding: '0.3rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '0.82rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>Planned Material Cost ({selectedCurrency.symbol})</label>
                      <input
                        type="number"
                        value={wbs.planned_material_cost || ''}
                        onChange={(e) => handleUpdateWbs(wbs.id, { planned_material_cost: parseFloat(e.target.value) || 0 })}
                        style={{ width: '100%', padding: '0.3rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '0.82rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>Total Task Budget</label>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#10b981', paddingTop: '0.3rem' }}>
                        {selectedCurrency.symbol} {wbs.budget_amount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {wbsAllocations.length === 0 && (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                  No WBS tasks assigned. Import from WBS templates above or click "+ Add Extra Project WBS".
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: PROJECT DOCUMENTS ────────────────────────────────────────── */}
      {activeTab === 'documents' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Paperclip size={18} color="#10b981" /> Project Documents & Attachments
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                  Upload drawings, BOQs, contracts, and handover documents specifically linked to this project.
                </p>
              </div>

              {projectId ? (
                <Button variant="primary" onClick={() => setIsDocUploadModalOpen(true)}>
                  <Upload size={14} /> Upload New Document
                </Button>
              ) : (
                <Badge variant="warning">Save project to enable document uploads</Badge>
              )}
            </div>

            {/* Document Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {documents.map((doc) => (
                <div
                  key={doc.document_id}
                  style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                    <FileText size={22} color="#6366f1" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {doc.document_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {doc.created_at ? doc.created_at.split('T')[0] : '—'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                    <a
                      href={doc.file_path || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        color: '#6366f1',
                        textDecoration: 'none',
                        background: 'rgba(99,102,241,0.1)',
                      }}
                    >
                      <Eye size={12} /> View
                    </a>

                    <button
                      type="button"
                      onClick={() => handleDeleteDocument(doc.document_id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        color: '#ef4444',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}

              {documents.length === 0 && (
                <div style={{ gridColumn: '1 / -1', padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                  No documents uploaded for this project yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── QUICK CUSTOMER CREATION MODAL ────────────────────────────────────── */}
      <Modal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} title="Add New Customer">
        <form onSubmit={handleQuickCustomerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <FormInput
            label="Customer Name"
            type="text"
            value={quickCustName}
            onChange={(e) => setQuickCustName(e.target.value)}
            placeholder="e.g. Emaar Properties"
            required
          />
          <FormInput
            label="Contact Person"
            type="text"
            value={quickCustContact}
            onChange={(e) => setQuickCustContact(e.target.value)}
            placeholder="e.g. John Smith"
          />
          <FormInput
            label="Contact Number"
            type="text"
            value={quickCustPhone}
            onChange={(e) => setQuickCustPhone(e.target.value)}
            placeholder="+971 50 123 4567"
          />
          <FormInput
            label="Email Address"
            type="email"
            value={quickCustEmail}
            onChange={(e) => setQuickCustEmail(e.target.value)}
            placeholder="client@example.com"
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsCustomerModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isSavingCustomer}>
              {isSavingCustomer ? 'Saving...' : 'Save & Select'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── PROJECT DOCUMENT UPLOAD MODAL ────────────────────────────────────── */}
      <Modal isOpen={isDocUploadModalOpen} onClose={() => setIsDocUploadModalOpen(false)} title="Upload Project Document">
        <form onSubmit={handleUploadDocument} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <FormInput
            label="Document Name"
            type="text"
            value={uploadDocName}
            onChange={(e) => setUploadDocName(e.target.value)}
            placeholder="e.g. Architectural Blueprint, Approved BOQ"
            required
          />

          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem', display: 'block' }}>
              Select File (PDF, Excel, Word, Images) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="file"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setUploadFile(e.target.files[0]);
                  if (!uploadDocName) setUploadDocName(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
                }
              }}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
              }}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsDocUploadModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isUploadingDoc}>
              {isUploadingDoc ? 'Uploading...' : 'Upload Document'}
            </Button>
          </div>
        </form>
      </Modal>
    </FormPageLayout>
  );
};

export default ProjectForm;
