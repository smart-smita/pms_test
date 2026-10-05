import React from 'react';
import { SiteSurveys } from '../../../pages/SiteSurveys';

interface SiteSurveyTabProps {
  projectId?: number;
  onNavigate: (page: string) => void;
}

export const SiteSurveyTab: React.FC<SiteSurveyTabProps> = ({ projectId }) => {
  return (
    <SiteSurveys projectId={projectId} />
  );
};
