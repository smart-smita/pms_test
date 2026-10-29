import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { FormInput } from '../components/forms/FormInput';
import { Button } from '../components/common/Button';
import { Save, Key, User as UserIcon, Sliders, Building2, Globe, FileText } from 'lucide-react';
import { showSuccess, showError } from '../utils/toast';
import { parseApiErrors } from '../services/api';
import { WorkCategorySettings } from './WorkCategorySettings';

interface SettingsProps {
  initialTab?: 'profile' | 'security' | 'project-config' | 'company';
}

export const Settings: React.FC<SettingsProps> = ({ initialTab = 'company' }) => {
  const { user } = useAuth();
  const isAdmin = user?.role_name === 'Admin' || user?.role_name === 'Super Admin';
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'project-config' | 'company'>(
    initialTab || (isAdmin ? 'company' : 'profile')
  );

  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Company Profile State
  const [companyData, setCompanyData] = useState({
    company_name: '',
    legal_name: '',
    gst_number: '',
    pan_number: '',
    cin_number: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    currency_code: 'INR',
    financial_year_start: '04-01',
    date_format: 'DD/MM/YYYY',
    timezone: 'Asia/Kolkata'
  });
  const [isLoadingCompany, setIsLoadingCompany] = useState(false);
  const [isSubmittingCompany, setIsSubmittingCompany] = useState(false);
  
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      setIsLoadingCompany(true);
      apiRequest<Record<string, string>>('/settings/company').then(res => {
        if (res.success && res.data) {
          setCompanyData(prev => ({ ...prev, ...res.data }));
        }
        setIsLoadingCompany(false);
      });
    }
  }, [isAdmin]);

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingCompany(true);
    const res = await apiRequest('/settings/company', {
      method: 'PUT',
      body: JSON.stringify(companyData)
    });
    setIsSubmittingCompany(false);
    if (res.success) {
      showSuccess('Company profile and statutory configuration updated successfully!');
    } else {
      showError(res.message || 'Failed to update company settings');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrors({});
    setIsSubmittingProfile(true);
    const res = await apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
    setIsSubmittingProfile(false);
    if (res.success) {
      showSuccess('Profile updated successfully! Please login again to reflect changes.');
    } else {
      if (res.errors) setProfileErrors(parseApiErrors(res.errors));
      showError(res.message || 'Failed to update profile');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrors({});
    if (newPassword !== confirmPassword) {
      setPasswordErrors({ confirmPassword: 'New passwords do not match' });
      return;
    }
    setIsSubmittingPassword(true);
    const res = await apiRequest('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setIsSubmittingPassword(false);
    if (res.success) {
      showSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      if (res.errors) setPasswordErrors(parseApiErrors(res.errors));
      showError(res.message || 'Failed to update password');
    }
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account profile, security, and global project configurations</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '1.5rem',
        paddingBottom: '0.25rem',
      }}>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('company')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'company' ? '#4f46e5' : 'transparent',
              color: activeTab === 'company' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: activeTab === 'company' ? 600 : 500,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Building2 size={16} /> Company & Tax Profile
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => setActiveTab('project-config')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'project-config' ? '#4f46e5' : 'transparent',
              color: activeTab === 'project-config' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: activeTab === 'project-config' ? 600 : 500,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Sliders size={16} /> Work Category Configuration
          </button>
        )}

        <button
          onClick={() => setActiveTab('profile')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'profile' ? '#4f46e5' : 'transparent',
            color: activeTab === 'profile' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: activeTab === 'profile' ? 600 : 500,
            fontSize: '0.88rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <UserIcon size={16} /> Profile Information
        </button>

        <button
          onClick={() => setActiveTab('security')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'security' ? '#4f46e5' : 'transparent',
            color: activeTab === 'security' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: activeTab === 'security' ? 600 : 500,
            fontSize: '0.88rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Key size={16} /> Change Password
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'company' && isAdmin && (
        <div style={{ maxWidth: '960px' }}>
          <div className="glass-card" style={{ padding: '1.75rem', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Building2 size={22} color="#4f46e5" /> Company & Statutory Profile
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                  Statutory details, registered address, GST/PAN credentials, and financial preferences used across quotation sheets, invoices, and vouchers
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdateCompany} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* 1. Legal Entity & Tax Registrations */}
              <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1.25rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.92rem', marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={16} color="#6366f1" /> 1. Corporate Identity & Tax Registrations
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                  <FormInput
                    label="Trading / Brand Name"
                    value={companyData.company_name}
                    onChange={(e) => setCompanyData({ ...companyData, company_name: e.target.value })}
                    placeholder="e.g. HTCO Infrastructure & Constructions"
                    required
                  />
                  <FormInput
                    label="Registered Legal Entity Name"
                    value={companyData.legal_name}
                    onChange={(e) => setCompanyData({ ...companyData, legal_name: e.target.value })}
                    placeholder="e.g. HTCO Infrastructure Private Limited"
                    required
                  />
                  <FormInput
                    label="GSTIN Number (Statutory GST)"
                    value={companyData.gst_number}
                    onChange={(e) => setCompanyData({ ...companyData, gst_number: e.target.value.toUpperCase() })}
                    placeholder="15-digit GSTIN (e.g. 27AAACH1234F1Z5)"
                    required
                  />
                  <FormInput
                    label="Corporate PAN"
                    value={companyData.pan_number}
                    onChange={(e) => setCompanyData({ ...companyData, pan_number: e.target.value.toUpperCase() })}
                    placeholder="10-digit PAN (e.g. AAACH1234F)"
                    required
                  />
                  <FormInput
                    label="Corporate Identity Number (CIN)"
                    value={companyData.cin_number}
                    onChange={(e) => setCompanyData({ ...companyData, cin_number: e.target.value.toUpperCase() })}
                    placeholder="21-digit CIN (e.g. U45200MH2020PTC123456)"
                  />
                </div>
              </div>

              {/* 2. Registered Office & Contact Info */}
              <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1.25rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.92rem', marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Globe size={16} color="#0284c7" /> 2. Registered Office & Communication
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                  <FormInput
                    label="Corporate Email"
                    type="email"
                    value={companyData.email}
                    onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                    placeholder="corporate@company.com"
                    required
                  />
                  <FormInput
                    label="Corporate Phone"
                    value={companyData.phone}
                    onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                    placeholder="+91 22 2876 5432"
                    required
                  />
                  <FormInput
                    label="Office / Headquarter Address"
                    value={companyData.address}
                    onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                    placeholder="Plot / Street / Building / Sector"
                    required
                  />
                  <FormInput
                    label="City"
                    value={companyData.city}
                    onChange={(e) => setCompanyData({ ...companyData, city: e.target.value })}
                    placeholder="e.g. Mumbai"
                    required
                  />
                  <FormInput
                    label="State"
                    value={companyData.state}
                    onChange={(e) => setCompanyData({ ...companyData, state: e.target.value })}
                    placeholder="e.g. Maharashtra"
                    required
                  />
                  <FormInput
                    label="Postal Code (PIN)"
                    value={companyData.pincode}
                    onChange={(e) => setCompanyData({ ...companyData, pincode: e.target.value })}
                    placeholder="e.g. 400051"
                    required
                  />
                </div>
              </div>

              {/* 3. Accounting & Financial Preferences */}
              <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1.25rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.92rem', marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building2 size={16} color="#16a34a" /> 3. Accounting & Financial Preferences
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                  <FormInput
                    label="Base Operating Currency"
                    value={companyData.currency_code}
                    onChange={(e) => setCompanyData({ ...companyData, currency_code: e.target.value.toUpperCase() })}
                    placeholder="INR, AED, USD..."
                    required
                  />
                  <FormInput
                    label="Financial Year Start (MM-DD)"
                    value={companyData.financial_year_start}
                    onChange={(e) => setCompanyData({ ...companyData, financial_year_start: e.target.value })}
                    placeholder="04-01 (April 1st)"
                    required
                  />
                  <FormInput
                    label="Date Format"
                    value={companyData.date_format}
                    onChange={(e) => setCompanyData({ ...companyData, date_format: e.target.value })}
                    placeholder="DD/MM/YYYY"
                    required
                  />
                  <FormInput
                    label="Standard Timezone"
                    value={companyData.timezone}
                    onChange={(e) => setCompanyData({ ...companyData, timezone: e.target.value })}
                    placeholder="Asia/Kolkata"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <Button type="submit" variant="primary" disabled={isSubmittingCompany} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Save size={16} /> {isSubmittingCompany ? 'Saving...' : 'Save Company Configuration'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'project-config' && isAdmin && (
        <WorkCategorySettings />
      )}

      {activeTab === 'profile' && (
        <div className="grid-auto" style={{ maxWidth: '700px' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '4px', height: '16px', background: '#6366f1', borderRadius: '4px' }}></span>
              Profile Information
            </h2>
            <form noValidate onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <FormInput label="Employee Code" type="text" value={user?.employee_code || ''} disabled />
              <FormInput label="Email" type="email" value={user?.email || ''} disabled />
              <FormInput label="Role" type="text" value={user?.role_name || ''} disabled />
              <FormInput label="Full Name" type="text" value={name} onChange={(e) => { setName(e.target.value); setProfileErrors(prev => ({...prev, name: ''})); }} required error={profileErrors.name} />
              
              <Button type="submit" variant="primary" style={{ alignSelf: 'flex-start' }} disabled={isSubmittingProfile}>
                <Save size={16} /> {isSubmittingProfile ? 'Saving...' : 'Save Profile'}
              </Button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="grid-auto" style={{ maxWidth: '700px' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '4px', height: '16px', background: '#a855f7', borderRadius: '4px' }}></span>
              Change Password
            </h2>
            <form noValidate onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <FormInput label="Current Password" type="password" value={currentPassword} onChange={(e) => { setCurrentPassword(e.target.value); setPasswordErrors(prev => ({...prev, currentPassword: ''})); }} required error={passwordErrors.currentPassword} />
              <FormInput label="New Password" type="password" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setPasswordErrors(prev => ({...prev, newPassword: ''})); }} required error={passwordErrors.newPassword} />
              <FormInput label="Confirm New Password" type="password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setPasswordErrors(prev => ({...prev, confirmPassword: ''})); }} required error={passwordErrors.confirmPassword} />
              
              <Button type="submit" variant="primary" style={{ alignSelf: 'flex-start' }} disabled={isSubmittingPassword}>
                <Key size={16} /> {isSubmittingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
