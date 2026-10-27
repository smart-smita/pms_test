import React, { useState, useEffect } from 'react';
import { GanttChart } from '../components/GanttChart';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { apiRequest } from '../services/api';

export const GanttChartPage: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setIsLoading(true);
    setError('');
    const res = await apiRequest<any[]>('/tasks');
    if (res.success && res.data) {
      // Map estimated_hours to plan_hours for the Gantt component
      const mappedTasks = res.data.map(t => ({
        ...t,
        plan_hours: t.estimated_hours
      }));
      setTasks(mappedTasks);
    } else {
      setError(res.message || 'Failed to load tasks');
    }
    setIsLoading(false);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Project Gantt Chart</h1>
          <p className="page-subtitle">Task-wise Plan Hours vs Actual Hours</p>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <div style={{ padding: '2rem', color: '#ef4444', textAlign: 'center' }}>{error}</div>
        ) : (
          <GanttChart tasks={tasks} />
        )}
      </div>
    </div>
  );
};
