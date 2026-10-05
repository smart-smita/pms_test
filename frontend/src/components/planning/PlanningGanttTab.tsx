import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Layers,
  Briefcase,
  ZoomIn,
  ZoomOut,
  ChevronRight,
  ChevronDown,
  Info,
  Clock,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface PlanningGanttTabProps {
  planning: any;
}

export const PlanningGanttTab: React.FC<PlanningGanttTabProps> = ({ planning }) => {
  const wbsList = planning.wbs || [];
  const tasksList = planning.tasks || [];
  const dependencies = planning.dependencies || [];

  const [zoomLevel, setZoomLevel] = useState<'day' | 'week'>('day');

  // Helper date parsing
  const parseDate = (dStr: string | null | undefined): Date | null => {
    if (!dStr) return null;
    const clean = dStr.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
    return new Date(dStr);
  };

  // Determine timeline overall bounds
  const { minDate, maxDate, totalDays, datesArray } = useMemo(() => {
    let min = planning.start_date ? parseDate(planning.start_date) : new Date();
    let max = planning.end_date ? parseDate(planning.end_date) : new Date();

    if (!min) min = new Date();
    if (!max) max = new Date();

    // Scan all tasks & wbs for earliest & latest dates
    tasksList.forEach((t: any) => {
      const ts = parseDate(t.start_date);
      const te = parseDate(t.end_date);
      const bs = parseDate(t.baseline_start);
      const be = parseDate(t.baseline_end);
      if (ts && ts < min!) min = ts;
      if (te && te > max!) max = te;
      if (bs && bs < min!) min = bs;
      if (be && be > max!) max = be;
    });

    wbsList.forEach((w: any) => {
      const ws = parseDate(w.start_date);
      const we = parseDate(w.end_date);
      if (ws && ws < min!) min = ws;
      if (we && we > max!) max = we;
    });

    // Add padding (3 days before, 7 days after)
    const startDate = new Date(min!);
    startDate.setDate(startDate.getDate() - 2);

    const endDate = new Date(max!);
    endDate.setDate(endDate.getDate() + 5);

    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const days = Math.max(15, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const dates: Date[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }

    return {
      minDate: startDate,
      maxDate: endDate,
      totalDays: days,
      datesArray: dates,
    };
  }, [planning, tasksList, wbsList]);

  const dayWidth = zoomLevel === 'day' ? 36 : 20;
  const rowHeight = 52;
  const sidebarWidth = 280;

  // Flatten rows: WBS followed by its Tasks
  const rows = useMemo(() => {
    const list: Array<{ type: 'wbs' | 'task'; data: any; parentWbs?: any }> = [];
    wbsList.forEach((wbs: any) => {
      list.push({ type: 'wbs', data: wbs });
      const childTasks = tasksList.filter((t: any) => t.planning_wbs_id === wbs.id);
      childTasks.forEach((t: any) => {
        list.push({ type: 'task', data: t, parentWbs: wbs });
      });
    });
    return list;
  }, [wbsList, tasksList]);

  // Calculate pixel X for a given date
  const getXForDate = (d: Date | null): number => {
    if (!d) return 0;
    const diffTime = d.getTime() - minDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return Math.max(0, diffDays * dayWidth);
  };

  const today = new Date();
  const todayX = getXForDate(today);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* ── GANTT CONTROLS & LEGEND ─────────────────────────────────── */}
      <div
        className="glass-card"
        style={{
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} color="var(--accent-primary)" />
            Interactive Timeline & Baseline Comparison Gantt
          </h3>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Compare initial quotation baseline against current active schedule with dependency links.
          </p>
        </div>

        {/* Legend & Zoom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: 14, height: 10, borderRadius: 2, background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }} />
              <span>Current Plan</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: 14, height: 8, borderRadius: 2, background: '#94a3b8', opacity: 0.6, border: '1px dashed #64748b' }} />
              <span style={{ color: 'var(--text-muted)' }}>Original Baseline</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: 14, height: 10, borderRadius: 2, background: '#10b981' }} />
              <span>WBS Roll-up</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.3rem' }}>
            <Button
              variant={zoomLevel === 'day' ? 'primary' : 'secondary'}
              onClick={() => setZoomLevel('day')}
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
            >
              Day Scale
            </Button>
            <Button
              variant={zoomLevel === 'week' ? 'primary' : 'secondary'}
              onClick={() => setZoomLevel('week')}
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
            >
              Compact
            </Button>
          </div>
        </div>
      </div>

      {/* ── GANTT MAIN VIEWPORT CONTAINER ────────────────────────────── */}
      <div
        className="glass-card"
        style={{
          padding: 0,
          overflow: 'hidden',
          display: 'flex',
          border: '1px solid var(--border-color)',
        }}
      >
        {/* Left Frozen Sidebar: Task Tree */}
        <div
          style={{
            width: sidebarWidth,
            flexShrink: 0,
            borderRight: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            zIndex: 2,
          }}
        >
          {/* Header */}
          <div
            style={{
              height: 48,
              borderBottom: '1px solid var(--border-color)',
              padding: '0 1rem',
              display: 'flex',
              alignItems: 'center',
              fontWeight: 600,
              fontSize: '0.84rem',
              color: 'var(--text-primary)',
            }}
          >
            WBS & Task Breakdown
          </div>

          {/* Rows */}
          {rows.map((row, idx) => {
            const isWbs = row.type === 'wbs';
            return (
              <div
                key={idx}
                style={{
                  height: rowHeight,
                  borderBottom: '1px solid var(--border-color)',
                  padding: isWbs ? '0 1rem' : '0 1rem 0 2rem',
                  display: 'flex',
                  alignItems: 'center',
                  background: isWbs ? 'rgba(59, 130, 246, 0.04)' : 'transparent',
                  fontWeight: isWbs ? 600 : 500,
                  fontSize: isWbs ? '0.85rem' : '0.8rem',
                  color: isWbs ? 'var(--text-primary)' : 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {isWbs ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Layers size={14} color="var(--accent-primary)" />
                    {row.data.wbs_name}
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Briefcase size={12} color="var(--text-muted)" />
                    {row.data.task_name}
                  </span>
                )}
              </div>
            );
          })}
          {rows.length === 0 && (
            <div style={{ padding: '2rem 1rem', fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              No WBS items loaded.
            </div>
          )}
        </div>

        {/* Right Scrollable Timeline Canvas */}
        <div style={{ flex: 1, overflowX: 'auto', position: 'relative' }}>
          <div style={{ width: totalDays * dayWidth, minWidth: '100%', position: 'relative' }}>
            {/* Timeline Header (Dates) */}
            <div
              style={{
                height: 48,
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                background: 'var(--bg-secondary)',
                position: 'sticky',
                top: 0,
                zIndex: 1,
              }}
            >
              {datesArray.map((date, idx) => {
                const dayOfWeek = date.getDay();
                const isSunday = dayOfWeek === 0;
                const isFirstOfMonth = date.getDate() === 1;

                return (
                  <div
                    key={idx}
                    style={{
                      width: dayWidth,
                      height: '100%',
                      borderRight: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      color: isSunday ? 'var(--danger)' : 'var(--text-secondary)',
                      background: isSunday ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                      fontWeight: isFirstOfMonth ? 700 : 400,
                    }}
                  >
                    <span>{date.getDate()}</span>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][dayOfWeek]}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Today Line Indicator */}
            {todayX > 0 && todayX < totalDays * dayWidth && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: todayX,
                  width: '2px',
                  background: 'var(--danger)',
                  zIndex: 3,
                  pointerEvents: 'none',
                }}
                title="Today"
              />
            )}

            {/* Rows with Gantt Bars */}
            {rows.map((row, rowIdx) => {
              const isWbs = row.type === 'wbs';
              const startDate = parseDate(row.data.start_date);
              const endDate = parseDate(row.data.end_date);
              const baselineStart = parseDate(row.data.baseline_start);
              const baselineEnd = parseDate(row.data.baseline_end);

              const currentX = startDate ? getXForDate(startDate) : 0;
              const currentEnd = endDate ? getXForDate(endDate) + dayWidth : currentX + dayWidth;
              const currentW = Math.max(dayWidth, currentEnd - currentX);

              const baselineX = baselineStart ? getXForDate(baselineStart) : currentX;
              const baselineEndPx = baselineEnd ? getXForDate(baselineEnd) + dayWidth : baselineX + dayWidth;
              const baselineW = Math.max(dayWidth, baselineEndPx - baselineX);

              return (
                <div
                  key={rowIdx}
                  style={{
                    height: rowHeight,
                    borderBottom: '1px solid var(--border-color)',
                    position: 'relative',
                    background: isWbs ? 'rgba(59, 130, 246, 0.02)' : 'transparent',
                  }}
                >
                  {/* Background grid lines */}
                  {datesArray.map((date, dIdx) => (
                    <div
                      key={dIdx}
                      style={{
                        position: 'absolute',
                        left: dIdx * dayWidth,
                        top: 0,
                        bottom: 0,
                        width: dayWidth,
                        borderRight: '1px solid rgba(255, 255, 255, 0.04)',
                        background: date.getDay() === 0 ? 'rgba(239, 68, 68, 0.03)' : 'transparent',
                        pointerEvents: 'none',
                      }}
                    />
                  ))}

                  {/* Dual-Tier Bars */}
                  {startDate && (
                    <div style={{ position: 'relative', height: '100%' }}>
                      {/* Top Tier: Baseline Bar (Muted) */}
                      {baselineStart && (
                        <div
                          style={{
                            position: 'absolute',
                            left: baselineX,
                            top: 8,
                            width: baselineW,
                            height: 8,
                            borderRadius: 3,
                            background: '#94a3b8',
                            opacity: 0.5,
                            border: '1px dashed #64748b',
                          }}
                          title={`Baseline: ${row.data.baseline_start} → ${row.data.baseline_end}`}
                        />
                      )}

                      {/* Bottom Tier: Current Plan Bar */}
                      <div
                        style={{
                          position: 'absolute',
                          left: currentX,
                          top: baselineStart ? 20 : 12,
                          width: currentW,
                          height: isWbs ? 20 : 22,
                          borderRadius: 4,
                          background: isWbs
                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                            : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0 0.5rem',
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                        }}
                        title={`${row.data.task_name || row.data.wbs_name}\nPlanned: ${row.data.start_date} → ${row.data.end_date} (${row.data.duration} working days)`}
                      >
                        {currentW > 70 && (row.data.task_name || row.data.wbs_name)}
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
  );
};
