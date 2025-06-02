import { ProjectObject } from '@metallichq/types';
import { createContext, ReactNode, useCallback, useEffect, useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { useOrganizations } from '../hooks/use-organizations';
import { listProjects } from '../lib/list-projects';
import { SELECTED_PROJECT_ID_KEY } from '../utils/constants';
import { captureException } from '../utils/error';

interface ProjectContextType {
  loading: boolean;
  projects: ProjectObject[];
  selectedProject: ProjectObject | null;
  setSelectedProject: (project: ProjectObject) => void;
  refreshProjects: () => Promise<void>;
}

export const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { selectedOrganizationId } = useOrganizations();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectObject[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectObject | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedProjectId = localStorage.getItem(SELECTED_PROJECT_ID_KEY);
      if (storedProjectId) {
        const project = projects.find((e) => e.id === storedProjectId);
        if (project) {
          setSelectedProject(project);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && selectedProject) {
      localStorage.setItem(SELECTED_PROJECT_ID_KEY, selectedProject.id);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (projects.length > 0) {
      const validProjectIds = projects.map((project) => String(project.id));
      if (!selectedProject || !validProjectIds.includes(selectedProject.id)) {
        const defaultProject = projects[0];
        if (defaultProject) {
          setSelectedProject(defaultProject);
        }
      }
    }
  }, [projects, selectedProject]);

  const refreshProjects = useCallback(async () => {
    if (!selectedOrganizationId) {
      return;
    }

    setLoading(true);
    try {
      const data = await listProjects(selectedOrganizationId);
      setProjects(data.data);
      return;
    } catch (err) {
      captureException(err);
    } finally {
      setLoading(false);
    }
  }, [selectedOrganizationId]);

  useEffect(() => {
    if (!user || !selectedOrganizationId) {
      return;
    }

    refreshProjects().catch(() => {});
  }, [refreshProjects, selectedOrganizationId, user]);

  return (
    <ProjectContext.Provider
      value={{
        loading,
        projects,
        selectedProject,
        setSelectedProject,
        refreshProjects
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};
