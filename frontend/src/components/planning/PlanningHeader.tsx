import React from 'react';
import {
  FileText,
  Calendar,
  Layers,
  Save,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Clock,
  DollarSign,
  Briefcase,
  History,
  ShieldAlert,
  FolderKanban,
  CheckCheck,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface PlanningHeaderProps {
  planning: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onBack: () => void;
  onSaveDraft: () => void;
  onRecalculate: () => void;
  onValidate: () => void;
  onSubmit: () => void;
  onApprove: () => void;
  onReject: () => void;
  onOpenDiffModal: () => void;
  isSaving: boolean;
  isAdminOrManager: boolean;
}

export const PlanningHeader: React.FC<PlanningHeaderProps> = ({
  planning,
  activeTab,
  setActiveTab,
  onBack,
  onSaveDraft,
  onRecalculate,
  onValidate,
  onSubmit,
  onApprove,
  onReject,
  onOpenDiffModal,
  isSaving,
  isAdminOrManager,
}) => {
  const hasQuotationChanges = planning.quotation_changes?.has_changes;
  const diffCount = planning.quotation_changes?.diffs?.length || 0;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <FileText size={15} /> },
    { id: 'wbs', label: 'WBS Planning', icon: <Layers size={15} /> },
    { id: 'tasks', label: 'Task Planning', icon: <Briefcase size={15} /> },
    { id: 'dependencies', label: 'Dependencies', icon: <History size={15} /> },
    { id: 'labour', label: 'Labour', icon: <Briefcase size={15} /> },
    { id: 'materials', label: 'Materials', icon: <Layers size={15} /> },
    { id: 'terms', label: 'Terms & Conditions', icon: <FileText size={15} /> },
    { id: 'calendar', label: 'Calendar Rules', icon: <Calendar size={15} /> },
    { id: 'gantt', label: 'Interactive Gantt', icon: <Calendar size={15} /> },
    { id: 'revisions', label: 'Change History', icon: <History size={15} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
      {/* ── QUOTATION CHANGE DETECTION ALERT BANNER ──────────────────── */}
      {hasQuotationChanges && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.25) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '10px',
            padding: '0.85rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={20} color="var(--warning)" />
            <div>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                Quotation Has Changed ({diffCount} differences detected)
              </span>
              <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                The commercial quotation was modified after this planning draft was created. Review diffs and selectively apply.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={onOpenDiffModal}
            style={{
              borderColor: 'var(--warning)',
              color: 'var(--warning)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.82rem',
              padding: '0.4rem 0.8rem',
            }}
          >
            <History size={14} /> Review Quotation Differences
          </Button>
        </div>
      )}

      {/* ── TOP INFO & ACTION BAR ────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          {/* Left Title & Metadata */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <Button
              variant="secondary"
              onClick={onBack}
              title="Back to Planning List"
              style={{ padding: '0.45rem', marginTop: '0.2rem' }}
            >
              <ArrowLeft size={16} />
            </Button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Planning: {planning.quotation_code}
                </h1>
                <Badge
                  variant={
                    planning.status === 'approved'
                      ? 'success'
                      : planning.status === 'in_review'
                      ? 'warning'
                      : planning.status === 'rejected'
                      ? 'danger'
                      : 'neutral'
                  }
                >
                  {planning.status?.replace('_', ' ').toUpperCase()}
                </Badge>
                <Badge variant="info">v{planning.version || 1}.0</Badge>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1.25rem',
                  marginTop: '0.5rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Customer:</strong>{' '}
                  {planning.customer_name} ({planning.customer_code})
                </div>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Project:</strong>{' '}
                  {planning.project_name || planning.new_project_name || 'New Project Auto-Creation'}
                </div>
                {planning.project_type_name && (
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>Type:</strong>{' '}
                    {planning.project_type_name}
                  </div>
                )}
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Timeline:</strong>{' '}
                  {planning.start_date ? String(planning.start_date).split('T')[0] : 'TBD'} →{' '}
                  {planning.end_date ? String(planning.end_date).split('T')[0] : 'TBD'}{' '}
                  <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                    ({planning.total_duration || 0} Working Days)
                  </span>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Planned Budget:</strong>{' '}
                  <span style={{ color: 'var(--success)', fontWeight: 700 }}>
                    ₹{Number(planning.total_budget || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <Button
              variant="secondary"
              onClick={onRecalculate}
              disabled={isSaving || planning.status === 'approved'}
              title="Recalculate dependencies, working days & date roll-ups"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
            >
              <RefreshCcw size={14} /> Recalculate
            </Button>

            <Button
              variant="secondary"
              onClick={onValidate}
              title="Validate completeness, dates, and dependencies"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
            >
              <ShieldAlert size={14} /> Validate
            </Button>

            {planning.status !== 'approved' && (
              <Button
                variant="secondary"
                onClick={onSaveDraft}
                disabled={isSaving}
                title="Save current planning values as draft"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
              >
                <Save size={14} /> {isSaving ? 'Saving...' : 'Save Draft'}
              </Button>
            )}

            {planning.status === 'draft' && (
              <Button
                variant="primary"
                onClick={onSubmit}
                disabled={isSaving}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
              >
                <CheckCircle2 size={14} /> Submit for Review
              </Button>
            )}

            {isAdminOrManager && (planning.status === 'in_review' || planning.status === 'draft') && (
              <>
                <Button
                  variant="primary"
                  onClick={onApprove}
                  disabled={isSaving}
                  style={{
                    background: 'var(--success)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.82rem',
                  }}
                >
                  <CheckCheck size={14} /> Approve & Create/Update Project
                </Button>

                <Button
                  variant="secondary"
                  onClick={onReject}
                  disabled={isSaving}
                  style={{
                    color: 'var(--danger)',
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.82rem',
                  }}
                >
                  <XCircle size={14} /> Reject
                </Button>
              </>
            )}
          </div>
        </div>

        {/* ── TABS NAVIGATION BAR ────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            marginTop: '1.25rem',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '0.85rem',
            overflowX: 'auto',
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.5rem 0.9rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: isActive ? 'var(--accent-primary)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
