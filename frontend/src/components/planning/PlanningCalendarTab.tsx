import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Sun,
  ShieldAlert,
  CheckCircle,
  XCircle,
  HelpCircle,
  Calculator,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

interface PlanningCalendarTabProps {
  planning: any;
}

export const PlanningCalendarTab: React.FC<PlanningCalendarTabProps> = ({ planning }) => {
  const daysOfWeek = [
    { num: 1, name: 'Monday', isWork: true },
    { num: 2, name: 'Tuesday', isWork: true },
    { num: 3, name: 'Wednesday', isWork: true },
    { num: 4, name: 'Thursday', isWork: true },
    { num: 5, name: 'Friday', isWork: true },
    { num: 6, name: 'Saturday', isWork: true },
    { num: 0, name: 'Sunday', isWork: false },
  ];

  const sampleHolidays = [
    { date: '2026-01-26', desc: 'Republic Day (National Holiday)', type: 'public_holiday' },
    { date: '2026-08-15', desc: 'Independence Day', type: 'public_holiday' },
    { date: '2026-10-02', desc: 'Gandhi Jayanti', type: 'public_holiday' },
    { date: '2026-11-08', desc: 'Diwali Festive Site Shutdown', type: 'site_shutdown' },
    { date: '2026-12-25', desc: 'Christmas Day', type: 'public_holiday' },
  ];

  // Simulator State
  const [simStartDate, setSimStartDate] = useState('2026-10-05');
  const [simDuration, setSimDuration] = useState(5);
  const [simResult, setSimResult] = useState<string | null>(null);

  const runSimulation = () => {
    const start = new Date(simStartDate);
    let curr = new Date(start);
    let remaining = Math.max(0, simDuration - 1);

    // Skip initial if Sunday
    while (curr.getDay() === 0) {
      curr.setDate(curr.getDate() + 1);
    }

    while (remaining > 0) {
      curr.setDate(curr.getDate() + 1);
      if (curr.getDay() !== 0) {
        remaining--;
      }
    }

    const y = curr.getFullYear();
    const m = String(curr.getMonth() + 1).padStart(2, '0');
    const d = String(curr.getDate()).padStart(2, '0');
    setSimResult(`${y}-${m}-${d}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={18} color="var(--accent-primary)" />
          Company Working Days & Calendar Schedule Engine
        </h3>
        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
          Active Calendar: <strong style={{ color: 'var(--text-primary)' }}>{planning.calendar_name || 'Default Company Calendar'}</strong> • Working Hours: <strong>10.00 hrs/day</strong>
        </p>
      </div>

      {/* ── WORKING DAYS MATRIX & SIMULATOR ─────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '1.5rem' }}>
        {/* Left: Working Days Configuration */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={16} color="var(--accent-primary)" /> Working Week Schedule
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.75rem' }}>
            {daysOfWeek.map((day) => (
              <div
                key={day.num}
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: day.isWork ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                  background: day.isWork ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{day.name}</div>
                <Badge variant={day.isWork ? 'success' : 'danger'} style={{ marginTop: '0.4rem' }}>
                  {day.isWork ? 'WORKING' : 'OFF'}
                </Badge>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1.25rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            💡 <strong style={{ color: 'var(--text-primary)' }}>Rule:</strong> All task duration inputs in Planning represent <em>Working Days</em>. Non-working days and declared site shutdowns are skipped automatically during dependency recalculation.
          </div>
        </div>

        {/* Right: Working Day Duration Calculator Tool */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calculator size={16} color="var(--success)" /> Working Days Schedule Simulator
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-input"
                value={simStartDate}
                onChange={(e) => setSimStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">Duration (Working Days)</label>
              <input
                type="number"
                className="form-input"
                value={simDuration}
                onChange={(e) => setSimDuration(Number(e.target.value))}
              />
            </div>

            <Button variant="primary" onClick={runSimulation} style={{ marginTop: '0.5rem' }}>
              Calculate Completion Date
            </Button>

            {simResult && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.85rem',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Calculated End Date:</span>
                <strong style={{ fontSize: '1rem', color: 'var(--success)' }}>{simResult}</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── HOLIDAYS & SHUTDOWNS TABLE ───────────────────────────────── */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sun size={16} color="var(--warning)" /> Company Holidays & Site Shutdowns
        </h4>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Holiday / Shutdown Date</th>
                <th style={{ padding: '0.75rem 1rem' }}>Description</th>
                <th style={{ padding: '0.75rem 1rem' }}>Category</th>
              </tr>
            </thead>
            <tbody>
              {sampleHolidays.map((h, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{h.date}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{h.desc}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <Badge variant={h.type === 'site_shutdown' ? 'warning' : 'info'}>
                      {h.type.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
