import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FormInput: React.FC<FormInputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input className={`form-input ${className}`} {...props} />
      {error && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{error}</span>}
    </div>
  );
};
