import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

export interface MultiSelectOption {
  value: string | number;
  label: string;
}

interface MultiSelectDropdownProps {
  label?: string;
  placeholder?: string;
  options: MultiSelectOption[];
  selectedValues: (string | number)[];
  onChange: (values: (string | number)[]) => void;
  required?: boolean;
  disabled?: boolean;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  placeholder = 'Select options...',
  options = [],
  selectedValues = [],
  onChange,
  required = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (val: string | number) => {
    const strVal = String(val);
    const currentlySelectedStr = selectedValues.map(String);
    if (currentlySelectedStr.includes(strVal)) {
      const newVals = selectedValues.filter(v => String(v) !== strVal);
      onChange(newVals);
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const handleRemove = (e: React.MouseEvent, val: string | number) => {
    e.stopPropagation();
    const strVal = String(val);
    const newVals = selectedValues.filter(v => String(v) !== strVal);
    onChange(newVals);
  };

  const selectedOptions = options.filter(opt => selectedValues.map(String).includes(String(opt.value)));

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', position: 'relative', width: '100%' }}>
      {label && (
        <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
      )}

      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          minHeight: '40px',
          padding: '0.25rem 0.5rem',
          borderRadius: '8px',
          border: isOpen ? '1px solid #6366f1' : '1px solid var(--border-color)',
          backgroundColor: disabled ? 'var(--border-color)' : 'var(--bg-card, #111827)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.4rem',
        }}
      >
        {selectedOptions.length === 0 ? (
          <div style={{ padding: '0.2rem 0.25rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {placeholder}
          </div>
        ) : (
          selectedOptions.map(opt => (
            <div
              key={opt.value}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                color: 'var(--text-primary)',
                padding: '0.2rem 0.4rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
              }}
            >
              {opt.label}
              <button
                type="button"
                onClick={(e) => handleRemove(e, opt.value)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
              >
                <X size={12} />
              </button>
            </div>
          ))
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          <ChevronDown size={16} color="var(--text-muted)" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
        </div>
      </div>

      {isOpen && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            maxHeight: '220px',
            overflowY: 'auto',
            backgroundColor: 'var(--bg-card, #111827)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 50,
            padding: '0.25rem'
          }}
        >
          {options.length === 0 ? (
            <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No options available
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = selectedValues.map(String).includes(String(opt.value));
              return (
                <div
                  key={opt.value}
                  onClick={() => handleToggle(opt.value)}
                  style={{
                    padding: '0.6rem 0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.85rem',
                    color: 'var(--text-primary)',
                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                    borderRadius: '4px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--border-color)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '1px solid ' + (isSelected ? 'var(--accent-primary)' : 'var(--text-muted)'),
                      borderRadius: '3px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isSelected ? 'var(--accent-primary)' : 'transparent'
                    }}
                  >
                    {isSelected && <Check size={12} color="#fff" />}
                  </div>
                  {opt.label}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
