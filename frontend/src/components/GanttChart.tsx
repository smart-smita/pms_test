import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Square, PlusCircle, Paperclip } from 'lucide-react';

interface GanttChartProps {
  tasks: any[];
}

export const GanttChart: React.FC<GanttChartProps> = ({ tasks }) => {
  const [collapsedWBS, setCollapsedWBS] = useState<Set<string>>(new Set());

  // Sort and process tasks to group by WBS
  const processedTasks = useMemo(() => {
    const wbsMap = new Map<string, any[]>();
    
    tasks.forEach(t => {
      const wbs = t.wbs_name || 'Uncategorized';
      if (!wbsMap.has(wbs)) {
        wbsMap.set(wbs, []);
      }
      wbsMap.get(wbs)!.push(t);
    });

    const rows: any[] = [];
    
    Array.from(wbsMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).forEach(([wbs, wbsTasks]) => {
      let minStart = Infinity;
      let maxEnd = -Infinity;
      let minBaselineStart = Infinity;
      let maxBaselineEnd = -Infinity;
      let minActualStart = Infinity;
      let maxActualEnd = -Infinity;
      let totalPlan = 0;
      let totalActual = 0;
      
      wbsTasks.forEach(t => {
        if (t.start_date || t.current_start) {
          const d = new Date(t.start_date || t.current_start).getTime();
          if (d < minStart) minStart = d;
        }
        if (t.target_date || t.current_end) {
          const d = new Date(t.target_date || t.current_end).getTime();
          if (d > maxEnd) maxEnd = d;
        }
        if (t.baseline_start) {
          const d = new Date(t.baseline_start).getTime();
          if (d < minBaselineStart) minBaselineStart = d;
        }
        if (t.baseline_end) {
          const d = new Date(t.baseline_end).getTime();
          if (d > maxBaselineEnd) maxBaselineEnd = d;
        }
        if (t.actual_start_date) {
          const d = new Date(t.actual_start_date).getTime();
          if (d < minActualStart) minActualStart = d;
        }
        if (t.actual_end_date) {
          const d = new Date(t.actual_end_date).getTime();
          if (d > maxActualEnd) maxActualEnd = d;
        }
        totalPlan += Number(t.plan_hours || 0);
        totalActual += Number(t.actual_hours || 0);
      });

      const parentId = `wbs-${wbs}`;
      
      // Parent Row (WBS)
      rows.push({
        task_id: parentId,
        task_name: wbs, // Show WBS name as the folder name
        wbs_name: wbs,
        isParent: true,
        depth: 0,
        childrenCount: wbsTasks.length,
        plan_hours: Math.round(totalPlan * 10) / 10,
        actual_hours: Math.round(totalActual * 10) / 10,
        start_date: minStart !== Infinity ? new Date(minStart).toISOString().split('T')[0] : null,
        target_date: maxEnd !== -Infinity ? new Date(maxEnd).toISOString().split('T')[0] : null,
        baseline_start: minBaselineStart !== Infinity ? new Date(minBaselineStart).toISOString().split('T')[0] : null,
        baseline_end: maxBaselineEnd !== -Infinity ? new Date(maxBaselineEnd).toISOString().split('T')[0] : null,
        actual_start_date: minActualStart !== Infinity ? new Date(minActualStart).toISOString().split('T')[0] : null,
        actual_end_date: maxActualEnd !== -Infinity ? new Date(maxActualEnd).toISOString().split('T')[0] : null,
        parent_wbs: null,
      });

      // Child Rows (Tasks)
      wbsTasks.sort((a, b) => (a.task_name || '').localeCompare(b.task_name || '')).forEach(t => {
        rows.push({
          ...t,
          task_id: t.task_id,
          wbs_name: '', // Hide WBS for children as it's grouped
          isParent: false,
          depth: 1,
          childrenCount: 0,
          parent_wbs: wbs,
          plan_hours: Math.round(Number(t.plan_hours || 0) * 10) / 10,
          actual_hours: Math.round(Number(t.actual_hours || 0) * 10) / 10,
        });
      });
    });
    
    return rows;
  }, [tasks]);

  const toggleCollapse = (wbs: string) => {
    const next = new Set(collapsedWBS);
    if (next.has(wbs)) next.delete(wbs);
    else next.add(wbs);
    setCollapsedWBS(next);
  };

  const visibleTasks = processedTasks.filter(t => {
    if (t.isParent) return true;
    if (collapsedWBS.has(t.parent_wbs)) return false;
    return true;
  });

  // Timeline calculations
  const { minDate, maxDate } = useMemo(() => {
    let min = new Date('2099-01-01').getTime();
    let max = new Date('2000-01-01').getTime();

    tasks.forEach(t => {
      const dates = [
        t.start_date, t.target_date, 
        t.baseline_start, t.baseline_end, 
        t.current_start, t.current_end, 
        t.actual_start_date, t.actual_end_date
      ];
      
      dates.forEach(dateStr => {
        if (dateStr) {
          const d = new Date(dateStr).getTime();
          if (d < min) min = d;
          if (d > max) max = d;
        }
      });
    });

    if (min > max) {
      min = new Date().getTime() - 7 * 24 * 60 * 60 * 1000;
      max = new Date().getTime() + 14 * 24 * 60 * 60 * 1000;
    } else {
      min -= 5 * 24 * 60 * 60 * 1000; // Pad 5 days before
      max += 14 * 24 * 60 * 60 * 1000; // Pad 14 days after
    }

    return { minDate: new Date(min), maxDate: new Date(max) };
  }, [tasks]);

  const daysDiff = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 3600 * 24));
  const daysArray = Array.from({ length: daysDiff + 1 }, (_, i) => {
    const d = new Date(minDate.getTime());
    d.setDate(d.getDate() + i);
    return d;
  });

  const getPositionStyle = (startDateStr?: string, endDateStr?: string) => {
    if (!startDateStr || !endDateStr) return { display: 'none' };
    const s = new Date(startDateStr).getTime();
    const e = new Date(endDateStr).getTime();
    const min = minDate.getTime();
    
    if (e < min || s > maxDate.getTime()) return { display: 'none' };
    
    const startOffset = Math.max(0, s - min);
    const duration = Math.max(24 * 60 * 60 * 1000, e - s);
    
    const leftPct = (startOffset / (daysDiff * 24 * 60 * 60 * 1000)) * 100;
    const widthPct = (duration / (daysDiff * 24 * 60 * 60 * 1000)) * 100;
    
    return {
      left: `${Math.max(0, Math.min(100, leftPct))}%`,
      width: `${Math.max(0, widthPct)}%`,
    };
  };

  const dayOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const colors = ['#38bdf8', '#4ade80', '#fb923c', '#94a3b8', '#a78bfa'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#ffffff', color: '#333333', border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Top Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0.5rem 1rem', borderBottom: '1px solid #e2e8f0', gap: '1rem', color: '#94a3b8' }}>
        <PlusCircle size={18} cursor="pointer" />
        <div style={{ height: '16px', width: '1px', background: '#e2e8f0' }} />
        <Paperclip size={18} cursor="pointer" />
        <div style={{ flex: 1 }} />
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Side: Data Grid */}
        <div style={{ width: '550px', flexShrink: 0, borderRight: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', background: '#f8fafc', fontWeight: 600, fontSize: '0.7rem', color: '#64748b', padding: '0.5rem 0', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10, letterSpacing: '0.05em' }}>
            <div style={{ width: '40px', textAlign: 'center' }}>ALL</div>
            <div style={{ width: '240px', paddingLeft: '0.5rem' }}>TASK NAME</div>
            <div style={{ width: '100px', textAlign: 'right', paddingRight: '0.5rem' }}>PLAN HOURS</div>
            <div style={{ width: '100px', textAlign: 'right', paddingRight: '0.5rem' }}>ACTUAL HOURS</div>
          </div>
          
          {visibleTasks.length === 0 ? (
            <div style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.85rem' }}>No tasks found for this project.</div>
          ) : (
            visibleTasks.map((t, idx) => {
              const color = colors[parseInt(t.parent_wbs || t.wbs_name || '0', 36) % colors.length] || colors[0];
              const isCollapsed = collapsedWBS.has(t.wbs_name || t.parent_wbs || '');
              const rowHeight = t.isParent ? 32 : 46;

              return (
                <div key={t.task_id} style={{ display: 'flex', fontSize: '0.8rem', padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9', color: t.isParent ? '#0f172a' : '#475569', alignItems: 'center', fontWeight: t.isParent ? 600 : 400, position: 'relative', height: `${rowHeight}px`, boxSizing: 'border-box' }}>
                  {/* Row Color Bar */}
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: color }} />
                  
                  <div style={{ width: '40px', display: 'flex', justifyContent: 'center' }}>
                    <span style={{ color: '#cbd5e1', fontSize: '0.7rem' }}>{idx + 1}</span>
                  </div>
                  
                  <div style={{ width: '240px', display: 'flex', alignItems: 'center', gap: '0.3rem', paddingLeft: `${t.depth * 1.5 + 0.5}rem` }}>
                    {t.childrenCount > 0 ? (
                      <div onClick={() => toggleCollapse(t.wbs_name)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                      </div>
                    ) : (
                      <div style={{ width: '14px' }} />
                    )}
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.task_name}</span>
                  </div>
                  
                  <div style={{ width: '100px', textAlign: 'right', paddingRight: '0.5rem' }}>{t.plan_hours || 0} hrs</div>
                  <div style={{ width: '100px', textAlign: 'right', paddingRight: '0.5rem' }}>{t.actual_hours || 0} hrs</div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Side: Gantt Timeline */}
        <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', background: '#f8fafc' }}>
          <div style={{ minWidth: `${daysArray.length * 25}px`, position: 'relative' }}>
            
            {/* Timeline Header (Months) */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10, height: '20px', background: '#ffffff', color: '#94a3b8', fontSize: '0.65rem', fontWeight: 600 }}>
               {daysArray.map((d, i) => {
                 const isStartOfMonth = d.getDate() === 1;
                 const isFirst = i === 0;
                 return (
                   <div key={i} style={{ width: '25px', flexShrink: 0, position: 'relative' }}>
                     {(isStartOfMonth || isFirst) && (
                       <span style={{ position: 'absolute', top: 2, left: 4, whiteSpace: 'nowrap' }}>
                         {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }).toUpperCase()}
                       </span>
                     )}
                   </div>
                 );
               })}
            </div>
            
            {/* Timeline Header (Days) */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: '20px', zIndex: 10, height: '18px', background: '#ffffff', color: '#cbd5e1', fontSize: '0.65rem' }}>
              {daysArray.map((d, i) => (
                <div key={i} style={{ width: '25px', flexShrink: 0, textAlign: 'center' }}>
                  {dayOfWeek[d.getDay()]}
                </div>
              ))}
            </div>

            {/* Grid Lines */}
            <div style={{ position: 'absolute', top: '38px', left: 0, right: 0, bottom: 0, display: 'flex', pointerEvents: 'none', zIndex: 0 }}>
              {daysArray.map((d, i) => {
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                return (
                  <div key={i} style={{ width: '25px', flexShrink: 0, borderRight: '1px dotted #e2e8f0', background: isWeekend ? 'rgba(0,0,0,0.02)' : 'transparent' }} />
                );
              })}
            </div>

            {/* Task Bars */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              {visibleTasks.map((t, idx) => {
                // Determine heights for stacked bars
                const rowHeight = t.isParent ? 32 : 46;
                
                return (
                  <div key={t.task_id} style={{ height: `${rowHeight}px`, position: 'relative', display: 'flex', alignItems: 'center' }}>
                    
                    {/* BASELINE BAR (Grey) */}
                    {t.baseline_start && t.baseline_end && (
                      <div 
                        style={{ 
                          position: 'absolute',
                          ...getPositionStyle(t.baseline_start, t.baseline_end),
                          top: t.isParent ? '4px' : '4px',
                          height: t.isParent ? '6px' : '8px',
                          background: '#cbd5e1', // grey-300
                          borderRadius: '2px',
                          zIndex: 1
                        }}
                        title={`Baseline: ${t.baseline_start} to ${t.baseline_end}`}
                      />
                    )}

                    {/* CURRENT PLAN BAR (Blue) */}
                    {(t.start_date || t.current_start) && (t.target_date || t.current_end) && (
                      <div 
                        style={{ 
                          position: 'absolute',
                          ...getPositionStyle(t.start_date || t.current_start, t.target_date || t.current_end),
                          top: t.isParent ? '12px' : '16px',
                          height: t.isParent ? '8px' : '12px',
                          display: 'flex',
                          alignItems: t.isParent ? 'flex-start' : 'center',
                          zIndex: 2
                        }}
                        title={`Current Plan: ${t.start_date || t.current_start} to ${t.target_date || t.current_end}`}
                      >
                        {/* The Current Gantt Bar */}
                        <div style={{ 
                          width: '100%', 
                          height: '100%', 
                          background: t.isParent ? '#475569' : '#3b82f6', // slate-600 / blue-500
                          borderRadius: t.isParent ? '0' : '3px',
                          borderTopLeftRadius: '3px',
                          borderTopRightRadius: '3px',
                          position: 'relative'
                        }}>
                           {t.isParent && (
                             <>
                               <div style={{ position: 'absolute', left: 0, top: '100%', width: '2px', height: '6px', background: '#475569' }} />
                               <div style={{ position: 'absolute', right: 0, top: '100%', width: '2px', height: '6px', background: '#475569' }} />
                             </>
                           )}
                        </div>

                        {/* Label Next to Bar */}
                        <div style={{ position: 'absolute', right: '-8px', top: '50%', transform: 'translate(100%, -50%)', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}>
                           <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.75rem' }}>
                             {t.task_name} {Math.min(100, Math.round((t.actual_hours / (t.plan_hours || 1)) * 100))}%
                           </span>
                        </div>
                      </div>
                    )}

                    {/* ACTUAL PROGRESS BAR (Green) */}
                    {t.actual_start_date && t.actual_end_date && !t.isParent && (
                      <div 
                        style={{ 
                          position: 'absolute',
                          ...getPositionStyle(t.actual_start_date, t.actual_end_date),
                          top: '32px',
                          height: '8px',
                          background: '#22c55e', // green-500
                          borderRadius: '2px',
                          zIndex: 3
                        }}
                        title={`Actuals: ${t.actual_start_date} to ${t.actual_end_date}`}
                      />
                    )}

                  </div>
                );
              })}
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
};
