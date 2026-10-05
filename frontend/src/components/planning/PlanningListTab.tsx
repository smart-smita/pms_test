import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  Search,
  ChevronRight,
  FolderKanban,
  Calendar,
  Layers,
  DollarSign,
  Briefcase,
  Clock,
  Filter,
} from 'lucide-react';

interface PlanningListTabProps {
  onSelect: (id: number) => void;
}

export const PlanningListTab: React.FC<PlanningListTabProps> = ({ onSelect }) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setIsLoading(true);
    const res = await apiRequest<any[]>('/planning');
    if (res.success && res.data) {
      setPlans(res.data);
    }
    setIsLoading(false);
  };

  const filteredPlans = plans.filter((p) => {
    const matchesSearch =
      (p.quotation_code?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (p.customer_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (p.project_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (p.new_project_name?.toLowerCase() || '').includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* ── HEADER & SEARCH BAR ─────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FolderKanban size={22} color="var(--accent-primary)" />
              Planning Workspace
            </h2>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              Manage approved quotation execution plans, working-day schedules, labour/materials, and project creations.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}
              />
              <input
                type="text"
                className="form-input"
                placeholder="Search by code, customer, project..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '2.4rem', fontSize: '0.84rem' }}
              />
            </div>

            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ fontSize: '0.84rem', width: '160px' }}
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="in_review">In Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── PLANS TABLE ──────────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: 0, overflowX: 'auto' }}>
        {isLoading ? (
          <div style={{ padding: '3rem' }}>
            <LoadingSpinner />
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '0.85rem 1.25rem' }}>Quotation & Version</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Customer</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Project / Project Type</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Schedule & Working Days</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Planned Budget</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlans.map((plan: any) => (
                <tr
                  key={plan.id}
                  style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s ease' }}
                  className="table-row-hover"
                >
                  {/* Quotation Code & Version */}
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{plan.quotation_code}</span>
                      <Badge variant="info">v{plan.version || 1}.0</Badge>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {plan.wbs_count || 0} WBS Disciplines • {plan.tasks_count || 0} Tasks
                    </div>
                  </td>

                  {/* Customer */}
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{plan.customer_name || 'Client'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{plan.customer_code}</div>
                  </td>

                  {/* Project */}
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                      {plan.project_name || plan.new_project_name || 'New Project Auto-Creation'}
                    </div>
                    {plan.project_type_name && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{plan.project_type_name}</div>
                    )}
                  </td>

                  {/* Schedule */}
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {plan.start_date ? String(plan.start_date).split('T')[0] : 'TBD'} →{' '}
                      {plan.end_date ? String(plan.end_date).split('T')[0] : 'TBD'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>
                      {plan.total_duration || 0} Working Days
                    </div>
                  </td>

                  {/* Budget */}
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--success)' }}>
                      ₹{Number(plan.total_budget || plan.quotation_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <Badge
                      variant={
                        plan.status === 'approved'
                          ? 'success'
                          : plan.status === 'in_review'
                          ? 'warning'
                          : plan.status === 'rejected'
                          ? 'danger'
                          : 'neutral'
                      }
                    >
                      {plan.status?.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </td>

                  {/* Open Button */}
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                    <Button
                      variant="secondary"
                      onClick={() => onSelect(plan.id)}
                      style={{
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.82rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      Open Workspace <ChevronRight size={14} />
                    </Button>
                  </td>
                </tr>
              ))}

              {filteredPlans.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No planning records match your search or filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
