import { GearIcon, PlusCircledIcon } from '@radix-ui/react-icons';
import { Box, Button, Flex, IconButton, Popover, ScrollArea, Separator, Skeleton, Text } from '@radix-ui/themes';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganizations } from '../hooks/use-organizations';
import { useToast } from '../hooks/use-toast';
import { DEFAULT_ORGANIZATION_NAME } from '../utils/constants';
import { captureException } from '../utils/error';
import { CreateTeamDialog } from './create-team-dialog';

export const TeamPopover: React.FC = () => {
  const { loading, organizations, selectedOrganizationId, switchOrganization } = useOrganizations();
  const selectedOrganization = organizations.find((organization) => organization.id === selectedOrganizationId);
  const [open, setOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const { toastError } = useToast();
  const navigate = useNavigate();

  const handleOrganizationChange = async (organizationId: string) => {
    if (organizationId === selectedOrganizationId) {
      return;
    }

    try {
      await switchOrganization(organizationId);
      setOpen(false);
    } catch (err) {
      toastError('Failed to switch teams.');
      captureException(err);
    }
  };

  if (loading || !selectedOrganization) {
    return (
      <Skeleton>
        <Button variant="ghost">Loading...</Button>
      </Skeleton>
    );
  }

  return (
    <Popover.Root open={open} onOpenChange={(open) => setOpen(open)}>
      <Popover.Trigger onClick={() => setOpen(true)}>
        <Button color="gray" variant="ghost" highContrast style={{ fontWeight: 'var(--font-weight-medium)' }}>
          {selectedOrganization.name || DEFAULT_ORGANIZATION_NAME}
        </Button>
      </Popover.Trigger>
      <Popover.Content
        role="menu"
        size="2"
        style={{
          width: 300,
          padding: 0,
          borderRadius: 'var(--radius-2)'
        }}
      >
        <Box>
          <Box py="1" px="3">
            <Text size="1" weight="bold" color="gray">
              Team selection
            </Text>
          </Box>
          <Separator role="none" orientation="horizontal" style={{ width: '100%' }} />
          <ScrollArea style={{ maxHeight: '175px' }}>
            <Flex direction="column" width="100%" py="3" px="3" gap="3">
              {organizations.map((organization) => {
                return (
                  <Button
                    asChild
                    key={organization.id}
                    color="gray"
                    highContrast
                    variant="ghost"
                    onClick={() => handleOrganizationChange(organization.id)}
                    style={{
                      background: organization.id === selectedOrganizationId ? 'var(--accent-a3)' : undefined,
                      cursor: organization.id === selectedOrganizationId ? 'default' : 'pointer'
                    }}
                  >
                    <Flex align="center" justify="between" width="100%">
                      <Text as="span">{organization.name || DEFAULT_ORGANIZATION_NAME}</Text>
                      {organization.id === selectedOrganizationId && (
                        <IconButton
                          variant="ghost"
                          color="gray"
                          highContrast
                          onClick={() => {
                            navigate(`/team/settings`);
                            setOpen(false);
                          }}
                          style={{ pointerEvents: 'all' }}
                        >
                          <GearIcon />
                        </IconButton>
                      )}
                    </Flex>
                  </Button>
                );
              })}
            </Flex>
          </ScrollArea>
          <Separator role="none" orientation="horizontal" style={{ width: '100%' }} />
          <Flex direction="column" width="100%" m="1">
            <Button color="gray" variant="ghost" onClick={() => setOpenDialog(true)}>
              <Flex align="center" px="2" py="1" justify="start" gap="2" width="100%">
                <PlusCircledIcon />
                <Text>Create new team</Text>
              </Flex>
            </Button>
          </Flex>
        </Box>
        <CreateTeamDialog open={openDialog} setOpen={setOpenDialog} />
      </Popover.Content>
    </Popover.Root>
  );
};
