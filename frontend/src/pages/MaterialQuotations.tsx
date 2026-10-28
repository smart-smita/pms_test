import React, { useEffect, useState } from 'react';
import { Package, Plus, Search, Eye, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../services/api';
import { Modal } from '../components/common/Modal';
import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';
import { Button } from '../components/common/Button';
import { showSuccess, showError } from '../utils/toast';
import { Badge } from '../components/common/Badge';

interface MaterialQuotation {
  quotation_id: number;
  project_id: number;
  project_name: string;
  wbs_id: number;
  wbs_name: string;
  quotation_date: string;
  status: 'draft' | 'approved';
  item_count: number;
  total_amount: number;
}

interface Project {
  project_id: number;
  project_name: string;
}

interface WBS {
  id: number;
  wbs_name: string;
}

interface Material {
  material_id: number;
  material_name: string;
  unit: string;
}

export const MaterialQuotations: React.FC = () => {
  const [quotations, setQuotations] = useState<MaterialQuotation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [wbsList, setWbsList] = useState<WBS[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ project_id: '', wbs_id: '', quotation_date: new Date().toISOString().split('T')[0] });
  const [items, setItems] = useState<{ material_id: string; planned_quantity: number; rate: number; tax_percentage: number }[]>([]);

  // View Details Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingQuotation, setViewingQuotation] = useState<any | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const handleViewQuotation = async (id: number) => {
    setIsLoadingDetails(true);
    setIsViewModalOpen(true);
    const res = await apiRequest<any>(`/materials/quotations/${id}`);
    if (res.success && res.data) {
      setViewingQuotation(res.data);
    }
    setIsLoadingDetails(false);
  };

  const fetchQuotations = async () => {
    setIsLoading(true);
    const res = await apiRequest<MaterialQuotation[]>('/materials/quotations');
    if (res.success && res.data) setQuotations(res.data);
    setIsLoading(false);
  };

  const fetchMasters = async () => {
    const pRes = await apiRequest<Project[]>('/projects');
    if (pRes.success && pRes.data) setProjects(pRes.data);

    const mRes = await apiRequest<Material[]>('/materials/master');
    if (mRes.success && mRes.data) setMaterials(mRes.data);
  };

  const fetchWbs = async (projectId: string) => {
    if (!projectId) { setWbsList([]); return; }
    const res = await apiRequest<WBS[]>(`/projects/${projectId}/wbs?wbs_type=material`);
    if (res.success && res.data) setWbsList(res.data);
  };

  useEffect(() => {
    fetchQuotations();
    fetchMasters();
  }, []);

  useEffect(() => {
    fetchWbs(formData.project_id);
  }, [formData.project_id]);

  const openCreateModal = () => {
    setFormData({ project_id: '', wbs_id: '', quotation_date: new Date().toISOString().split('T')[0] });
    setItems([]);
    setIsModalOpen(true);
  };

  const addItem = () => setItems([...items, { material_id: '', planned_quantity: 1, rate: 0, tax_percentage: 18 }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: string, val: any) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: val };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project_id || !formData.wbs_id) return showError('Select Project and WBS');
    if (items.some(i => !i.material_id)) return showError('Select material for all items');

    setIsSubmitting(true);
    const res = await apiRequest('/materials/quotations', {
      method: 'POST',
      body: JSON.stringify({ ...formData, status: 'draft', items: items.map(i => ({ ...i, material_id: Number(i.material_id) })) }),
    });
    setIsSubmitting(false);

    if (res.success) {
      showSuccess('Quotation created');
      setIsModalOpen(false);
      fetchQuotations();
    } else {
      showError(res.message || 'Failed to create');
    }
  };

  const handleApprove = async (id: number) => {
    if (!window.confirm('Approve this material quotation?')) return;
    const res = await apiRequest(`/materials/quotations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'approved' })
    });
    if (res.success) {
      showSuccess('Approved successfully');
      fetchQuotations();
    } else {
      showError(res.message || 'Failed to approve');
    }
  };

  const filtered = quotations.filter(q => q.project_name.toLowerCase().includes(searchQuery.toLowerCase()) || q.wbs_name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Package color="#4f46e5" />
            Material Quotations (Planned Budgets)
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Manage planned material budget per Project and WBS</p>
        </div>
        <Button variant="primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> New Quotation
        </Button>
      </div>

      <div className="glass-card" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" placeholder="Search project or WBS..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Date</th>
              <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Project / WBS</th>
              <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>Items</th>
              <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>Amount</th>
              <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
              <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr> : 
             filtered.map(q => (
              <tr key={q.quotation_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem 1.5rem' }}>{new Date(q.quotation_date).toLocaleDateString()}</td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{q.project_name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{q.wbs_name}</div>
                </td>
                <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>{q.item_count}</td>
                <td style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 600, color: '#4ade80' }}>₹ {Number(q.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                  {q.status === 'approved' ? <Badge variant="success">Approved</Badge> : <Badge variant="warning">Draft</Badge>}
                </td>
                <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <Button variant="secondary" onClick={() => handleViewQuotation(q.quotation_id)} style={{ padding: '0.4rem', color: '#60a5fa' }} title="View Details">
                      <Eye size={16} />
                    </Button>
                    {q.status === 'draft' && (
                      <Button variant="secondary" onClick={() => handleApprove(q.quotation_id)} style={{ padding: '0.4rem', color: '#4ade80' }} title="Approve">
                        <CheckCircle2 size={16} />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Quotation Details Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Material Quotation Details">
        {isLoadingDetails ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading details...</div>
        ) : viewingQuotation ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: 'var(--bg-primary)', padding: '1rem', borderRadius: '12px' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Project</span>
                <strong style={{ color: 'var(--text-primary)' }}>{viewingQuotation.project_name}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>WBS Discipline</span>
                <strong style={{ color: 'var(--text-primary)' }}>{viewingQuotation.wbs_name}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Date</span>
                <strong style={{ color: 'var(--text-primary)' }}>{new Date(viewingQuotation.quotation_date).toLocaleDateString()}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Status</span>
                <Badge variant={viewingQuotation.status === 'approved' ? 'success' : 'warning'}>{viewingQuotation.status}</Badge>
              </div>
            </div>

            <div>
              <h4 style={{ fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Quotation Items Breakdown</h4>
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '0.6rem 1rem', textAlign: 'left' }}>Material</th>
                      <th style={{ padding: '0.6rem 1rem', textAlign: 'right' }}>Planned Qty</th>
                      <th style={{ padding: '0.6rem 1rem', textAlign: 'right' }}>Rate (₹)</th>
                      <th style={{ padding: '0.6rem 1rem', textAlign: 'right' }}>Tax %</th>
                      <th style={{ padding: '0.6rem 1rem', textAlign: 'right' }}>Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(viewingQuotation.items || []).map((it: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.6rem 1rem' }}>
                          <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{it.material_name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{it.material_code} ({it.unit})</span>
                        </td>
                        <td style={{ padding: '0.6rem 1rem', textAlign: 'right' }}>{it.planned_quantity} {it.unit}</td>
                        <td style={{ padding: '0.6rem 1rem', textAlign: 'right' }}>₹ {Number(it.rate).toLocaleString('en-IN')}</td>
                        <td style={{ padding: '0.6rem 1rem', textAlign: 'right' }}>{it.tax_percentage}%</td>
                        <td style={{ padding: '0.6rem 1rem', textAlign: 'right', fontWeight: 600, color: '#4ade80' }}>
                          ₹ {Number(it.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'var(--bg-primary)', fontWeight: 700 }}>
                      <td colSpan={4} style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Grand Total:</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#4ade80', fontSize: '1rem' }}>
                        ₹ {((viewingQuotation.items || []).reduce((acc: number, cur: any) => acc + Number(cur.total_amount || 0), 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>Close</Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Material Quotation">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormSelect label="Project *" value={formData.project_id} onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              options={[{ value: '', label: '-- Select Project --' }, ...projects.map(p => ({ value: String(p.project_id), label: p.project_name }))]} required />
            <FormSelect label="WBS *" value={formData.wbs_id} onChange={(e) => setFormData({ ...formData, wbs_id: e.target.value })}
              options={[{ value: '', label: '-- Select WBS --' }, ...wbsList.map(w => ({ value: String(w.id), label: w.wbs_name }))]} required />
          </div>
          <FormInput label="Date" type="date" value={formData.quotation_date} onChange={(e) => setFormData({ ...formData, quotation_date: e.target.value })} required />
          
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Materials</h3>
              <Button type="button" variant="secondary" onClick={addItem}><Plus size={16}/> Add Item</Button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {items.map((it, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 40px', gap: '0.5rem', alignItems: 'center' }}>
                  <FormSelect label="" value={it.material_id} onChange={(e) => updateItem(i, 'material_id', e.target.value)}
                    options={[{ value: '', label: 'Select' }, ...materials.map(m => ({ value: String(m.material_id), label: `${m.material_name} (${m.unit})` }))]} />
                  <FormInput label="" type="number" placeholder="Qty" value={String(it.planned_quantity)} onChange={(e) => updateItem(i, 'planned_quantity', Number(e.target.value))} />
                  <FormInput label="" type="number" placeholder="Rate" value={String(it.rate)} onChange={(e) => updateItem(i, 'rate', Number(e.target.value))} />
                  <FormInput label="" type="number" placeholder="Tax %" value={String(it.tax_percentage)} onChange={(e) => updateItem(i, 'tax_percentage', Number(e.target.value))} />
                  <Button type="button" variant="secondary" onClick={() => removeItem(i)} style={{ color: '#ef4444', padding: '0.5rem' }}>X</Button>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
