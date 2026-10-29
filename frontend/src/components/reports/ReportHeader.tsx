import React from 'react';
import { Download, Printer, RotateCcw, Filter, LucideIcon } from 'lucide-react';
import { Button } from '../common/Button';

export interface FilterOption {
  value: string | number;
  label: string;
}

export interface ReportFilterConfig {
  key: string;
  label: string;
  type: 'select' | 'date' | 'text';
  value: any;
  onChange: (val: any) => void;
  options?: FilterOption[];
  placeholder?: string;
}

export interface ReportHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  badgeText?: string;
  filters?: ReportFilterConfig[];
  onResetFilters?: () => void;
  onExportCsv?: () => void;
  onPrintPdf?: () => void;
  isExporting?: boolean;
  extraActions?: React.ReactNode;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  badgeText,
  filters = [],
  onResetFilters,
  onExportCsv,
  onPrintPdf,
  isExporting = false,
  extraActions,
}) => {
  return (
    <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Title & Action Buttons Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {Icon && (
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(99, 102, 241, 0.12)',
                  color: '#6366f1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={22} />
              </div>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h1
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    margin: 0,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {title}
                </h1>
                {badgeText && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '999px',
                      background: 'rgba(99, 102, 241, 0.15)',
                      color: '#6366f1',
                      fontWeight: 600,
                    }}
                  >
                    {badgeText}
                  </span>
                )}
              </div>
              {subtitle && (
                <p
                  style={{
                    margin: '0.25rem 0 0 0',
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {extraActions}

          {onPrintPdf && (
            <Button
              variant="outline"
              size="sm"
              onClick={onPrintPdf}
              icon={Printer}
              title="Print formatted report or save as PDF"
            >
              Print / PDF
            </Button>
          )}

          {onExportCsv && (
            <Button
              variant="primary"
              size="sm"
              onClick={onExportCsv}
              disabled={isExporting}
              icon={Download}
              title="Download report data as Excel CSV"
            >
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          )}
        </div>
      </div>

      {/* Filter Controls Bar */}
      {filters.length > 0 && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <Filter size={14} /> Report Filters & Parameters
            </div>
            {onResetFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                <RotateCcw size={12} /> Reset Filters
              </button>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.75rem',
              alignItems: 'flex-end',
            }}
          >
            {filters.map((f) => (
              <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {f.label}
                </label>
                {f.type === 'select' ? (
                  <select
                    value={f.value}
                    onChange={(e) => f.onChange(e.target.value)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  >
                    {f.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : f.type === 'date' ? (
                  <input
                    type="date"
                    value={f.value}
                    onChange={(e) => f.onChange(e.target.value)}
                    style={{
                      padding: '0.45rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                ) : (
                  <input
                    type="text"
                    value={f.value}
                    placeholder={f.placeholder || `Search by ${f.label.toLowerCase()}...`}
                    onChange={(e) => f.onChange(e.target.value)}
                    style={{
                      padding: '0.45rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
