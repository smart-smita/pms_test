import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { FormInput } from '../components/forms/FormInput';
import { Button } from '../components/common/Button';
import { Save, Key, User as UserIcon, Sliders } from 'lucide-react';
import { showSuccess, showError } from '../utils/toast';
import { parseApiErrors } from '../services/api';
import { WorkCategorySettings } from './WorkCategorySettings';

interface SettingsProps {
  initialTab?: 'profile' | 'security' | 'project-config';
}

export const Settings: React.FC<SettingsProps> = ({ initialTab = 'profile' }) => {
  const { user } = useAuth();
  const isAdmin = user?.role_name === 'Admin' || user?.role_name === 'Super Admin';
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'project-config'>(
    initialTab || (isAdmin ? 'project-config' : 'profile')
  );

  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

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
