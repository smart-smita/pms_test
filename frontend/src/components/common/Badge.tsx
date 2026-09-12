import React from 'react';

type BadgeVariant = 
  | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  | 'completed' | 'active' | 'planned' | 'pending' | 'in-progress'
  | 'delayed' | 'on-hold' | 'cancelled' | 'inactive' | 'paid' | 'approved' | 'rejected';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  /** Auto-derive variant from the text value (status string) */
  auto?: boolean;
}

/** Map a raw status string → badge variant */
function statusToVariant(raw: string): BadgeVariant {
  const s = String(raw).toLowerCase().trim().replace(/\s+/g, '-');
  const map: Record<string, BadgeVariant> = {
    completed:    'completed',
    active:       'active',
    planned:      'planned',
    pending:      'pending',
    'in-progress':'in-progress',
    'in_progress':'in-progress',
    inprogress:   'in-progress',
    delayed:      'delayed',
    'on-hold':    'on-hold',
    'on_hold':    'on-hold',
    onhold:       'on-hold',
    cancelled:    'cancelled',
    inactive:     'inactive',
    paid:         'paid',
    approved:     'approved',
    rejected:     'rejected',
    open:         'info',
    outside_area: 'warning',
    missing_checkout: 'warning',
    success:      'success',
    warning:      'warning',
    danger:       'danger',
    info:         'info',
  };
  return map[s] || 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({ variant, children, auto }) => {
  const resolved: BadgeVariant = auto
    ? statusToVariant(String(children))
    : variant || 'info';
  return <span className={`badge badge-${resolved}`}>{children}</span>;
};
