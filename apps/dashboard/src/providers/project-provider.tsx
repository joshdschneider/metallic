import { ProjectObject } from '@metallichq/types';
import { createContext, ReactNode, useCallback, useEffect, useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { useOrganizations } from '../hooks/use-organizations';
import { createProject as apiCreateProject } from '../lib/create-project';
import { deleteProject as apiDeleteProject } from '../lib/delete-project';
import { listProjects } from '../lib/list-projects';
import { updateProject as apiUpdateProject } from '../lib/update-project';
import { SELECTED_PROJECT_ID_KEY } from '../utils/constants';
import { captureException } from '../utils/error';

interface ProjectContextType {
  loading: boolean;
  projects: ProjectObject[];
  selectedProject: ProjectObject | null;
  refreshProjects: () => Promise<void>;
  switchProjects: (projectId: string) => void;
  createProject: (name: string) => Promise<ProjectObject>;
  updateProject: (projectId: string, data: { name: string }) => Promise<ProjectObject>;
  deleteProject: (projectId: string) => Promise<void>;
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

  const createProject = useCallback(
    async (name: string): Promise<ProjectObject> => {
      if (!selectedOrganizationId) {
        throw new Error('No organization selected');
      }

      const data = await apiCreateProject({ organizationId: selectedOrganizationId, name });
      setProjects((prev) => [...prev, data]);
      setSelectedProject(data);
      return data;
    },
    [selectedOrganizationId]
  );

  const updateProject = useCallback(
    async (projectId: string, data: { name: string }): Promise<ProjectObject> => {
      if (!selectedOrganizationId) {
        throw new Error('No organization selected');
      }

      const updatedProject = await apiUpdateProject({
        organizationId: selectedOrganizationId,
        projectId,
        name: data.name
      });

      setProjects((prev) => prev.map((p) => (p.id === projectId ? updatedProject : p)));
      if (selectedProject?.id === projectId) {
        setSelectedProject(updatedProject);
      }

      return updatedProject;
    },
    [selectedOrganizationId, selectedProject]
  );

  const deleteProject = useCallback(
    async (projectId: string): Promise<void> => {
      if (!selectedOrganizationId) {
        throw new Error('No organization selected');
      }

      await apiDeleteProject({
        organizationId: selectedOrganizationId,
        projectId
      });

      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      if (selectedProject?.id === projectId) {
        const remainingProjects = projects.filter((p) => p.id !== projectId);
        if (remainingProjects.length > 0) {
          setSelectedProject(remainingProjects[0]);
        } else {
          setSelectedProject(null);
        }
      }
    },
    [selectedOrganizationId, selectedProject, projects]
  );

  const switchProjects = useCallback(
    (projectId: string): void => {
      const project = projects.find((e) => e.id === projectId);
      if (!project) {
        console.warn(`Project with ID ${projectId} not found`);
        return;
      }

      setSelectedProject(project);
    },
    [setSelectedProject, projects]
  );

  return (
    <ProjectContext.Provider
      value={{
        loading,
        projects,
        selectedProject,
        refreshProjects,
        switchProjects,
        createProject,
        updateProject,
        deleteProject
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};
