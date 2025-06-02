import { Box, Button, Flex, Popover, Separator, Skeleton, Text } from '@radix-ui/themes';
import { useState } from 'react';
import { useProjects } from '../hooks/use-projects';
import { DEFAULT_PROJECT_NAME } from '../utils/constants';
import { captureException } from '../utils/error';
import { DashedBoxIcon } from './custom-icons';

export const ProjectPopover: React.FC = () => {
  const { loading, projects, selectedProject, setSelectedProject } = useProjects();
  const [open, setOpen] = useState(false);

  const handleProjectChange = (projectId: string) => {
    if (!selectedProject || projectId === selectedProject.id) {
      return;
    }

    const project = projects.find((p) => p.id === projectId);
    if (!project) {
      captureException('No project found');
    } else {
      setSelectedProject(project);
      setOpen(false);
    }
  };

  if (loading || !selectedProject) {
    return (
      <Skeleton>
        <Button variant="ghost">Loading...</Button>
      </Skeleton>
    );
  }

  return (
    <Popover.Root open={open} onOpenChange={(open) => setOpen(open)}>
      <Popover.Trigger onClick={() => setOpen(true)}>
        <Button color="gray" variant="ghost" highContrast>
          <Flex align="center" justify="between" width="100%" gap="2">
            <DashedBoxIcon />
            <Text as="span">{selectedProject.name || DEFAULT_PROJECT_NAME}</Text>
          </Flex>
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
              Project selection
            </Text>
          </Box>
          <Separator role="none" orientation="horizontal" style={{ width: '100%' }} />
          <Flex direction="column" width="100%" py="3" px="3" gap="3">
            {projects.map((proj) => {
              return (
                <Button
                  asChild
                  color="gray"
                  highContrast
                  variant="ghost"
                  onClick={() => handleProjectChange(proj.id)}
                  style={{
                    background: selectedProject.id === proj.id ? 'var(--accent-a3)' : undefined,
                    cursor: selectedProject.id === proj.id ? 'default' : 'pointer'
                  }}
                >
                  <Flex align="center" justify="between" width="100%">
                    <Text as="span">{proj.name || DEFAULT_PROJECT_NAME}</Text>
                  </Flex>
                </Button>
              );
            })}
          </Flex>
        </Box>
      </Popover.Content>
    </Popover.Root>
  );
};
