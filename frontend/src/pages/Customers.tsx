import React, { useEffect, useState } from 'react';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';
import { apiRequest } from '../services/api';
import { Customer, Country, Community, Nationality } from '../types';
import {
  Plus,
  Edit,
  Trash2,
  Building2,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  Eye,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Layers,
} from 'lucide-react';
import { ConfirmDeleteModal } from '../components/common/ConfirmDeleteModal';
import { showSuccess, showError } from '../utils/toast';
import { useAuth } from '../context/AuthContext';

export const Customers: React.FC = () => {
  const { user } = useAuth();
  const isAdminOrManager =
    user?.role_name === 'Admin' || user?.role_name === 'Super Admin' || user?.role_name === 'Manager';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [nationalities, setNationalities] = useState<Nationality[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State for View Profile Details
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

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

  // Form Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Customer / Company Name (Compulsory)
    const trimmedName = formData.customer_name.trim();
    if (!trimmedName) {
      newErrors.customer_name = 'Customer / Company name is compulsory';
    } else if (trimmedName.length < 2) {
      newErrors.customer_name = 'Customer name must be at least 2 characters';
    }

    // Contact Number (Compulsory)
    const trimmedPhone = formData.contact_number.trim();
    if (!trimmedPhone) {
      newErrors.contact_number = 'Contact number is compulsory';
    } else if (trimmedPhone.replace(/[^0-9]/g, '').length < 7) {
      newErrors.contact_number = 'Please enter a valid phone number (at least 7 digits)';
    }

    // Email (Compulsory)
    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail) {
      newErrors.email = 'Email address is compulsory';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        newErrors.email = 'Please enter a valid email address (e.g. client@company.com)';
      }
    }

    // Country (Compulsory)
    if (!formData.country_id) {
      newErrors.country_id = 'Please select a country';
    }

    // Status (Compulsory)
    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

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
    setErrors({});
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
    setErrors({});
    setIsModalOpen(true);
  };

  const openViewModal = (cust: Customer) => {
    setViewingCustomer(cust);
    setIsViewModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showError('Please correct the highlighted compulsory fields.');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      ...formData,
      customer_name: formData.customer_name.trim(),
      customer_code: formData.customer_code.trim(),
      contact_person: formData.contact_person.trim() || null,
      contact_number: formData.contact_number.trim(),
      email: formData.email.trim(),
      state: formData.state.trim() || null,
      city: formData.city.trim() || null,
      address: formData.address.trim() || null,
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
      showSuccess(editingCustomer ? 'Customer updated successfully.' : 'Customer registered successfully.');
      setIsModalOpen(false);
      fetchCustomers();
    } else {
      showError(res.message || 'Failed to save customer.');
      if (res.message?.toLowerCase().includes('email')) {
        setErrors((prev) => ({ ...prev, email: res.message || 'Email already exists' }));
      } else if (res.message?.toLowerCase().includes('code')) {
        setErrors((prev) => ({ ...prev, customer_code: res.message || 'Code already in use' }));
      }
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
    {
      header: 'Code',
      accessor: (r) => (
        <span
          style={{
            fontFamily: 'monospace',
            fontWeight: 700,
            fontSize: '0.8rem',
            color: 'var(--accent-primary)',
            background: 'rgba(99, 102, 241, 0.1)',
            padding: '0.2rem 0.5rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
          }}
        >
          {r.customer_code}
        </span>
      ),
      sortKey: 'customer_code',
    },
    {
      header: 'Customer / Company Name',
      accessor: (r) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <div
            onClick={() => openViewModal(r)}
            style={{
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'color 0.15s ease',
            }}
            title="Click to view details"
            className="hover-underline"
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Building2 size={15} color="var(--accent-primary)" />
            </div>
            <span>{r.customer_name}</span>
          </div>
          {r.contact_person && (
            <div
              style={{
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                paddingLeft: '2rem',
              }}
            >
              <User size={12} /> Contact: <span style={{ color: 'var(--text-secondary)' }}>{r.contact_person}</span>
            </div>
          )}
        </div>
      ),
      sortKey: 'customer_name',
    },
    {
      header: 'Contact Info',
      accessor: (r) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.82rem' }}>
          {r.email ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-primary)' }}>
              <Mail size={13} color="var(--info)" />
              <a
                href={`mailto:${r.email}`}
                style={{ color: 'var(--text-primary)', textDecoration: 'none' }}
                onClick={(e) => e.stopPropagation()}
              >
                {r.email}
              </a>
            </div>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>—</span>
          )}
          {r.contact_number && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
              <Phone size={13} color="var(--success)" />
              <a
                href={`tel:${r.contact_number}`}
                style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
                onClick={(e) => e.stopPropagation()}
              >
                {r.contact_number}
              </a>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Location',
      accessor: (r) => (
        <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontWeight: 500,
              color: 'var(--text-primary)',
            }}
          >
            <Globe size={14} color="var(--purple)" />
            <span>{r.country_name || 'N/A'}</span>
          </div>
          {(r.city || r.state) && (
            <div
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.76rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                paddingLeft: '1.2rem',
              }}
            >
              <MapPin size={11} />
              <span>{[r.city, r.state].filter(Boolean).join(', ')}</span>
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
          <Briefcase size={12} style={{ marginRight: '0.3rem' }} />
          {r.project_count || 0} Project{r.project_count === 1 ? '' : 's'}
        </Badge>
      ),
      sortKey: 'project_count',
    },
    {
      header: 'Status',
      accessor: (r) => (
        <Badge variant={r.status === 'active' ? 'success' : 'danger'}>
          <span
            style={{
              display: 'inline-block',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: r.status === 'active' ? 'var(--success)' : 'var(--danger)',
              marginRight: '0.35rem',
            }}
          />
          {r.status === 'active' ? 'Active' : 'Inactive'}
        </Badge>
      ),
      sortKey: 'status',
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={24} color="var(--accent-primary)" /> Customer Management
          </h1>
          <p className="page-subtitle" style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Manage client profiles, contacts, regional locations, and linked project records
          </p>
        </div>
        {isAdminOrManager && (
          <Button variant="primary" onClick={openCreateModal}>
            <Plus size={18} /> Add Customer
          </Button>
        )}
      </div>

      {/* Main Data Table */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <DataTable
          columns={columns}
          data={customers}
          searchPlaceholder="Search customers by name, code, contact, email, or location..."
          exportFilename="customers_list"
          isLoading={isLoading}
          actions={(row) => (
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <Button
                variant="secondary"
                onClick={() => openViewModal(row)}
                title="View Full Profile"
                style={{ padding: '0.35rem 0.6rem', color: 'var(--text-primary)' }}
              >
                <Eye size={14} />
              </Button>
              {isAdminOrManager && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => openEditModal(row)}
                    title="Edit Customer"
                    style={{ padding: '0.35rem 0.6rem', color: 'var(--text-primary)' }}
                  >
                    <Edit size={14} />
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleDelete(row.customer_id, row.customer_name)}
                    title="Delete Customer"
                    style={{
                      padding: '0.35rem 0.6rem',
                      color: 'var(--danger)',
                      borderColor: 'rgba(239, 68, 68, 0.3)',
                    }}
                  >
                    <Trash2 size={14} />
                  </Button>
                </>
              )}
            </div>
          )}
        />
      </div>

      {/* Create / Edit Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Building2 size={18} color="var(--accent-primary)" />
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {editingCustomer ? `Edit Customer (${editingCustomer.customer_code})` : 'Register New Customer'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Fields marked with (<span style={{ color: 'var(--danger)' }}>*</span>) are compulsory
              </div>
            </div>
          </div>
        }
      >
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Section 1: Company Profile */}
            <div
              style={{
                background: 'var(--border-color)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '0.85rem',
                  paddingBottom: '0.4rem',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <Building2 size={16} color="var(--accent-primary)" />
                <span>1. Company & Account Details</span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '0.85rem',
                }}
              >
                <div>
                  <FormInput
                    label="Customer / Company Name"
                    placeholder="e.g. Al-Noor Enterprises LLC"
                    value={formData.customer_name}
                    onChange={(e) => handleFieldChange('customer_name', e.target.value)}
                    error={errors.customer_name}
                    required
                  />
                </div>

                <div>
                  <FormInput
                    label="Customer Code"
                    placeholder="Auto-generated if left blank (e.g. CUST-0001)"
                    value={formData.customer_code}
                    onChange={(e) => handleFieldChange('customer_code', e.target.value)}
                    error={errors.customer_code}
                  />
                </div>

                <div>
                  <FormSelect
                    label="Account Status"
                    value={formData.status}
                    onChange={(e) => handleFieldChange('status', e.target.value)}
                    error={errors.status}
                    required
                    options={[
                      { value: 'active', label: 'Active (Enabled)' },
                      { value: 'inactive', label: 'Inactive (Disabled)' },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Contact Information */}
            <div
              style={{
                background: 'var(--border-color)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '0.85rem',
                  paddingBottom: '0.4rem',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <User size={16} color="var(--info)" />
                <span>2. Primary Contact Details</span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '0.85rem',
                }}
              >
                <div>
                  <FormInput
                    label="Contact Person"
                    placeholder="Primary contact person / manager"
                    value={formData.contact_person}
                    onChange={(e) => handleFieldChange('contact_person', e.target.value)}
                  />
                </div>

                <div>
                  <FormInput
                    label="Contact Phone Number"
                    placeholder="e.g. +971 50 123 4567"
                    value={formData.contact_number}
                    onChange={(e) => handleFieldChange('contact_number', e.target.value)}
                    error={errors.contact_number}
                    required
                  />
                </div>

                <div>
                  <FormInput
                    label="Email Address"
                    type="email"
                    placeholder="e.g. procurement@company.com"
                    value={formData.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    error={errors.email}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Regional & Billing Address */}
            <div
              style={{
                background: 'var(--border-color)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '0.85rem',
                  paddingBottom: '0.4rem',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <Globe size={16} color="var(--purple)" />
                <span>3. Regional & Billing Address</span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '0.85rem',
                  marginBottom: '0.85rem',
                }}
              >
                <div>
                  <FormSelect
                    label="Country"
                    value={formData.country_id}
                    onChange={(e) => handleFieldChange('country_id', e.target.value)}
                    error={errors.country_id}
                    required
                    options={[
                      { value: '', label: '-- Select Country (Compulsory) --' },
                      ...countries.map((c) => ({
                        value: String(c.country_id),
                        label: `${c.country_name} (${c.country_code})`,
                      })),
                    ]}
                  />
                </div>

                <div>
                  <FormInput
                    label="State / Province"
                    placeholder="e.g. Dubai, Abu Dhabi, etc."
                    value={formData.state}
                    onChange={(e) => handleFieldChange('state', e.target.value)}
                  />
                </div>

                <div>
                  <FormInput
                    label="City"
                    placeholder="e.g. Dubai"
                    value={formData.city}
                    onChange={(e) => handleFieldChange('city', e.target.value)}
                  />
                </div>

                <div>
                  <FormSelect
                    label="Community"
                    value={formData.community_id}
                    onChange={(e) => handleFieldChange('community_id', e.target.value)}
                    options={[
                      { value: '', label: '-- Select Community (Optional) --' },
                      ...communities.map((cm) => ({
                        value: String(cm.community_id),
                        label: cm.community_name,
                      })),
                    ]}
                  />
                </div>

                <div>
                  <FormSelect
                    label="Nationality"
                    value={formData.nationality_id}
                    onChange={(e) => handleFieldChange('nationality_id', e.target.value)}
                    options={[
                      { value: '', label: '-- Select Nationality (Optional) --' },
                      ...nationalities.map((n) => ({
                        value: String(n.nationality_id),
                        label: n.nationality_name,
                      })),
                    ]}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    marginBottom: '0.4rem',
                  }}
                >
                  Billing / Registered Address
                </label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Full office, tower, street address, or PO Box..."
                  value={formData.address}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '0.75rem',
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? (
                'Saving...'
              ) : editingCustomer ? (
                <>
                  <CheckCircle2 size={16} /> Update Customer
                </>
              ) : (
                <>
                  <Plus size={16} /> Register Customer
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Customer Details Modal */}
      {viewingCustomer && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(99, 102, 241, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Building2 size={18} color="var(--accent-primary)" />
              </div>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {viewingCustomer.customer_name}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Customer Profile & Contact Record
                </div>
              </div>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Header Highlights */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.75rem',
                background: 'var(--border-color)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Customer Code
                </div>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: 'var(--accent-primary)',
                    marginTop: '0.2rem',
                  }}
                >
                  {viewingCustomer.customer_code}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Account Status
                </div>
                <div style={{ marginTop: '0.2rem' }}>
                  <Badge variant={viewingCustomer.status === 'active' ? 'success' : 'danger'}>
                    {viewingCustomer.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Linked Projects
                </div>
                <div style={{ marginTop: '0.2rem' }}>
                  <Badge variant={viewingCustomer.project_count && viewingCustomer.project_count > 0 ? 'info' : 'warning'}>
                    <Briefcase size={12} style={{ marginRight: '0.25rem' }} />
                    {viewingCustomer.project_count || 0} Project(s)
                  </Badge>
                </div>
              </div>
            </div>

            {/* Profile Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1rem',
              }}
            >
              {/* Contact Card */}
              <div
                style={{
                  background: 'var(--border-color)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '0.75rem',
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: '0.4rem',
                  }}
                >
                  <User size={15} color="var(--info)" /> Primary Contact
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>
                      Contact Person:
                    </span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                      {viewingCustomer.contact_person || 'Not specified'}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>
                      Phone / Mobile:
                    </span>
                    {viewingCustomer.contact_number ? (
                      <a
                        href={`tel:${viewingCustomer.contact_number}`}
                        style={{ color: 'var(--success)', textDecoration: 'none', fontWeight: 500 }}
                      >
                        {viewingCustomer.contact_number}
                      </a>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Not specified</span>
                    )}
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>
                      Email Address:
                    </span>
                    {viewingCustomer.email ? (
                      <a
                        href={`mailto:${viewingCustomer.email}`}
                        style={{ color: 'var(--info)', textDecoration: 'none', fontWeight: 500 }}
                      >
                        {viewingCustomer.email}
                      </a>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Not specified</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Location Card */}
              <div
                style={{
                  background: 'var(--border-color)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '0.75rem',
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: '0.4rem',
                  }}
                >
                  <Globe size={15} color="var(--purple)" /> Location & Regional Details
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Country:</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                      {viewingCustomer.country_name || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>
                      City / State:
                    </span>
                    <span style={{ color: 'var(--text-primary)' }}>
                      {[viewingCustomer.city, viewingCustomer.state].filter(Boolean).join(', ') || 'N/A'}
                    </span>
                  </div>
                  {viewingCustomer.community_name && (
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>
                        Community:
                      </span>
                      <span style={{ color: 'var(--text-primary)' }}>{viewingCustomer.community_name}</span>
                    </div>
                  )}
                  {viewingCustomer.nationality_name && (
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>
                        Nationality:
                      </span>
                      <span style={{ color: 'var(--text-primary)' }}>{viewingCustomer.nationality_name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Address */}
            {viewingCustomer.address && (
              <div
                style={{
                  background: 'var(--border-color)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem',
                  }}
                >
                  <MapPin size={15} color="var(--warning)" /> Registered / Billing Address
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {viewingCustomer.address}
                </p>
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            {isAdminOrManager && (
              <Button
                variant="primary"
                onClick={() => {
                  setIsViewModalOpen(false);
                  openEditModal(viewingCustomer);
                }}
              >
                <Edit size={14} /> Edit Customer
              </Button>
            )}
            <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
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
