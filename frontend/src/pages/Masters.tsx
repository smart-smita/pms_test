import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { DataTable, Column } from '../components/common/DataTable';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';
import { Plus, Edit } from 'lucide-react';
import { showSuccess, showError } from '../utils/toast';

export const Masters: React.FC = () => {
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'project_types' | 'communities' | 'terms_templates'>('project_types');
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    let endpoint = '';
    if (activeTab === 'project_types') endpoint = '/masters/project-types?all=true';
    if (activeTab === 'communities') endpoint = '/masters/communities';
    if (activeTab === 'terms_templates') endpoint = '/terms-templates';

    const res = await apiRequest<any[]>(endpoint);
    if (res.success && res.data) {
      setData(res.data);
    }
    setIsLoading(false);
  };

  const handleOpenModal = (item?: any) => {
    setFormData(item || {});
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    let endpoint = '';
    if (activeTab === 'project_types') endpoint = '/masters/project-types';
    if (activeTab === 'communities') endpoint = '/masters/communities';
    if (activeTab === 'terms_templates') endpoint = '/terms-templates';

    const isEdit = !!formData.project_type_id || !!formData.id || !!formData.template_id;
    const method = isEdit ? 'PUT' : 'POST';
    const submitEndpoint = isEdit ? `\${endpoint}/\${formData.project_type_id || formData.template_id || formData.id}` : endpoint;

    // For Terms templates, ensure we have minimal required fields
    const payload = { ...formData };
    if (activeTab === 'terms_templates' && !isEdit) {
      payload.template_type = payload.template_type || 'standard';
      payload.is_active = 1;
      payload.items = payload.items || [];
    }

    const res = await apiRequest(submitEndpoint, {
      method,
      body: JSON.stringify(payload),
    });

    setIsSubmitting(false);

    if (res.success) {
      showSuccess(`\${activeTab.replace('_', ' ')} saved successfully`);
      setIsModalOpen(false);
      fetchData();
    } else {
      showError(res.message || 'Failed to save record');
    }
  };

  const getColumns = (): Column<any>[] => {
    if (activeTab === 'project_types') {
      return [
        { header: 'Project Type Name', accessor: 'project_type_name', sortKey: 'project_type_name' },
        { header: 'Description', accessor: 'description', sortKey: 'description' },
        { header: 'Status', accessor: (r) => r.is_active ? 'Active' : 'Inactive' },
      ];
    }
    if (activeTab === 'communities') {
      return [
        { header: 'Community Name', accessor: 'community_name', sortKey: 'community_name' },
        { header: 'State/Region', accessor: 'state', sortKey: 'state' },
      ];
    }
    return [
      { header: 'Template Name', accessor: 'template_name', sortKey: 'template_name' },
      { header: 'Status', accessor: (r) => r.status === 1 ? 'Active' : 'Inactive' },
    ];
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">System Masters</h1>
          <p className="page-subtitle">Manage project types, templates, and reference data</p>
        </div>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          <Plus size={16} /> Add New
        </Button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
        <button
          onClick={() => setActiveTab('project_types')}
          style={{ padding: '0.75rem 1rem', background: 'transparent', border: 'none', borderBottom: activeTab === 'project_types' ? '2px solid #4f46e5' : '2px solid transparent', color: activeTab === 'project_types' ? '#4f46e5' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}
        >
          Project Types
        </button>
        <button
          onClick={() => setActiveTab('terms_templates')}
          style={{ padding: '0.75rem 1rem', background: 'transparent', border: 'none', borderBottom: activeTab === 'terms_templates' ? '2px solid #4f46e5' : '2px solid transparent', color: activeTab === 'terms_templates' ? '#4f46e5' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}
        >
          Terms Templates
        </button>
        <button
          onClick={() => setActiveTab('communities')}
          style={{ padding: '0.75rem 1rem', background: 'transparent', border: 'none', borderBottom: activeTab === 'communities' ? '2px solid #4f46e5' : '2px solid transparent', color: activeTab === 'communities' ? '#4f46e5' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}
        >
          Communities
        </button>
      </div>

      <div className="glass-card">
        <DataTable
          columns={getColumns()}
          data={data}
          searchPlaceholder="Search master data..."
          isLoading={isLoading}
          actions={(row) => (
            <Button variant="secondary" onClick={() => handleOpenModal(row)} style={{ padding: '0.35rem 0.65rem' }}>
              <Edit size={14} /> Edit
            </Button>
          )}
        />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Manage Master Data">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {activeTab === 'project_types' && (
            <>
              <FormInput label="Project Type Name" type="text" value={formData.project_type_name || ''} onChange={(e) => setFormData({...formData, project_type_name: e.target.value})} required />
              <FormInput label="Description" type="text" value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} />
              <FormSelect label="Status" value={formData.is_active !== undefined ? String(formData.is_active) : '1'} onChange={(e) => setFormData({...formData, is_active: Number(e.target.value)})} options={[{value: '1', label: 'Active'}, {value: '0', label: 'Inactive'}]} />
            </>
          )}

          {activeTab === 'communities' && (
            <>
              <FormInput label="Community Name" type="text" value={formData.community_name || ''} onChange={(e) => setFormData({...formData, community_name: e.target.value})} required />
              <FormInput label="State/Region" type="text" value={formData.state || ''} onChange={(e) => setFormData({...formData, state: e.target.value})} />
            </>
          )}

          {activeTab === 'terms_templates' && (
            <>
              <FormInput label="Template Name" type="text" value={formData.template_name || ''} onChange={(e) => setFormData({...formData, template_name: e.target.value})} required />
              
              <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Template Clauses / Conditions</h4>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      const currentItems = formData.items || [];
                      setFormData({
                        ...formData,
                        items: [...currentItems, { title: '', description: '', sort_order: currentItems.length + 1 }]
                      });
                    }}
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                  >
                    <Plus size={12} /> Add Condition
                  </Button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {(formData.items || []).map((item: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Condition {idx + 1}</div>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            const newItems = formData.items.filter((_: any, i: number) => i !== idx);
                            setFormData({ ...formData, items: newItems });
                          }}
                          style={{ padding: '0.25rem 0.5rem', color: '#ef4444', height: 'auto', minHeight: 'auto' }}
                        >
                          ✕ Remove
                        </Button>
                      </div>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[idx].title = e.target.value;
                          setFormData({ ...formData, items: newItems });
                        }}
                        style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                        placeholder="Condition Title (e.g., Payment Terms)"
                        required
                      />
                      <textarea
                        value={item.description}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[idx].description = e.target.value;
                          setFormData({ ...formData, items: newItems });
                        }}
                        style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', minHeight: '60px', fontFamily: 'inherit' }}
                        placeholder="Condition Description..."
                      />
                    </div>
                  ))}
                  {(!formData.items || formData.items.length === 0) && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>
                      No conditions added yet.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
