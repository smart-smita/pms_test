import React from 'react';
import { ArrowLeft, Save, X } from 'lucide-react';
import { Button } from '../common/Button';

interface FormPageLayoutProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onSave?: (e?: React.FormEvent | React.MouseEvent) => void | Promise<void>;
  onCancel?: () => void;
  isSaving?: boolean;
  saveLabel?: string;
  children: React.ReactNode;
}

export const FormPageLayout: React.FC<FormPageLayoutProps> = ({
  title,
  subtitle,
  onBack,
  onSave,
  onCancel,
  isSaving = false,
  saveLabel = 'Save',
  children,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: 'var(--bg-primary)' }}>
      {/* Sticky Header with Actions */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-color)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.5rem',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {title}
            </h1>
            {subtitle && (
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {onCancel && (
            <Button
              variant="secondary"
              onClick={onCancel}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
              disabled={isSaving}
            >
              <X size={16} />
              Cancel
            </Button>
          )}
          {onSave && (
            <Button
              variant="primary"
              onClick={onSave}
              disabled={isSaving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#4f46e5',
                color: '#ffffff',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
              }}
            >
              {isSaving ? (
                <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              ) : (
                <Save size={16} />
              )}
              {isSaving ? 'Saving...' : saveLabel}
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ padding: '1.5rem', flex: 1 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-hover)' }}>
      <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h2>
    </div>
    <div style={{ padding: '1.5rem' }}>
      {children}
    </div>
  </div>
);
