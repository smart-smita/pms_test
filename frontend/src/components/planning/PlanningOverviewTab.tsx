import React from 'react';
import {
  DollarSign,
  Calendar,
  Layers,
  Briefcase,
  Users,
  Package,
  FileText,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '../common/Badge';

interface PlanningOverviewTabProps {
  planning: any;
  onNavigateTab: (tab: string) => void;
}

export const PlanningOverviewTab: React.FC<PlanningOverviewTabProps> = ({ planning, onNavigateTab }) => {
  const wbsList = planning.wbs || [];
  const tasksList = planning.tasks || [];
  const labourList = planning.labour || [];
  const materialsList = planning.materials || [];
  const taxesList = planning.taxes || [];

  const totalLabourCost = Number(planning.total_labour_cost || 0);
  const totalMaterialCost = Number(planning.total_material_cost || 0);
  const totalTaxAmount = Number(planning.total_tax_amount || 0);
  const totalBudget = Number(planning.total_budget || 0);

  const workflowSteps = [
    { label: 'Quotation Approved', completed: true, desc: 'Commercial quotation finalized' },
    { label: 'Planning Initialized', completed: true, desc: 'WBS, labour, materials loaded' },
    {
      label: 'Resource & Date Planning',
      completed: planning.status !== 'draft' || tasksList.length > 0,
      active: planning.status === 'draft',
      desc: 'Planner reviews and reschedules dates',
    },
    {
      label: 'Submitted for Review',
      completed: planning.status === 'in_review' || planning.status === 'approved',
      active: planning.status === 'in_review',
      desc: 'Integrity validation & sign-off',
    },
    {
      label: 'Project Created / Updated',
      completed: planning.status === 'approved',
      desc: 'Active execution under approved dates',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ── WORKFLOW PIPELINE PROGRESS STEPPER ──────────────────────── */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={18} color="var(--accent-primary)" />
          Quotation → Planning → Project Workflow Status
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', flexWrap: 'wrap', gap: '1rem' }}>
          {workflowSteps.map((step, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '180px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: step.completed
                    ? 'var(--success)'
                    : step.active
                    ? 'var(--accent-primary)'
                    : 'var(--bg-secondary)',
                  color: step.completed || step.active ? '#ffffff' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  border: '2px solid',
                  borderColor: step.completed
                    ? 'var(--success)'
                    : step.active
                    ? 'var(--accent-primary)'
                    : 'var(--border-color)',
                  flexShrink: 0,
                }}
              >
                {step.completed ? <CheckCircle size={16} /> : idx + 1}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: step.completed || step.active ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {step.label}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{step.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4 KEY METRIC CARDS ───────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        {/* Card 1: Total Budget */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Planned Total Budget</span>
            <div style={{ width: 34, height: 34, borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={18} color="var(--success)" />
            </div>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            ₹{totalBudget.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.4rem', display: 'flex', gap: '0.8rem' }}>
            <span>Labour: ₹{totalLabourCost.toLocaleString()}</span>
            <span>Mat: ₹{totalMaterialCost.toLocaleString()}</span>
          </div>
        </div>

        {/* Card 2: Timeline */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Project Timeline</span>
            <div style={{ width: 34, height: 34, borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={18} color="var(--accent-primary)" />
            </div>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {planning.total_duration || 0} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Working Days</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
            {planning.start_date ? String(planning.start_date).split('T')[0] : 'TBD'} → {planning.end_date ? String(planning.end_date).split('T')[0] : 'TBD'}
          </div>
        </div>

        {/* Card 3: WBS & Tasks */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>WBS & Tasks Structure</span>
            <div style={{ width: 34, height: 34, borderRadius: '8px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={18} color="#a855f7" />
            </div>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {wbsList.length} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>WBS</span> • {tasksList.length} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Tasks</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
            {planning.dependencies?.length || 0} Task Predecessor Relationships
          </div>
        </div>

        {/* Card 4: Labour & Material Resources */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Planned Resources</span>
            <div style={{ width: 34, height: 34, borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} color="var(--warning)" />
            </div>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {labourList.length} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Labour</span> • {materialsList.length} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Materials</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
            {planning.terms_snapshots?.length || 0} Terms & Conditions Clauses
          </div>
        </div>
      </div>

      {/* ── TWO COLUMN DETAILED BREAKDOWN ────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)', gap: '1.5rem' }}>
        {/* Left Column: WBS Milestones Summary */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} color="var(--accent-primary)" />
              Work Breakdown Structure Milestones
            </h3>
            <button
              onClick={() => onNavigateTab('wbs')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-primary)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              View Full WBS <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {wbsList.map((w: any, i: number) => {
              const childTasksCount = tasksList.filter((t: any) => t.planning_wbs_id === w.id).length;
              return (
                <div
                  key={w.id || i}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{w.wbs_name}</span>
                      <Badge variant="neutral">{w.wbs_code || `WBS-${i + 1}`}</Badge>
                      <Badge variant={w.wbs_type === 'material' ? 'warning' : w.wbs_type === 'both' ? 'info' : 'success'}>
                        {w.wbs_type?.toUpperCase()}
                      </Badge>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      {childTasksCount} Tasks • Planned Hours: {w.planned_hours || 0} hrs
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {w.start_date ? String(w.start_date).split('T')[0] : 'TBD'} → {w.end_date ? String(w.end_date).split('T')[0] : 'TBD'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: 600 }}>
                      ₹{Number(w.budget_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              );
            })}
            {wbsList.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No WBS disciplines imported yet.</p>
            )}
          </div>
        </div>

        {/* Right Column: Commercial & Project Overview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Customer & Quotation Card */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Building2 size={16} color="var(--accent-primary)" /> Customer & Commercial Basis
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Customer:</strong> {planning.customer_name} ({planning.customer_code})
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Contact Person:</strong> {planning.contact_person || 'N/A'} ({planning.contact_number || 'N/A'})
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Quotation Code:</strong> {planning.quotation_code}
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Quotation Date:</strong> {planning.quotation_date ? String(planning.quotation_date).split('T')[0] : 'N/A'}
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Quotation Total:</strong> ₹{Number(planning.quotation_total || 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Budget Cost Split */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <DollarSign size={16} color="var(--success)" /> Cost Split
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Labour Cost:</span>
                <strong style={{ color: 'var(--text-primary)' }}>₹{totalLabourCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Material Cost:</span>
                <strong style={{ color: 'var(--text-primary)' }}>₹{totalMaterialCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Taxes:</span>
                <strong style={{ color: 'var(--text-primary)' }}>₹{totalTaxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.4rem', fontWeight: 700 }}>
                <span style={{ color: 'var(--text-primary)' }}>Grand Total:</span>
                <span style={{ color: 'var(--success)' }}>₹{totalBudget.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
