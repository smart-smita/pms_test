import React from 'react';
import { Attendance } from '../../../pages/Attendance';

interface AttendanceTabProps {
  projectId?: number;
  onNavigate: (page: string) => void;
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({ projectId }) => {
  return (
    <Attendance projectId={projectId} />
  );
};
