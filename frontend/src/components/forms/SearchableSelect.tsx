import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';

export interface SearchableOption {
  value: string | number;
  label: string;
}

interface SearchableSelectProps {
  label?: string;
  options: SearchableOption[];
  value?: string | number | (string | number)[];
  onChange: (value: any) => void;
  error?: string;
  required?: boolean;
  multiple?: boolean;
  placeholder?: string;
  className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  options,
  value,
  onChange,
  error,
  required,
  multiple = false,
  placeholder = 'Select...',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const filteredOptions = options.filter(opt => 
    String(opt.label).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isSelected = (optValue: string | number) => {
    if (multiple && Array.isArray(value)) {
      return value.includes(optValue);
    }
    return String(value) === String(optValue);
  };

  const handleSelect = (optValue: string | number) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? [...value] : [];
      if (currentValues.includes(optValue)) {
        onChange(currentValues.filter(v => v !== optValue));
      } else {
        onChange([...currentValues, optValue]);
      }
    } else {
      onChange(optValue);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const handleRemoveItem = (e: React.MouseEvent, optValue: string | number) => {
    e.stopPropagation();
    if (multiple && Array.isArray(value)) {
      onChange(value.filter(v => v !== optValue));
    } else {
      onChange('');
    }
  };

  const renderValue = () => {
    if (multiple && Array.isArray(value) && value.length > 0) {
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {value.map(val => {
            const opt = options.find(o => String(o.value) === String(val));
            return (
              <span
                key={String(val)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: '#818cf8',
                  fontSize: '0.75rem',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '4px',
                  fontWeight: 500
                }}
              >
                {opt ? opt.label : val}
                <X
                  size={12}
                  style={{ marginLeft: '4px', cursor: 'pointer' }}
                  onClick={(e) => handleRemoveItem(e, val)}
                />
              </span>
            );
          })}
        </div>
      );
    } else if (!multiple && value !== undefined && value !== '') {
      const opt = options.find(o => String(o.value) === String(value));
      return (
        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500, color: 'var(--text-primary)' }}>
          {opt ? opt.label : value}
        </span>
      );
    }
    return <span style={{ color: 'var(--text-muted)' }}>{placeholder}</span>;
  };

  const cleanLabel = label ? label.replace(/\s*\*+\s*$/, '') : '';

  return (
    <div
      className={`form-group ${className}`}
      ref={wrapperRef}
      style={{ position: 'relative', marginBottom: label ? '1rem' : '0', width: '100%' }}
    >
      {label && (
        <label
          className="form-label"
          style={{
            display: 'block',
            fontSize: '0.85rem',
            fontWeight: 500,
            marginBottom: '0.35rem',
            color: 'var(--text-secondary)'
          }}
        >
          {cleanLabel} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
      )}

      {/* Select Box Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          minHeight: '38px',
          padding: '0.45rem 0.75rem',
          background: 'var(--input-bg)',
          color: 'var(--input-text)',
          border: error ? '1px solid #ef4444' : '1px solid var(--input-border)',
          borderRadius: 'var(--radius-sm, 6px)',
          cursor: 'pointer',
          userSelect: 'none',
          boxShadow: 'var(--shadow-sm)',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          outline: isOpen ? '2px solid rgba(99, 102, 241, 0.4)' : 'none'
        }}
      >
        <div style={{ flex: 1, minWidth: 0, paddingRight: '0.5rem' }}>
          {renderValue()}
        </div>
        <ChevronDown
          size={16}
          style={{
            color: 'var(--text-muted)',
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            flexShrink: 0
          }}
        />
      </div>

      {/* Dropdown Floating Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 9999,
            backgroundColor: 'var(--bg-card, #1e293b)',
            color: 'var(--text-primary, #f8fafc)',
            border: '1px solid var(--border-color, #334155)',
            borderRadius: 'var(--radius-sm, 8px)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.35), 0 8px 10px -6px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden',
            maxHeight: '300px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Search Box Header */}
          <div
            style={{
              padding: '0.5rem',
              borderBottom: '1px solid var(--border-color, #334155)',
              backgroundColor: 'var(--bg-secondary, #0f172a)'
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '0.65rem',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none'
                }}
              />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="Search..."
                style={{
                  width: '100%',
                  padding: '0.4rem 0.65rem 0.4rem 2rem',
                  fontSize: '0.85rem',
                  backgroundColor: 'var(--input-bg, #1e293b)',
                  color: 'var(--input-text, #f8fafc)',
                  border: '1px solid var(--border-color, #334155)',
                  borderRadius: '4px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Options List */}
          <div style={{ overflowY: 'auto', maxHeight: '240px', padding: '0.25rem 0' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                No matching options found.
              </div>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {filteredOptions.map((opt) => {
                  const selected = isSelected(opt.value);
                  return (
                    <li
                      key={String(opt.value)}
                      onClick={() => handleSelect(opt.value)}
                      style={{
                        padding: '0.55rem 0.85rem',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: selected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                        color: selected ? '#818cf8' : 'var(--text-primary)',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!selected) e.currentTarget.style.backgroundColor = 'var(--select-option-hover, rgba(255,255,255,0.06))';
                      }}
                      onMouseLeave={(e) => {
                        if (!selected) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <span style={{ fontWeight: selected ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {opt.label}
                      </span>
                      {selected && <Check size={14} style={{ color: '#818cf8', flexShrink: 0, marginLeft: '0.5rem' }} />}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {error && <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#ef4444' }}>{error}</p>}
    </div>
  );
};
