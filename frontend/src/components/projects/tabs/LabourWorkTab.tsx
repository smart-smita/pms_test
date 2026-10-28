import React from 'react';
import { Labours } from '../../../pages/Labours';

interface LabourWorkTabProps {
  projectId?: number;
  onNavigate: (page: string) => void;
}

export const LabourWorkTab: React.FC<LabourWorkTabProps> = ({ projectId, onNavigate }) => {
  return (
    <Labours projectId={projectId} isEmbedded={true} defaultTab="work_logs" onNavigate={onNavigate} />
  );
};
