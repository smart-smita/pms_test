import React, { useState } from 'react';
import { Project, Customer } from '../../types';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { ProgressRing } from '../common/ProgressRing';
import { 
  Building2, Calendar, Leaf, ArrowLeft, Edit, MoreHorizontal,
  Download, Copy, Power, ExternalLink
} from 'lucide-react';

interface WorkspaceHeaderProps {
  project: Project;
  customer?: Customer | null;
  onBack: () => void;
  onEdit: () => void;
  onExportExcel?: () => void;
  onDuplicate?: () => void;
  onToggleStatus?: () => void;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  project,
  customer,
  onBack,
  onEdit,
  onExportExcel,
  onDuplicate,
  onToggleStatus,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const statusVariant = 
    project.status === 'active' ? 'warning' :
    project.status === 'completed' ? 'success' :
    project.status === 'cancelled' ? 'danger' : 'secondary';

  const statusStr = String(project.status || '');
  const statusLabel = 
    statusStr === 'active' ? 'In Progress' :
    statusStr === 'completed' ? 'Completed' :
    statusStr === 'cancelled' ? 'Delayed' : 
    statusStr === 'planning' ? 'Planning' : statusStr;

  const formatDate = (d?: string | null) => {
    if (!d) return 'N/A';
    try {
      return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return d;
    }
  };

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-color)',
        padding: '1.15rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.25rem',
      }}
    >
      {/* Left Column: Project Thumbnail, Title, Code & Client */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.15rem', minWidth: '260px' }}>
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.2) 0%, rgba(99, 102, 241, 0.4) 100%), url("https://images.unsplash.com/photo-1584738766473-61c083514bf4?ixlib=rb-4.0.3&auto=format&fit=crop&w=160&q=80") center/cover',
            border: '1px solid var(--border-color)',
            flexShrink: 0,
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              {project.project_name}
            </h1>
            <Badge variant={statusVariant as any} style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', fontWeight: 600 }}>
              {statusLabel}
            </Badge>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.02em' }}>
            {project.project_code}
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Building2 size={13} color="#6366f1" />
            <span>{customer?.customer_name || project.client_name || project.community_name || 'The Polo Townhouses'}</span>
          </div>
        </div>
      </div>

      {/* Middle Column: Summary Metric Tiles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
        {/* Project Type */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(34, 197, 94, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#22c55e',
            }}
          >
            <Leaf size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Project Type</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {project.project_type_name || 'Landscaping'}
            </div>
          </div>
        </div>

        {/* Start Date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8',
            }}
          >
            <Calendar size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Start Date</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {formatDate(project.start_date)}
            </div>
          </div>
        </div>

        {/* End Date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(168, 85, 247, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#a855f7',
            }}
          >
            <Calendar size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>End Date</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {formatDate(project.end_date)}
            </div>
          </div>
        </div>

        {/* Progress with Circular Donut Ring */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '0.5rem', borderLeft: '1px solid var(--border-color)' }}>
          <ProgressRing progress={project.progress_percentage || 0} size={38} strokeWidth={4} color="#4f46e5" />
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Progress</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {project.progress_percentage || 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', position: 'relative' }}>
        <Button
          variant="secondary"
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.45rem 0.85rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={15} />
          <span>Back</span>
        </Button>

        <Button
          variant="primary"
          onClick={onEdit}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: '#4f46e5',
            padding: '0.45rem 1rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
          }}
        >
          <Edit size={15} />
          <span>Edit Project</span>
        </Button>

        <div style={{ position: 'relative' }}>
          <Button
            variant="secondary"
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            style={{
              padding: '0.45rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MoreHorizontal size={17} />
          </Button>

          {showMoreMenu && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: '180px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '0.4rem',
                boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                zIndex: 30,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.15rem',
              }}
            >
              {onExportExcel && (
                <button
                  onClick={() => { setShowMoreMenu(false); onExportExcel(); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.5rem 0.65rem',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Download size={14} color="#818cf8" /> Export Excel
                </button>
              )}

              {onDuplicate && (
                <button
                  onClick={() => { setShowMoreMenu(false); onDuplicate(); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.5rem 0.65rem',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Copy size={14} color="#38bdf8" /> Duplicate Project
                </button>
              )}

              {onToggleStatus && (
                <button
                  onClick={() => { setShowMoreMenu(false); onToggleStatus(); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.5rem 0.65rem',
                    border: 'none',
                    background: 'transparent',
                    color: project.status === 'active' ? '#ef4444' : '#10b981',
                    fontSize: '0.82rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Power size={14} /> {project.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
