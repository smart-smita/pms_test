import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FormInput: React.FC<FormInputProps> = ({ label, error, className = '', ...props }) => {
  const cleanLabel = label ? label.replace(/\s*\*+\s*$/, '') : '';
  return (
    <div className="form-group">
      <label className="form-label">
        {cleanLabel} {props.required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <input className={`form-input ${error ? 'invalid-input' : ''} ${className}`} {...props} />
      {error && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{error}</span>}
    </div>
  );
};
