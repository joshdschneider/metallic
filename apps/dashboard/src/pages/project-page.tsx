import { Pencil1Icon, TrashIcon } from '@radix-ui/react-icons';
import { Box, Button, Card, Dialog, Flex, Heading, Text, TextField, VisuallyHidden } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import { Layout } from '../components/layout';
import { Loading } from '../components/loading';
import { useProjects } from '../hooks/use-projects';
import { useToast } from '../hooks/use-toast';
import { captureException } from '../utils/error';

export default function ProjectPage() {
  const { loading, selectedProject } = useProjects();
  const [showEditProjectDialog, setShowEditProjectDialog] = useState<boolean>(false);
  const [showDeleteProjectDialog, setShowDeleteProjectDialog] = useState<boolean>(false);
  const [name, setName] = useState(selectedProject?.name ?? '');
  const { toastSuccess } = useToast();

  useEffect(() => {
    if (!selectedProject) {
      return;
    }

    setName(selectedProject.name ?? '');
  }, [selectedProject]);

  if (loading || !selectedProject) {
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
            Project
          </Heading>
        </Flex>

        <Box pt="1">
          <Flex align="center" justify="between" mt="6" mb="4">
            <Heading size="4" weight="medium">
              Project details
            </Heading>
            <Button color="blue" radius="large" onClick={() => setShowEditProjectDialog(true)}>
              <Pencil1Icon /> Edit project details
            </Button>
          </Flex>
          <Card variant="surface" size="3">
            <Flex align="center" justify="start" gap="5">
              <Text color="gray" size="2">
                Project name
              </Text>
              <Text size="2">{name}</Text>
            </Flex>
          </Card>

          <Flex align="center" justify="between" mt="8" mb="4">
            <Heading size="4" weight="medium">
              Danger zone
            </Heading>
          </Flex>
          <Card variant="surface" size="3" style={{ borderColor: 'var(--red-6)' }}>
            <Flex direction="column">
              <Flex direction="column" justify="start" mb="4">
                <Text size="2" weight="medium">
                  Delete project
                </Text>
                <Text size="2" color="gray" mt="1">
                  Permanently delete this project and all its data. This action cannot be undone.
                </Text>
              </Flex>
              <Box>
                <Button color="red" variant="solid" onClick={() => setShowDeleteProjectDialog(true)}>
                  <TrashIcon /> Delete project
                </Button>
              </Box>
            </Flex>
          </Card>

          <EditProjectDialog
            show={showEditProjectDialog}
            setShow={setShowEditProjectDialog}
            onSave={(name) => {
              setName(name);
              setShowEditProjectDialog(false);
              toastSuccess('Project name updated');
            }}
          />
          <DeleteProjectDialog show={showDeleteProjectDialog} setShow={setShowDeleteProjectDialog} />
        </Box>
      </Box>
    </Layout>
  );
}

type EditProjectDialogProps = {
  show: boolean;
  setShow: (show: boolean) => void;
  onSave: (name: string) => void;
};

function EditProjectDialog({ show, setShow, onSave }: EditProjectDialogProps) {
  const { selectedProject, updateProject } = useProjects();
  const [saveProjectLoading, setSaveProjectLoading] = useState(false);
  const [name, setName] = useState('');
  const { toastError } = useToast();

  useEffect(() => {
    if (selectedProject) {
      setName(selectedProject.name ?? '');
    }
  }, [selectedProject, show]);

  const saveProject = async (projectId: string, name: string) => {
    setSaveProjectLoading(true);
    try {
      await updateProject(projectId, { name });
      onSave(name);
    } catch (err) {
      captureException(err);
      toastError('Failed to update project name.');
    } finally {
      setSaveProjectLoading(false);
    }
  };

  function cancel() {
    setShow(false);
    if (selectedProject) {
      setName(selectedProject.name ?? '');
    }
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
        <Dialog.Title>Project name</Dialog.Title>
        <Dialog.Description>Edit the project name</Dialog.Description>
      </VisuallyHidden>
      <Dialog.Content maxWidth={'400px'}>
        <Flex direction="column" justify="start" gap="4" width="100%">
          <Box>
            <Heading as="h3" size="3">
              Project name
            </Heading>
          </Box>
          <Flex direction="row" flexGrow="1" justify="start" gap="3" mb="1">
            <TextField.Root value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%' }} />
            <Button
              radius="large"
              loading={saveProjectLoading}
              disabled={!selectedProject || name === selectedProject.name}
              onClick={() => {
                if (selectedProject) {
                  saveProject(selectedProject.id, name);
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

type DeleteProjectDialogProps = {
  show: boolean;
  setShow: (show: boolean) => void;
};

function DeleteProjectDialog({ show, setShow }: DeleteProjectDialogProps) {
  const { selectedProject, deleteProject, projects } = useProjects();
  const [deleteProjectLoading, setDeleteProjectLoading] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const { toastError, toastSuccess } = useToast();

  const handleDeleteProject = async () => {
    if (!selectedProject) {
      return;
    } else if (projects.length === 1) {
      toastError('You can not delete your only project.');
      return;
    }

    setDeleteProjectLoading(true);
    try {
      await deleteProject(selectedProject.id);
      toastSuccess('Project deleted successfully');
      setShow(false);
      setConfirmationText('');
    } catch (err) {
      captureException(err);
      toastError('Failed to delete project.');
    } finally {
      setDeleteProjectLoading(false);
    }
  };

  const canDelete = confirmationText === selectedProject?.name;

  function cancel() {
    setShow(false);
    setConfirmationText('');
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
        <Dialog.Title>Delete project</Dialog.Title>
        <Dialog.Description>Confirm project deletion</Dialog.Description>
      </VisuallyHidden>
      <Dialog.Content maxWidth={'450px'}>
        <Flex direction="column" justify="start" gap="4" width="100%">
          <Flex direction="column" justify="start" gap="1">
            <Heading as="h3" size="3" weight="medium">
              Delete project
            </Heading>
            <Text size="2" color="gray" mt="1">
              {`This action cannot be undone. This will permanently delete the project `}
              <Text weight="medium">{selectedProject?.name}</Text>
              {` and all of its data.`}
            </Text>
          </Flex>

          <Flex direction="column" justify="start" gap="1">
            <Text size="2" weight="medium" mb="1">
              {`Please type "`}
              <Text weight="bold">{selectedProject?.name}</Text>
              {`" to confirm:`}
            </Text>
            <TextField.Root
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              style={{ width: '100%' }}
              placeholder={selectedProject?.name ?? undefined}
            />
          </Flex>

          <Flex justify="end" gap="3" mt="2">
            <Button variant="soft" color="gray" onClick={cancel}>
              Cancel
            </Button>
            <Button color="red" loading={deleteProjectLoading} disabled={!canDelete} onClick={handleDeleteProject}>
              <TrashIcon /> Delete project
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
