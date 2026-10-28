import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { DataTable, Column } from '../components/common/DataTable';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';
import { Badge } from '../components/common/Badge';
import {
  LucideIcon, Plus, Edit, Eye, Trash2, Power, Sparkles, Loader2, FileText,
  CheckCircle, AlertCircle, FolderKanban, Layers, Package, Users,
  Briefcase, Ruler, Building2, Coins, Percent, CalendarCheck, Sliders
} from 'lucide-react';
import { showSuccess, showError, showWarning } from '../utils/toast';
import { WbsTemplates } from './WbsTemplates';
import { Employees } from './Employees';
import { Labours } from './Labours';
import { Materials } from './Materials';

export type MasterTab =
  | 'project_types'
  | 'wbs_templates'
  | 'terms_templates'
  | 'materials'
  | 'employees'
  | 'labour_types'
  | 'units'
  | 'communities'
  | 'currencies'
  | 'taxes'
  | 'calendars';

export interface MasterTabDef {
  key: MasterTab;
  label: string;
  icon: LucideIcon;
  slug: string;
}

export const masterTabDefinitions: MasterTabDef[] = [
  { key: 'project_types', label: 'Project Types', icon: FolderKanban, slug: 'project-types' },
  { key: 'wbs_templates', label: 'WBS Templates', icon: Layers, slug: 'wbs-templates' },
  { key: 'terms_templates', label: 'Terms & Conditions', icon: FileText, slug: 'terms' },
  { key: 'materials', label: 'Materials', icon: Package, slug: 'materials' },
  { key: 'employees', label: 'Employee Master', icon: Users, slug: 'employees' },
  { key: 'labour_types', label: 'Labour / Contractor', icon: Briefcase, slug: 'labour' },
  { key: 'units', label: 'Units & Disciplines', icon: Ruler, slug: 'units' },
  { key: 'communities', label: 'Communities', icon: Building2, slug: 'communities' },
  { key: 'currencies', label: 'Currency', icon: Coins, slug: 'currency' },
  { key: 'taxes', label: 'Taxes', icon: Percent, slug: 'taxes' },
  { key: 'calendars', label: 'Calendars & Holidays', icon: CalendarCheck, slug: 'calendars' },
];

export function parseMasterTab(tabStr?: string): MasterTab {
  if (!tabStr) return 'project_types';
  const clean = tabStr.toLowerCase().replace(/_/g, '-');
  if (clean === 'wbs-templates' || clean === 'wbs' || clean === 'wbs-template') return 'wbs_templates';
  if (clean === 'terms' || clean === 'terms-templates' || clean === 'terms_templates' || clean === 'terms-and-conditions') return 'terms_templates';
  if (clean === 'materials' || clean === 'material') return 'materials';
  if (clean === 'employees' || clean === 'employee') return 'employees';
  if (clean === 'labour' || clean === 'labours' || clean === 'contractor' || clean === 'contractors' || clean === 'labour-types' || clean === 'labour_types') return 'labour_types';
  if (clean === 'units' || clean === 'unit' || clean === 'disciplines' || clean === 'discipline') return 'units';
  if (clean === 'communities' || clean === 'community') return 'communities';
  if (clean === 'currency' || clean === 'currencies') return 'currencies';
  if (clean === 'taxes' || clean === 'tax') return 'taxes';
  if (clean === 'calendars' || clean === 'calendar' || clean === 'holidays') return 'calendars';
  if (clean === 'project-types' || clean === 'project_types') return 'project_types';
  return 'project_types';
}

export function masterTabToSlug(tab: MasterTab): string {
  const match = masterTabDefinitions.find(t => t.key === tab);
  return match ? match.slug : 'project-types';
}

interface MastersProps {
  initialTab?: string;
  initialAction?: string;
  onNavigate?: (page: string) => void;
}

// Auto short-form code generator helper
function generateShortCode(name: string, fallback = 'CODE'): string {
  if (!name || !name.trim()) return '';
  const clean = name.trim().replace(/[^a-zA-Z0-9\s]/g, ' ');
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return fallback;
  if (words.length === 1) {
    return words[0].substring(0, 4).toUpperCase();
  }
  return words.map(w => w[0]).join('').substring(0, 6).toUpperCase();
}

export const Masters: React.FC<MastersProps> = ({ initialTab, initialAction, onNavigate }) => {
  const { hasPermission, user } = useAuth();
  const isAdminOrSuperAdmin = user?.role_name === 'Admin' || user?.role_name === 'Super Admin';

  const [activeTab, setActiveTab] = useState<MasterTab>(() => parseMasterTab(initialTab));
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sync initialTab when provided or changed
  useEffect(() => {
    if (initialTab) {
      setActiveTab(parseMasterTab(initialTab));
    }
  }, [initialTab]);

  // Auto-open create modal if initialAction === 'create' for native tabs
  useEffect(() => {
    if (initialAction === 'create') {
      const parsed = parseMasterTab(initialTab);
      if (['project_types', 'terms_templates', 'units', 'communities', 'currencies', 'taxes', 'calendars'].includes(parsed)) {
        handleOpenModal();
      }
    }
  }, [initialAction, initialTab]);

  const handleTabChange = (key: MasterTab) => {
    setActiveTab(key);
    const slug = masterTabToSlug(key);
    const targetUrl = `masters?tab=${slug}`;
    if (onNavigate) {
      onNavigate(targetUrl);
    } else {
      window.location.hash = `#/${targetUrl}`;
    }
    sessionStorage.setItem('saved_page', targetUrl);
  };

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isManualCode, setIsManualCode] = useState(false);
  const [togglingId, setTogglingId] = useState<any>(null);

  // View Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    if (activeTab === 'wbs_templates' || activeTab === 'employees' || activeTab === 'labour_types' || activeTab === 'materials') {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    let endpoint = '';
    if (activeTab === 'project_types') endpoint = '/masters/project-types?all=true';
    if (activeTab === 'communities') endpoint = '/masters/communities';
    if (activeTab === 'terms_templates') endpoint = '/terms-templates?all=true';
    if (activeTab === 'currencies') endpoint = '/masters/currencies?all=true';
    if (activeTab === 'taxes') endpoint = '/masters/taxes?all=true';
    if (activeTab === 'units') endpoint = '/masters/disciplines?all=true';
    if (activeTab === 'calendars') endpoint = '/masters/calendars';

    const res = await apiRequest<any[]>(endpoint);
    if (res.success && res.data) {
      setData(res.data);
    }
    setIsLoading(false);
  };

  const handleOpenModal = (item?: any) => {
    setIsManualCode(!!item); // if editing, preserve existing code without auto-overwriting

    if (activeTab === 'terms_templates') {
      if (item) {
        setFormData({
          ...item,
          items: item.items ? item.items.map((it: any) => ({ ...it, is_mandatory: Boolean(it.is_mandatory) })) : [],
        });
      } else {
        setFormData({
          template_name: '',
          description: '',
          status: 1,
          items: [{ title: '', description: '', is_mandatory: false, sort_order: 1 }],
        });
      }
    } else if (activeTab === 'project_types') {
      setFormData(item ? { ...item } : { type_code: '', type_name: '', description: '', status: 1 });
    } else if (activeTab === 'units') {
      setFormData(item ? { ...item } : { discipline_code: '', discipline_name: '', description: '', status: 1 });
    } else if (activeTab === 'currencies') {
      setFormData(item ? { ...item } : { currency_code: '', currency_name: '', symbol: '', exchange_rate: 1.0, is_base: 0, status: 1 });
    } else if (activeTab === 'taxes') {
      setFormData(item ? { ...item } : { tax_code: '', tax_name: '', tax_type: 'GST', tax_percentage: 18, status: 1 });
    } else if (activeTab === 'communities') {
      setFormData(item ? { ...item } : { community_name: '', state: '' });
    } else if (activeTab === 'calendars') {
      setFormData(item ? { ...item } : { calendar_name: '', working_days_json: '[1,2,3,4,5,6]', working_hours_per_day: 10, status: 1 });
    } else {
      setFormData(item || {});
    }
    setIsModalOpen(true);
  };

  const handleOpenViewModal = (item: any) => {
    if (activeTab === 'calendars' && item) {
      apiRequest(`/masters/holidays?calendar_id=${item.id}`).then(res => {
        setViewingItem({ ...item, holidays: res.data || [] });
      });
      setViewingItem({ ...item, holidays: [] });
    } else {
      setViewingItem(item);
    }
    setIsViewModalOpen(true);
  };

  const handleToggleStatus = async (item: any) => {
    const currentStatus = item.status !== undefined ? Number(item.status) : 1;
    const newStatus = currentStatus === 1 ? 0 : 1;
    const itemId = item.template_id || item.type_id || item.currency_id || item.tax_id || item.discipline_id || item.id;
    setTogglingId(itemId);

    let res: any;
    if (activeTab === 'terms_templates') {
      res = await apiRequest(`/terms-templates/${item.template_id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
    } else if (activeTab === 'currencies') {
      res = await apiRequest(`/masters/currencies/${item.currency_id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
    } else if (activeTab === 'taxes') {
      res = await apiRequest(`/masters/taxes/${item.tax_id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
    } else if (activeTab === 'project_types') {
      res = await apiRequest(`/masters/project-types/${item.type_id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
    } else if (activeTab === 'units') {
      res = await apiRequest(`/masters/disciplines/${item.discipline_id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
    } else if (activeTab === 'calendars') {
      res = await apiRequest(`/masters/calendars/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
    }

    setTogglingId(null);
    if (res?.success) {
      showSuccess(`Status changed to ${newStatus === 1 ? 'Active' : 'Inactive'}`);
      fetchData();
    } else {
      showError(res?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (item: any) => {
    if (!window.confirm(`Are you sure you want to delete this ${activeTab.replace('_', ' ')}?`)) return;

    let endpoint = '';
    if (activeTab === 'terms_templates') endpoint = `/terms-templates/${item.template_id}`;

    if (endpoint) {
      const res = await apiRequest(endpoint, { method: 'DELETE' });
      if (res.success) {
        showSuccess('Record deleted successfully');
        fetchData();
      } else {
        showError(res.message || 'Failed to delete record');
      }
    }
  };

  // Name change handlers with automatic short-form generation
  const handleNameChange = (val: string) => {
    if (activeTab === 'project_types') {
      const updated: any = { ...formData, type_name: val };
      if (!isManualCode) {
        updated.type_code = generateShortCode(val, 'PRJ');
      }
      setFormData(updated);
    } else if (activeTab === 'units') {
      const updated: any = { ...formData, discipline_name: val };
      if (!isManualCode) {
        updated.discipline_code = generateShortCode(val, 'DISC');
      }
      setFormData(updated);
    } else if (activeTab === 'currencies') {
      const updated: any = { ...formData, currency_name: val };
      if (!isManualCode) {
        updated.currency_code = generateShortCode(val, 'CUR');
      }
      setFormData(updated);
    } else if (activeTab === 'taxes') {
      const updated: any = { ...formData, tax_name: val };
      if (!isManualCode) {
        updated.tax_code = generateShortCode(val, 'TAX');
      }
      setFormData(updated);
    } else if (activeTab === 'terms_templates') {
      setFormData({ ...formData, template_name: val });
    } else if (activeTab === 'communities') {
      setFormData({ ...formData, community_name: val });
    } else if (activeTab === 'calendars') {
      setFormData({ ...formData, calendar_name: val });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side Duplicate Name & Code Validation
    if (activeTab === 'terms_templates') {
      const trimmedName = (formData.template_name || '').trim().toLowerCase();
      if (!trimmedName) {
        showWarning('Template name cannot be empty');
        return;
      }
      const duplicate = data.find(
        (t) => t.template_name.trim().toLowerCase() === trimmedName && t.template_id !== formData.template_id
      );
      if (duplicate) {
        showError(`A Terms & Conditions template named "${formData.template_name.trim()}" already exists. Duplicate templates cannot be created.`);
        return;
      }
    } else if (activeTab === 'project_types') {
      const trimmedName = (formData.type_name || '').trim().toLowerCase();
      const trimmedCode = (formData.type_code || '').trim().toLowerCase();
      const duplicateName = data.find((p) => p.type_name?.trim().toLowerCase() === trimmedName && p.type_id !== formData.type_id);
      if (duplicateName) {
        showError(`A project type named "${formData.type_name.trim()}" already exists.`);
        return;
      }
      const duplicateCode = data.find((p) => p.type_code?.trim().toLowerCase() === trimmedCode && p.type_id !== formData.type_id);
      if (duplicateCode) {
        showError(`A project type with code "${formData.type_code.trim()}" already exists.`);
        return;
      }
    } else if (activeTab === 'units') {
      const trimmedName = (formData.discipline_name || '').trim().toLowerCase();
      const trimmedCode = (formData.discipline_code || '').trim().toLowerCase();
      const duplicateName = data.find((d) => d.discipline_name?.trim().toLowerCase() === trimmedName && d.discipline_id !== formData.discipline_id);
      if (duplicateName) {
        showError(`A discipline named "${formData.discipline_name.trim()}" already exists.`);
        return;
      }
      const duplicateCode = data.find((d) => d.discipline_code?.trim().toLowerCase() === trimmedCode && d.discipline_id !== formData.discipline_id);
      if (duplicateCode) {
        showError(`A discipline with code "${formData.discipline_code.trim()}" already exists.`);
        return;
      }
    } else if (activeTab === 'currencies') {
      const trimmedCode = (formData.currency_code || '').trim().toLowerCase();
      const duplicateCode = data.find((c) => c.currency_code?.trim().toLowerCase() === trimmedCode && c.currency_id !== formData.currency_id);
      if (duplicateCode) {
        showError(`A currency with code "${formData.currency_code.trim()}" already exists.`);
        return;
      }
    } else if (activeTab === 'taxes') {
      const trimmedName = (formData.tax_name || '').trim().toLowerCase();
      const duplicateName = data.find((t) => t.tax_name?.trim().toLowerCase() === trimmedName && t.tax_id !== formData.tax_id);
      if (duplicateName) {
        showError(`A tax named "${formData.tax_name.trim()}" already exists.`);
        return;
      }
    } else if (activeTab === 'communities') {
      const trimmedName = (formData.community_name || '').trim().toLowerCase();
      const duplicateName = data.find((c) => c.community_name?.trim().toLowerCase() === trimmedName && c.community_id !== formData.community_id);
      if (duplicateName) {
        showError(`A community named "${formData.community_name.trim()}" already exists.`);
        return;
      }
    }

    setIsSubmitting(true);

    let endpoint = '';
    let isEdit = false;
    let itemId = '';

    if (activeTab === 'project_types') {
      endpoint = '/masters/project-types';
      isEdit = !!formData.type_id;
      itemId = formData.type_id;
    } else if (activeTab === 'communities') {
      endpoint = '/masters/communities';
      isEdit = !!formData.community_id;
      itemId = formData.community_id;
    } else if (activeTab === 'terms_templates') {
      endpoint = '/terms-templates';
      isEdit = !!formData.template_id;
      itemId = formData.template_id;
    } else if (activeTab === 'currencies') {
      endpoint = '/masters/currencies';
      isEdit = !!formData.currency_id;
      itemId = formData.currency_id;
    } else if (activeTab === 'taxes') {
      endpoint = '/masters/taxes';
      isEdit = !!formData.tax_id;
      itemId = formData.tax_id;
    } else if (activeTab === 'units') {
      endpoint = '/masters/disciplines';
      isEdit = !!formData.discipline_id;
      itemId = formData.discipline_id;
    } else if (activeTab === 'calendars') {
      endpoint = '/masters/calendars';
      isEdit = !!formData.id;
      itemId = formData.id;
    }

    const method = isEdit ? 'PUT' : 'POST';
    const submitEndpoint = isEdit ? `${endpoint}/${itemId}` : endpoint;

    const payload = { ...formData };
    if (activeTab === 'terms_templates') {
      payload.items = (formData.items || []).map((it: any, idx: number) => ({
        ...it,
        is_mandatory: it.is_mandatory ? 1 : 0,
        sort_order: idx + 1,
      }));
    }

    const res = await apiRequest(submitEndpoint, {
      method,
      body: JSON.stringify(payload),
    });

    setIsSubmitting(false);

    if (res.success) {
      showSuccess(`${activeTab.replace('_', ' ')} saved successfully`);
      setIsModalOpen(false);
      fetchData();
    } else {
      showError(res.message || 'Failed to save record');
    }
  };

  const getColumns = (): Column<any>[] => {
    if (activeTab === 'project_types') {
      return [
        { header: 'Project Type Name', accessor: 'type_name', sortKey: 'type_name' },
        {
          header: 'Short Code',
          accessor: (r) => (
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#38bdf8', background: 'rgba(56,189,248,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
              {r.type_code}
            </span>
          ),
          sortKey: 'type_code'
        },
        { header: 'Description', accessor: (r) => r.description || '—' },
        {
          header: 'Status',
          accessor: (r) => (
            <Badge variant={r.status === 1 ? 'success' : 'secondary'}>
              {r.status === 1 ? 'Active' : 'Inactive'}
            </Badge>
          ),
        },
      ];
    }
    if (activeTab === 'communities') {
      return [
        { header: 'Community Name', accessor: 'community_name', sortKey: 'community_name' },
        { header: 'State/Region', accessor: (r) => r.state || '—' },
      ];
    }
    if (activeTab === 'currencies') {
      return [
        {
          header: 'Code',
          accessor: (r) => (
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
              {r.currency_code}
            </span>
          ),
          sortKey: 'currency_code'
        },
        { header: 'Currency Name', accessor: 'currency_name', sortKey: 'currency_name' },
        { header: 'Symbol', accessor: 'symbol' },
        { header: 'Exchange Rate', accessor: 'exchange_rate' },
        {
          header: 'Status',
          accessor: (r) => (
            <Badge variant={r.status === 1 ? 'success' : 'secondary'}>
              {r.status === 1 ? 'Active' : 'Inactive'}
            </Badge>
          ),
        },
      ];
    }
    if (activeTab === 'taxes') {
      return [
        { header: 'Tax Name', accessor: 'tax_name', sortKey: 'tax_name' },
        {
          header: 'Tax Code',
          accessor: (r) => (
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
              {r.tax_code || '—'}
            </span>
          )
        },
        { header: 'Percentage', accessor: (r) => `${r.tax_percentage}%`, sortKey: 'tax_percentage' },
        { header: 'Type', accessor: 'tax_type' },
        {
          header: 'Status',
          accessor: (r) => (
            <Badge variant={r.status === 1 ? 'success' : 'secondary'}>
              {r.status === 1 ? 'Active' : 'Inactive'}
            </Badge>
          ),
        },
      ];
    }
    if (activeTab === 'units') {
      return [
        { header: 'Discipline / Unit Name', accessor: 'discipline_name', sortKey: 'discipline_name' },
        {
          header: 'Code',
          accessor: (r) => (
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#a855f7', background: 'rgba(168,85,247,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
              {r.discipline_code}
            </span>
          ),
          sortKey: 'discipline_code'
        },
        { header: 'Description', accessor: (r) => r.description || '—' },
        {
          header: 'Status',
          accessor: (r) => (
            <Badge variant={r.status === 1 ? 'success' : 'secondary'}>
              {r.status === 1 ? 'Active' : 'Inactive'}
            </Badge>
          ),
        },
      ];
    }
    if (activeTab === 'labour_types') {
      return [
        { header: 'Labour Name', accessor: 'name', sortKey: 'name' },
        { header: 'Category / Type', accessor: (r) => r.labour_category || r.labour_type || 'Contractor' },
        { header: 'Pay Rate', accessor: (r) => r.hourly_rate ? `₹${r.hourly_rate}/hr` : r.monthly_salary ? `₹${r.monthly_salary}/mo` : r.daily_rate ? `₹${r.daily_rate}/day` : '-' },
        { header: 'Contact', accessor: 'contact_number' },
      ];
    }
    if (activeTab === 'calendars') {
      return [
        { header: 'Calendar Name', accessor: 'calendar_name', sortKey: 'calendar_name' },
        { header: 'Working Days', accessor: (r) => {
            try {
              const days = JSON.parse(r.working_days_json);
              const map = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              return days.map((d: number) => map[d]).join(', ');
            } catch { return '—'; }
        } },
        { header: 'Hrs / Day', accessor: 'working_hours_per_day' },
        {
          header: 'Status',
          accessor: (r) => (
            <Badge variant={r.status === 1 ? 'success' : 'secondary'}>
              {r.status === 1 ? 'Active' : 'Inactive'}
            </Badge>
          ),
        },
      ];
    }
    // Terms & Conditions Templates
    return [
      {
        header: 'Template Name',
        accessor: (r) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={16} color="#818cf8" />
            <span style={{ fontWeight: 600 }}>{r.template_name}</span>
          </div>
        ),
        sortKey: 'template_name'
      },
      { header: 'Description', accessor: (r) => r.description || '—' },
      {
        header: 'Clauses Count',
        accessor: (r) => (
          <span style={{ fontWeight: 600, color: '#818cf8', background: 'rgba(129,140,248,0.1)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem' }}>
            {r.items ? r.items.length : 0} clauses
          </span>
        ),
      },
      {
        header: 'Status',
        accessor: (r) => (
          <Badge variant={r.status === 1 ? 'success' : 'secondary'}>
            {r.status === 1 ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
    ];
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Sliders size={24} style={{ color: 'var(--accent-primary, #6366f1)' }} />
            Master Management
          </h1>
          <p className="page-subtitle">
            Centralized master repository for project types, WBS hierarchies, terms & conditions, workforce masters, materials, and enterprise reference configurations.
          </p>
        </div>
        {(activeTab === 'project_types' || activeTab === 'terms_templates' || activeTab === 'units' || activeTab === 'communities' || activeTab === 'currencies' || activeTab === 'taxes' || activeTab === 'calendars') && (
          <Button variant="primary" onClick={() => handleOpenModal()}>
            <Plus size={16} /> Add New
          </Button>
        )}
      </div>

      {/* Master Tabs Navigation Bar */}
      <div
        role="tablist"
        aria-label="Master Modules Navigation"
        style={{
          display: 'flex',
          gap: '0.35rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid var(--border-color)',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: '0.35rem',
          scrollbarWidth: 'thin',
        }}
        className="master-tab-bar"
      >
        {masterTabDefinitions.map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTabChange(tab.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1rem',
                background: isActive ? 'rgba(79, 70, 229, 0.12)' : 'transparent',
                border: 'none',
                borderBottom: isActive ? '2.5px solid var(--accent-primary, #6366f1)' : '2.5px solid transparent',
                borderRadius: '8px 8px 0 0',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease-in-out',
                outline: 'none',
              }}
              title={tab.label}
              className={`master-tab-btn ${isActive ? 'active' : ''}`}
            >
              <Icon size={16} color={isActive ? '#818cf8' : 'currentColor'} style={{ flexShrink: 0 }} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Embedded Master Modules */}
      {activeTab === 'wbs_templates' && (
        <WbsTemplates isEmbedded={true} initialAction={initialAction as any} onNavigate={onNavigate} />
      )}

      {activeTab === 'employees' && (
        <Employees isEmbedded={true} initialAction={initialAction as any} onNavigate={onNavigate} />
      )}

      {activeTab === 'labour_types' && (
        <Labours isEmbedded={true} defaultTab="registry" initialAction={initialAction as any} onNavigate={onNavigate} />
      )}

      {activeTab === 'materials' && (
        <Materials isMasterOnly={true} onNavigate={onNavigate} />
      )}

      {/* Native Master Modules DataTable */}
      {(activeTab === 'project_types' || activeTab === 'terms_templates' || activeTab === 'units' || activeTab === 'communities' || activeTab === 'currencies' || activeTab === 'taxes' || activeTab === 'calendars') && (
        <div className="glass-card">
          {isLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <Loader2 size={32} className="spin" color="#6366f1" />
              <span>Loading {activeTab.replace('_', ' ')} data...</span>
            </div>
          ) : (
            <DataTable
              columns={getColumns()}
              data={data}
              searchPlaceholder={`Search ${activeTab.replace('_', ' ')}...`}
              isLoading={false}
              actions={(row) => {
                const rowId = row.template_id || row.type_id || row.currency_id || row.tax_id || row.discipline_id;
                const isTogglingThis = togglingId === rowId;

                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {/* View Button */}
                    <Button
                      variant="secondary"
                      onClick={() => handleOpenViewModal(row)}
                      style={{ padding: '0.3rem 0.55rem', fontSize: '0.78rem' }}
                      title="View Details"
                    >
                      <Eye size={13} /> View
                    </Button>

                    {/* Edit Button */}
                    <Button
                      variant="secondary"
                      onClick={() => handleOpenModal(row)}
                      style={{ padding: '0.3rem 0.55rem', fontSize: '0.78rem' }}
                      title="Edit Record"
                    >
                      <Edit size={13} /> Edit
                    </Button>

                    {/* Status Toggle Button */}
                    {(activeTab === 'terms_templates' || activeTab === 'currencies' || activeTab === 'taxes' || activeTab === 'project_types' || activeTab === 'units' || activeTab === 'calendars') && (
                      <Button
                        variant="secondary"
                        onClick={() => handleToggleStatus(row)}
                        disabled={isTogglingThis}
                        style={{
                          padding: '0.3rem 0.55rem',
                          fontSize: '0.78rem',
                          color: row.status === 1 ? '#10b981' : '#64748b',
                        }}
                        title={row.status === 1 ? 'Deactivate' : 'Activate'}
                      >
                        {isTogglingThis ? <Loader2 size={13} className="spin" /> : <Power size={13} />}
                        {row.status === 1 ? 'Active' : 'Inactive'}
                      </Button>
                    )}

                    {/* Delete Button (Terms templates) */}
                    {activeTab === 'terms_templates' && isAdminOrSuperAdmin && (
                      <Button
                        variant="secondary"
                        onClick={() => handleDelete(row)}
                        style={{ padding: '0.3rem 0.55rem', fontSize: '0.78rem', color: '#ef4444' }}
                        title="Delete Template"
                      >
                        <Trash2 size={13} />
                      </Button>
                    )}
                  </div>
                );
              }}
            />
          )}
        </div>
      )}

      {/* View Modal */}
      {viewingItem && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={`View Details — ${activeTab.replace('_', ' ').toUpperCase()}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '75vh', overflowY: 'auto' }}>
            {activeTab === 'terms_templates' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={20} color="#818cf8" />
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {viewingItem.template_name}
                    </h3>
                  </div>
                  <Badge variant={viewingItem.status === 1 ? 'success' : 'secondary'}>
                    {viewingItem.status === 1 ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {viewingItem.description && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, background: 'var(--border-color)', padding: '0.65rem', borderRadius: '6px' }}>
                    {viewingItem.description}
                  </p>
                )}

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    Clauses & Conditions ({viewingItem.items ? viewingItem.items.length : 0})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {(viewingItem.items || []).map((it: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          padding: '0.75rem 0.95rem',
                          borderRadius: '8px',
                          background: 'var(--border-color)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                            {idx + 1}. {it.title}
                          </span>
                          <Badge variant={it.is_mandatory ? 'danger' : 'secondary'}>
                            {it.is_mandatory ? 'Mandatory' : 'Optional'}
                          </Badge>
                        </div>
                        <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', margin: 0, whiteSpace: 'pre-line' }}>
                          {it.description || 'No detailed clause description.'}
                        </p>
                      </div>
                    ))}
                    {(!viewingItem.items || viewingItem.items.length === 0) && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>No clauses configured in this template.</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'project_types' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Project Type Name:</span> <div style={{ fontWeight: 600 }}>{viewingItem.type_name}</div></div>
                <div><span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Short Code:</span> <div><span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#38bdf8' }}>{viewingItem.type_code}</span></div></div>
                <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Description:</span> <div>{viewingItem.description || '—'}</div></div>
                <div><span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Status:</span> <div><Badge variant={viewingItem.status === 1 ? 'success' : 'secondary'}>{viewingItem.status === 1 ? 'Active' : 'Inactive'}</Badge></div></div>
              </div>
            )}

            {activeTab === 'units' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Discipline / Unit Name:</span> <div style={{ fontWeight: 600 }}>{viewingItem.discipline_name}</div></div>
                <div><span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Short Code:</span> <div><span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#a855f7' }}>{viewingItem.discipline_code}</span></div></div>
                <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Description:</span> <div>{viewingItem.description || '—'}</div></div>
                <div><span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Status:</span> <div><Badge variant={viewingItem.status === 1 ? 'success' : 'secondary'}>{viewingItem.status === 1 ? 'Active' : 'Inactive'}</Badge></div></div>
              </div>
            )}

            {activeTab === 'currencies' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Currency Code:</span> <div><span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#10b981' }}>{viewingItem.currency_code}</span></div></div>
                <div><span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Currency Name:</span> <div style={{ fontWeight: 600 }}>{viewingItem.currency_name}</div></div>
                <div><span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Symbol:</span> <div style={{ fontWeight: 600 }}>{viewingItem.symbol}</div></div>
                <div><span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Exchange Rate:</span> <div style={{ fontWeight: 600 }}>{viewingItem.exchange_rate}</div></div>
                <div><span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Status:</span> <div><Badge variant={viewingItem.status === 1 ? 'success' : 'secondary'}>{viewingItem.status === 1 ? 'Active' : 'Inactive'}</Badge></div></div>
              </div>
            )}

            {activeTab === 'taxes' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Tax Name:</span> <div style={{ fontWeight: 600 }}>{viewingItem.tax_name}</div></div>
                <div><span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Tax Code:</span> <div><span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#f59e0b' }}>{viewingItem.tax_code || '—'}</span></div></div>
                <div><span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Type:</span> <div>{viewingItem.tax_type || '—'}</div></div>
                <div><span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Percentage:</span> <div style={{ fontWeight: 600 }}>{viewingItem.tax_percentage}%</div></div>
                <div><span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Status:</span> <div><Badge variant={viewingItem.status === 1 ? 'success' : 'secondary'}>{viewingItem.status === 1 ? 'Active' : 'Inactive'}</Badge></div></div>
              </div>
            )}

            {activeTab === 'communities' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Community Name:</span> <div style={{ fontWeight: 600 }}>{viewingItem.community_name}</div></div>
                <div><span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>State / Region:</span> <div>{viewingItem.state || '—'}</div></div>
              </div>
            )}

            {activeTab === 'calendars' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Calendar Name:</span> <div style={{ fontWeight: 600 }}>{viewingItem.calendar_name}</div></div>
                <div><span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Working Hours/Day:</span> <div>{viewingItem.working_hours_per_day}</div></div>
                <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Working Days:</span> <div>{
                  (() => {
                    try {
                      const days = JSON.parse(viewingItem.working_days_json);
                      const map = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                      return days.map((d: number) => map[d]).join(', ');
                    } catch { return '—'; }
                  })()
                }</div></div>
                <div><span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Status:</span> <div><Badge variant={viewingItem.status === 1 ? 'success' : 'secondary'}>{viewingItem.status === 1 ? 'Active' : 'Inactive'}</Badge></div></div>
                
                {viewingItem.holidays && viewingItem.holidays.length > 0 && (
                  <div style={{ gridColumn: '1 / -1', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Holidays ({viewingItem.holidays.length})</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {viewingItem.holidays.map((h: any, idx: number) => (
                        <div key={idx} style={{ padding: '0.5rem', background: 'var(--border-color)', borderRadius: '6px', fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: 600, color: '#f87171' }}>{h.holiday_date ? h.holiday_date.split('T')[0] : ''}</span> 
                          {' - '} {h.description || 'No description'} 
                          <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>({h.type.replace('_', ' ')})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create / Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Manage ${activeTab.replace('_', ' ').toUpperCase()}`}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {activeTab === 'project_types' && (
            <>
              <FormInput
                label="Project Type Name"
                type="text"
                value={formData.type_name || ''}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Residential Villa, Commercial Tower"
                required
              />
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Type Short Code <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsManualCode(false);
                      setFormData({ ...formData, type_code: generateShortCode(formData.type_name, 'PRJ') });
                    }}
                    style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Sparkles size={12} /> Auto Generate
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.type_code || ''}
                  onChange={(e) => {
                    setIsManualCode(true);
                    setFormData({ ...formData, type_code: e.target.value.toUpperCase() });
                  }}
                  placeholder="e.g. RV, COM-TWR"
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                  }}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Auto-generated short code from name. You can manually edit it.</span>
              </div>
              <FormInput label="Description" type="text" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Optional description..." />
              <FormSelect
                label="Status"
                value={formData.status !== undefined ? String(formData.status) : '1'}
                onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) })}
                options={[{ value: '1', label: 'Active' }, { value: '0', label: 'Inactive' }]}
              />
            </>
          )}

          {activeTab === 'units' && (
            <>
              <FormInput
                label="Discipline / Unit Name"
                type="text"
                value={formData.discipline_name || ''}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Civil Works, Electrical Engineering"
                required
              />
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Discipline Short Code <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsManualCode(false);
                      setFormData({ ...formData, discipline_code: generateShortCode(formData.discipline_name, 'DISC') });
                    }}
                    style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Sparkles size={12} /> Auto Generate
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.discipline_code || ''}
                  onChange={(e) => {
                    setIsManualCode(true);
                    setFormData({ ...formData, discipline_code: e.target.value.toUpperCase() });
                  }}
                  placeholder="e.g. CW, ELEC"
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                  }}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Auto-generated short code from discipline name.</span>
              </div>
              <FormInput label="Description" type="text" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              <FormSelect
                label="Status"
                value={formData.status !== undefined ? String(formData.status) : '1'}
                onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) })}
                options={[{ value: '1', label: 'Active' }, { value: '0', label: 'Inactive' }]}
              />
            </>
          )}

          {activeTab === 'communities' && (
            <>
              <FormInput
                label="Community Name"
                type="text"
                value={formData.community_name || ''}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Downtown Dubai, Business Bay"
                required
              />
              <FormInput label="State/Region" type="text" value={formData.state || ''} onChange={(e) => setFormData({ ...formData, state: e.target.value })} placeholder="e.g. Dubai, Abu Dhabi" />
            </>
          )}

          {activeTab === 'currencies' && (
            <>
              <FormInput
                label="Currency Name"
                type="text"
                value={formData.currency_name || ''}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. UAE Dirham, US Dollar, Indian Rupee"
                required
              />
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Currency Code (e.g. AED, USD, INR) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsManualCode(false);
                      setFormData({ ...formData, currency_code: generateShortCode(formData.currency_name, 'CUR') });
                    }}
                    style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Sparkles size={12} /> Auto Generate
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.currency_code || ''}
                  onChange={(e) => {
                    setIsManualCode(true);
                    setFormData({ ...formData, currency_code: e.target.value.toUpperCase() });
                  }}
                  placeholder="e.g. AED, USD, EUR"
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                  }}
                  required
                />
              </div>
              <FormInput label="Currency Symbol (e.g. AED, $, ₹)" type="text" value={formData.symbol || ''} onChange={(e) => setFormData({ ...formData, symbol: e.target.value })} required />
              <FormInput label="Exchange Rate (relative to base currency)" type="number" step="0.000001" value={formData.exchange_rate || 1.0} onChange={(e) => setFormData({ ...formData, exchange_rate: parseFloat(e.target.value) })} required />
              <FormSelect
                label="Status"
                value={formData.status !== undefined ? String(formData.status) : '1'}
                onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) })}
                options={[{ value: '1', label: 'Active' }, { value: '0', label: 'Inactive' }]}
              />
            </>
          )}

          {activeTab === 'taxes' && (
            <>
              <FormInput
                label="Tax Name"
                type="text"
                value={formData.tax_name || ''}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Value Added Tax 5%, GST 18%"
                required
              />
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Tax Short Code
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsManualCode(false);
                      setFormData({ ...formData, tax_code: generateShortCode(formData.tax_name, 'TAX') });
                    }}
                    style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Sparkles size={12} /> Auto Generate
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.tax_code || ''}
                  onChange={(e) => {
                    setIsManualCode(true);
                    setFormData({ ...formData, tax_code: e.target.value.toUpperCase() });
                  }}
                  placeholder="e.g. VAT-5, GST-18"
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                  }}
                />
              </div>
              <FormSelect
                label="Tax Type"
                value={formData.tax_type || 'VAT'}
                onChange={(e) => setFormData({ ...formData, tax_type: e.target.value })}
                options={[
                  { value: 'VAT', label: 'VAT (Value Added Tax)' },
                  { value: 'GST', label: 'GST (Goods & Services Tax)' },
                  { value: 'CGST_SGST', label: 'CGST / SGST' },
                  { value: 'IGST', label: 'IGST' },
                  { value: 'SALES_TAX', label: 'Sales Tax' },
                  { value: 'OTHER', label: 'Other' },
                ]}
              />
              <FormInput label="Tax Percentage (%)" type="number" step="0.01" value={formData.tax_percentage !== undefined ? formData.tax_percentage : 5} onChange={(e) => setFormData({ ...formData, tax_percentage: parseFloat(e.target.value) })} required />
              <FormSelect
                label="Status"
                value={formData.status !== undefined ? String(formData.status) : '1'}
                onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) })}
                options={[{ value: '1', label: 'Active' }, { value: '0', label: 'Inactive' }]}
              />
            </>
          )}

          {activeTab === 'terms_templates' && (
            <>
              <FormInput
                label="Template Name"
                type="text"
                value={formData.template_name || ''}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Standard Construction Terms, Turnkey Fitout Terms"
                required
              />
              <FormInput
                label="Description / Scope"
                type="text"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief summary of where this template applies..."
              />
              <FormSelect
                label="Status"
                value={formData.status !== undefined ? String(formData.status) : '1'}
                onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) })}
                options={[{ value: '1', label: 'Active' }, { value: '0', label: 'Inactive' }]}
              />

              <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Clauses / Conditions</h4>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      const currentItems = formData.items || [];
                      setFormData({
                        ...formData,
                        items: [...currentItems, { title: '', description: '', is_mandatory: false, sort_order: currentItems.length + 1 }],
                      });
                    }}
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                  >
                    <Plus size={12} /> Add Condition
                  </Button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
                  {(formData.items || []).map((item: any, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem',
                        padding: '0.65rem',
                        background: 'var(--border-color)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Clause #{idx + 1}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={Boolean(item.is_mandatory)}
                              onChange={(e) => {
                                const newItems = [...formData.items];
                                newItems[idx].is_mandatory = e.target.checked;
                                setFormData({ ...formData, items: newItems });
                              }}
                            />
                            <span style={{ color: item.is_mandatory ? '#ef4444' : 'var(--text-secondary)', fontWeight: item.is_mandatory ? 600 : 400 }}>
                              Mandatory
                            </span>
                          </label>

                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                              const newItems = formData.items.filter((_: any, i: number) => i !== idx);
                              setFormData({ ...formData, items: newItems });
                            }}
                            style={{ padding: '0.15rem 0.4rem', color: '#ef4444', height: 'auto', minHeight: 'auto', fontSize: '0.75rem' }}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>

                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[idx].title = e.target.value;
                          setFormData({ ...formData, items: newItems });
                        }}
                        style={{
                          padding: '0.45rem',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-input)',
                          color: 'var(--text-primary)',
                          fontSize: '0.85rem',
                        }}
                        placeholder="Condition Title (e.g. Payment Schedule, Site Handover, Retention)"
                        required
                      />
                      <textarea
                        value={item.description}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[idx].description = e.target.value;
                          setFormData({ ...formData, items: newItems });
                        }}
                        style={{
                          padding: '0.45rem',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-input)',
                          color: 'var(--text-primary)',
                          minHeight: '50px',
                          fontSize: '0.83rem',
                          fontFamily: 'inherit',
                        }}
                        placeholder="Detailed clause text..."
                      />
                    </div>
                  ))}
                  {(!formData.items || formData.items.length === 0) && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>
                      No clauses added. Click "Add Condition" above.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'calendars' && (
            <>
              <FormInput
                label="Calendar Name"
                type="text"
                value={formData.calendar_name || ''}
                onChange={(e) => setFormData({ ...formData, calendar_name: e.target.value })}
                placeholder="e.g. standard_5_day, 6_day_week"
                required
              />
              <FormInput
                label="Working Days (JSON Array [0=Sun...6=Sat])"
                type="text"
                value={formData.working_days_json || ''}
                onChange={(e) => setFormData({ ...formData, working_days_json: e.target.value })}
                placeholder="e.g. [1,2,3,4,5,6]"
                required
              />
              <FormInput
                label="Working Hours per Day"
                type="number"
                step="0.5"
                value={formData.working_hours_per_day || 10}
                onChange={(e) => setFormData({ ...formData, working_hours_per_day: parseFloat(e.target.value) })}
                required
              />
              <FormSelect
                label="Status"
                value={formData.status !== undefined ? String(formData.status) : '1'}
                onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) })}
                options={[{ value: '1', label: 'Active' }, { value: '0', label: 'Inactive' }]}
              />

              <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Holidays / Exceptions</h4>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      const current = formData.holidays || [];
                      setFormData({
                        ...formData,
                        holidays: [...current, { holiday_date: '', description: '', type: 'public_holiday' }],
                      });
                    }}
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                  >
                    <Plus size={12} /> Add Holiday
                  </Button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
                  {(formData.holidays || []).map((h: any, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem',
                        padding: '0.65rem',
                        background: 'var(--border-color)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1 }}>
                          <input
                            type="date"
                            value={h.holiday_date ? h.holiday_date.split('T')[0] : ''}
                            onChange={(e) => {
                              const newH = [...formData.holidays];
                              newH[idx].holiday_date = e.target.value;
                              setFormData({ ...formData, holidays: newH });
                            }}
                            style={{
                              padding: '0.45rem',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-input)',
                              color: 'var(--text-primary)',
                              fontSize: '0.85rem',
                            }}
                            required
                          />
                          <select
                            value={h.type || 'public_holiday'}
                            onChange={(e) => {
                              const newH = [...formData.holidays];
                              newH[idx].type = e.target.value;
                              setFormData({ ...formData, holidays: newH });
                            }}
                            style={{
                              padding: '0.45rem',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-input)',
                              color: 'var(--text-primary)',
                              fontSize: '0.85rem',
                            }}
                          >
                            <option value="public_holiday">Public Holiday</option>
                            <option value="site_shutdown">Site Shutdown</option>
                            <option value="unavailable">Unavailable</option>
                          </select>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            const newH = formData.holidays.filter((_: any, i: number) => i !== idx);
                            setFormData({ ...formData, holidays: newH });
                          }}
                          style={{ padding: '0.15rem 0.4rem', color: '#ef4444', height: 'auto', minHeight: 'auto', fontSize: '0.75rem' }}
                        >
                          Remove
                        </Button>
                      </div>
                      <input
                        type="text"
                        value={h.description || ''}
                        onChange={(e) => {
                          const newH = [...formData.holidays];
                          newH[idx].description = e.target.value;
                          setFormData({ ...formData, holidays: newH });
                        }}
                        style={{
                          padding: '0.45rem',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-input)',
                          color: 'var(--text-primary)',
                          fontSize: '0.85rem',
                        }}
                        placeholder="Description (e.g. Diwali, Independence Day)"
                      />
                    </div>
                  ))}
                  {(!formData.holidays || formData.holidays.length === 0) && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>
                      No holidays added. Click "Add Holiday" above.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Loader2 size={14} className="spin" /> Saving...
                </span>
              ) : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Masters;

