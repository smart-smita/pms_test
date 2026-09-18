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
      let totalPlan = 0;
      let totalActual = 0;
      
      wbsTasks.forEach(t => {
        if (t.start_date) {
          const d = new Date(t.start_date).getTime();
          if (d < minStart) minStart = d;
        }
        if (t.target_date) {
          const d = new Date(t.target_date).getTime();
          if (d > maxEnd) maxEnd = d;
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
      if (t.start_date) {
        const d = new Date(t.start_date).getTime();
        if (d < min) min = d;
        if (d > max) max = d;
      }
      if (t.target_date) {
        const d = new Date(t.target_date).getTime();
        if (d < min) min = d;
        if (d > max) max = d;
      }
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
              
              return (
                <div key={t.task_id} style={{ display: 'flex', fontSize: '0.8rem', padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9', color: t.isParent ? '#0f172a' : '#475569', alignItems: 'center', fontWeight: t.isParent ? 600 : 400, position: 'relative' }}>
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
                const color = colors[parseInt(t.parent_wbs || t.wbs_name || '0', 36) % colors.length] || colors[0];
                return (
                  <div key={t.task_id} style={{ height: '28px', position: 'relative', display: 'flex', alignItems: 'center' }}>
                    {t.start_date && t.target_date && (
                      <div 
                        style={{ 
                          position: 'absolute',
                          ...getPositionStyle(t.start_date, t.target_date),
                          height: t.isParent ? '12px' : '16px',
                          display: 'flex',
                          alignItems: t.isParent ? 'flex-start' : 'center',
                        }}
                      >
                        {/* The Gantt Bar */}
                        <div style={{ 
                          width: '100%', 
                          height: t.isParent ? '6px' : '100%', 
                          background: color, 
                          borderRadius: t.isParent ? '0' : '2px',
                          borderTopLeftRadius: '2px',
                          borderTopRightRadius: '2px',
                          position: 'relative'
                        }}>
                           {t.isParent && (
                             <>
                               <div style={{ position: 'absolute', left: 0, top: '6px', width: '2px', height: '6px', background: color }} />
                               <div style={{ position: 'absolute', right: 0, top: '6px', width: '2px', height: '6px', background: color }} />
                             </>
                           )}
                        </div>

                        {/* Dependency Arrow (mocking one for visual) */}
                        {!t.isParent && t.depth > 0 && idx % 2 === 0 && (
                           <div style={{ position: 'absolute', left: '-15px', top: '-14px', width: '15px', height: '22px', borderLeft: '1px solid #94a3b8', borderBottom: '1px solid #94a3b8' }}>
                             <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '0', height: '0', borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '4px solid #94a3b8' }} />
                           </div>
                        )}

                        {/* Label Next to Bar */}
                        <div style={{ position: 'absolute', right: '-10px', top: '50%', transform: 'translate(100%, -50%)', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
                           <span style={{ fontWeight: 600, color: '#333', fontSize: '0.75rem' }}>{t.task_name} {Math.min(100, Math.round((t.actual_hours / (t.plan_hours || 1)) * 100))}%</span>
                        </div>
                      </div>
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
