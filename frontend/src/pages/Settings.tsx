import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { FormInput } from '../components/forms/FormInput';
import { Button } from '../components/common/Button';
import { Save, Key } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [profileMsg, setProfileMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg('Updating...');
    const res = await apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
    if (res.success) {
      setProfileMsg('Profile updated successfully! Please login again to reflect changes.');
    } else {
      setProfileMsg(res.message || 'Failed to update profile');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg('New passwords do not match');
      return;
    }
    setPasswordMsg('Updating...');
    const res = await apiRequest('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (res.success) {
      setPasswordMsg('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordMsg(res.message || 'Failed to update password');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account profile and security</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        
        {/* Profile Settings */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '4px', height: '16px', background: '#6366f1', borderRadius: '4px' }}></span>
            Profile Information
          </h2>
          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <FormInput label="Employee Code" type="text" value={user?.employee_code || ''} disabled />
            <FormInput label="Email" type="email" value={user?.email || ''} disabled />
            <FormInput label="Role" type="text" value={user?.role_name || ''} disabled />
            <FormInput label="Full Name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            
            {profileMsg && (
              <div style={{ fontSize: '0.85rem', color: profileMsg.includes('successfully') ? '#10b981' : '#ef4444' }}>
                {profileMsg}
              </div>
            )}
            
            <Button type="submit" variant="primary" style={{ alignSelf: 'flex-start' }}>
              <Save size={16} /> Save Profile
            </Button>
          </form>
        </div>

        {/* Security Settings */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '4px', height: '16px', background: '#a855f7', borderRadius: '4px' }}></span>
            Change Password
          </h2>
          <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <FormInput label="Current Password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            <FormInput label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            <FormInput label="Confirm New Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            
            {passwordMsg && (
              <div style={{ fontSize: '0.85rem', color: passwordMsg.includes('successfully') ? '#10b981' : '#ef4444' }}>
                {passwordMsg}
              </div>
            )}
            
            <Button type="submit" variant="primary" style={{ alignSelf: 'flex-start' }}>
              <Key size={16} /> Update Password
            </Button>
          </form>
        </div>

      </div>
    </div>
  );
};
