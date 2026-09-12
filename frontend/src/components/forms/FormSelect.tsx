import React from 'react';

interface Option {
  value: string | number;
  label: string;
}

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Option[];
  error?: string;
}

export const FormSelect: React.FC<FormSelectProps> = ({ label, options, error, className = '', ...props }) => {
  const cleanLabel = label ? label.replace(/\s*\*+\s*$/, '') : '';
  return (
    <div className="form-group">
      <label className="form-label">
        {cleanLabel} {props.required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <select className={`form-select ${error ? 'invalid-input' : ''} ${className}`} {...props}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{error}</span>}
    </div>
  );
};
