import { GearIcon, PlusCircledIcon } from '@radix-ui/react-icons';
import { Box, Button, Flex, IconButton, Popover, ScrollArea, Separator, Skeleton, Text } from '@radix-ui/themes';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../hooks/use-projects';
import { DEFAULT_PROJECT_NAME } from '../utils/constants';
import { captureException } from '../utils/error';
import { CreateProjectDialog } from './create-project-dialog';
import { FolderIcon } from './custom-icons';

export const ProjectPopover: React.FC = () => {
  const { loading, projects, selectedProject, switchProjects } = useProjects();
  const [open, setOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const navigate = useNavigate();

  const handleProjectChange = (projectId: string) => {
    if (!selectedProject || projectId === selectedProject.id) {
      return;
    }

    const project = projects.find((p) => p.id === projectId);
    if (!project) {
      captureException('No project found');
    } else {
      switchProjects(project.id);
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
            <FolderIcon color="var(--gray-10)" />
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
          <ScrollArea style={{ maxHeight: '175px' }}>
            <Flex direction="column" width="100%" py="3" px="3" gap="3">
              {projects.map((proj) => {
                return (
                  <Button
                    key={proj.id}
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
                      {proj.id === selectedProject.id && (
                        <IconButton
                          variant="ghost"
                          color="gray"
                          highContrast
                          onClick={() => {
                            navigate(`/project`);
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
                <Text>Create new project</Text>
              </Flex>
            </Button>
          </Flex>
        </Box>
        <CreateProjectDialog open={openDialog} setOpen={setOpenDialog} />
      </Popover.Content>
    </Popover.Root>
  );
};
