import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface SummaryCardItem {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  trendText?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  tooltip?: string;
}

export interface ReportSummaryCardsProps {
  cards: SummaryCardItem[];
  columns?: number;
}

export const ReportSummaryCards: React.FC<ReportSummaryCardsProps> = ({ cards, columns = 5 }) => {
  const getVariantStyles = (variant?: string) => {
    switch (variant) {
      case 'success':
        return {
          iconBg: 'rgba(16, 185, 129, 0.12)',
          iconColor: '#10b981',
          accent: '#10b981',
        };
      case 'danger':
        return {
          iconBg: 'rgba(239, 68, 68, 0.12)',
          iconColor: '#ef4444',
          accent: '#ef4444',
        };
      case 'warning':
        return {
          iconBg: 'rgba(245, 158, 11, 0.12)',
          iconColor: '#f59e0b',
          accent: '#f59e0b',
        };
      case 'info':
        return {
          iconBg: 'rgba(6, 182, 212, 0.12)',
          iconColor: '#06b6d4',
          accent: '#06b6d4',
        };
      case 'primary':
        return {
          iconBg: 'rgba(99, 102, 241, 0.12)',
          iconColor: '#6366f1',
          accent: '#6366f1',
        };
      default:
        return {
          iconBg: 'rgba(100, 116, 139, 0.12)',
          iconColor: '#64748b',
          accent: '#94a3b8',
        };
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(210px, 1fr))`,
        gap: '1rem',
        marginBottom: '1.5rem',
      }}
    >
      {cards.map((card, idx) => {
        const styles = getVariantStyles(card.variant);
        const Icon = card.icon;

        return (
          <div
            key={idx}
            title={card.tooltip}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '1.1rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top accent indicator */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: styles.accent,
              }}
            />

            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.6rem',
                }}
              >
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {card.title}
                </span>
                {Icon && (
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: styles.iconBg,
                      color: styles.iconColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={16} />
                  </div>
                )}
              </div>

              <div
                style={{
                  fontSize: '1.55rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                }}
              >
                {card.value}
              </div>
            </div>

            {(card.subtitle || card.trendText) && (
              <div
                style={{
                  marginTop: '0.6rem',
                  paddingTop: '0.5rem',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <span>{card.subtitle}</span>
                {card.trendText && (
                  <span
                    style={{
                      fontWeight: 600,
                      color:
                        card.trendType === 'positive'
                          ? '#10b981'
                          : card.trendType === 'negative'
                          ? '#ef4444'
                          : 'var(--text-secondary)',
                    }}
                  >
                    {card.trendText}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
