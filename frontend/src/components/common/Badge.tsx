import React from 'react';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'info', children }) => {
  return <span className={`badge badge-${variant}`}>{children}</span>;
};
