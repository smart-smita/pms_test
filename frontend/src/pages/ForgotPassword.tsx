import React, { useState } from 'react';
import { FormInput } from '../components/forms/FormInput';
import { Button } from '../components/common/Button';
import { apiRequest } from '../services/api';
import { ArrowLeft, Send } from 'lucide-react';
import { showSuccess, showError } from '../utils/toast';

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    const res = await apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    setIsLoading(false);
    if (res.success) {
      showSuccess(res.message || 'Token requested successfully.');
      setMessage(res.message);
      if (res.data?.resetToken) {
        setResetToken(res.data.resetToken);
      }
    } else {
      showError(res.message || 'Failed to request token.');
    }
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
        <button
          onClick={onBackToLogin}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            cursor: 'pointer',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
          }}
        >
          <ArrowLeft size={16} /> Back to Login
        </button>

        <h2 style={{ fontSize: '1.5rem', color: '#f8fafc', marginBottom: '0.5rem' }}>Reset Password</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Enter your registered email address to receive a password reset token.
        </p>

        {message && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10b981',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
            }}
          >
            {message}
            {resetToken && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#f8fafc', wordBreak: 'break-all' }}>
                Generated Token: <code>{resetToken}</code>
              </div>
            )}
          </div>
        )}

        <form noValidate onSubmit={handleSubmit}>
          <FormInput
            label="Email Address"
            type="email"
            placeholder="e.g. admin@htco.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Button type="submit" variant="primary" style={{ width: '100%', padding: '0.8rem' }} disabled={isLoading}>
            <Send size={18} /> {isLoading ? 'Sending...' : 'Request Token'}
          </Button>
        </form>
      </div>
    </div>
  );
};
