import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';

export interface SearchableOption {
  value: string | number;
  label: string;
}

interface SearchableSelectProps {
  label: string;
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

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isSelected = (optValue: string | number) => {
    if (multiple && Array.isArray(value)) {
      return value.includes(optValue);
    }
    return value === optValue;
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
        <div className="flex flex-wrap gap-1">
          {value.map(val => {
            const opt = options.find(o => o.value === val);
            return (
              <span key={val} className="flex items-center bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">
                {opt ? opt.label : val}
                <X className="w-3 h-3 ml-1 cursor-pointer hover:text-indigo-900" onClick={(e) => handleRemoveItem(e, val)} />
              </span>
            );
          })}
        </div>
      );
    } else if (!multiple && value !== undefined && value !== '') {
      const opt = options.find(o => o.value === value);
      return <span className="block truncate">{opt ? opt.label : value}</span>;
    }
    return <span className="text-gray-400">{placeholder}</span>;
  };

  const cleanLabel = label ? label.replace(/\s*\*+\s*$/, '') : '';

  return (
    <div className={`form-group relative ${className}`} ref={wrapperRef}>
      {label && (
        <label className="form-label block text-sm font-medium text-gray-700 mb-1">
          {cleanLabel} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div 
        className={`form-select relative w-full bg-white border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm min-h-[38px] flex items-center`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex-1 pr-4">
          {renderValue()}
        </div>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
        </span>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          <div className="sticky top-0 bg-white px-2 py-2 border-b border-gray-100 z-10">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
          </div>
          
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-2 text-gray-500">No options found.</div>
          ) : (
            <ul className="max-h-48 overflow-y-auto">
              {filteredOptions.map((opt) => (
                <li
                  key={opt.value}
                  className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-50 ${isSelected(opt.value) ? 'bg-indigo-100 text-indigo-900' : 'text-gray-900'}`}
                  onClick={() => handleSelect(opt.value)}
                >
                  <span className={`block truncate ${isSelected(opt.value) ? 'font-semibold' : 'font-normal'}`}>
                    {opt.label}
                  </span>
                  {isSelected(opt.value) ? (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600">
                      <Check className="h-4 w-4" aria-hidden="true" />
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};
