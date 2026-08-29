import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface RequirePermissionProps {
  module: string;
  action: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RequirePermission: React.FC<RequirePermissionProps> = ({
  module,
  action,
  children,
  fallback = null,
}) => {
  const { hasPermission } = useAuth();

  const isAllowed = hasPermission(module, action);

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
