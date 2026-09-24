import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'info' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
  icon?: React.ComponentType<any>;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  icon: Icon,
  ...props
}) => {
  return (
    <button className={`btn btn-${variant} btn-${size} ${className}`} {...props}>
      {Icon && <Icon className="mr-1.5 inline-block" size={16} />}
      {children}
    </button>
  );
};

