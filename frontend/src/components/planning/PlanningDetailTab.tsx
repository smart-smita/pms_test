import React from 'react';
import { Layers, Calendar } from 'lucide-react';
import { Badge } from '../common/Badge';

interface PlanningDetailTabProps {
  planningData: any;
  onRefresh: () => void;
}

export const PlanningDetailTab: React.FC<PlanningDetailTabProps> = ({ planningData, onRefresh }) => {
  if (!planningData) return null;

  const wbsList = planningData.wbs || [];
  const tasksList = planningData.tasks || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
          <Layers size={18} style={{ color: 'var(--accent-primary)' }} />
          Work Breakdown Structure (WBS)
        </h3>
        
        {wbsList.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No WBS imported from quotation.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {wbsList.map((wbs: any) => (
              <div key={wbs.id} style={{ 
                border: '1px solid var(--border-color)', 
                borderRadius: '8px', 
                padding: '1rem',
                background: 'var(--bg-secondary)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{wbs.wbs_name}</h4>
                  <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span>Start: {wbs.baseline_start ? new Date(wbs.baseline_start).toLocaleDateString() : 'TBD'}</span>
                    <span>End: {wbs.baseline_end ? new Date(wbs.baseline_end).toLocaleDateString() : 'TBD'}</span>
                    <Badge variant="info">{wbs.duration} Days</Badge>
                  </div>
                </div>
                
                {/* WBS Tasks */}
                <div style={{ marginTop: '1rem', paddingLeft: '1rem', borderLeft: '2px solid var(--border-color)' }}>
                  <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Tasks</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {tasksList.filter((t: any) => t.planning_wbs_id === wbs.id).map((task: any) => (
                      <div key={task.id} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '0.75rem',
                        background: 'var(--bg-primary)',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)'
                      }}>
                        <span style={{ fontWeight: 500 }}>{task.task_name}</span>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          <span>Duration: {task.duration} days</span>
                          <span>Dates: {task.start_date ? new Date(task.start_date).toLocaleDateString() : 'TBD'} - {task.end_date ? new Date(task.end_date).toLocaleDateString() : 'TBD'}</span>
                        </div>
                      </div>
                    ))}
                    {tasksList.filter((t: any) => t.planning_wbs_id === wbs.id).length === 0 && (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No tasks for this WBS.</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
          <Calendar size={18} style={{ color: 'var(--accent-primary)' }} />
          Dependencies & Scheduling
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Scheduling Engine will populate critical path and dependencies here in Phase 5.
        </p>
      </div>
    </div>
  );
};
