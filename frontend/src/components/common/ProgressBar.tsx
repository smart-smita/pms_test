import React from 'react';

interface ProgressBarProps {
  progress: number;
  height?: number;
  color?: string;
  showLabel?: boolean;
  label?: string;
  totalTasks?: number;
  completedTasks?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress = 0,
  height = 6,
  color,
  showLabel = true,
  label,
  totalTasks,
  completedTasks,
}) => {
  const normProgress = Math.min(Math.max(Math.round(Number(progress) || 0), 0), 100);

  // Dynamic color if not explicitly provided
  let barColor = color;
  if (!barColor) {
    if (normProgress >= 100) barColor = '#10b981'; // green
    else if (normProgress >= 70) barColor = '#4f46e5'; // indigo
    else if (normProgress >= 40) barColor = '#3b82f6'; // blue
    else barColor = '#f59e0b'; // amber
  }

  return (
    <div style={{ width: '100%' }}>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', marginBottom: '0.3rem' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {label || `${normProgress}%`}
          </span>
          {totalTasks !== undefined && (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
              {completedTasks || 0}/{totalTasks} Tasks
            </span>
          )}
        </div>
      )}
      <div
        style={{
          width: '100%',
          height: `${height}px`,
          backgroundColor: 'var(--border-color)',
          borderRadius: `${height}px`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${normProgress}%`,
            height: '100%',
            backgroundColor: barColor,
            borderRadius: `${height}px`,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
    </div>
  );
};
