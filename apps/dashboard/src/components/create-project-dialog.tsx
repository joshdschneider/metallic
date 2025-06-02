import { Box, Button, Dialog, Flex, Heading, Text, TextField, VisuallyHidden } from '@radix-ui/themes';
import { useState } from 'react';
import { useProjects } from '../hooks/use-projects';
import { useToast } from '../hooks/use-toast';
import { captureException } from '../utils/error';

export type CreateProjectDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export function CreateProjectDialog({ open, setOpen }: CreateProjectDialogProps) {
  const [name, setName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { toastError } = useToast();
  const { createProject } = useProjects();

  async function createNewProject() {
    setLoading(true);
    try {
      await createProject(name);
      setOpen(false);
    } catch (err) {
      captureException(err);
      toastError('Failed to create new project');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(open) => setOpen(open)}>
      <VisuallyHidden>
        <Dialog.Title>Create new project</Dialog.Title>
      </VisuallyHidden>
      <VisuallyHidden>
        <Dialog.Description>Enter a name for the new project</Dialog.Description>
      </VisuallyHidden>
      <Dialog.Content width="400px">
        <Flex direction="column" justify="start" gap="4" width="100%">
          <Box>
            <Heading as="h3" size="4">
              Create new project
            </Heading>
          </Box>
          <label>
            <Flex direction="column" justify="start" gap="1">
              <Text as="span" size="2" color="gray">
                Project name
              </Text>
              <TextField.Root value={name} onChange={(e) => setName(e.target.value)} />
            </Flex>
          </label>
          <Flex align="center" justify="end" gap="3" mt="2">
            <Button variant="outline" color="gray" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createNewProject} loading={loading}>
              Create Project
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
