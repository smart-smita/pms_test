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
    tax_percentage: '5',
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
    const [cRes, pRes, dRes, tRes] = await Promise.all([
      apiRequest<Customer[]>('/customers'),
      apiRequest<Project[]>('/projects'),
      apiRequest<Discipline[]>('/masters/disciplines'),
      apiRequest<TermsTemplate[]>('/terms-templates'),
    ]);
    if (cRes.success && cRes.data) setCustomers(cRes.data);
    if (pRes.success && pRes.data) setProjects(pRes.data);
    if (dRes.success && dRes.data) setDisciplinesList(dRes.data);
    if (tRes.success && tRes.data) setTermsTemplates(tRes.data);
  };

  useEffect(() => {
    fetchMasters();
  }, []);

  useEffect(() => {
    fetchQuotations();
  }, [filterCustomer, filterStatus]);

  const calculateSubtotal = () => lineItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const subtotal = calculateSubtotal();
  const taxPct = Number(formData.tax_percentage) || 0;
  const taxAmount = (subtotal * taxPct) / 100;
  const discount = Number(formData.discount_amount) || 0;
  const grandTotal = subtotal + taxAmount - discount;

  const openCreateModal = () => {
    setEditingQuotation(null);
    setFormData({
      quotation_code: '',
      customer_id: '',
      project_id: '',
      quotation_date: new Date().toISOString().split('T')[0],
      validity_date: '',
      description: '',
      tax_percentage: '5',
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
    if (!formData.project_id) { showError('Please select a project.'); return; }

    setIsSubmitting(true);
    const payload = {
      customer_id: Number(formData.customer_id),
      project_id: Number(formData.project_id),
      quotation_code: formData.quotation_code || undefined,
      quotation_date: formData.quotation_date,
      validity_date: formData.validity_date || null,
      description: formData.description,
      tax_percentage: Number(formData.tax_percentage) || 0,
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
              label="Project"
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              options={[
                { value: '', label: '-- Select Project --' },
                ...projects.map((p) => ({ value: String(p.project_id), label: `${p.project_name} (${p.project_code})` })),
              ]}
              required
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
          <div style={{ marginTop: '1.5rem', background: 'rgba(99,102,241,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Grand Total</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#4ade80' }}>
                ₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
                  const tmpl = termsTemplates.find(t => String(t.template_id) === e.target.value);
                  if (tmpl && tmpl.items && tmpl.items.length > 0) {
                    if (termsSnapshots.length > 0) {
                      if (!window.confirm("Changing the template will replace the current template-based terms. Continue?")) return;
                    }
                    setTermsSnapshots(tmpl.items.map((item: any) => ({ title: item.title, description: item.description, sort_order: item.sort_order })));
                  }
                }}
                options={[
                  { value: '', label: '-- Select Template --' },
                  ...termsTemplates.map((t) => ({ value: String(t.template_id), label: t.template_name }))
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
    </div>
  );
};
