export interface ClientExpiryStatus {
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'NO_EXPIRY';
  daysRemaining: number | null;
  statusLabel: string;
  badgeVariant: 'success' | 'warning' | 'critical' | 'danger' | 'secondary';
  badgeStyle: { background: string; color: string; border?: string };
}

export function calculateExpiryStatus(expiryDateStr?: string | null): ClientExpiryStatus {
  if (!expiryDateStr) {
    return {
      status: 'NO_EXPIRY',
      daysRemaining: null,
      statusLabel: 'No Expiry',
      badgeVariant: 'secondary',
      badgeStyle: { background: 'rgba(148, 163, 184, 0.12)', color: '#94a3b8' },
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expDate = new Date(expiryDateStr);
  expDate.setHours(0, 0, 0, 0);

  if (isNaN(expDate.getTime())) {
    return {
      status: 'NO_EXPIRY',
      daysRemaining: null,
      statusLabel: 'Invalid Date',
      badgeVariant: 'secondary',
      badgeStyle: { background: 'rgba(148, 163, 184, 0.12)', color: '#94a3b8' },
    };
  }

  const diffTime = expDate.getTime() - today.getTime();
  const days = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return {
      status: 'EXPIRED',
      daysRemaining: days,
      statusLabel: `Expired (${Math.abs(days)}d ago)`,
      badgeVariant: 'danger',
      badgeStyle: { background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' },
    };
  }

  if (days === 0) {
    return {
      status: 'EXPIRED',
      daysRemaining: 0,
      statusLabel: 'Expiring Today',
      badgeVariant: 'danger',
      badgeStyle: { background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid #ef4444' },
    };
  }

  if (days === 1) {
    return {
      status: 'EXPIRING_SOON',
      daysRemaining: 1,
      statusLabel: '1 Day Remaining (Critical)',
      badgeVariant: 'critical',
      badgeStyle: { background: 'rgba(249, 115, 22, 0.2)', color: '#f97316', border: '1px solid rgba(249, 115, 22, 0.4)' },
    };
  }

  if (days <= 3) {
    return {
      status: 'EXPIRING_SOON',
      daysRemaining: days,
      statusLabel: `${days} Days Remaining (High Warning)`,
      badgeVariant: 'critical',
      badgeStyle: { background: 'rgba(249, 115, 22, 0.15)', color: '#f97316' },
    };
  }

  if (days <= 10) {
    return {
      status: 'EXPIRING_SOON',
      daysRemaining: days,
      statusLabel: `${days} Days Remaining (Warning)`,
      badgeVariant: 'warning',
      badgeStyle: { background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' },
    };
  }

  return {
    status: 'ACTIVE',
    daysRemaining: days,
    statusLabel: `Active (${days}d left)`,
    badgeVariant: 'success',
    badgeStyle: { background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' },
  };
}
