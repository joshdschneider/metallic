import { useContext } from 'react';
import { OrganizationContext } from '../providers/organization-provider';

export const useOrganizations = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganizations must be used within an OrganizationProvider');
  }

  return context;
};
