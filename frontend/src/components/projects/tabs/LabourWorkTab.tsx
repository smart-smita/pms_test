import React from 'react';
import { Labours } from '../../../pages/Labours';

interface LabourWorkTabProps {
  projectId?: number;
  onNavigate: (page: string) => void;
}

export const LabourWorkTab: React.FC<LabourWorkTabProps> = ({ projectId }) => {
  return (
    <Labours projectId={projectId} />
  );
};
