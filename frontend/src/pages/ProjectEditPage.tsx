import React from 'react';
import { ProjectForm } from './ProjectForm';

interface ProjectEditPageProps {
  projectId: number;
  onNavigate: (page: string) => void;
}

export const ProjectEditPage: React.FC<ProjectEditPageProps> = ({ projectId, onNavigate }) => {
  return (
    <ProjectForm
      projectId={projectId}
      onBack={() => onNavigate(`project/workspace/${projectId}`)}
    />
  );
};
