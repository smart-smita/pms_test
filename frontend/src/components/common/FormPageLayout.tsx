import React from 'react';
import { PageHeader, BreadcrumbItem } from './PageHeader';
import { Button } from './Button';
import { Save, ArrowLeft } from 'lucide-react';

interface FormPageLayoutProps {
  breadcrumbs: BreadcrumbItem[];
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
  saveButtonText?: string;
  cancelButtonText?: string;
  saveDisabled?: boolean;
  children: React.ReactNode;
  extraActions?: React.ReactNode;
}

export const FormPageLayout: React.FC<FormPageLayoutProps> = ({
  breadcrumbs,
  title,
  subtitle,
  badge,
  onCancel,
  onSubmit,
  isSubmitting = false,
  saveButtonText = 'Save',
  cancelButtonText = 'Cancel',
  saveDisabled = false,
  children,
  extraActions,
}) => {
  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1280px', margin: '0 auto', paddingBottom: '3rem' }}>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={title}
        subtitle={subtitle}
        badge={badge}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {extraActions}
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isSubmitting}
              style={{
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                fontWeight: 500,
              }}
            >
              <ArrowLeft size={15} />
              <span>{cancelButtonText}</span>
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || saveDisabled}
              style={{
                borderRadius: '8px',
                padding: '0.5rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                background: '#4f46e5',
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
              }}
            >
              {isSubmitting ? (
                <span className="spinner" style={{ width: '14px', height: '14px' }} />
              ) : (
                <Save size={15} />
              )}
              <span>{saveButtonText}</span>
            </Button>
          </div>
        }
      />

      {/* Form Section Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {children}
      </div>
    </form>
  );
};
