import React from 'react';
import { ProjectForm } from './ProjectForm';

interface ProjectCreatePageProps {
  onNavigate: (page: string) => void;
}

export const ProjectCreatePage: React.FC<ProjectCreatePageProps> = ({ onNavigate }) => {
  return (
    <ProjectForm
      onBack={() => onNavigate('project/workspace')}
    />
  );
};
