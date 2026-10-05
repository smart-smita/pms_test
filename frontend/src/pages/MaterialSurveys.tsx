import React, { useEffect, useState } from 'react';
import { Package, Plus, Search, Eye, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../services/api';
import { Modal } from '../components/common/Modal';
import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';
import { Button } from '../components/common/Button';
import { showSuccess, showError } from '../utils/toast';
import { Badge } from '../components/common/Badge';

interface MaterialSurvey {
  survey_id: number;
  project_id: number;
  project_name: string;
  wbs_id: number;
  wbs_name: string;
  survey_date: string;
  survey_month: string;
  status: 'draft' | 'approved';
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

export const MaterialSurveys: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const [surveys, setSurveys] = useState<MaterialSurvey[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [wbsList, setWbsList] = useState<WBS[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ project_id: '', wbs_id: '', survey_date: new Date().toISOString().split('T')[0], survey_month: new Date().toISOString().slice(0,7) });
  const [items, setItems] = useState<{ material_id: string; opening_qty: number; added_qty: number; used_qty: number; wastage_qty: number; rate: number }[]>([]);

  // View Details Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingSurvey, setViewingSurvey] = useState<any | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const handleViewSurvey = async (id: number) => {
    setIsLoadingDetails(true);
    setIsViewModalOpen(true);
    const res = await apiRequest<any>(`/materials/surveys/${id}`);
    if (res.success && res.data) {
      setViewingSurvey(res.data);
    }
    setIsLoadingDetails(false);
  };

  const fetchSurveys = async () => {
    setIsLoading(true);
    const res = await apiRequest<MaterialSurvey[]>('/materials/surveys');
    if (res.success && res.data) setSurveys(res.data);
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
    fetchSurveys();
    fetchMasters();
  }, []);

  useEffect(() => {
    fetchWbs(formData.project_id);
  }, [formData.project_id]);

  const openCreateModal = () => {
    setFormData({ project_id: '', wbs_id: '', survey_date: new Date().toISOString().split('T')[0], survey_month: new Date().toISOString().slice(0,7) });
    setItems([]);
    setIsModalOpen(true);
  };

  const addItem = () => setItems([...items, { material_id: '', opening_qty: 0, added_qty: 0, used_qty: 0, wastage_qty: 0, rate: 0 }]);
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
    const res = await apiRequest('/materials/surveys', {
      method: 'POST',
      body: JSON.stringify({ ...formData, status: 'draft', items: items.map(i => ({ ...i, material_id: Number(i.material_id) })) }),
    });
    setIsSubmitting(false);

    if (res.success) {
      showSuccess('Survey created');
      setIsModalOpen(false);
      fetchSurveys();
    } else {
      showError(res.message || 'Failed to create');
    }
  };

  const handleApprove = async (id: number) => {
    if (!window.confirm('Approve this material survey?')) return;
    const res = await apiRequest(`/materials/surveys/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'approved' })
    });
    if (res.success) {
      showSuccess('Approved successfully');
      fetchSurveys();
    } else {
      showError(res.message || 'Failed to approve');
    }
  };

  const filtered = surveys.filter(s => s.project_name.toLowerCase().includes(searchQuery.toLowerCase()) || s.wbs_name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div style={{ padding: embedded ? '0' : '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Package color="#4f46e5" />
            Monthly Material Surveys
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Track material consumption and wastage per project</p>
        </div>
        <Button variant="primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> New Survey
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
              <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Month</th>
              <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Date</th>
              <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Project / WBS</th>
              <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
              <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr> : 
             filtered.map(s => (
              <tr key={s.survey_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>{s.survey_month}</td>
                <td style={{ padding: '1rem 1.5rem' }}>{new Date(s.survey_date).toLocaleDateString()}</td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{s.project_name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.wbs_name}</div>
                </td>
                <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                  {s.status === 'approved' ? <Badge variant="success">Approved</Badge> : <Badge variant="warning">Draft</Badge>}
                </td>
                <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <Button variant="secondary" onClick={() => handleViewSurvey(s.survey_id)} style={{ padding: '0.4rem', color: '#60a5fa' }} title="View Details">
                      <Eye size={16} />
                    </Button>
                    {s.status === 'draft' && (
                      <Button variant="secondary" onClick={() => handleApprove(s.survey_id)} style={{ padding: '0.4rem', color: '#4ade80' }} title="Approve">
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

      {/* View Material Survey Details Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Material Survey Details">
        {isLoadingDetails ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading details...</div>
        ) : viewingSurvey ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', background: 'var(--bg-primary)', padding: '1rem', borderRadius: '12px' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Month / Date</span>
                <strong style={{ color: 'var(--text-primary)' }}>{viewingSurvey.survey_month} ({new Date(viewingSurvey.survey_date).toLocaleDateString()})</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Project</span>
                <strong style={{ color: 'var(--text-primary)' }}>{viewingSurvey.project_name}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>WBS Discipline</span>
                <strong style={{ color: 'var(--text-primary)' }}>{viewingSurvey.wbs_name}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Status</span>
                <Badge variant={viewingSurvey.status === 'approved' ? 'success' : 'warning'}>{viewingSurvey.status}</Badge>
              </div>
            </div>

            <div>
              <h4 style={{ fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Materials Measured & Logged</h4>
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '0.6rem 0.8rem', textAlign: 'left' }}>Material</th>
                      <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>Opening</th>
                      <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>Added</th>
                      <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>Used</th>
                      <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>Wastage</th>
                      <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>Remaining</th>
                      <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>Rate (₹)</th>
                      <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>Used Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(viewingSurvey.items || []).map((it: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.6rem 0.8rem' }}>
                          <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{it.material_name}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>{it.material_code} ({it.unit})</span>
                        </td>
                        <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>{it.opening_qty}</td>
                        <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right', color: '#38bdf8' }}>+{it.added_qty}</td>
                        <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right', color: '#f59e0b', fontWeight: 600 }}>{it.used_qty}</td>
                        <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right', color: '#ef4444' }}>{it.wastage_qty}</td>
                        <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right', fontWeight: 600 }}>{it.remaining_qty}</td>
                        <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>₹ {Number(it.rate).toLocaleString('en-IN')}</td>
                        <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right', fontWeight: 600, color: '#4ade80' }}>
                          ₹ {Number(it.used_cost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'var(--bg-primary)', fontWeight: 700 }}>
                      <td colSpan={7} style={{ padding: '0.75rem 0.8rem', textAlign: 'right' }}>Total Consumed Cost:</td>
                      <td style={{ padding: '0.75rem 0.8rem', textAlign: 'right', color: '#4ade80', fontSize: '0.95rem' }}>
                        ₹ {((viewingSurvey.items || []).reduce((acc: number, cur: any) => acc + Number(cur.used_cost || 0), 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Material Survey">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormSelect label="Project *" value={formData.project_id} onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              options={[{ value: '', label: '-- Select Project --' }, ...projects.map(p => ({ value: String(p.project_id), label: p.project_name }))]} required />
            <FormSelect label="WBS *" value={formData.wbs_id} onChange={(e) => setFormData({ ...formData, wbs_id: e.target.value })}
              options={[{ value: '', label: '-- Select WBS --' }, ...wbsList.map(w => ({ value: String(w.id), label: w.wbs_name }))]} required />
            <FormInput label="Survey Date" type="date" value={formData.survey_date} onChange={(e) => setFormData({ ...formData, survey_date: e.target.value })} required />
            <FormInput label="Survey Month" type="month" value={formData.survey_month} onChange={(e) => setFormData({ ...formData, survey_month: e.target.value })} required />
          </div>
          
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Materials</h3>
              <Button type="button" variant="secondary" onClick={addItem}><Plus size={16}/> Add Item</Button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {items.map((it, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 40px', gap: '0.5rem', alignItems: 'center' }}>
                  <FormSelect label="" value={it.material_id} onChange={(e) => updateItem(i, 'material_id', e.target.value)}
                    options={[{ value: '', label: 'Select Material' }, ...materials.map(m => ({ value: String(m.material_id), label: `${m.material_name} (${m.unit})` }))]} />
                  <FormInput label="" type="number" placeholder="Open Qty" value={String(it.opening_qty)} onChange={(e) => updateItem(i, 'opening_qty', Number(e.target.value))} />
                  <FormInput label="" type="number" placeholder="Add Qty" value={String(it.added_qty)} onChange={(e) => updateItem(i, 'added_qty', Number(e.target.value))} />
                  <FormInput label="" type="number" placeholder="Used Qty" value={String(it.used_qty)} onChange={(e) => updateItem(i, 'used_qty', Number(e.target.value))} />
                  <FormInput label="" type="number" placeholder="Waste Qty" value={String(it.wastage_qty)} onChange={(e) => updateItem(i, 'wastage_qty', Number(e.target.value))} />
                  <FormInput label="" type="number" placeholder="Rate" value={String(it.rate)} onChange={(e) => updateItem(i, 'rate', Number(e.target.value))} />
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
