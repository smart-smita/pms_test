import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Truck,
  Wrench,
  Users,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  FileText
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';
import { ConfirmDeleteModal } from '../components/common/ConfirmDeleteModal';
import { showSuccess, showError } from '../utils/toast';
import { useAuth } from '../context/AuthContext';

export interface Vendor {
  vendor_id: number;
  vendor_code: string;
  vendor_name: string;
  vendor_type: 'material' | 'equipment' | 'contractor' | 'general';
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  gst_number: string | null;
  pan_number: string | null;
  bank_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  payment_terms_days: number;
  status: 'active' | 'inactive';
  created_at: string;
}

export const Vendors: React.FC = () => {
  const { hasPermission } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingVendor, setDeletingVendor] = useState<Vendor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    vendor_code: '',
    vendor_name: '',
    vendor_type: 'material' as 'material' | 'equipment' | 'contractor' | 'general',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    gst_number: '',
    pan_number: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    payment_terms_days: 30,
    status: 'active' as 'active' | 'inactive'
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchVendors = async () => {
    setIsLoading(true);
    let url = '/vendors';
    const params: string[] = [];
    if (selectedType !== 'all') params.push(`vendor_type=${selectedType}`);
    if (selectedStatus !== 'all') params.push(`status=${selectedStatus}`);
    if (searchQuery.trim()) params.push(`search=${encodeURIComponent(searchQuery.trim())}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    const res = await apiRequest<Vendor[]>(url);
    if (res.success && res.data) {
      setVendors(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchVendors();
  }, [selectedType, selectedStatus]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVendors();
  };

  const openCreateModal = () => {
    setEditingVendor(null);
    setFormData({
      vendor_code: `VEN-${Date.now().toString().slice(-4)}`,
      vendor_name: '',
      vendor_type: 'material',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      gst_number: '',
      pan_number: '',
      bank_name: '',
      account_number: '',
      ifsc_code: '',
      payment_terms_days: 30,
      status: 'active'
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (v: Vendor) => {
    setEditingVendor(v);
    setFormData({
      vendor_code: v.vendor_code,
      vendor_name: v.vendor_name,
      vendor_type: v.vendor_type,
      contact_person: v.contact_person || '',
      email: v.email || '',
      phone: v.phone || '',
      address: v.address || '',
      gst_number: v.gst_number || '',
      pan_number: v.pan_number || '',
      bank_name: v.bank_name || '',
      account_number: v.account_number || '',
      ifsc_code: v.ifsc_code || '',
      payment_terms_days: v.payment_terms_days || 30,
      status: v.status
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.vendor_name.trim()) errs.vendor_name = 'Vendor name is required';
    if (!formData.vendor_code.trim()) errs.vendor_code = 'Vendor code is required';
    if (formData.email && !formData.email.includes('@')) errs.email = 'Invalid email address';
    if (formData.gst_number && formData.gst_number.length !== 15) {
      errs.gst_number = 'GSTIN must be 15 alphanumeric characters';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (editingVendor) {
        const res = await apiRequest(`/vendors/${editingVendor.vendor_id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        if (res.success) {
          showSuccess('Vendor updated successfully');
          setIsModalOpen(false);
          fetchVendors();
        } else {
          showError(res.message || 'Failed to update vendor');
        }
      } else {
        const res = await apiRequest('/vendors', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        if (res.success) {
          showSuccess('Vendor created successfully');
          setIsModalOpen(false);
          fetchVendors();
        } else {
          showError(res.message || 'Failed to create vendor');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingVendor) return;
    setIsDeleting(true);
    try {
      const res = await apiRequest(`/vendors/${deletingVendor.vendor_id}`, {
        method: 'DELETE'
      });
      if (res.success) {
        showSuccess('Vendor deleted successfully');
        setIsDeleteModalOpen(false);
        setDeletingVendor(null);
        fetchVendors();
      } else {
        showError(res.message || 'Failed to delete vendor');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // KPI calculations
  const totalCount = vendors.length;
  const materialSuppliers = vendors.filter(v => v.vendor_type === 'material').length;
  const equipmentVendors = vendors.filter(v => v.vendor_type === 'equipment').length;
  const contractors = vendors.filter(v => v.vendor_type === 'contractor').length;

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'material':
        return <Badge variant="info">Material Supplier</Badge>;
      case 'equipment':
        return <Badge variant="warning">Equipment Rental</Badge>;
      case 'contractor':
        return <Badge variant="success">Subcontractor</Badge>;
      default:
        return <Badge variant="secondary">General</Badge>;
    }
  };

  const columns: Column<Vendor>[] = [
    {
      header: 'Code & Name',
      accessor: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.vendor_name}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{row.vendor_code}</div>
        </div>
      )
    },
    {
      header: 'Category Type',
      accessor: (row) => getTypeBadge(row.vendor_type)
    },
    {
      header: 'Contact Person',
      accessor: (row) => row.contact_person || '—'
    },
    {
      header: 'Contact Details',
      accessor: (row) => (
        <div style={{ fontSize: '0.82rem' }}>
          {row.phone && <div>{row.phone}</div>}
          {row.email && <div style={{ color: 'var(--text-muted)' }}>{row.email}</div>}
          {!row.phone && !row.email && <span>—</span>}
        </div>
      )
    },
    {
      header: 'GSTIN / PAN',
      accessor: (row) => (
        <div style={{ fontSize: '0.82rem' }}>
          {row.gst_number && <div><span style={{ color: 'var(--text-muted)' }}>GST:</span> {row.gst_number}</div>}
          {row.pan_number && <div><span style={{ color: 'var(--text-muted)' }}>PAN:</span> {row.pan_number}</div>}
          {!row.gst_number && !row.pan_number && <span>—</span>}
        </div>
      )
    },
    {
      header: 'Credit Terms',
      accessor: (row) => `${row.payment_terms_days || 30} Days`
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge variant={row.status === 'active' ? 'success' : 'danger'}>
          {row.status.toUpperCase()}
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => openEditModal(row)}
            title="Edit Vendor"
          >
            <Edit size={16} />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setDeletingVendor(row);
              setIsDeleteModalOpen(true);
            }}
            title="Deactivate Vendor"
          >
            <Trash2 size={16} color="var(--danger)" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Building2 color="#4f46e5" size={28} />
            Suppliers & Contractors Master
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Manage approved vendors, material suppliers, equipment plant agencies, and civil subcontractors
          </p>
        </div>
        <Button onClick={openCreateModal} variant="primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Add Supplier / Contractor
        </Button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span>Total Vendors</span>
            <Building2 size={20} color="#4f46e5" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.5rem' }}>{totalCount}</div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span>Material Suppliers</span>
            <Truck size={20} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.5rem' }}>{materialSuppliers}</div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span>Equipment Agencies</span>
            <Wrench size={20} color="#d97706" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.5rem' }}>{equipmentVendors}</div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span>Subcontractors</span>
            <Users size={20} color="#16a34a" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.5rem' }}>{contractors}</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by vendor name, code, GSTIN, or contact person..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '0.65rem 1rem 0.65rem 2.65rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
          </div>
          <Button type="submit" variant="secondary">Search</Button>
        </form>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            style={{ padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
          >
            <option value="all">All Vendor Types</option>
            <option value="material">Material Suppliers</option>
            <option value="equipment">Equipment Rental</option>
            <option value="contractor">Subcontractors</option>
            <option value="general">General Suppliers</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Vendors Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          data={vendors}
          keyExtractor={(v) => v.vendor_id}
          isLoading={isLoading}
          emptyMessage="No suppliers or contractors found. Click 'Add Supplier / Contractor' to register the first vendor."
        />
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Building2 size={22} color="#4f46e5" />
            <span>{editingVendor ? `Edit Vendor (${editingVendor.vendor_code})` : 'Register New Supplier / Contractor'}</span>
          </div>
        }
      >
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Basic Info */}
            <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>1. Basic & Commercial Details</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                <FormInput
                  label="Vendor / Firm Name"
                  placeholder="e.g. UltraTech Cement Ltd."
                  value={formData.vendor_name}
                  onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                  error={formErrors.vendor_name}
                  required
                />
                <FormInput
                  label="Vendor Code"
                  placeholder="Auto-generated or custom code"
                  value={formData.vendor_code}
                  onChange={(e) => setFormData({ ...formData, vendor_code: e.target.value })}
                  error={formErrors.vendor_code}
                  required
                />
                <FormSelect
                  label="Vendor Category"
                  value={formData.vendor_type}
                  onChange={(e) => setFormData({ ...formData, vendor_type: e.target.value as any })}
                  options={[
                    { value: 'material', label: 'Material Supplier' },
                    { value: 'equipment', label: 'Equipment Rental Agency' },
                    { value: 'contractor', label: 'Civil / Labour Subcontractor' },
                    { value: 'general', label: 'General / Service Vendor' }
                  ]}
                  required
                />
                <FormSelect
                  label="Account Status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  options={[
                    { value: 'active', label: 'Active (Approved)' },
                    { value: 'inactive', label: 'Inactive (Blacklisted / On-Hold)' }
                  ]}
                />
              </div>
            </div>

            {/* Contact Details */}
            <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>2. Contact Information</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                <FormInput
                  label="Contact Person"
                  placeholder="Key Account Manager"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                />
                <FormInput
                  label="Phone / Mobile"
                  placeholder="e.g. +91 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <FormInput
                  label="Corporate Email"
                  placeholder="e.g. sales@vendor.com"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  error={formErrors.email}
                />
                <FormInput
                  label="Registered / Dispatch Address"
                  placeholder="Office or factory address..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>

            {/* Tax & Banking Details */}
            <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>3. Statutory & Banking Details</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                <FormInput
                  label="GSTIN Number"
                  placeholder="15-digit GSTIN (e.g. 27AADCU1234E1Z5)"
                  value={formData.gst_number}
                  onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })}
                  error={formErrors.gst_number}
                />
                <FormInput
                  label="PAN Number"
                  placeholder="10-digit PAN (e.g. AADCU1234E)"
                  value={formData.pan_number}
                  onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase() })}
                />
                <FormInput
                  label="Bank Name"
                  placeholder="e.g. HDFC Bank Ltd."
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                />
                <FormInput
                  label="Account Number"
                  placeholder="Bank Account Number"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                />
                <FormInput
                  label="IFSC Code"
                  placeholder="e.g. HDFC0001234"
                  value={formData.ifsc_code}
                  onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value.toUpperCase() })}
                />
                <FormInput
                  label="Payment Credit Period (Days)"
                  type="number"
                  placeholder="e.g. 30"
                  value={formData.payment_terms_days}
                  onChange={(e) => setFormData({ ...formData, payment_terms_days: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingVendor ? 'Save Changes' : 'Register Vendor'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Deactivate Vendor"
        recordName={`${deletingVendor?.vendor_name || ''} (${deletingVendor?.vendor_code || ''})`}
        isLoading={isDeleting}
      />
    </div>
  );
};
