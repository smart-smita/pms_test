import React from 'react';
import { GanttChartPage } from '../../../pages/GanttChartPage';

interface GanttTabProps {
  projectId?: number;
  onNavigate: (page: string) => void;
}

export const GanttTab: React.FC<GanttTabProps> = ({ projectId }) => {
  return (
    <GanttChartPage />
  );
};
