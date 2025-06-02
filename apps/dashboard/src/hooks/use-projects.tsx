import { useContext } from 'react';
import { ProjectContext } from '../providers/project-provider';

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within an ProjectProvider');
  }

  return context;
};
