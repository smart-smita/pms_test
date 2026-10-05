import React from 'react';

interface WbsTypeBadgeProps {
  type?: 'labour' | 'material' | 'labour_material' | string;
  size?: 'sm' | 'md';
}

export const WbsTypeBadge: React.FC<WbsTypeBadgeProps> = ({ type = 'labour_material', size = 'sm' }) => {
  const normType = String(type).toLowerCase().replace(/[^a-z_]/g, '');

  let label = 'LABOUR + MATERIAL';
  let bg = 'rgba(99, 102, 241, 0.12)';
  let color = '#818cf8';
  let border = '1px solid rgba(99, 102, 241, 0.25)';

  if (normType === 'labour' || normType === 'labor') {
    label = 'LABOUR';
    bg = 'rgba(245, 158, 11, 0.12)';
    color = '#f59e0b';
    border = '1px solid rgba(245, 158, 11, 0.25)';
  } else if (normType === 'material') {
    label = 'MATERIAL';
    bg = 'rgba(16, 185, 129, 0.12)';
    color = '#10b981';
    border = '1px solid rgba(16, 185, 129, 0.25)';
  }

  const isSmall = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: isSmall ? '0.15rem 0.45rem' : '0.25rem 0.65rem',
        borderRadius: '6px',
        fontSize: isSmall ? '0.68rem' : '0.78rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        background: bg,
        color: color,
        border: border,
        whiteSpace: 'nowrap',
      }}
    >
      [{label}]
    </span>
  );
};
