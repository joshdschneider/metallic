import { OrganizationObject } from '@metallichq/types';
import { Pencil1Icon } from '@radix-ui/react-icons';
import { Box, Button, Card, Dialog, Flex, Heading, Text, TextField, VisuallyHidden } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import { InvitationsTable } from '../components/invitations-table';
import { Layout } from '../components/layout';
import { Loading } from '../components/loading';
import { TeamMembersTable } from '../components/team-members-table';
import { useInvitations } from '../hooks/use-invitations';
import { useOrganizations } from '../hooks/use-organizations';
import { useToast } from '../hooks/use-toast';
import { captureException } from '../utils/error';

export default function TeamPage() {
  const { loading, selectedOrganizationId, organizations } = useOrganizations();
  const [selectedOrganization, setSelectedOrganization] = useState<OrganizationObject | null>(null);
  const [showEditTeamDialog, setShowEditTeamDialog] = useState<boolean>(false);
  const [name, setName] = useState('');
  const { toastSuccess } = useToast();

  const {
    invitations,
    addInvitation,
    removeInvitation,
    loading: invitationsLoading,
    error: invitationsError
  } = useInvitations();

  useEffect(() => {
    if (!selectedOrganizationId) {
      return;
    }

    const selectedOrganization = organizations.find((organization) => organization.id === selectedOrganizationId);
    setSelectedOrganization(selectedOrganization ?? null);
    setName(selectedOrganization?.name ?? '');
  }, [organizations, selectedOrganizationId]);

  if (loading || !selectedOrganization) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  return (
    <Layout>
      <Box py="9" px="5" style={{ margin: '0px auto', maxWidth: '68rem' }}>
        <Flex align="center" justify="between" mb="4" style={{ minHeight: 'var(--space-5)' }}>
          <Heading as="h2" size="6" weight="medium">
            Team
          </Heading>
        </Flex>

        <Box pt="1">
          <Flex align="center" justify="between" mt="6" mb="4">
            <Heading size="4" weight="medium">
              Team details
            </Heading>
            <Button color="blue" radius="large" onClick={() => setShowEditTeamDialog(true)}>
              <Pencil1Icon /> Edit team details
            </Button>
          </Flex>
          <Card variant="surface" size="3">
            <Flex align="center" justify="start" gap="5">
              <Text color="gray" size="2">
                Team name
              </Text>
              <Text size="2">{name}</Text>
            </Flex>
          </Card>
          <EditTeamDialog
            show={showEditTeamDialog}
            setShow={setShowEditTeamDialog}
            onSave={(name) => {
              setName(name);
              setShowEditTeamDialog(false);
              toastSuccess('Team name updated');
            }}
          />
          <TeamMembersTable addInvitation={addInvitation} />
          {invitations.length > 0 && (
            <InvitationsTable
              invitations={invitations}
              removeInvitation={removeInvitation}
              loading={invitationsLoading}
              error={invitationsError}
            />
          )}
        </Box>
      </Box>
    </Layout>
  );
}

type EditTeamDialogProps = {
  show: boolean;
  setShow: (show: boolean) => void;
  onSave: (name: string) => void;
};

function EditTeamDialog({ show, setShow, onSave }: EditTeamDialogProps) {
  const { selectedOrganizationId, organizations, updateOrganization } = useOrganizations();
  const [selectedOrganization, setSelectedOrganization] = useState<OrganizationObject | null>(null);
  const [saveOrganizationLoading, setSaveOrganizationLoading] = useState(false);
  const [name, setName] = useState('');
  const { toastError } = useToast();

  useEffect(() => {
    if (!selectedOrganizationId) {
      return;
    }

    const selectedOrganization = organizations.find((organization) => organization.id === selectedOrganizationId);
    setSelectedOrganization(selectedOrganization ?? null);
    setName(selectedOrganization?.name ?? '');
  }, [organizations, selectedOrganizationId]);

  const saveOrganization = async (organizationId: string, data: { name: string }) => {
    setSaveOrganizationLoading(true);
    try {
      await updateOrganization(organizationId, data);
      onSave(name);
    } catch (err) {
      captureException(err);
      toastError('Failed to update team name.');
    } finally {
      setSaveOrganizationLoading(false);
    }
  };

  function cancel() {
    setShow(false);
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      cancel();
    } else {
      setShow(true);
    }
  }

  return (
    <Dialog.Root open={show} onOpenChange={handleOpenChange}>
      <VisuallyHidden>
        <Dialog.Title>Team name</Dialog.Title>
        <Dialog.Description>Edit the team name</Dialog.Description>
      </VisuallyHidden>
      <Dialog.Content maxWidth={'400px'}>
        <Flex direction="column" justify="start" gap="4" width="100%">
          <Box>
            <Heading as="h3" size="3">
              Team name
            </Heading>
          </Box>
          <Flex direction="row" flexGrow="1" justify="start" gap="3" mb="1">
            <TextField.Root value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%' }} />
            <Button
              radius="large"
              loading={saveOrganizationLoading}
              disabled={!selectedOrganization || name === selectedOrganization.name}
              onClick={() => {
                if (selectedOrganization) {
                  saveOrganization(selectedOrganization.id, { name });
                }
              }}
            >
              Save
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
