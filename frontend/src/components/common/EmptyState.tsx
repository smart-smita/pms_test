import React from 'react';
import { Button } from './Button';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: any;
  actionLabel?: string;
  onAction?: () => void;
  height?: string | number;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records available',
  description,
  icon: Icon = Inbox,
  actionLabel,
  onAction,
  height = '240px',
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: typeof height === 'number' ? `${height}px` : height,
        padding: '2.5rem 1.5rem',
        textAlign: 'center',
        color: 'var(--text-muted)',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'rgba(79, 70, 229, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
          color: '#818cf8',
        }}
      >
        <Icon size={28} />
      </div>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
        {title}
      </h3>
      {description && (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem', maxWidth: '400px' }}>
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction} style={{ marginTop: '1.25rem' }}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
