import React, { useEffect, useState } from 'react';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';
import { apiRequest } from '../services/api';
import { Customer, Country, Community, Nationality } from '../types';
import { Plus, Edit, Trash2, Building2, User, Mail, Phone, Globe } from 'lucide-react';
import { ConfirmDeleteModal } from '../components/common/ConfirmDeleteModal';
import { showSuccess, showError } from '../utils/toast';
import { useAuth } from '../context/AuthContext';

export const Customers: React.FC = () => {
  const { user } = useAuth();
  const isAdminOrManager = user?.role_name === 'Admin' || user?.role_name === 'Super Admin' || user?.role_name === 'Manager';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [nationalities, setNationalities] = useState<Nationality[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    customer_code: '',
    customer_name: '',
    contact_person: '',
    contact_number: '',
    email: '',
    country_id: '',
    state: '',
    city: '',
    community_id: '',
    nationality_id: '',
    address: '',
    status: 'active' as 'active' | 'inactive',
  });

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<{ id: number; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCustomers = async () => {
    setIsLoading(true);
    const res = await apiRequest<Customer[]>('/customers');
    if (res.success && res.data) {
      setCustomers(res.data);
    }
    setIsLoading(false);
  };

  const fetchMasters = async () => {
    const [cRes, cmRes, nRes] = await Promise.all([
      apiRequest<Country[]>('/masters/countries'),
      apiRequest<Community[]>('/masters/communities'),
      apiRequest<Nationality[]>('/masters/nationalities'),
    ]);
    if (cRes.success && cRes.data) setCountries(cRes.data);
    if (cmRes.success && cmRes.data) setCommunities(cmRes.data);
    if (nRes.success && nRes.data) setNationalities(nRes.data);
  };

  useEffect(() => {
    fetchCustomers();
    fetchMasters();
  }, []);

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormData({
      customer_code: '',
      customer_name: '',
      contact_person: '',
      contact_number: '',
      email: '',
      country_id: '',
      state: '',
      city: '',
      community_id: '',
      nationality_id: '',
      address: '',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setFormData({
      customer_code: cust.customer_code || '',
      customer_name: cust.customer_name || '',
      contact_person: cust.contact_person || '',
      contact_number: cust.contact_number || '',
      email: cust.email || '',
      country_id: cust.country_id ? String(cust.country_id) : '',
      state: cust.state || '',
      city: cust.city || '',
      community_id: cust.community_id ? String(cust.community_id) : '',
      nationality_id: cust.nationality_id ? String(cust.nationality_id) : '',
      address: cust.address || '',
      status: cust.status || 'active',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_name.trim()) {
      showError('Customer name is required.');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      ...formData,
      country_id: formData.country_id ? Number(formData.country_id) : null,
      community_id: formData.community_id ? Number(formData.community_id) : null,
      nationality_id: formData.nationality_id ? Number(formData.nationality_id) : null,
    };

    const endpoint = editingCustomer ? `/customers/${editingCustomer.customer_id}` : '/customers';
    const method = editingCustomer ? 'PUT' : 'POST';

    const res = await apiRequest<Customer>(endpoint, {
      method,
      body: JSON.stringify(payload),
    });

    setIsSubmitting(false);

    if (res.success) {
      showSuccess(editingCustomer ? 'Customer updated successfully.' : 'Customer created successfully.');
      setIsModalOpen(false);
      fetchCustomers();
    } else {
      showError(res.message || 'Failed to save customer.');
    }
  };

  const handleDelete = (id: number, name: string) => {
    setDeletingCustomer({ id, name });
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingCustomer) return;
    setIsDeleting(true);
    const res = await apiRequest(`/customers/${deletingCustomer.id}`, { method: 'DELETE' });
    setIsDeleting(false);

    if (res.success) {
      showSuccess('Customer deleted successfully.');
      setIsDeleteModalOpen(false);
      fetchCustomers();
    } else {
      showError(res.message || 'Unable to delete customer.');
    }
  };

  const columns: Column<Customer>[] = [
    { header: 'Code', accessor: 'customer_code', sortKey: 'customer_code' },
    {
      header: 'Customer Name',
      accessor: (r) => (
        <div>
          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Building2 size={16} color="#6366f1" />
            {r.customer_name}
          </div>
          {r.contact_person && (
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.1rem' }}>
              <User size={12} /> Contact: {r.contact_person}
            </div>
          )}
        </div>
      ),
      sortKey: 'customer_name',
    },
    {
      header: 'Contact Info',
      accessor: (r) => (
        <div style={{ fontSize: '0.82rem' }}>
          {r.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#cbd5e1' }}>
              <Mail size={12} color="#38bdf8" /> {r.email}
            </div>
          )}
          {r.contact_number && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#94a3b8' }}>
              <Phone size={12} color="#4ade80" /> {r.contact_number}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Location / Country',
      accessor: (r) => (
        <div style={{ fontSize: '0.82rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Globe size={13} color="#a855f7" /> {r.country_name || 'N/A'}
          </div>
          {(r.city || r.state) && (
            <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
              {[r.city, r.state].filter(Boolean).join(', ')}
            </div>
          )}
        </div>
      ),
      sortKey: 'country_name',
    },
    {
      header: 'Projects',
      accessor: (r) => (
        <Badge variant={r.project_count && r.project_count > 0 ? 'info' : 'warning'}>
          {r.project_count || 0} Project(s)
        </Badge>
      ),
      sortKey: 'project_count',
    },
    {
      header: 'Status',
      accessor: (r) => (
        <Badge variant={r.status === 'active' ? 'success' : 'danger'}>
          {r.status}
        </Badge>
      ),
      sortKey: 'status',
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Customer Management</h1>
          <p className="page-subtitle">Manage client accounts, regional contacts, and project associations</p>
        </div>
        {isAdminOrManager && (
          <Button variant="primary" onClick={openCreateModal}>
            <Plus size={18} /> Add Customer
          </Button>
        )}
      </div>

      <div className="glass-card">
        <DataTable
          columns={columns}
          data={customers}
          searchPlaceholder="Search customers by name, code, contact, email, or location..."
          exportFilename="customers_list"
          isLoading={isLoading}
          actions={
            isAdminOrManager
              ? (row) => (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button variant="secondary" onClick={() => openEditModal(row)} style={{ padding: '0.35rem 0.65rem' }}>
                      <Edit size={14} /> Edit
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleDelete(row.customer_id, row.customer_name)}
                      style={{ padding: '0.35rem 0.65rem', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                    >
                      <Trash2 size={14} /> Delete
                    </Button>
                  </div>
                )
              : undefined
          }
        />
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? `Edit Customer (${editingCustomer.customer_code})` : 'Register New Customer'}
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormInput
              label="Customer Code (Optional)"
              placeholder="Auto-generated if blank (e.g. CUST-0001)"
              value={formData.customer_code}
              onChange={(e) => setFormData({ ...formData, customer_code: e.target.value })}
            />
            <FormInput
              label="Customer / Company Name"
              placeholder="Enter company name"
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              required
            />
            <FormInput
              label="Contact Person"
              placeholder="Primary contact person name"
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            />
            <FormInput
              label="Contact Number"
              placeholder="+91 98765 43210"
              value={formData.contact_number}
              onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
            />
            <FormInput
              label="Email Address"
              type="email"
              placeholder="client@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <FormSelect
              label="Country"
              value={formData.country_id}
              onChange={(e) => setFormData({ ...formData, country_id: e.target.value })}
              options={[
                { value: '', label: '-- Select Country --' },
                ...countries.map((c) => ({ value: String(c.country_id), label: `${c.country_name} (${c.country_code})` })),
              ]}
            />
            <FormInput
              label="State / Province"
              placeholder="State or Region"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            />
            <FormInput
              label="City"
              placeholder="City name"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <FormSelect
              label="Community"
              value={formData.community_id}
              onChange={(e) => setFormData({ ...formData, community_id: e.target.value })}
              options={[
                { value: '', label: '-- Select Community (Optional) --' },
                ...communities.map((c) => ({ value: String(c.community_id), label: c.community_name })),
              ]}
            />
            <FormSelect
              label="Nationality"
              value={formData.nationality_id}
              onChange={(e) => setFormData({ ...formData, nationality_id: e.target.value })}
              options={[
                { value: '', label: '-- Select Nationality (Optional) --' },
                ...nationalities.map((n) => ({ value: String(n.nationality_id), label: n.nationality_name })),
              ]}
            />
            <FormSelect
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              required
            />
          </div>

          <div style={{ marginTop: '1rem' }}>
            <FormInput
              label="Billing / Registered Address"
              placeholder="Full office or project billing address..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        recordName={deletingCustomer?.name || 'this customer'}
        isLoading={isDeleting}
      />
    </div>
  );
};
