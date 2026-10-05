import React from 'react';
import { Materials } from '../../../pages/Materials';

interface MaterialTabProps {
  projectId?: number;
  onNavigate: (page: string) => void;
}

export const MaterialTab: React.FC<MaterialTabProps> = ({ projectId }) => {
  return (
    <Materials projectId={projectId} />
  );
};
