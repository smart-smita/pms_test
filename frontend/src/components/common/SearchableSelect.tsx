import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Plus, Check, X } from 'lucide-react';

export interface SearchableOption {
  value: string | number;
  label: string;
  subLabel?: string;
  code?: string;
}

interface SearchableSelectProps {
  label?: string;
  placeholder?: string;
  options: SearchableOption[];
  value: string | number;
  onChange: (value: string | number, option?: SearchableOption) => void;
  onAddNew?: () => void;
  addNewLabel?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  placeholder = 'Select...',
  options = [],
  value,
  onChange,
  onAddNew,
  addNewLabel = '+ Add New',
  disabled = false,
  required = false,
  error,
  helperText,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  const filteredOptions = options.filter((opt) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const l = opt.label.toLowerCase();
    const s = (opt.subLabel || '').toLowerCase();
    const c = (opt.code || '').toLowerCase();
    return l.includes(q) || s.includes(q) || c.includes(q);
  });

  const handleSelect = (option: SearchableOption) => {
    onChange(option.value, option);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', position: 'relative', width: '100%' }}>
      {label && (
        <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
      )}

      {/* Main Select Button */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          minHeight: '40px',
          padding: '0.45rem 0.75rem',
          borderRadius: '8px',
          border: error ? '1px solid #ef4444' : isOpen ? '1px solid #6366f1' : '1px solid var(--border-color)',
          backgroundColor: disabled ? 'var(--border-color)' : 'var(--bg-card, #111827)',
          color: disabled ? 'var(--text-muted)' : 'var(--text-primary)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          boxShadow: isOpen ? '0 0 0 2px rgba(99, 102, 241, 0.2)' : 'none',
          transition: 'all 0.15s ease',
        }}
      >
        <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? (
            <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 500 }}>
              {selectedOption.code && (
                <span style={{ color: '#818cf8', fontWeight: 600, marginRight: '0.4rem' }}>
                  [{selectedOption.code}]
                </span>
              )}
              {selectedOption.label}
              {selectedOption.subLabel && (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginLeft: '0.4rem' }}>
                  ({selectedOption.subLabel})
                </span>
              )}
            </span>
          ) : (
            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted, #64748b)' }}>
              {placeholder}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Clear selection"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown
            size={16}
            color="var(--text-secondary)"
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
          />
        </div>
      </div>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 9999,
            backgroundColor: 'var(--bg-card, #111827)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Search Box */}
          <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={15} color="var(--text-secondary)" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type to search..."
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                outline: 'none',
              }}
              onClick={(e) => e.stopPropagation()}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Add New Action (Sticky Top if provided) */}
          {onAddNew && (
            <div style={{ padding: '0.35rem 0.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onAddNew();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  padding: '0.4rem 0.6rem',
                  borderRadius: '6px',
                  border: '1px dashed #6366f1',
                  background: 'rgba(99, 102, 241, 0.08)',
                  color: '#818cf8',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Plus size={14} />
                <span>{addNewLabel}</span>
              </button>
            </div>
          )}

          {/* Options List */}
          <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '0.35rem' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                No records found matching "{searchQuery}"
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.65rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                      color: isSelected ? '#ffffff' : 'var(--text-primary)',
                      fontSize: '0.85rem',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--border-color)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontWeight: isSelected ? 600 : 500, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {opt.code && (
                          <span style={{ color: '#818cf8', fontSize: '0.78rem', fontWeight: 600 }}>
                            [{opt.code}]
                          </span>
                        )}
                        <span>{opt.label}</span>
                      </div>
                      {opt.subLabel && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                          {opt.subLabel}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check size={16} color="#6366f1" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {error && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{error}</span>}
      {helperText && !error && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{helperText}</span>}
    </div>
  );
};
export default SearchableSelect;
