import React from 'react';
import { Timesheets } from '../../../pages/Timesheets';

interface TimesheetTabProps {
  projectId?: number;
  onNavigate: (page: string) => void;
}

export const TimesheetTab: React.FC<TimesheetTabProps> = ({ projectId, onNavigate }) => {
  return (
    <Timesheets projectId={projectId} onNavigate={onNavigate} />
  );
};
