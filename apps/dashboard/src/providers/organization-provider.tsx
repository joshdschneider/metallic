import { OrganizationObject } from '@metallichq/types';
import { createContext, ReactNode, useCallback, useEffect, useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { api } from '../lib/api';
import { SELECTED_ORGANIZATION_ID_KEY } from '../utils/constants';
import { captureException } from '../utils/error';

interface OrganizationContextType {
  loading: boolean;
  organizations: OrganizationObject[];
  selectedOrganizationId: string | null;
  setSelectedOrganizationId: (organizationId: string) => void;
  refreshOrganizations: () => Promise<void>;
  createOrganization: (name: string) => Promise<OrganizationObject>;
  updateOrganization: (organizationId: string, { name }: { name: string }) => Promise<OrganizationObject>;
  switchOrganization: (organizationId: string) => Promise<void>;
}

export const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<OrganizationObject[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedOrganizationId = localStorage.getItem(SELECTED_ORGANIZATION_ID_KEY);
      if (storedOrganizationId) {
        setSelectedOrganizationId(storedOrganizationId);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && selectedOrganizationId) {
      localStorage.setItem(SELECTED_ORGANIZATION_ID_KEY, selectedOrganizationId);
    }
  }, [selectedOrganizationId]);

  useEffect(() => {
    if (organizations.length > 0) {
      const validOrganizationIds = organizations.map((organization) => String(organization.id));
      if (!selectedOrganizationId || !validOrganizationIds.includes(selectedOrganizationId)) {
        const defaultOrganizationId = validOrganizationIds[0];
        setSelectedOrganizationId(defaultOrganizationId ?? null);
      }
    }
  }, [organizations, selectedOrganizationId]);

  const refreshOrganizations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ object: 'list'; data: OrganizationObject[] }>('/web/organizations');
      const { data } = res.data;
      setOrganizations(data);
      return;
    } catch (err) {
      captureException(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    refreshOrganizations().catch(() => {});
  }, [refreshOrganizations, user]);

  const createOrganization = useCallback(async (name: string): Promise<OrganizationObject> => {
    const res = await api.post<OrganizationObject>('/web/organizations', { name });
    const newOrganization = res.data;
    setOrganizations((prev) => [...prev, newOrganization]);
    return newOrganization;
  }, []);

  const updateOrganization = useCallback(
    async (id: string, { name }: { name: string }): Promise<OrganizationObject> => {
      const res = await api.put<OrganizationObject>(`/web/organizations/${id}`, { name });
      const updatedOrganization = res.data;
      setOrganizations((prev) => prev.map((a) => (a.id === id ? updatedOrganization : a)));
      return updatedOrganization;
    },
    []
  );

  const switchOrganization = async (organizationId: string): Promise<void> => {
    await api.get(`/web/auth/switch?organization_id=${organizationId}`);
    setSelectedOrganizationId(organizationId);
  };

  return (
    <OrganizationContext.Provider
      value={{
        loading,
        organizations,
        selectedOrganizationId,
        setSelectedOrganizationId,
        refreshOrganizations,
        createOrganization,
        updateOrganization,
        switchOrganization
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};
