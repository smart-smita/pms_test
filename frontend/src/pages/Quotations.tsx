import React, { useEffect, useState } from 'react';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';
import { apiRequest } from '../services/api';
import { Quotation, Customer, Project, Discipline, TermsTemplate } from '../types';
import { Plus, Edit, Trash2, FileText, CheckCircle2, XCircle, Download, Building2, FolderKanban, PlusCircle, Trash } from 'lucide-react';
import { ConfirmDeleteModal } from '../components/common/ConfirmDeleteModal';
import { showSuccess, showError } from '../utils/toast';
import { useAuth } from '../context/AuthContext';

export const Quotations: React.FC = () => {
  const { user } = useAuth();
  const isAdminOrManager = user?.role_name === 'Admin' || user?.role_name === 'Super Admin' || user?.role_name === 'Manager';

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [disciplinesList, setDisciplinesList] = useState<Discipline[]>([]);
  const [termsTemplates, setTermsTemplates] = useState<TermsTemplate[]>([]);
  const [taxesList, setTaxesList] = useState<any[]>([]);
  const [selectedTaxId, setSelectedTaxId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    quotation_code: '',
    customer_id: '',
    project_id: '',
    quotation_date: new Date().toISOString().split('T')[0],
    validity_date: '',
    description: '',
    tax_percentage: '18',
    discount_amount: '0',
  });

  const [termsSnapshots, setTermsSnapshots] = useState<{ title: string; description: string; sort_order: number }[]>([]);

  const [lineItems, setLineItems] = useState<
    { discipline_id: number; discipline_name: string; description: string; unit: string; quantity: number; rate: number; amount: number }[]
  >([]);

  // Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingQuotation, setDeletingQuotation] = useState<{ id: number; code: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Create Project from Quotation modal
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [createProjectQuotation, setCreateProjectQuotation] = useState<Quotation | null>(null);
  const [createProjectForm, setCreateProjectForm] = useState({ project_code: '', project_name: '', project_address: '' });
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const openCreateProjectModal = (q: Quotation) => {
    setCreateProjectQuotation(q);
    setCreateProjectForm({
      project_code: `PRJ-${q.quotation_code}`,
      project_name: q.customer_name ? `${q.customer_name} Project` : '',
      project_address: '',
    });
    setIsCreateProjectOpen(true);
  };

  const handleCreateProject = async () => {
    if (!createProjectQuotation) return;
    if (!createProjectForm.project_code.trim()) { showError('Project code is required.'); return; }
    setIsCreatingProject(true);
    const res = await apiRequest<{ project_id: number }>(`/quotations/${createProjectQuotation.quotation_id}/create-project`, {
      method: 'POST',
      body: JSON.stringify(createProjectForm),
    });
    setIsCreatingProject(false);
    if (res.success && res.data) {
      showSuccess(`Project created successfully (ID: ${res.data.project_id}). Navigate to Projects to view it.`);
      setIsCreateProjectOpen(false);
      fetchQuotations();
    } else {
      showError(res.message || 'Failed to create project from quotation.');
    }
  };

  const fetchQuotations = async () => {
    setIsLoading(true);
    let url = '/quotations';
    const query: string[] = [];
    if (filterCustomer) query.push(`customer_id=${filterCustomer}`);
    if (filterStatus) query.push(`status=${filterStatus}`);
    if (query.length > 0) url += `?${query.join('&')}`;

    const res = await apiRequest<Quotation[]>(url);
    if (res.success && res.data) setQuotations(res.data);
    setIsLoading(false);
  };

  const fetchMasters = async () => {
    const [cRes, pRes, dRes, tRes, txRes] = await Promise.all([
      apiRequest<Customer[]>('/customers'),
      apiRequest<Project[]>('/projects'),
      apiRequest<Discipline[]>('/masters/disciplines'),
      apiRequest<TermsTemplate[]>('/terms-templates'),
      apiRequest<any[]>('/masters/taxes'),
    ]);
    if (cRes.success && cRes.data) setCustomers(cRes.data);
    if (pRes.success && pRes.data) setProjects(pRes.data);
    if (dRes.success && dRes.data) setDisciplinesList(dRes.data);
    if (tRes.success && tRes.data) setTermsTemplates(tRes.data);
    if (txRes.success && txRes.data) setTaxesList(txRes.data);
  };

  useEffect(() => {
    fetchMasters();
  }, []);

  useEffect(() => {
    fetchQuotations();
  }, [filterCustomer, filterStatus]);

  const selectedTax = taxesList.find((t) => String(t.tax_id) === selectedTaxId);
  const taxPct = selectedTax ? Number(selectedTax.tax_percentage) : Number(formData.tax_percentage) || 0;
  const isSplitTax = selectedTax ? Boolean(selectedTax.is_split || selectedTax.tax_type === 'CGST_SGST') : false;
  const cgstPct = selectedTax && isSplitTax ? Number(selectedTax.cgst_percentage || taxPct / 2) : 0;
  const sgstPct = selectedTax && isSplitTax ? Number(selectedTax.sgst_percentage || taxPct / 2) : 0;

  const calculateSubtotal = () => lineItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const subtotal = calculateSubtotal();
  const discount = Number(formData.discount_amount) || 0;
  const taxableAmount = Math.max(0, subtotal - discount);

  const cgstAmount = isSplitTax ? (taxableAmount * cgstPct) / 100 : 0;
  const sgstAmount = isSplitTax ? (taxableAmount * sgstPct) / 100 : 0;
  const taxAmount = isSplitTax ? cgstAmount + sgstAmount : (taxableAmount * taxPct) / 100;
  const grandTotal = taxableAmount + taxAmount;

  const openCreateModal = () => {
    setEditingQuotation(null);
    setSelectedTaxId('');
    setFormData({
      quotation_code: '',
      customer_id: '',
      project_id: '',
      quotation_date: new Date().toISOString().split('T')[0],
      validity_date: '',
      description: '',
      tax_percentage: '18',
      discount_amount: '0',
    });
    setTermsSnapshots([]);
    setLineItems([]);
    setIsModalOpen(true);
  };

  const openEditModal = async (q: Quotation) => {
    setEditingQuotation(q);
    const detailRes = await apiRequest<Quotation>(`/quotations/${q.quotation_id}`);
    const quotationData = detailRes.success && detailRes.data ? detailRes.data : q;

    setSelectedTaxId(quotationData.tax_id ? String(quotationData.tax_id) : '');
    setFormData({
      quotation_code: quotationData.quotation_code,
      customer_id: String(quotationData.customer_id),
      project_id: String(quotationData.project_id),
      quotation_date: quotationData.quotation_date ? quotationData.quotation_date.split('T')[0] : '',
      validity_date: quotationData.validity_date ? quotationData.validity_date.split('T')[0] : '',
      description: quotationData.description || '',
      tax_percentage: String(quotationData.tax_percentage || 0),
      discount_amount: String(quotationData.discount_amount || 0),
    });

    if (quotationData.terms_snapshots) {
      setTermsSnapshots(quotationData.terms_snapshots.map((t: any) => ({
        title: t.title || '',
        description: t.description || '',
        sort_order: Number(t.sort_order || 0),
      })));
    } else {
      setTermsSnapshots([]);
    }

    if (quotationData.disciplines) {
      setLineItems(
        quotationData.disciplines.map((d) => ({
          discipline_id: d.discipline_id,
          discipline_name: d.discipline_name,
          description: d.description || '',
          unit: d.unit || 'lump_sum',
          quantity: Number(d.quantity),
          rate: Number(d.rate),
          amount: Number(d.amount),
        }))
      );
    } else {
      setLineItems([]);
    }

    setIsModalOpen(true);
  };

  const addLineItem = () => {
    if (disciplinesList.length === 0) return;
    const firstDisc = disciplinesList[0];
    setLineItems([
      ...lineItems,
      {
        discipline_id: firstDisc.discipline_id,
        discipline_name: firstDisc.discipline_name,
        description: '',
        unit: 'lump_sum',
        quantity: 1,
        rate: 0,
        amount: 0,
      },
    ]);
  };

  const removeLineItem = (index: number) => {
    const updated = [...lineItems];
    updated.splice(index, 1);
    setLineItems(updated);
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const updated = [...lineItems];
    const item = { ...updated[index], [field]: value };

    if (field === 'discipline_id') {
      const disc = disciplinesList.find((d) => d.discipline_id === Number(value));
      if (disc) item.discipline_name = disc.discipline_name;
    }

    item.amount = Number(item.quantity) * Number(item.rate);
    updated[index] = item;
    setLineItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_id) { showError('Please select a customer.'); return; }
    // project_id is optional in the quotation-first flow

    setIsSubmitting(true);
    const payload = {
      customer_id: Number(formData.customer_id),
      project_id: formData.project_id ? Number(formData.project_id) : null,
      quotation_code: formData.quotation_code || undefined,
      quotation_date: formData.quotation_date,
      validity_date: formData.validity_date || null,
      description: formData.description,
      tax_id: selectedTax ? selectedTax.tax_id : null,
      tax_type: selectedTax ? selectedTax.tax_type : null,
      tax_percentage: Number(formData.tax_percentage) || 0,
      cgst_amount: cgstAmount,
      sgst_amount: sgstAmount,
      igst_amount: !isSplitTax && selectedTax && selectedTax.tax_type === 'IGST' ? taxAmount : 0,
      discount_amount: Number(formData.discount_amount) || 0,
      subtotal_amount: subtotal,
      tax_amount: taxAmount,
      total_amount: grandTotal,
      terms_snapshots: termsSnapshots,
      disciplines: lineItems,
    };

    const endpoint = editingQuotation ? `/quotations/${editingQuotation.quotation_id}` : '/quotations';
    const method = editingQuotation ? 'PUT' : 'POST';

    const res = await apiRequest<Quotation>(endpoint, {
      method,
      body: JSON.stringify(payload),
    });

    setIsSubmitting(false);

    if (res.success) {
      showSuccess(editingQuotation ? 'Quotation updated successfully.' : 'Quotation created successfully.');
      setIsModalOpen(false);
      fetchQuotations();
    } else {
      showError(res.message || 'Failed to save quotation.');
    }
  };

  const handleStatusChange = async (id: number, status: 'approved' | 'rejected') => {
    const res = await apiRequest(`/quotations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });

    if (res.success) {
      showSuccess(`Quotation ${status} successfully.`);
      fetchQuotations();
    } else {
      showError(res.message || 'Failed to update quotation status.');
    }
  };

  const handleDownloadPdf = (id: number, code: string) => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    window.open(`${apiUrl}/quotations/${id}/pdf?token=${token}`, '_blank');
  };

  const handleDelete = (id: number, code: string) => {
    setDeletingQuotation({ id, code });
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingQuotation) return;
    setIsDeleting(true);
    const res = await apiRequest(`/quotations/${deletingQuotation.id}`, { method: 'DELETE' });
    setIsDeleting(false);

    if (res.success) {
      showSuccess('Quotation deleted successfully.');
      setIsDeleteModalOpen(false);
      fetchQuotations();
    } else {
      showError(res.message || 'Failed to delete quotation.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge variant="success">Approved</Badge>;
      case 'pending_approval': return <Badge variant="warning">Pending Approval</Badge>;
      case 'rejected': return <Badge variant="danger">Rejected</Badge>;
      case 'revised': return <Badge variant="info">Revised</Badge>;
      default: return <Badge variant="secondary">Draft</Badge>;
    }
  };

  const columns: Column<Quotation>[] = [
    { header: 'Code / Date', accessor: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: '#818cf8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <FileText size={15} /> {r.quotation_code}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            Date: {new Date(r.quotation_date).toLocaleDateString()}
          </div>
        </div>
      ), sortKey: 'quotation_code'
    },
    { header: 'Customer & Project', accessor: (r) => (
        <div>
          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Building2 size={14} color="#6366f1" /> {r.customer_name || 'N/A'}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <FolderKanban size={13} color="#38bdf8" /> {r.project_name || 'N/A'}
          </div>
        </div>
      )
    },
    { header: 'Financial Total', accessor: (r) => (
        <div>
          <div style={{ fontWeight: 700, color: '#4ade80', fontSize: '0.95rem' }}>
            ₹ {Number(r.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Subtotal: ₹ {Number(r.subtotal_amount).toFixed(2)} | Tax: {r.tax_percentage}%
          </div>
        </div>
      ), sortKey: 'total_amount'
    },
    { header: 'Status', accessor: (r) => getStatusBadge(r.status), sortKey: 'status' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Quotation & Scope Management</h1>
          <p className="page-subtitle">Draft line-item quotes, assign disciplines, set terms & conditions, and generate PDFs</p>
        </div>
        {isAdminOrManager && (
          <Button variant="primary" onClick={openCreateModal}>
            <Plus size={18} /> Create Quotation
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ minWidth: '220px' }}>
          <FormSelect
            label="Filter by Customer"
            value={filterCustomer}
            onChange={(e) => setFilterCustomer(e.target.value)}
            options={[
              { value: '', label: 'All Customers' },
              ...customers.map((c) => ({ value: String(c.customer_id), label: c.customer_name })),
            ]}
          />
        </div>
        <div style={{ minWidth: '180px' }}>
          <FormSelect
            label="Filter by Status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'draft', label: 'Draft' },
              { value: 'pending_approval', label: 'Pending Approval' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ]}
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card">
        <DataTable
          columns={columns}
          data={quotations}
          searchPlaceholder="Search by code, customer, project or total amount..."
          exportFilename="quotations_list"
          isLoading={isLoading}
          actions={(row) => (
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <Button variant="secondary" onClick={() => handleDownloadPdf(row.quotation_id, row.quotation_code)} style={{ padding: '0.35rem 0.6rem' }}>
                <Download size={14} /> PDF
              </Button>
              {isAdminOrManager && row.status !== 'approved' && (
                <>
                  <Button variant="secondary" onClick={() => openEditModal(row)} style={{ padding: '0.35rem 0.6rem' }}>
                    <Edit size={14} /> Edit
                  </Button>
                  <Button variant="secondary" onClick={() => handleStatusChange(row.quotation_id, 'approved')} style={{ padding: '0.35rem 0.6rem', color: '#4ade80' }}>
                    <CheckCircle2 size={14} /> Approve
                  </Button>
                </>
              )}
              {isAdminOrManager && row.status === 'approved' && !row.project_id && (
                <Button
                  variant="secondary"
                  onClick={() => openCreateProjectModal(row)}
                  style={{ padding: '0.35rem 0.6rem', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.4)' }}
                  title="Create a project from this approved quotation"
                >
                  <FolderKanban size={14} /> Create Project
                </Button>
              )}
              {isAdminOrManager && (
                <Button
                  variant="secondary"
                  onClick={() => handleDelete(row.quotation_id, row.quotation_code)}
                  style={{ padding: '0.35rem 0.6rem', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
                >
                  <Trash2 size={14} />
                </Button>
              )}
            </div>
          )}
        />
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingQuotation ? `Edit Quotation (${editingQuotation.quotation_code})` : 'Draft New Quotation'}
      >
        <form onSubmit={handleSubmit} style={{ maxHeight: '75vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormSelect
              label="Customer"
              value={formData.customer_id}
              onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
              options={[
                { value: '', label: '-- Select Customer --' },
                ...customers.map((c) => ({ value: String(c.customer_id), label: `${c.customer_name} (${c.customer_code})` })),
              ]}
              required
            />
            <FormSelect
              label="Project (Optional — leave blank to create one from this quotation after approval)"
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              options={[
                { value: '', label: '-- No Project Yet --' },
                ...projects.map((p) => ({ value: String(p.project_id), label: `${p.project_name} (${p.project_code})` })),
              ]}
            />
            <FormInput
              label="Quotation Date"
              type="date"
              value={formData.quotation_date}
              onChange={(e) => setFormData({ ...formData, quotation_date: e.target.value })}
              required
            />
            <FormInput
              label="Validity Date"
              type="date"
              value={formData.validity_date}
              onChange={(e) => setFormData({ ...formData, validity_date: e.target.value })}
            />
          </div>

          <div style={{ marginTop: '1rem' }}>
            <FormInput
              label="Scope Description"
              placeholder="Brief description of the work scope..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Line Items / Disciplines Section */}
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Discipline Line Items</h3>
              <Button type="button" variant="secondary" onClick={addLineItem} style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}>
                <PlusCircle size={14} /> Add Line Item
              </Button>
            </div>

            {lineItems.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                No disciplines added. Click "Add Line Item" to add disciplines & rates.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {lineItems.map((item, index) => (
                  <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 40px', gap: '0.5rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <FormSelect
                        label=""
                        value={String(item.discipline_id)}
                        onChange={(e) => updateLineItem(index, 'discipline_id', e.target.value)}
                        options={disciplinesList.map((d) => ({ value: String(d.discipline_id), label: d.discipline_name }))}
                      />
                    </div>
                    <div>
                      <FormInput
                        label=""
                        type="number"
                        placeholder="Qty"
                        value={String(item.quantity)}
                        onChange={(e) => updateLineItem(index, 'quantity', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <FormInput
                        label=""
                        type="number"
                        placeholder="Rate"
                        value={String(item.rate)}
                        onChange={(e) => updateLineItem(index, 'rate', Number(e.target.value))}
                      />
                    </div>
                    <div style={{ fontWeight: 600, color: '#4ade80', textAlign: 'right', fontSize: '0.9rem' }}>
                      ₹ {Number(item.amount).toFixed(2)}
                    </div>
                    <button type="button" onClick={() => removeLineItem(index)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
                      <Trash size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Financial Summary */}
          <div style={{ marginTop: '1.5rem', background: 'rgba(99,102,241,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <FormSelect
                label="Tax Scheme / Rate"
                value={selectedTaxId}
                onChange={(e) => {
                  const tId = e.target.value;
                  setSelectedTaxId(tId);
                  const st = taxesList.find((t) => String(t.tax_id) === tId);
                  if (st) {
                    setFormData((prev) => ({ ...prev, tax_percentage: String(st.tax_percentage) }));
                  }
                }}
                options={[
                  { value: '', label: '-- Custom Tax % --' },
                  ...taxesList.map((t) => ({
                    value: String(t.tax_id),
                    label: `${t.tax_name} (${t.tax_percentage}%) ${t.country_name ? `[${t.country_name}]` : ''}`,
                  })),
                ]}
              />
              <FormInput
                label="Tax Percentage (%)"
                type="number"
                value={formData.tax_percentage}
                onChange={(e) => setFormData({ ...formData, tax_percentage: e.target.value })}
              />
              <FormInput
                label="Discount Amount (₹)"
                type="number"
                value={formData.discount_amount}
                onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
              />
            </div>

            {/* Financial Breakdown Table */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div>Subtotal: <strong>₹ {subtotal.toFixed(2)}</strong></div>
              <div>Discount: <strong style={{ color: '#f87171' }}>- ₹ {discount.toFixed(2)}</strong></div>
              {isSplitTax ? (
                <>
                  <div>CGST ({cgstPct}%): <strong style={{ color: '#38bdf8' }}>₹ {cgstAmount.toFixed(2)}</strong></div>
                  <div>SGST ({sgstPct}%): <strong style={{ color: '#38bdf8' }}>₹ {sgstAmount.toFixed(2)}</strong></div>
                </>
              ) : (
                <div>Tax ({taxPct}%): <strong style={{ color: '#38bdf8' }}>₹ {taxAmount.toFixed(2)}</strong></div>
              )}
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#4ade80' }}>
                Grand Total: ₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Terms & Conditions</h3>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <FormSelect
                label="Load from Template (Optional)"
                value=""
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  const tmpl = termsTemplates.find((t) => String(t.template_id) === val || t.template_name === val);
                  if (tmpl) {
                    let parsedItems: { title: string; description: string; sort_order: number }[] = [];
                    if (tmpl.items && Array.isArray(tmpl.items) && tmpl.items.length > 0) {
                      parsedItems = tmpl.items.map((item: any, idx: number) => ({
                        title: item.title || `Condition ${idx + 1}`,
                        description: item.description || item.terms_content || String(item),
                        sort_order: item.sort_order ?? idx,
                      }));
                    } else if (tmpl.terms_content) {
                      const lines = tmpl.terms_content.split('\n').filter((l: string) => l.trim().length > 0);
                      if (lines.length > 1) {
                        parsedItems = lines.map((line: string, idx: number) => {
                          const match = line.match(/^(\d+[\.\)]\s*)(.*)/);
                          const title = match ? `Condition ${match[1].trim()}` : `Condition ${idx + 1}`;
                          const description = match ? match[2] : line;
                          return { title, description, sort_order: idx };
                        });
                      } else {
                        parsedItems = [{ title: tmpl.template_name, description: tmpl.terms_content, sort_order: 0 }];
                      }
                    }

                    if (parsedItems.length > 0) {
                      if (termsSnapshots.length > 0) {
                        if (!window.confirm("Loading this template will replace the current terms. Continue?")) return;
                      }
                      setTermsSnapshots(parsedItems);
                    }
                  }
                }}
                options={[
                  { value: '', label: '-- Select Template --' },
                  ...Array.from(new Map(termsTemplates.map((t) => [t.template_name, t])).values()).map((t) => ({
                    value: String(t.template_id),
                    label: t.template_name,
                  })),
                ]}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {termsSnapshots.map((term, index) => (
                <div key={index} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <FormInput 
                      label=""
                      placeholder="Condition Title"
                      value={term.title}
                      onChange={(e) => {
                        const newTerms = [...termsSnapshots];
                        newTerms[index].title = e.target.value;
                        setTermsSnapshots(newTerms);
                      }}
                    />
                    <button type="button" onClick={() => {
                      const newTerms = [...termsSnapshots];
                      newTerms.splice(index, 1);
                      setTermsSnapshots(newTerms);
                    }} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', marginTop: '0.5rem' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <textarea 
                    placeholder="Condition Description"
                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem', borderRadius: '4px', minHeight: '60px', fontFamily: 'inherit' }}
                    value={term.description}
                    onChange={(e) => {
                      const newTerms = [...termsSnapshots];
                      newTerms[index].description = e.target.value;
                      setTermsSnapshots(newTerms);
                    }}
                  />
                </div>
              ))}
              
              <Button type="button" variant="secondary" onClick={() => setTermsSnapshots([...termsSnapshots, { title: '', description: '', sort_order: termsSnapshots.length }])} style={{ alignSelf: 'flex-start' }}>
                <Plus size={16} /> Add Custom Condition
              </Button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingQuotation ? 'Update Quotation' : 'Save Draft Quotation'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        recordName={deletingQuotation?.code || 'this quotation'}
        isLoading={isDeleting}
      />

      {/* Create Project from Quotation Modal */}
      <Modal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        title={`Create Project from Quotation ${createProjectQuotation?.quotation_code || ''}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', background: 'rgba(99,102,241,0.08)', borderRadius: '8px', fontSize: '0.85rem', color: '#94a3b8', border: '1px solid rgba(99,102,241,0.2)' }}>
            This will create a new project seeded from the approved quotation data.
            Project budget will be set to the quotation total.
            Project WBS entries will be created from each discipline line item.
          </div>
          <FormInput
            label="Project Code *"
            placeholder="e.g. PRJ-2026-001"
            value={createProjectForm.project_code}
            onChange={(e) => setCreateProjectForm({ ...createProjectForm, project_code: e.target.value })}
          />
          <FormInput
            label="Project Name"
            placeholder="e.g. Unitglo Site A Civil Works"
            value={createProjectForm.project_name}
            onChange={(e) => setCreateProjectForm({ ...createProjectForm, project_name: e.target.value })}
          />
          <FormInput
            label="Project Address (optional)"
            placeholder="Site address..."
            value={createProjectForm.project_address}
            onChange={(e) => setCreateProjectForm({ ...createProjectForm, project_address: e.target.value })}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button variant="secondary" onClick={() => setIsCreateProjectOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateProject} disabled={isCreatingProject}>
              {isCreatingProject ? 'Creating...' : '✓ Create Project'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
