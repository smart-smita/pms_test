import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FormInput } from '../components/forms/FormInput';
import { Button } from '../components/common/Button';
import { LogIn, KeyRound } from 'lucide-react';

interface LoginProps {
  onForgotPassword: () => void;
}

export const Login: React.FC<LoginProps> = ({ onForgotPassword }) => {
  const { login, isLoading, error } = useAuth();
  const [employeeCode, setEmployeeCode] = useState('ADMIN001');
  const [password, setPassword] = useState('Admin@123');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(employeeCode, password);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at top right, #1e1b4b 0%, #0f172a 60%)',
        padding: '1.5rem',
      }}
    >
      <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '1.75rem',
              fontWeight: 800,
              boxShadow: '0 8px 20px rgba(99, 102, 241, 0.4)',
              marginBottom: '1rem',
            }}
          >
            H
          </div>
          <h2 style={{ fontSize: '1.6rem', color: '#f8fafc' }}>HTCO GPS Portal</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Sign in to access Attendance & Task System
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <FormInput
            label="Employee Code"
            type="text"
            placeholder="e.g. ADMIN001, MGR001, EMP001"
            value={employeeCode}
            onChange={(e) => setEmployeeCode(e.target.value)}
            required
          />

          <FormInput
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
            <button
              type="button"
              onClick={onForgotPassword}
              style={{
                background: 'none',
                border: 'none',
                color: '#818cf8',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Forgot Password?
            </button>
          </div>

          <Button type="submit" variant="primary" style={{ width: '100%', padding: '0.8rem' }} disabled={isLoading}>
            <LogIn size={18} /> {isLoading ? 'Authenticating...' : 'Sign In'}
          </Button>
        </form>

        <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.75rem', color: '#94a3b8' }}>
          <div style={{ fontWeight: 700, color: '#f8fafc', marginBottom: '0.35rem' }}>Demo Seed Credentials:</div>
          <div>Admin: <code>ADMIN001</code> / <code>Admin@123</code></div>
          <div>Manager: <code>MGR001</code> / <code>Manager@123</code></div>
          <div>Employee: <code>EMP001</code> / <code>Employee@123</code></div>
        </div>
      </div>
    </div>
  );
};
