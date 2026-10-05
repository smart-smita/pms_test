import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, ChevronDown, Check, Loader2, X } from 'lucide-react';
import { apiService } from '../../services/api';
import { showSuccess, showError } from '../../utils/toast';

export interface LabourOption {
  labour_id: number;
  name: string;
  labour_type: string;
  sub_worker_count?: number;
}

interface LabourComboboxProps {
  selectedLabourId: number | string;
  labours: LabourOption[];
  onSelectLabour: (labour: LabourOption | null) => void;
  onInitiateCreate?: (name: string, type: 'direct_labour' | 'contractor') => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  style?: React.CSSProperties;
}

export const LabourCombobox: React.FC<LabourComboboxProps> = ({
  selectedLabourId,
  labours,
  onSelectLabour,
  onInitiateCreate,
  placeholder = '-- Select Labour / Contractor --',
  disabled = false,
  required = false,
  style,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedLabourId) {
      const found = labours.find((l) => Number(l.labour_id) === Number(selectedLabourId));
      if (found) setSearchTerm(found.name);
    } else if (!isOpen) {
      setSearchTerm('');
    }
  }, [selectedLabourId, labours, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (selectedLabourId) {
          const found = labours.find((l) => Number(l.labour_id) === Number(selectedLabourId));
          setSearchTerm(found ? found.name : '');
        } else {
          setSearchTerm('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedLabourId, labours]);

  const filteredLabours = React.useMemo(() => {
    if (!searchTerm.trim()) return labours;
    const term = searchTerm.trim().toLowerCase();
    return labours.filter((l) => l.name.toLowerCase().includes(term));
  }, [labours, searchTerm]);

  const exactMatchExists = React.useMemo(() => {
    if (!searchTerm.trim()) return false;
    const term = searchTerm.trim().toLowerCase();
    return labours.some((l) => l.name.trim().toLowerCase() === term);
  }, [labours, searchTerm]);

  const handleSelect = (labour: LabourOption) => {
    onSelectLabour(labour);
    setSearchTerm(labour.name);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectLabour(null);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleCreateNewLabour = (type: 'direct_labour' | 'contractor') => {
    const name = searchTerm.trim();
    if (!name) return;
    setIsOpen(false);
    if (onInitiateCreate) onInitiateCreate(name, type);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', position: 'relative', width: '100%' }}>
        <Search size={16} style={{ position: 'absolute', left: '8px', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
        <input
          type="text"
          disabled={disabled}
          required={required && !selectedLabourId}
          value={searchTerm}
          placeholder={placeholder}
          onFocus={() => { if (!disabled) setIsOpen(true); }}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen && !disabled) setIsOpen(true);
          }}
          className="form-input"
          style={{
            paddingLeft: '32px',
            paddingRight: selectedLabourId ? '54px' : '32px',
            fontSize: '0.85rem',
            width: '100%',
            cursor: disabled ? 'not-allowed' : 'text',
          }}
        />

        {selectedLabourId && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            style={{ position: 'absolute', right: '28px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
            title="Clear selection"
          >
            <X size={14} />
          </button>
        )}

        <ChevronDown
          size={16}
          onClick={() => { if (!disabled) setIsOpen(!isOpen); }}
          style={{ position: 'absolute', right: '8px', color: 'var(--text-secondary)', cursor: disabled ? 'not-allowed' : 'pointer', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
        />
      </div>

      {isOpen && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0, right: 0,
            zIndex: 999,
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
            maxHeight: '260px',
            overflowY: 'auto',
            padding: '4px',
          }}
        >
          {filteredLabours.length > 0 ? (
            filteredLabours.map((l) => {
              const isSelected = Number(l.labour_id) === Number(selectedLabourId);
              return (
                <div
                  key={l.labour_id}
                  onClick={() => handleSelect(l)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: isSelected ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                    color: isSelected ? '#6366f1' : 'var(--text-primary)',
                    fontWeight: isSelected ? 600 : 400,
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>{l.name}</span>
                    <span style={{ fontSize: '0.7rem', color: isSelected ? '#6366f1' : 'var(--text-muted)' }}>
                      {l.labour_type === 'contractor' ? 'Contractor' : 'Direct Labour'}
                    </span>
                  </div>
                  {isSelected && <Check size={14} style={{ color: '#6366f1' }} />}
                </div>
              );
            })
          ) : (
            <div style={{ padding: '0.6rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              No existing records match "{searchTerm}"
            </div>
          )}

          {searchTerm.trim() !== '' && !exactMatchExists && (
            <div style={{ borderTop: '1px solid var(--border-color, #e2e8f0)', marginTop: '4px', paddingTop: '4px' }}>
              <div style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Create New:</div>
              <div
                onClick={isCreating ? undefined : () => handleCreateNewLabour('direct_labour')}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#4f46e5',
                  background: 'rgba(79, 70, 229, 0.08)',
                  cursor: isCreating ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '4px'
                }}
              >
                {isCreating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                <span>+ Add "{searchTerm.trim()}" as Direct Labour</span>
              </div>
              <div
                onClick={isCreating ? undefined : () => handleCreateNewLabour('contractor')}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#d97706',
                  background: 'rgba(217, 119, 6, 0.08)',
                  cursor: isCreating ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                {isCreating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                <span>+ Add "{searchTerm.trim()}" as Contractor</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
