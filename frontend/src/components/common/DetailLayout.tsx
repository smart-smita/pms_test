import React from 'react';
import { PageHeader, BreadcrumbItem } from './PageHeader';
import { Button } from './Button';
import { ArrowLeft, Edit, Download, Trash2 } from 'lucide-react';

interface DetailLayoutProps {
  breadcrumbs: BreadcrumbItem[];
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  onBack: () => void;
  onEdit?: () => void;
  onExport?: () => void;
  onDelete?: () => void;
  extraActions?: React.ReactNode;
  children: React.ReactNode;
}

export const DetailLayout: React.FC<DetailLayoutProps> = ({
  breadcrumbs,
  title,
  subtitle,
  badge,
  onBack,
  onEdit,
  onExport,
  onDelete,
  extraActions,
  children,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1280px', margin: '0 auto', paddingBottom: '3rem' }}>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={title}
        subtitle={subtitle}
        badge={badge}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Button
              variant="secondary"
              onClick={onBack}
              style={{
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                fontWeight: 500,
              }}
            >
              <ArrowLeft size={15} />
              <span>Back</span>
            </Button>
            {onExport && (
              <Button
                variant="secondary"
                onClick={onExport}
                style={{
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                }}
              >
                <Download size={15} />
                <span>Export</span>
              </Button>
            )}
            {onEdit && (
              <Button
                variant="primary"
                onClick={onEdit}
                style={{
                  borderRadius: '8px',
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  background: '#4f46e5',
                }}
              >
                <Edit size={15} />
                <span>Edit</span>
              </Button>
            )}
            {onDelete && (
              <Button
                variant="danger"
                onClick={onDelete}
                style={{
                  borderRadius: '8px',
                  padding: '0.5rem 0.85rem',
                }}
              >
                <Trash2 size={15} />
              </Button>
            )}
            {extraActions}
          </div>
        }
      />

      {/* Detail Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {children}
      </div>
    </div>
  );
};
