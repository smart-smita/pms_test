import React, { useState, useEffect } from 'react';
import { Project, Wbs, Task } from '../../../types';
import { apiRequest } from '../../../services/api';
import { Button } from '../../common/Button';
import { Badge } from '../../common/Badge';
import { ProgressBar } from '../../common/ProgressBar';
import { WbsTypeBadge } from '../../common/WbsTypeBadge';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { 
  Layers, Plus, ChevronRight, ChevronDown, CheckSquare, 
  Users, Package, Clock, DollarSign, FileText, Info
} from 'lucide-react';

interface ManageWorkTabProps {
  projectId: number;
  onNavigate: (page: string) => void;
}

export const ManageWorkTab: React.FC<ManageWorkTabProps> = ({
  projectId,
  onNavigate,
}) => {
  const [wbsList, setWbsList] = useState<Wbs[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedWbsId, setSelectedWbsId] = useState<number | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'tasks' | 'labour' | 'materials' | 'logs'>('info');
  const [isLoading, setIsLoading] = useState(true);

  const fetchWorkData = async () => {
    setIsLoading(true);
    const [wRes, tRes] = await Promise.all([
      apiRequest<Wbs[]>(`/projects/${projectId}/wbs`),
      apiRequest<Task[]>(`/tasks?project_id=${projectId}`),
    ]);
    if (wRes.success && wRes.data) {
      setWbsList(wRes.data);
      if (wRes.data.length > 0 && selectedWbsId === null) {
        setSelectedWbsId(wRes.data[0].wbs_id);
      }
    }
    if (tRes.success && tRes.data) setTasks(tRes.data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (projectId) fetchWorkData();
  }, [projectId]);

  const selectedWbs = wbsList.find((w) => w.wbs_id === selectedWbsId) || wbsList[0] || null;
  const wbsTasks = tasks.filter((t) => t.wbs_id === selectedWbs?.wbs_id);

  if (isLoading) {
    return (
      <div style={{ padding: '3.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
        <LoadingSpinner />
        <span style={{ color: 'var(--text-secondary)' }}>Loading project work breakdown...</span>
      </div>
    );
  }

  if (!projectId) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Layers size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
        <h3>No Project Selected</h3>
        <p>Please select a project from the Project List to manage its work structure.</p>
        <Button variant="primary" style={{ marginTop: '1rem' }} onClick={() => onNavigate('project/workspace')}>
          Go to Project List
        </Button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Manage Project Work (WBS)
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
            Work Breakdown Structure, discipline packages, deliverables and task allocation
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => onNavigate(`project/${projectId}/edit`)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: '#4f46e5',
            color: '#ffffff',
            borderRadius: '8px',
            padding: '0.55rem 1.15rem',
            fontWeight: 600,
            fontSize: '0.86rem',
            boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
          }}
        >
          <Plus size={16} />
          <span>Add / Allocate WBS</span>
        </Button>
      </div>

      {/* Two-Column Layout: Left = WBS Tree Hierarchy, Right = WBS Node Details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 360px) 1fr', gap: '1.25rem', alignItems: 'start' }}>
        
        {/* Left Column: WBS Hierarchy Tree */}
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0.25rem 0.5rem' }}>
            WBS Disciplines ({wbsList.length})
          </div>

          {wbsList.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No WBS nodes allocated yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {(() => {
                const renderWbsTree = (parentId: number | null, depth = 0): React.ReactNode => {
                  const children = wbsList.filter((w) => (w.parent_id || null) === parentId);
                  if (children.length === 0) return null;

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingLeft: depth > 0 ? '0.85rem' : '0', borderLeft: depth > 0 ? '1px dashed var(--border-color)' : 'none', marginLeft: depth > 0 ? '0.5rem' : '0' }}>
                      {children.map((wbs) => {
                        const isSelected = wbs.wbs_id === selectedWbs?.wbs_id;
                        const nodeTasks = tasks.filter((t) => t.wbs_id === wbs.wbs_id);
                        return (
                          <React.Fragment key={wbs.wbs_id}>
                            <button
                              onClick={() => setSelectedWbsId(wbs.wbs_id)}
                              style={{
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.4rem',
                                padding: '0.75rem 0.85rem',
                                borderRadius: '8px',
                                border: isSelected ? '1.5px solid #6366f1' : '1px solid var(--border-color)',
                                background: isSelected ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-primary)',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: isSelected ? '#818cf8' : 'var(--text-primary)' }}>
                                  {wbs.wbs_code || 'WBS'}
                                </span>
                                <WbsTypeBadge type={wbs.wbs_type || 'labour_material'} size="sm" />
                              </div>

                              <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {wbs.wbs_name}
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                <span>{nodeTasks.length} Tasks</span>
                                <span>₹ {Number((wbs as any).budget_amount || 0).toLocaleString()}</span>
                              </div>

                              <div style={{ marginTop: '0.2rem' }}>
                                <ProgressBar progress={(wbs as any).progress_percentage || 0} showLabel={false} height={4} />
                              </div>
                            </button>
                            {renderWbsTree(wbs.wbs_id, depth + 1)}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  );
                };
                
                // If there are no parent_id links, they all fallback to null parent
                // If some nodes don't have parent_id properly set, we should just group them
                // Let's render the roots (nodes whose parent_id is null or not found in the list)
                const roots = wbsList.filter(w => !w.parent_id || !wbsList.find(p => p.wbs_id === w.parent_id));
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {roots.map(root => (
                      <React.Fragment key={root.wbs_id}>
                        <button
                          onClick={() => setSelectedWbsId(root.wbs_id)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.4rem',
                            padding: '0.75rem 0.85rem',
                            borderRadius: '8px',
                            border: (root.wbs_id === selectedWbs?.wbs_id) ? '1.5px solid #6366f1' : '1px solid var(--border-color)',
                            background: (root.wbs_id === selectedWbs?.wbs_id) ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: (root.wbs_id === selectedWbs?.wbs_id) ? '#818cf8' : 'var(--text-primary)' }}>
                              {root.wbs_code || 'WBS'}
                            </span>
                            <WbsTypeBadge type={root.wbs_type || 'labour_material'} size="sm" />
                          </div>

                          <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {root.wbs_name}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            <span>{tasks.filter((t) => t.wbs_id === root.wbs_id).length} Tasks</span>
                            <span>₹ {Number((root as any).budget_amount || 0).toLocaleString()}</span>
                          </div>

                          <div style={{ marginTop: '0.2rem' }}>
                            <ProgressBar progress={(root as any).progress_percentage || 0} showLabel={false} height={4} />
                          </div>
                        </button>
                        {renderWbsTree(root.wbs_id, 1)}
                      </React.Fragment>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Right Column: Detailed Node View & Sub-Tabs */}
        {selectedWbs ? (
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedWbs.wbs_code} - {selectedWbs.wbs_name}
                  </h3>
                  <WbsTypeBadge type={selectedWbs.wbs_type || 'labour_material'} size="md" />
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Discipline Category: {selectedWbs.discipline_name || 'General Project Work'}
                </div>
              </div>

              <Button
                variant="primary"
                onClick={() => onNavigate(`project/workspace/${projectId}/tasks/new?wbsId=${selectedWbs.wbs_id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.82rem',
                  padding: '0.45rem 0.95rem',
                  borderRadius: '6px',
                  background: '#4f46e5',
                }}
              >
                <Plus size={14} />
                <span>Add Task to WBS</span>
              </Button>
            </div>

            {/* Sub-Tabs Bar */}
            <div style={{ display: 'flex', gap: '0.5rem', padding: '0 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(255, 255, 255, 0.01)' }}>
              <button
                onClick={() => setActiveSubTab('info')}
                style={{
                  padding: '0.75rem 0.85rem',
                  background: 'none',
                  border: 'none',
                  borderBottom: `2px solid ${activeSubTab === 'info' ? '#4f46e5' : 'transparent'}`,
                  color: activeSubTab === 'info' ? '#818cf8' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                }}
              >
                Information
              </button>

              <button
                onClick={() => setActiveSubTab('tasks')}
                style={{
                  padding: '0.75rem 0.85rem',
                  background: 'none',
                  border: 'none',
                  borderBottom: `2px solid ${activeSubTab === 'tasks' ? '#4f46e5' : 'transparent'}`,
                  color: activeSubTab === 'tasks' ? '#818cf8' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                }}
              >
                Tasks ({wbsTasks.length})
              </button>

              <button
                onClick={() => setActiveSubTab('labour')}
                style={{
                  padding: '0.75rem 0.85rem',
                  background: 'none',
                  border: 'none',
                  borderBottom: `2px solid ${activeSubTab === 'labour' ? '#4f46e5' : 'transparent'}`,
                  color: activeSubTab === 'labour' ? '#818cf8' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                }}
              >
                Labour & Staff
              </button>

              <button
                onClick={() => setActiveSubTab('materials')}
                style={{
                  padding: '0.75rem 0.85rem',
                  background: 'none',
                  border: 'none',
                  borderBottom: `2px solid ${activeSubTab === 'materials' ? '#4f46e5' : 'transparent'}`,
                  color: activeSubTab === 'materials' ? '#818cf8' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                }}
              >
                Materials
              </button>
            </div>

            {/* Sub-Tab Contents */}
            <div style={{ padding: '1.5rem' }}>
              {activeSubTab === 'info' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>PLANNED QUANTITY / UNIT</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                      {(selectedWbs as any).planned_quantity || 1} {(selectedWbs as any).unit || 'Unit'}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>RATE PER UNIT</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.2rem' }}>
                      ₹ {Number((selectedWbs as any).rate || 0).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL BUDGET</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#4ade80', marginTop: '0.2rem' }}>
                      ₹ {Number((selectedWbs as any).budget_amount || 0).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL ESTIMATED HOURS</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b', marginTop: '0.2rem' }}>
                      {(selectedWbs as any).total_hours || 0} hrs
                    </div>
                  </div>
                </div>
              )}

              {activeSubTab === 'tasks' && (
                <div>
                  {wbsTasks.length === 0 ? (
                    <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <CheckSquare size={32} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem auto' }} />
                      <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>No tasks in this WBS</div>
                      <div style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>Click &quot;Add Task to WBS&quot; above to create tasks for this deliverable.</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {wbsTasks.map((t) => (
                        <div
                          key={t.task_id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.85rem 1rem',
                            borderRadius: '8px',
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                              {t.task_code} - {t.task_name}
                            </div>
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                              Assignee: {t.assigned_employee_name || t.assigned_labour_name || 'Unassigned'} • Planned: {t.planned_hours || 0} hrs
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Badge variant={t.status === 'completed' ? 'success' : t.status === 'in_progress' ? 'warning' : 'info'}>
                              {t.status}
                            </Badge>
                            <Button
                              variant="secondary"
                              onClick={() => onNavigate(`project/workspace/${projectId}/tasks/${t.task_id}`)}
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                            >
                              View
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeSubTab === 'labour' && (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <div style={{ marginBottom: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Labour & Contractor Allocations for {selectedWbs.wbs_name}:
                  </div>
                  <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    Planned Labour Cost: ₹ {Number((selectedWbs as any).planned_labour_cost || 0).toLocaleString()}
                  </div>
                </div>
              )}

              {activeSubTab === 'materials' && (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <div style={{ marginBottom: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Material Requirements for {selectedWbs.wbs_name}:
                  </div>
                  <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    Planned Material Cost: ₹ {Number((selectedWbs as any).planned_material_cost || 0).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Select a WBS node from the left tree to inspect deliverables.
          </div>
        )}
      </div>
    </div>
  );
};
