import { Box, Button, Dialog, Flex, Heading, Text, TextField, VisuallyHidden } from '@radix-ui/themes';
import { useState } from 'react';
import { useOrganizations } from '../hooks/use-organizations';
import { useToast } from '../hooks/use-toast';
import { captureException } from '../utils/error';

export type CreateTeamDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export function CreateTeamDialog({ open, setOpen }: CreateTeamDialogProps) {
  const [name, setName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { toastError } = useToast();
  const { createOrganization, switchOrganization } = useOrganizations();

  async function createTeam() {
    setLoading(true);
    try {
      const organization = await createOrganization(name);
      await switchOrganization(organization.id);
      setOpen(false);
    } catch (err) {
      captureException(err);
      toastError('Failed to create new team');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(open) => setOpen(open)}>
      <VisuallyHidden>
        <Dialog.Title>Create new team</Dialog.Title>
      </VisuallyHidden>
      <VisuallyHidden>
        <Dialog.Description>Enter a name for the new team</Dialog.Description>
      </VisuallyHidden>
      <Dialog.Content width="400px">
        <Flex direction="column" justify="start" gap="4" width="100%">
          <Box>
            <Heading as="h3" size="4">
              Create new team
            </Heading>
          </Box>
          <label>
            <Flex direction="column" justify="start" gap="1">
              <Text as="span" size="2" color="gray">
                Team name
              </Text>
              <TextField.Root value={name} onChange={(e) => setName(e.target.value)} />
            </Flex>
          </label>
          <Flex align="center" justify="end" gap="3" mt="2">
            <Button variant="outline" color="gray" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createTeam} loading={loading}>
              Create Team
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
