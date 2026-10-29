import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRightCircle,
  HelpCircle,
  Info,
} from 'lucide-react';

export interface ActionFooterProps {
  situation: string;
  completedSummary?: string;
  pendingSummary?: string;
  alerts?: { text: string; severity?: 'warning' | 'danger' | 'info' }[];
  recommendations: string[];
}

export const ReportActionFooter: React.FC<ActionFooterProps> = ({
  situation,
  completedSummary,
  pendingSummary,
  alerts = [],
  recommendations = [],
}) => {
  return (
    <div
      style={{
        marginTop: '2rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <HelpCircle size={18} style={{ color: '#6366f1' }} />
        <h3
          style={{
            margin: 0,
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
          }}
        >
          Executive Summary & 5-Point Analysis
        </h3>
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            marginLeft: 'auto',
          }}
        >
          Automated Insights
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {/* Q1: What is the current situation? */}
        <div
          style={{
            padding: '1rem',
            borderRadius: '8px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#3b82f6',
              fontWeight: 600,
              fontSize: '0.82rem',
              marginBottom: '0.4rem',
            }}
          >
            <Info size={15} /> 1. Current Situation
          </div>
          <p
            style={{
              margin: 0,
              fontSize: '0.85rem',
              color: 'var(--text-primary)',
              lineHeight: 1.5,
            }}
          >
            {situation}
          </p>
        </div>

        {/* Q2 & Q3: What is completed & What is pending? */}
        <div
          style={{
            padding: '1rem',
            borderRadius: '8px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#10b981',
              fontWeight: 600,
              fontSize: '0.82rem',
              marginBottom: '0.4rem',
            }}
          >
            <CheckCircle2 size={15} /> 2. Completed vs. 3. Pending
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
            {completedSummary && (
              <div style={{ marginBottom: '0.35rem' }}>
                <strong style={{ color: '#10b981' }}>Done:</strong> {completedSummary}
              </div>
            )}
            {pendingSummary && (
              <div>
                <strong style={{ color: '#f59e0b' }}>Pending:</strong> {pendingSummary}
              </div>
            )}
          </div>
        </div>

        {/* Q4: Is anything going wrong? */}
        <div
          style={{
            padding: '1rem',
            borderRadius: '8px',
            background: alerts.length > 0 ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-primary)',
            border: `1px solid ${alerts.length > 0 ? 'rgba(239, 68, 68, 0.25)' : 'var(--border-color)'}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: alerts.length > 0 ? '#ef4444' : '#10b981',
              fontWeight: 600,
              fontSize: '0.82rem',
              marginBottom: '0.4rem',
            }}
          >
            <AlertTriangle size={15} /> 4. Issues & Attention Items
          </div>
          {alerts.length > 0 ? (
            <ul
              style={{
                margin: 0,
                paddingLeft: '1.2rem',
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
                lineHeight: 1.45,
              }}
            >
              {alerts.map((alert, idx) => (
                <li key={idx} style={{ marginBottom: '0.25rem' }}>
                  {alert.text}
                </li>
              ))}
            </ul>
          ) : (
            <p
              style={{
                margin: 0,
                fontSize: '0.85rem',
                color: '#10b981',
                lineHeight: 1.5,
              }}
            >
              ✓ No critical overruns, delays, or severe financial variances detected.
            </p>
          )}
        </div>

        {/* Q5: What should I do next? */}
        <div
          style={{
            padding: '1rem',
            borderRadius: '8px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#6366f1',
              fontWeight: 600,
              fontSize: '0.82rem',
              marginBottom: '0.4rem',
            }}
          >
            <ArrowRightCircle size={15} /> 5. Recommended Next Actions
          </div>
          {recommendations.length > 0 ? (
            <ul
              style={{
                margin: 0,
                paddingLeft: '1.2rem',
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
                lineHeight: 1.45,
              }}
            >
              {recommendations.map((rec, idx) => (
                <li key={idx} style={{ marginBottom: '0.25rem' }}>
                  {rec}
                </li>
              ))}
            </ul>
          ) : (
            <p
              style={{
                margin: 0,
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              Monitor scheduled progress and regular weekly review milestones.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
