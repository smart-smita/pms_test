import React from 'react';
import { Tasks } from '../../../pages/Tasks';

interface TaskManagementTabProps {
  projectId?: number;
  onNavigate?: (page: string) => void;
}

export const TaskManagementTab: React.FC<TaskManagementTabProps> = ({
  projectId,
}) => {
  return <Tasks projectId={projectId} />;
};
