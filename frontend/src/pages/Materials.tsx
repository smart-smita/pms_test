import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, MoreVertical, Package, Edit, Trash2 } from 'lucide-react';
import { apiRequest } from '../services/api';
import { Modal } from '../components/common/Modal';
import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';
import { Button } from '../components/common/Button';
import { showSuccess, showError } from '../utils/toast';

interface Material {
  material_id: number;
  material_code: string;
  material_name: string;
  category: string | null;
  description: string | null;
  unit: string;
  brand_spec: string | null;
  status: 'active' | 'inactive';
}

export const Materials: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [formData, setFormData] = useState({
    material_code: '',
    material_name: '',
    category: '',
    description: '',
    unit: 'Nos',
    brand_spec: '',
    status: 'active'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMaterials = async () => {
    setIsLoading(true);
    const res = await apiRequest<Material[]>(`/materials/master${searchQuery ? `?search=${searchQuery}` : ''}`);
    if (res.success && res.data) {
      setMaterials(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMaterials();
  }, [searchQuery]);

  const openCreateModal = () => {
    setEditingMaterial(null);
    setFormData({
      material_code: '',
      material_name: '',
      category: '',
      description: '',
      unit: 'Nos',
      brand_spec: '',
      status: 'active'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (mat: Material) => {
    setEditingMaterial(mat);
    setFormData({
      material_code: mat.material_code,
      material_name: mat.material_name,
      category: mat.category || '',
      description: mat.description || '',
      unit: mat.unit || 'Nos',
      brand_spec: mat.brand_spec || '',
      status: mat.status || 'active'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const endpoint = editingMaterial ? `/materials/master/${editingMaterial.material_id}` : '/materials/master';
    const method = editingMaterial ? 'PUT' : 'POST';

    const res = await apiRequest(endpoint, {
      method,
      body: JSON.stringify(formData),
    });

    setIsSubmitting(false);
    if (res.success) {
      showSuccess(`Material ${editingMaterial ? 'updated' : 'created'} successfully`);
      setIsModalOpen(false);
      fetchMaterials();
    } else {
      showError(res.message || 'Failed to save material');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this material?')) return;
    const res = await apiRequest(`/materials/master/${id}`, { method: 'DELETE' });
    if (res.success) {
      showSuccess('Material deleted successfully');
      fetchMaterials();
    } else {
      showError(res.message || 'Failed to delete material');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Package color="#4f46e5" />
            Material Master
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Manage standard materials</p>
        </div>
        <Button variant="primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Add Material
        </Button>
      </div>

      <div className="glass-card" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search materials..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
          </div>
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
              {isLoading ? (
                <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
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
                        <Button variant="secondary" onClick={() => openEditModal(mat)} style={{ padding: '0.4rem', color: '#6366f1' }}>
                          <Edit size={16} />
                        </Button>
                        <Button variant="secondary" onClick={() => handleDelete(mat.material_id)} style={{ padding: '0.4rem', color: '#ef4444' }}>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingMaterial ? 'Edit Material' : 'Add Material'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <FormInput
            label="Material Code (Leave blank for auto)"
            value={formData.material_code}
            onChange={(e) => setFormData({ ...formData, material_code: e.target.value })}
            disabled={!!editingMaterial}
          />
          <FormInput
            label="Material Name *"
            value={formData.material_name}
            onChange={(e) => setFormData({ ...formData, material_name: e.target.value })}
            required
          />
          <FormInput
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          />
          <FormInput
            label="Unit of Measure"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
          />
          <FormInput
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <FormSelect
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active'|'inactive' })}
            options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (editingMaterial ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
