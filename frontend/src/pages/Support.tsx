import React, { useState } from 'react';
import { FormInput } from '../components/forms/FormInput';
import { Button } from '../components/common/Button';
import { Send, MessageSquare } from 'lucide-react';
import { apiRequest } from '../services/api';

export const Support: React.FC = () => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg('Submitting ticket...');
    const res = await apiRequest('/auth/support', {
      method: 'POST',
      body: JSON.stringify({ subject, message }),
    });
    if (res.success) {
      setStatusMsg('Support ticket submitted successfully! Our team will contact you shortly.');
      setSubject('');
      setMessage('');
    } else {
      setStatusMsg(res.message || 'Failed to submit ticket');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Help & Support</h1>
          <p className="page-subtitle">Submit a request for IT or HR assistance</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem', maxWidth: '600px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '4px', height: '16px', background: '#3b82f6', borderRadius: '4px' }}></span>
          Contact Support Team
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <FormInput label="Subject" type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. GPS Tracking Issue" required />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Describe the Issue</label>
            <textarea
              className="form-input"
              style={{ minHeight: '120px', resize: 'vertical' }}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please provide details..."
              required
            />
          </div>

          {statusMsg && (
            <div style={{ fontSize: '0.85rem', color: statusMsg.includes('successfully') ? '#10b981' : '#ef4444', padding: '0.75rem', background: statusMsg.includes('successfully') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
              {statusMsg}
            </div>
          )}

          <Button type="submit" variant="primary" style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}>
            <Send size={16} /> Submit Ticket
          </Button>
        </form>

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: '#3b82f6' }}>
            <MessageSquare size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Need Immediate Help?</h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.4 }}>
              For urgent queries, please call the IT helpdesk at <br/> 
              <strong style={{ color: 'var(--text-primary)' }}>+91-800-HTCO-ERP</strong> (Ext: 442)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
