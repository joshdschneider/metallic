import { InvitationObject, InvitationState } from '@metallichq/types';
import { useEffect, useState } from 'react';
import { useOrganizations } from '../hooks/use-organizations';
import { listInvitations } from '../lib/list-invitations';
import { captureException } from '../utils/error';

export const useInvitations = () => {
  const [invitations, setInvitations] = useState<InvitationObject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { selectedOrganizationId } = useOrganizations();

  const refreshInvitations = async () => {
    if (!selectedOrganizationId) {
      return;
    }

    setLoading(true);
    try {
      const data = await listInvitations(selectedOrganizationId);
      setInvitations(data.data.filter((m) => m.state === InvitationState.Pending));
    } catch (err) {
      setError('Failed to load invites.');
      captureException(err);
    } finally {
      setLoading(false);
    }
  };

  const addInvitation = (invitation: InvitationObject) => {
    setInvitations((invitations) => [...invitations, invitation]);
  };

  const removeInvitation = (invitationId: string) => {
    setInvitations((invitations) => invitations.filter((i) => i.id !== invitationId));
  };

  useEffect(() => {
    refreshInvitations();
  }, [selectedOrganizationId]);

  return { invitations, addInvitation, removeInvitation, error, loading, refreshInvitations };
};
